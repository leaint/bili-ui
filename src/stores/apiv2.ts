import { encWbi } from "./sign";

export enum ApiUrl {
  NewsUrl = "https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?type_list=8,512,4097,4098,4099,4100,4101",
  UserInfoUrl = "https://api.bilibili.com/x/space/wbi/acc/info?",
  SuggestionUrl = "https://s.search.bilibili.com/main/suggest?func=suggest&suggest_type=accurate&sub_type=tag&main_ver=v1&highlight=&bangumi_acc_num=1&special_acc_num=1&topic_acc_num=1&upuser_acc_num=3&tag_num=10&special_num=10&bangumi_num=10&upuser_num=3",
  VideoInfoUrl = "https://api.bilibili.com/x/web-interface/view?",
  CookieUrl = "https://data.bilibili.com/v/web/web_page_view?url=https://www.bilibili.com/blackboard/friends-links.html",
  MoreNewsUrl = "https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_history?type_list=8,512,4097,4098,4099,4100,4101",
  UserUrl = "https://api.bilibili.com/x/web-interface/search/type?context=&search_type=bili_user",
  BangumiUrl = "https://api.bilibili.com/x/web-interface/wbi/search/type?",
  SearchVideoUrl = "https://api.bilibili.com/x/web-interface/search/type?search_type=video",
  SearchSpaceUrl = "https://api.bilibili.com/x/space/wbi/arc/search?",
  NavInfo = "https://api.bilibili.com/x/web-interface/nav",
  VideoShot = "https://api.bilibili.com/x/player/videoshot?",
}

export interface ApiConfig {
  cookie: string;
  apiprefix: string;
  uid: string;
  vapiprefix: string;
}

export abstract class APIGen {
  constructor(public defaultHeaders: Headers, public defaultStore: ApiConfig) {}
  /**创建网络请求 */
  async mkfetch(path: string, headers = this.defaultHeaders) {
    return this.mkPlainFetch(path, headers).then((e) => e.json());
  }

  async mkPlainFetch(path: string, headers = this.defaultHeaders) {
    return fetch(this.defaultStore.apiprefix + path, {
      headers,
      referrerPolicy: "no-referrer",
    });
  }

  abstract doFetch(
    apiType: string,
    param: Record<string, any>,
    headers?: Headers
  ): Promise<any>;

  static parse(apiUrl: string, param: Record<string, any>) {
    const url =
      apiUrl +
      Object.entries(param).reduce((acc, [k, v]) => acc + `&${k}=${v}`, "");

    return url;
  }
}

export const APITypeMap = new Map<string, string>([
  ["get-news", ApiUrl.NewsUrl],
  ["get-more-news", ApiUrl.MoreNewsUrl],
  ["search-video", ApiUrl.SearchVideoUrl],
  ["search-space", ApiUrl.SearchSpaceUrl],
  ["search-user-info", ApiUrl.UserInfoUrl],
  ["search-bg-ft", ApiUrl.BangumiUrl],
  ["get-suggestion", ApiUrl.SuggestionUrl],
  ["get-video-info", ApiUrl.VideoInfoUrl],
  ["search-up-user", ApiUrl.UserUrl],
  ["get-visitor-cookie", ApiUrl.CookieUrl],
  ["get-videoshot", ApiUrl.VideoShot],
]);

const WbiMap = new Map<string, boolean>([
  ["search-user-info", true],
  ["search-bg-ft", true],
  ["search-space", true],
]);
//ps=30&tid=0&jsonp=jsonp
export class MyAPIGen extends APIGen {
  doFetch(apiType: string, param: Record<string, any>): Promise<any> {
    const apiUrl = APITypeMap.get(apiType);
    const needWbi = WbiMap.get(apiType) || false;

    if (apiUrl) {
      if (needWbi) {
        return encWbi(param).then((wbiParams) =>
          this.mkfetch(apiUrl + wbiParams)
        );
      } else {
        const url = APIGen.parse(apiUrl, param);
        return this.mkfetch(url);
      }
    } else {
      return Promise.reject("can't found this api: " + apiType);
    }
  }
}
