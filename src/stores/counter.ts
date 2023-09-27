import type { SearchItem } from "./interface";

const uid = localStorage.getItem("uid") || "";
const cookie = localStorage.getItem("cookie") || "";
export const myHeaders = new Headers();

const apiprefix = localStorage.getItem("apiprefix") || "";

if (apiprefix) {
  myHeaders.append("X-Cookie", cookie);
  myHeaders.append("X-Referer", "https://www.bilibili.com");
  myHeaders.append("X-Origin", "https://www.bilibili.com");
}
const vapiprefix = localStorage.getItem("vapiprefix") || "http://";
const settings = {
  cookie: cookie,
  apiprefix: apiprefix,
  uid: uid,
  vapiprefix: vapiprefix,
};

if (
  localStorage.getItem("apiprefix") === null ||
  localStorage.getItem("vapiprefix") === null
) {
  localStorage.setItem("apiprefix", apiprefix);
  localStorage.setItem("vapiprefix", vapiprefix);
}

/**设置数据的代理对象，修改设置时会保存设置和同步更新请求头数据 */
export const settingStore = new Proxy(settings, {
  ownKeys(t) {
    return Reflect.ownKeys(t);
  },
  get(t, p, r) {
    return Reflect.get(t, p, r);
  },
  set(t, p, v, r): boolean {
    if (p in t) {
      /**更新Cookie时，同步更新请求头中的X-Cookie数据 */
      if (p === "cookie") {
        myHeaders.set("X-Cookie", v);
      }
      Reflect.set(t, p, v);
      localStorage.setItem(p.toString(), v);
      return true;
    }
    return false;
  },
});

export enum PLAYMODE {
  SINGLE,
  ALL,
  ROUND,
}
export enum MODE {
  SEARCH,
  SPACE,
  USER,
  MEDIA_BANGUMI_FT,
}

export const store = {
  cacheStore: new Map<string, any>(),
  space: {
    results: Array<SearchItem>(),
    mid: 0,
    keyword: "",
    order: "totalrank",
    page: 1,
    numPages: 0,
    userInfo: {
      face: "",
      name: "",
      sign: "",
      sex: "",
      level: 1,
      mid: 0,
      fans: 0,
    },
  },
  results: Array<SearchItem>(),
  keyword: "",
  order: "totalrank",
  page: 1,
  numPages: 0,
  duration: 0,
  pagemode: 0,
  playmode: PLAYMODE.SINGLE,
};
export interface CardItemContent {
  bvid: string;
  pic: string;
  title: string;
  mid: number;
  author: string;
  url: string;
  duration: string;
}

export class StateEvent {
  detail;
  constructor(
    public type: string,
    eventInitDict: { detail: { pagemode: MODE; query: any } }
  ) {
    this.detail = eventInitDict?.detail || null;
  }
}

export class EventDispatch {
  middleware: ((event: StateEvent) => void)[] = [];
  eventMap = new Map<string, Set<any>>();
  constructor(fs?: ((event: StateEvent) => void)[]) {
    if (fs) {
      this.middleware.push(...fs);
    }
  }
  use(f: (event: StateEvent) => void) {
    this.middleware.push(f);
  }
  addEventListener(eventName: string, fn: (e: StateEvent) => void) {
    let fns;
    if (!this.eventMap.has(eventName)) {
      fns = new Set();
      this.eventMap.set(eventName, fns);
    } else {
      fns = this.eventMap.get(eventName);
    }
    fns?.add(fn);
  }
  dispatchEvent(event: StateEvent) {
    this.eventMap.get(event.type)?.forEach((fn) => {
      fn(event);
    });
  }
  dispatch(event: StateEvent) {
    this.middleware.forEach((f) => {
      f(event);
    });
    this.dispatchEvent(event);
  }
}
