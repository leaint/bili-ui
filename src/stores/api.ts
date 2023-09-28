import { ApiUrl, MyAPIGen, type ApiConfig } from "./apiv2";
import { myHeaders, settingStore } from "./counter";

export class Api {
  constructor(public defaultHeaders: Headers, public defaultStore: ApiConfig) {}

  /**获取游客Cookie */
  async getVisitorCookie() {
    const e = await fetch(this.defaultStore.apiprefix + ApiUrl.CookieUrl, {
      referrerPolicy: "no-referrer",
    });

    return { cookie: e.headers.get("x-cookie") || document.cookie };
  }
  async getNavInfo() {
    const e = await fetch(this.defaultStore.apiprefix + ApiUrl.NavInfo, {
      referrerPolicy: "no-referrer",
    }).then((e) => e.json());
    const img_url: string = e.data.wbi_img.img_url;
    const sub_url: string = e.data.wbi_img.sub_url;
    const img_key = img_url.split("/");
    const sub_key = sub_url.split("/");
    return {
      img_key: img_key[img_key.length - 1].split(".")[0],
      sub_key: sub_key[sub_key.length - 1].split(".")[0],
    };
  }
}

const apiClient = new Api(myHeaders, settingStore);

export const myAPIGen = new MyAPIGen(myHeaders, settingStore);

export async function getWbiKeys() {
  if (wbi_keys.img_key === "") {
    wbi_keys = await apiClient.getNavInfo();
  }
  return wbi_keys;
}
let wbi_keys = {
  img_key: "",
  sub_key: "",
};
export default apiClient;
