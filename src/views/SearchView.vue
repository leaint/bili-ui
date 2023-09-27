<script setup lang="ts">
import router from "@/router";
import { myAPIGen } from "@/stores/api";
import { MODE, type CardItemContent } from "@/stores/counter";
import {
  type SearchItem,
  convertDateToString,
  type UpUserInfo,
  type AllSearchParam,
  type SpaceSearchParm,
  type SearchParam,
  type TypeItem,
  type SpaceSearchOrder,
  type AllSearchOrder,
  type LocalUserSearchOrder,
  type LocalUserSearchParm,
  type UpUserList,
  type Media_BG_FT,
  biligcID,
  type BgFtSearchType,
} from "@/stores/interface";
import { onActivated, onBeforeMount, ref, shallowRef, watch } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import CardItem from "../components/CardItem.vue";
import Pagination from "../components/ThePagination.vue";
import AuthorInfo from "../components/AuthorInfo.vue";
import { UserInfo } from "@/stores/lib";
import SearchBar from "../components/SearchBar.vue";
import EmptyBox from "../components/EmptyBox.vue";
import {
  convertIntToString,
  AllSearcher,
  AllSearcherAction,
  BgFtSearcher,
  BgFtSearcherAction,
  eventDispatcher,
  FULFILLED,
  InitModeEvent,
  PENDING,
  REJECTED,
  Searcher,
  SearcherFacade,
  SpaceSearcher,
  SpaceSearcherAction,
  UserInfoSearchAction,
  UserSearcher,
  userSearcherAction,
  type ListObj,
  type SearcherQueryModel,
  type SearcherResultModel,
  type TitleGenerator,
} from "./SearchViewScript";
// import noface from "@/assets/noface.jpg";

// #region URL查询参数 ——begin
const keyword = ref("");
const order = ref("totalrank");
const duration = ref(0);
const page = ref(1);
const mid = ref(0);
const userOrder = ref<LocalUserSearchOrder>("0");
const bgftSearchType = ref<BgFtSearchType>("media_bangumi");

// #endregion URL查询参数 ——end

// #region 状态参数 ——begin
const pageMode = ref(MODE.SEARCH);
const results = shallowRef(Array<SearchItem>());
const upuserResults = shallowRef(Array<UpUserInfo>());
const BgFtResults = shallowRef(Array<Media_BG_FT>());
const numPages = ref(0);
const suggestwords = shallowRef(Array<string>());
const userInfo = ref(UserInfo.nullUserInfo());
const errormsg = ref("");
const typelist = ref<TypeItem[]>([
  { name: "视频", value: MODE.SEARCH, default: false },
  { name: "用户", value: MODE.USER, default: false },
  { name: "番剧", value: MODE.MEDIA_BANGUMI_FT, default: false },
]);
const showEmpty = ref(false);
// #endregion 状态参数 ——end

let clear = true;

eventDispatcher.use((e) => {
  if (e.type.endsWith(PENDING)) {
    showEmpty.value = false;

    clear = false;
    setTimeout(() => {
      if (!clear) {
        errormsg.value = "加载中...";
      }
    }, 1000);
  } else if (e.type.endsWith(FULFILLED) || e.type.endsWith(REJECTED)) {
    errormsg.value = "";
    clear = true;
    if (numPages.value === 0) {
      showEmpty.value = true;
    }
    updateTitle();
  }
});
class SpaceTitle implements TitleGenerator {
  readonly pageTitle = "";

  getTitle() {
    if (!userInfo.value?.name) {
      return this.pageTitle;
    } else {
      if (keyword.value.length > 0) {
        return keyword.value + " - 第 " + page.value + " 页";
      } else {
        return userInfo.value.name + " - 第 " + page.value + " 页";
      }
    }
  }
}
class UserInfoSearchParm implements SearcherQueryModel {
  isSame(query: any): boolean {
    throw new Error("Method not implemented.");
  }
  isValid(): boolean {
    return mid.value > 0;
  }
  isEqual(t: SearchParam): boolean {
    throw new Error("Method not implemented.");
  }
  getData(): SearchParam {
    return {
      mid: mid.value,
    };
  }
  setData(data: any): void {
    mid.value = parseInt(data.mid?.toString(), 10) || 0;
  }
}
class UserInfoResultModel implements SearcherResultModel {
  clearData(): void {
    throw new Error("Method not implemented.");
  }
  isEqual(t: ListObj): boolean {
    throw new Error("Method not implemented.");
  }
  getData(): ListObj {
    return {
      results: [
        {
          userInfo: userInfo.value,
          res: [],
        },
      ],
      numPages: 1,
    };
  }
  setData(data: ListObj): void {
    if (data.results.length > 0) {
      const user = data.results[0] as UpUserInfo;

      userInfo.value = user.userInfo;
    }
  }
}

const toDefaultValue = (a: any, defaultValue: any = "") =>
  a === undefined ? defaultValue : a;

class SpaceSearcherQueryModel implements SearcherQueryModel {
  readonly defaultOrder: SpaceSearchOrder = "pubdate";

  isSame(query: any): boolean {
    if (toDefaultValue(query.mid, 0) != mid.value) {
      return false;
    }
    if (
      toDefaultValue(query.keyword) !== keyword.value ||
      toDefaultValue(query.page, 1) != page.value ||
      toDefaultValue(query.order, this.defaultOrder) !== order.value
    ) {
      return false;
    }
    return true;
  }
  isEqual(query: SearchParam): boolean {
    return (
      mid.value === query.mid &&
      page.value === query.page &&
      keyword.value === query.keyword &&
      order.value === query.order
    );
  }
  getData(): SearchParam {
    const query: SpaceSearchParm = {
      page: page.value,
      mid: mid.value,
      order: order.value as SpaceSearchOrder,
      keyword: keyword.value,
    };
    return query;
  }
  setData(query: any): void {
    page.value = parseInt(query.page?.toString(), 10) || 1;
    order.value = query.order?.toString();
    if (query.order === undefined) {
      order.value = this.defaultOrder;
    }
    keyword.value = query.keyword?.toString() || "";
  }

  isValid() {
    return mid.value > 0;
  }
}

class SpaceSearcherResultModel implements SearcherResultModel {
  isEqual(t: ListObj): boolean {
    throw new Error("Method not implemented.");
  }
  getData(): ListObj {
    return {
      results: results.value,
      numPages: numPages.value,
    };
  }
  setData(data: ListObj): void {
    results.value = data.results as SearchItem[];

    numPages.value = data.numPages;
  }

  clearData(): void {
    results.value = [];
    numPages.value = 0;
  }
}

class AllTitle implements TitleGenerator {
  readonly pageTitle = "搜索页";
  getTitle() {
    if (keyword.value.length === 0) {
      return this.pageTitle;
    } else {
      return keyword.value + " - 第 " + page.value + " 页";
    }
  }
}

class AllSearcherQueryModel implements SearcherQueryModel {
  readonly defaultOrder: AllSearchOrder = "totalrank";

  isSame(query: any): boolean {
    if (
      toDefaultValue(query.keyword) !== keyword.value ||
      toDefaultValue(query.page, 1) != page.value ||
      toDefaultValue(query.order, this.defaultOrder) !== order.value ||
      toDefaultValue(query.duration, 0) != duration.value
    ) {
      return false;
    }
    return true;
  }
  isEqual(query: SearchParam): boolean {
    return (
      duration.value === query.duration &&
      page.value === query.page &&
      keyword.value === query.keyword &&
      order.value === query.order
    );
  }
  getData(): SearchParam {
    const query: AllSearchParam = {
      keyword: keyword.value,
      page: page.value,
      order: order.value as AllSearchOrder,
      duration: duration.value,
    };
    return query;
  }
  setData(query: any): void {
    page.value = parseInt(query.page?.toString(), 10) || 1;
    duration.value = parseInt(query.duration?.toString(), 10) || 0;
    keyword.value = query.keyword?.toString() || "";

    order.value = query.order?.toString();
    if (query.order === undefined) {
      order.value = this.defaultOrder;
    }
  }

  isValid() {
    return keyword.value.length > 0;
  }
}

class AllSearcherResultModel implements SearcherResultModel {
  isEqual(t: ListObj): boolean {
    throw new Error("Method not implemented.");
  }
  getData(): ListObj {
    return {
      results: results.value,
      numPages: numPages.value,
    };
  }
  setData(data: ListObj): void {
    results.value = data.results as SearchItem[];

    numPages.value = data.numPages;
  }

  clearData(): void {
    results.value = [];
    numPages.value = 0;
  }
}

class UserTitle implements TitleGenerator {
  readonly pageTitle = "用户搜索页";
  getTitle() {
    if (keyword.value.length === 0) {
      return this.pageTitle;
    } else {
      return keyword.value + " - 第 " + page.value + " 页";
    }
  }
}

class UserSearcherQueryModel implements SearcherQueryModel {
  readonly defaultOrder: LocalUserSearchOrder = "0";

  isSame(query: any): boolean {
    if (
      toDefaultValue(query.keyword) !== keyword.value ||
      toDefaultValue(query.page, 1) != page.value ||
      toDefaultValue(query.order, this.defaultOrder) !== order.value
    ) {
      return false;
    }
    return true;
  }
  isEqual(): boolean {
    throw new Error("Method not implemented.");
  }
  getData(): SearchParam {
    const query: LocalUserSearchParm = {
      keyword: keyword.value,
      page: page.value,
      order: userOrder.value,
    };
    return query;
  }
  setData(query: any): void {
    page.value = parseInt(query.page?.toString(), 10) || 1;
    keyword.value = query.keyword?.toString() || "";

    order.value = query.order?.toString();
    if (query.order === undefined) {
      order.value = this.defaultOrder;
    }
  }

  isValid() {
    return keyword.value.length > 0;
  }
}

class UserSearcherResultModel implements SearcherResultModel {
  isEqual(t: ListObj): boolean {
    throw new Error("Method not implemented.");
  }
  getData(): ListObj {
    return {
      results: upuserResults.value,
      numPages: numPages.value,
    };
  }
  setData(data: ListObj): void {
    upuserResults.value = data.results as UpUserInfo[];
    numPages.value = data.numPages;
  }

  clearData(): void {
    upuserResults.value = [];
    numPages.value = 0;
  }
}
class BgFtTitle implements TitleGenerator {
  readonly bangumiTitle = "番剧搜索页";
  readonly ftTitle = "影视搜索页";
  readonly pageTitle = "";
  getTitle() {
    if (keyword.value.length === 0) {
      if (bgftSearchType.value === "media_ft") {
        return this.ftTitle;
      } else {
        return this.bangumiTitle;
      }
    } else {
      return keyword.value + " - 第 " + page.value + " 页";
    }
  }
}
class BgFtSearcherQueryModel implements SearcherQueryModel {
  isSame(query: any): boolean {
    return toDefaultValue(query.keyword) === keyword.value;
  }
  isEqual(query: any): boolean {
    throw new Error("Method not implemented.");
  }
  getData(): SearchParam {
    return {
      keyword: keyword.value,
      page: page.value,
      search_type: bgftSearchType.value,
    };
  }
  setData(query: any): void {
    page.value = parseInt(query.page?.toString(), 10) || 1;
    keyword.value = query.keyword?.toString() || "";

    if (query.search_type !== "media_ft") {
      bgftSearchType.value = "media_bangumi";
    } else {
      bgftSearchType.value = "media_ft";
    }
  }

  isValid() {
    return keyword.value.length > 0;
  }
}

class BgFtSearcherResultModel implements SearcherResultModel {
  isEqual(t: ListObj): boolean {
    throw new Error("Method not implemented.");
  }
  getData(): ListObj {
    return {
      results: BgFtResults.value,
      numPages: numPages.value,
    };
  }
  setData(data: ListObj): void {
    BgFtResults.value = data.results as Media_BG_FT[];
    numPages.value = data.numPages;
  }

  clearData(): void {
    BgFtResults.value = [];
    numPages.value = 0;
  }
}

//FIXME userInfo
const spaceSearcher = new SpaceSearcher(
  eventDispatcher,
  new SearcherFacade(
    [
      new SpaceSearcherQueryModel(),
      {
        key: "spacequery",
        cache: true,
        constrain: true,
        restore: true,
      },
    ],
    [
      new SpaceSearcherResultModel(),
      {
        key: "spaceresult",
        cache: true,
        constrain: false,
        restore: true,
      },
    ],
    new SpaceSearcherAction(myAPIGen)
  ),
  new SpaceTitle(),
  new SearcherFacade(
    [new UserInfoSearchParm(), null],
    [
      new UserInfoResultModel(),
      {
        key: "userinfo",
        cache: true,
        constrain: false,
        restore: true,
      },
    ],
    new UserInfoSearchAction(myAPIGen)
  )
);
const allSearcher = new AllSearcher(
  eventDispatcher,
  new SearcherFacade(
    [
      new AllSearcherQueryModel(),
      {
        key: "query",
        cache: true,
        constrain: true,
        restore: false,
      },
    ],
    [
      new AllSearcherResultModel(),
      {
        key: "result",
        cache: true,
        constrain: false,
        restore: true,
      },
    ],
    new AllSearcherAction(myAPIGen)
  ),
  new AllTitle()
);
const userSearcher = new UserSearcher(
  eventDispatcher,
  new SearcherFacade(
    [
      new UserSearcherQueryModel(),
      {
        key: "query",
        cache: false,
        constrain: false,
        restore: false,
      },
    ],
    [
      new UserSearcherResultModel(),
      {
        key: "result",
        cache: false,
        constrain: false,
        restore: false,
      },
    ],
    new userSearcherAction(myAPIGen)
  ),
  new UserTitle()
);
const bgFtSearcher = new BgFtSearcher(
  eventDispatcher,
  new SearcherFacade(
    [
      new BgFtSearcherQueryModel(),
      {
        key: "query",
        cache: false,
        constrain: false,
        restore: false,
      },
    ],
    [
      new BgFtSearcherResultModel(),
      {
        key: "result",
        cache: false,
        constrain: false,
        restore: false,
      },
    ],
    new BgFtSearcherAction(myAPIGen)
  ),

  new BgFtTitle()
);

let searcher: Searcher;

function chooseSearcher(mode: MODE): Searcher {
  switch (mode) {
    case MODE.SPACE:
      return spaceSearcher;

    case MODE.SEARCH:
      return allSearcher;

    case MODE.USER:
      return userSearcher;
    case MODE.MEDIA_BANGUMI_FT:
      return bgFtSearcher;
    default:
      throw `unknown page mode '${mode}'`;
  }
}

/**网页标题更新函数*/
function updateTitle() {
  document.title = searcher!.title;
}

eventDispatcher.addEventListener(InitModeEvent, (le) => {
  const query = le.detail.query;

  const current = le.detail.pagemode;
  const prevSearcher = searcher;

  searcher = chooseSearcher(current);

  searcher.searcherQueryModel.setData(query);

  pageMode.value = current;

  if (searcher !== prevSearcher) {
    searcher.restart();
  }
  typelist.value.forEach((i) => {
    i.default = i.value === pageMode.value;
  });
});

onBeforeMount(() => {
  const query = router.currentRoute.value.query;
  const mode = router.currentRoute.value.meta.pagemode as MODE;

  //FIXME INITMODEACTION 与 restart 函数功能是否重复
  const localSearcher = chooseSearcher(mode);
  eventDispatcher.dispatchEvent(localSearcher.initModeAction(query));
});
// 上次的KeepAlive页面缓存是否符合当前页面模式及参数，符合则只更新标题，否则重启模式
onActivated(() => {
  const mode = router.currentRoute.value.meta.pagemode as MODE;
  // 与上次缓存状态不一致，重新启动
  if (
    mode !== pageMode.value ||
    !searcher.searcherQueryModel.isSame(router.currentRoute.value.query)
  ) {
    searcher.resultModel.clearData();
    eventDispatcher.dispatchEvent(
      chooseSearcher(mode).initModeAction(router.currentRoute.value.query)
    );
  }
  updateTitle();
});
// 缓存数据。同组件，不同页面模式，切换模式。
onBeforeRouteLeave((to) => {
  searcher.cacheModel.saveData();

  const isOtherPageMode =
    to.meta.pagemode !== undefined && pageMode.value !== to.meta.pagemode;
  // 不离开此组件，且切换页面模式
  if (isOtherPageMode) {
    searcher.resultModel.clearData();
    eventDispatcher.dispatchEvent(
      chooseSearcher(to.meta.pagemode as MODE).initModeAction(to.query)
    );
  }
});
//相同页面模式，不同查询参数
onBeforeRouteUpdate((to) => {
  searcher.searcherQueryModel.setData(to.query);
  if (searcher.searcherQueryModel.isValid()) {
    searcher.triggerUpdateListEvent();
  } else {
    searcher.resultModel.clearData();
    eventDispatcher.dispatchEvent(searcher.initModeAction(to.query));
  }
});

/**
 * 搜索
 * @param pagev 页码
 */
function search(pagev: number) {
  if (searcher.searcherQueryModel.isValid()) {
    router.push({
      query: {
        ...searcher.searcherQueryModel.getData(),
        page: pagev,
      },
    });
  }
}

watch(keyword, () => void setTimeout(() => void getsuggest(), 0));

let lasttime = Date.now() - 2000;
let lastkeyword = "";
/**获取搜索建议词
 * @param mode 尝试次数，0为初始值
 */
function getsuggest(mode = 0) {
  if (pageMode.value === MODE.SPACE) {
    return;
  }
  const usertime = Date.now();
  // 若上次请求时间距现在不足1秒，取消或延迟此次操作
  if (usertime - lasttime < 1000) {
    // 若当前有未完成请求操作，延后1秒再搜索，否则取消此次操作
    if (mode <= 1) {
      setTimeout(() => {
        getsuggest(mode + 1);
      }, 1000);
    }
    return;
  }
  // 更新上次搜索时间
  lasttime = usertime;

  if (keyword.value.length === 0) {
    suggestwords.value = [];
    return;
  }
  if (suggestwords.value.length > 0 && lastkeyword === keyword.value) {
    return;
  }
  lastkeyword = keyword.value;

  myAPIGen.doFetch("get-suggestion", { term: keyword.value }).then((e) => {
    suggestwords.value = e.result?.tag?.map((i: any) => i.value) || [];
  });
}

function cardAdapter(item: SearchItem, pagemode: MODE): CardItemContent {
  const content: CardItemContent = {
    bvid: item.bvid,
    pic: item.pic,
    mid: item.mid,
    author: item.author,
    title: item.title,
    url: item.arcurl,
    duration: pagemode === MODE.SEARCH ? item.duration : item.length,
  };
  return content;
}
type UpuserRes = UpUserList["result"][0]["res"][0];

function upuserAdapter(item: UserInfo, res: UpuserRes) {
  const content: CardItemContent = {
    bvid: res.bvid,
    pic: res.pic,
    mid: item.mid,
    author: item.name,
    title: res.title,
    url: res.arcurl,
    duration: res.duration,
  };
  return content;
}

function needPay(item: Media_BG_FT) {
  return (
    item.badges != null &&
    item.badges?.findIndex((i) => i.text.includes("会员")) !== -1
  );
}

function bgFtAdapter(item: Media_BG_FT) {
  const content: CardItemContent = {
    bvid: "ss" + item.season_id,
    pic: item.cover,
    mid: biligcID,
    author: "",
    title: item.title,
    url: item.url,
    duration: (item.eps?.length || "1") + "P",
  };
  return content;
}
function pagechange(page: number) {
  search(page);
}

function getsuggestEvent(key: string) {
  keyword.value = key;
  getsuggest();
}
function searchEvent(key: string) {
  keyword.value = key;
  search(1);
}
function typeselectEvent(key: string) {
  const mode = parseInt(key);
  let path = "";
  switch (mode) {
    case MODE.SEARCH:
      path = "/search?keyword=" + keyword.value;
      break;
    case MODE.USER:
      path = "/upuser?keyword=" + keyword.value;
      break;
    case MODE.MEDIA_BANGUMI_FT:
      path = "/bgft?keyword=" + keyword.value;
      break;
  }
  router.push(path);
}
</script>

<template>
  <div class="divbox">
    <div class="box">
      <SearchBar
        :suggestwords="suggestwords"
        :keyword="keyword"
        :autofocus="true"
        :typelist="typelist"
        @searchevent="searchEvent"
        @getsuggest="getsuggestEvent"
        @typeselect="typeselectEvent"
      ></SearchBar>

      <template v-if="MODE.SEARCH === pageMode || MODE.SPACE === pageMode">
        <fieldset @change="search(1)">
          <template v-if="MODE.SEARCH === pageMode">
            <input
              type="radio"
              v-model="order"
              id="vtotalrank"
              value="totalrank"
            />
            <label for="vtotalrank">综合排序</label>
          </template>
          <input type="radio" v-model="order" id="vclick" value="click" />
          <label for="vclick">点击最多</label>
          <input type="radio" v-model="order" id="vpubdate" value="pubdate" />
          <label for="vpubdate">最新发布</label>
          <template v-if="MODE.SPACE === pageMode">
            <input type="radio" v-model="order" id="vstow" value="stow" />
            <label for="vstow">最多收藏</label>
          </template>
          <template v-if="MODE.SEARCH === pageMode">
            <input type="radio" v-model="order" id="vdm" value="dm" />
            <label for="vdm">最多弹幕</label>
          </template>
        </fieldset>
        <fieldset @change="search(1)" v-if="MODE.SEARCH === pageMode">
          <input type="radio" v-model="duration" id="dall" value="0" />
          <label for="dall">全部时长</label>
          <input type="radio" v-model="duration" id="dten" value="1" />
          <label for="dten">10分钟以下</label>
          <input type="radio" v-model="duration" id="dthirty" value="2" />
          <label for="dthirty">10-30分钟</label>
          <input type="radio" v-model="duration" id="dsixty" value="3" />
          <label for="dsixty">30-60分钟</label>
          <input type="radio" v-model="duration" id="dupsixty" value="4" />
          <label for="dupsixty">60分钟以上</label>
        </fieldset>
      </template>
      <template v-if="MODE.USER === pageMode">
        <fieldset @change="search(1)">
          <input type="radio" v-model="userOrder" id="ua" value="0" />
          <label for="ua">默认</label>
          <input type="radio" v-model="userOrder" id="ub" value="1" />
          <label for="ub">粉丝数多</label>
          <input type="radio" v-model="userOrder" id="uc" value="2" />
          <label for="uc">粉丝数少</label>
          <input type="radio" v-model="userOrder" id="ud" value="3" />
          <label for="ud">等级高</label>
          <input type="radio" v-model="userOrder" id="ue" value="4" />
          <label for="ue">等级低</label>
        </fieldset>
      </template>
      <template v-if="MODE.MEDIA_BANGUMI_FT === pageMode">
        <fieldset @change="search(1)">
          <input
            type="radio"
            v-model="bgftSearchType"
            id="ma"
            value="media_bangumi"
          />
          <label for="ma">番剧</label>
          <input
            type="radio"
            v-model="bgftSearchType"
            id="mb"
            value="media_ft"
          />
          <label for="mb">影视</label>
        </fieldset>
      </template>
    </div>
    <AuthorInfo
      :user-info="userInfo"
      :mid="mid"
      size="large"
      v-if="MODE.SPACE === pageMode"
    ></AuthorInfo>
    <hr class="break" style="width: 100%; max-width: 900px" />
    <div class="errormsg" v-show="errormsg.length > 0">{{ errormsg }}</div>
    <div>
      <template v-if="MODE.USER === pageMode">
        <ul class="upuserbox">
          <li v-for="(item, index) of upuserResults" :key="index">
            <AuthorInfo :user-info="item.userInfo" imgsize="large"></AuthorInfo>
            <ul class="resultbox leftbox">
              <CardItem
                v-for="(res, index) of item.res"
                :key="index"
                :item="upuserAdapter(item.userInfo, res)"
                :left-to-right="true"
              >
                <template #detail>
                  <span>📈️{{ convertIntToString(parseInt(res.play)) }}</span>
                  <span>🕒️{{ convertDateToString(res.pubdate) }}</span>
                </template>
              </CardItem>
            </ul>
            <div style="text-align: end">
              <a target="_blank" :href="'./space?mid=' + item.userInfo.mid"
                >查看用户所有稿件📎️</a
              >
            </div>
          </li>
        </ul>
      </template>
      <template v-if="MODE.SEARCH === pageMode || MODE.SPACE === pageMode">
        <ul class="resultbox">
          <li v-for="(item, index) of results" :key="index">
            <CardItem
              :item="cardAdapter(item, pageMode)"
              :show-author="pageMode === MODE.SEARCH"
            >
              <template #detail>
                <span>📈️{{ item.play }}</span>
                <span v-if="pageMode === MODE.SEARCH"
                  >🕒️{{ item.pubdate }}</span
                >
                <span v-else>🕒️{{ item.created }}</span>
              </template>
            </CardItem>
          </li>
        </ul>
      </template>
      <template v-if="MODE.MEDIA_BANGUMI_FT === pageMode">
        <ul class="resultbox">
          <li v-for="(item, index) of BgFtResults" :key="index">
            <CardItem :item="bgFtAdapter(item)" :show-author="false">
              <template #detail>
                <span>🕒️{{ convertDateToString(item.pubtime) }}</span>
                <span style="padding-left: 1em"
                  >{{ needPay(item) ? "💰️会员" : "" }}
                </span>
              </template>
            </CardItem>
          </li>
        </ul>
      </template>
      <Pagination
        :num-pages="numPages"
        :current-page="page"
        @pagechange="pagechange"
      ></Pagination>
      <EmptyBox v-if="showEmpty" />
    </div>
  </div>
</template>

<style scoped>
.divbox {
  display: flex;
  flex-direction: column;
  place-items: center;
}

ul.resultbox {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 0;
  list-style: none;
  gap: 1em;
}
.resultbox {
  margin-top: 1em;
  max-width: min-content;
  margin-left: auto;
  margin-right: auto;
}
.resultbox.leftbox {
  max-width: fit-content;
  margin-left: 2em;
}

ul.upuserbox {
  align-self: stretch;
  list-style: none;
}
ul.upuserbox .resultbox {
  grid-template-columns: repeat(3, 1fr);
}
ul.upuserbox .authorinfo {
  border: none;
  margin: unset;
}
ul.upuserbox > li {
  border-bottom: 1px solid #bdbdbd;
  padding-bottom: 1em;
}

.errormsg {
  position: fixed;
  top: 1%;
  z-index: 555;
  /* margin: auto; */
  left: calc(50% - 10em);
  min-width: 20em;
  /* right: auto; */
  padding: 3px 2em;
  min-height: 1em;
  color: white;
  background-color: #81c784;
  border-radius: 5px;
  text-align: center;
}

fieldset {
  border: 0;
  font-size: small;
  display: flex;
  flex-wrap: wrap;
}
fieldset input {
  display: none;
}

fieldset label {
  padding: 2px 5px;
  margin: 0 0.5em;
  border-radius: 5px;
  cursor: pointer;
}
fieldset label:hover {
  color: #447de2;
}
fieldset input:checked + label {
  color: white;
  background-color: #447de2;
}

@media (max-width: 900px), (orientation: portrait) {
  ul.upuserbox .resultbox {
    grid-template-columns: repeat(1, 1fr);
  }
  ul.resultbox {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 500px) {
  .divbox .box {
    width: 450px;
  }
}
</style>
