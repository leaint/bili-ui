import type { APIGen } from "@/stores/apiv2";
import { MODE, StateEvent, EventDispatch, store } from "@/stores/counter";
import {
  type SearchItem,
  type UpUserInfo,
  type Media_BG_FT,
  type SearchParam,
  type SpaceSearchParm,
  convertDateToString,
  type AllSearchParam,
  type LocalUserSearchOrder,
  type UserSearchOrder,
  type UserSearchOrderSort,
  type LocalUserSearchParm,
  type UserSearchParm,
  type UpUser,
  type BangumiSearchParm,
  type SpaceSearchRequestParm,
} from "@/stores/interface";
import { UserInfo } from "@/stores/lib";

export const InitModeEvent = "initmode";
export const UpdateListEvent = "updatelist";

const STATE = ["PENDING", "FULFILLED", "REJECTED"];
export const [PENDING, FULFILLED, REJECTED] = STATE;

export const eventDispatcher = new EventDispatch();

interface Comparable<T> {
  isEqual(t: T): boolean;
}
interface Entity<T> {
  getData(): T;
  setData(data: any): void;
}

export type ComparableEntity<T> = Comparable<T> & Entity<T>;

export interface SearcherQueryModel extends ComparableEntity<SearchParam> {
  /**比较搜索参数是否在效果上一致，即使参数不完全相同 */
  isSame(query: any): boolean;
  /**是否为有效的搜索参数 */
  isValid(): boolean;
}

export interface ListObj {
  results: Array<SearchItem> | Array<UpUserInfo> | Array<Media_BG_FT>;
  numPages: number;
}

export interface SearcherResultModel extends ComparableEntity<ListObj> {
  clearData(): void;
}

export interface TitleGenerator {
  getTitle(): string;
}

const progress = makeProgress(eventDispatcher);

export function makeProgress(eventDispatcher: EventDispatch) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const f = descriptor.value!;
    descriptor.value = async function (...args: any) {
      eventDispatcher.dispatch(new CustomEvent(PENDING));
      try {
        const res = await f.apply(this, ...args);
        eventDispatcher.dispatch(new CustomEvent(FULFILLED));
        return res;
      } catch (e) {
        console.error(e);
        eventDispatcher.dispatch(new CustomEvent(REJECTED));
      }
    };
  };
}

export abstract class Searcher {
  abstract readonly mode: MODE;
  cacheModel: SearcherCacheModel;
  searcherQueryModel: SearcherQueryModel;
  resultModel: SearcherResultModel;
  searcherAction: SearcherAction;

  constructor(
    public et: EventDispatch,
    searchFacade: SearcherFacade,
    public titleGenerator: TitleGenerator
  ) {
    ({
      searcherQueryModel: this.searcherQueryModel,
      searcherAction: this.searcherAction,
      resultModel: this.resultModel,
    } = searchFacade.getData());
    const { cacheModel } = searchFacade.getData();

    if (cacheModel === undefined) {
      throw "cacheModel can't be undefined";
    }
    this.cacheModel = cacheModel;
  }

  get title(): string {
    return this.titleGenerator.getTitle();
  }

  initModeAction = (query: any) =>
    new StateEvent(InitModeEvent, {
      detail: { pagemode: this.mode, query },
    });
  restart(): void {
    if (this.searcherQueryModel.isValid()) {
      //若搜索所需数据与缓存数据一致
      if (this.cacheModel.isCacheValid()) {
        this.cacheModel.restoreData();
      } else {
        //else start a new search request
        this.triggerUpdateListEvent();
      }
    } else {
      this.resultModel.clearData();
    }
  }
  @progress
  async triggerUpdateListEvent() {
    this.et.dispatchEvent(new CustomEvent(UpdateListEvent));
    try {
      await this.updateList();
    } catch (e) {
      this.resultModel.clearData();
      throw e;
    }
  }
  protected async updateList(): Promise<void> {
    const data = await this.searcherAction.search(
      this.searcherQueryModel.getData()
    );
    this.resultModel.setData(data);
  }
}

export class AllSearcher extends Searcher {
  readonly mode = MODE.SEARCH;
}

export class UserSearcher extends Searcher {
  mode = MODE.USER;
}

export class BgFtSearcher extends Searcher {
  readonly mode = MODE.MEDIA_BANGUMI_FT;
}

// FIXME userInfo 的缓存依赖KeepAlive而不是userInfoSearcherFacade
export class SpaceSearcher extends Searcher {
  readonly mode = MODE.SPACE;
  constructor(
    public et: EventDispatch,
    searchFacade: SearcherFacade,
    public titleGenerator: TitleGenerator,
    public userInfoSearcherFacade: SearcherFacade
  ) {
    super(et, searchFacade, titleGenerator);
    this.et.addEventListener(InitModeEvent, (le) => {
      const current = le.detail.pagemode;

      if (current === MODE.SPACE) {
        this.fetchUserInfo(le.detail.query);
      }
    });
  }

  fetchUserInfo(query: any) {
    this.userInfoSearcherFacade.searcherQueryModel.setData(query);
    if (this.userInfoSearcherFacade.searcherQueryModel.isValid()) {
      this.userInfoSearcherFacade.searcherAction
        .search(this.searcherQueryModel.getData())
        .then((data) => {
          this.userInfoSearcherFacade.resultModel.setData(data);
        });
    }
  }
}

interface NoneDataCacheConfig {
  cache: boolean;
  constrain: boolean;
  restore: boolean;
  key: string;
}
export interface CacheConfig extends NoneDataCacheConfig {
  data: ComparableEntity<any>;
}

export class SearcherCacheModel {
  configs: CacheConfig[] = [];
  constructor(configs: CacheConfig[], public cacheStore: Map<string, any>) {
    this.setConfig(configs);
  }
  setConfig(configs: CacheConfig[]): void {
    this.configs = configs;
  }
  isCacheValid(): boolean {
    const validArr = this.configs.filter((i) => i.constrain);

    let ret = validArr.length > 0;
    for (const config of validArr) {
      const cachedData = this.cacheStore.get(config.key);

      if (cachedData === undefined || !config.data.isEqual(cachedData)) {
        ret = false;
        break;
      }
    }

    return ret;
  }
  saveData(): boolean {
    const arr = this.configs.filter((i) => i.cache);

    const ret = arr.length > 0;
    for (const config of arr) {
      this.cacheStore.set(config.key, config.data.getData());
    }
    return ret;
  }

  restoreData(): boolean {
    const arr = this.configs.filter((i) => i.restore);

    for (const config of arr) {
      const cachedData = this.cacheStore.get(config.key);
      if (cachedData !== undefined) {
        config.data.setData(cachedData);
      }
    }
    return true;
  }
}

export class SearcherFacade {
  searcherQueryModel: SearcherQueryModel;
  resultModel: SearcherResultModel;
  cacheModel?: SearcherCacheModel;
  constructor(
    queryModelWithConfig: [SearcherQueryModel, NoneDataCacheConfig | null],
    resultModelWithConfig: [SearcherResultModel, NoneDataCacheConfig | null],
    public searcherAction: SearcherAction
  ) {
    this.searcherQueryModel = queryModelWithConfig[0];
    this.resultModel = resultModelWithConfig[0];

    const configs: CacheConfig[] = [];
    if (queryModelWithConfig[1] !== null) {
      configs.push({
        data: this.searcherQueryModel,
        ...queryModelWithConfig[1],
      });
    }
    if (resultModelWithConfig[1] !== null) {
      configs.push({
        data: this.resultModel,
        ...resultModelWithConfig[1],
      });
    }
    if (configs.length > 0) {
      this.cacheModel = new SearcherCacheModel(configs, store.cacheStore);
    }
  }

  getData() {
    return {
      searcherQueryModel: this.searcherQueryModel,
      searcherAction: this.searcherAction,
      resultModel: this.resultModel,
      cacheModel: this.cacheModel,
    };
  }
}

abstract class SearcherAction {
  constructor(public apiClient: APIGen) {}
  abstract search(p: SearchParam): Promise<ListObj>;
}

export class SpaceSearcherAction extends SearcherAction {
  async search(p: SpaceSearchParm): Promise<ListObj> {
    const spaceRequestParam: SpaceSearchRequestParm = {
      pn: p.page,
      keyword: p.keyword,
      order: p.order,
      mid: p.mid,
      ps: 30,
      tid: 0,
    };

    const res2 = await this.apiClient.doFetch(
      "search-space",
      spaceRequestParam
    );

    let numPages: number;
    numPages = Math.floor(res2.data.page.count / res2.data.page.ps);
    if (res2.data.page.count % res2.data.page.ps > 0) {
      numPages++;
    }

    const arr = res2.data.list.vlist;

    const len = arr.length;
    for (let i = 0; i < len; i++) {
      const item = arr[i];
      item.play = convertIntToString(item.play);
      item.arcurl = "https://www.bilibili.com/video/" + item.bvid;
      item.created = convertDateToString(item.created);
      item.length = convertDurationToString(item.length);
    }

    return {
      results: arr,
      numPages,
    };
  }
}

export class UserInfoSearchAction extends SearcherAction {
  async search(p: SearchParam): Promise<ListObj> {
    let localUserInfo = await this.apiClient
      .doFetch("search-user-info", p)
      .then((e) => {
        if (e.data !== undefined) {
          return UserInfo.from(e.data);
        }
      });
    if (localUserInfo === undefined) {
      localUserInfo = UserInfo.nullUserInfo();
    }
    const ret = {
      results: [
        {
          userInfo: localUserInfo,
          res: [],
        },
      ],
      numPages: 1,
    };
    return ret;
  }
}

export class AllSearcherAction extends SearcherAction {
  async search(p: AllSearchParam): Promise<ListObj> {
    const res2 = await this.apiClient.doFetch("search-video", p);
    const arr = res2.data.result;
    const len = arr.length;
    for (let i = 0; i < len; i++) {
      const item = arr[i];
      item.play = convertIntToString(item.play);
      item.pubdate = convertDateToString(item.pubdate);
      item.duration = convertDurationToString(item.duration);
    }
    return {
      results: arr,
      numPages: res2.data.numPages,
    };
  }
}

export class userSearcherAction extends SearcherAction {
  private order(o: LocalUserSearchOrder) {
    let order: UserSearchOrder = "0",
      order_sort: UserSearchOrderSort = 0;
    switch (o) {
      case "1":
        order = "fans";
        break;
      case "2":
        order = "fans";
        order_sort = 1;
        break;
      case "3":
        order = "level";
        break;
      case "4":
        order = "level";
        order_sort = 1;
    }
    return {
      order,
      order_sort,
    };
  }

  private gender(g: number) {
    switch (g) {
      case 1:
        return "男";
      case 2:
        return "女";
      case 3:
        return "？";
    }
    return "？";
  }
  async search(p: LocalUserSearchParm): Promise<ListObj> {
    const { order: localOrder, order_sort } = this.order(p.order);
    const param: UserSearchParm = {
      ...p,
      order: localOrder,
      order_sort,
    };
    const res2 = await this.apiClient.doFetch("search-up-user", param);

    const arr = res2.data.result as UpUser[];

    const upuserList = new Array<UpUserInfo>();
    const len = arr.length;
    for (let i = 0; i < len; i++) {
      const item = arr[i];
      const userInfo = new UserInfo(
        item.upic,
        item.uname,
        item.usign,
        this.gender(item.gender),
        item.level,
        item.mid,
        item.fans
      );
      upuserList.push({
        userInfo,
        res: item.res,
      } as UpUserInfo);
    }

    return {
      results: upuserList,
      numPages: res2.data.numPages,
    };
  }
}

export class BgFtSearcherAction extends SearcherAction {
  async search(p: BangumiSearchParm): Promise<ListObj> {
    const res = await this.apiClient.doFetch("search-bg-ft", p);
    const results: Media_BG_FT[] = res.data?.result || [];

    return {
      results,
      numPages: res.data.numPages,
    };
  }
}

export const convertIntToString = (n: number): string => {
  if (n >= 1e4) {
    return Math.round(n / 1e3) / 10 + "万";
  }
  return n.toString();
};
export const convertDurationToString = (d: string): string => {
  const ds = d.split(":");
  const min = parseInt(ds[0], 10);
  let s = "0" + ds[1];
  s = s.slice(-2);

  if (min < 60) {
    return ds[0] + ":" + s;
  } else {
    const h = Math.floor(min / 60);
    const m = "0" + (min % 60);

    return h + ":" + m.slice(-2) + ":" + s;
  }
};
