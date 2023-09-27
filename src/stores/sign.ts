import { getWbiKeys } from "./api";
import { md5 } from "./md5";

/** from github */
const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61,
  26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
  20, 34, 44, 52,
];

function getMixinKey(orig: string) {
  return mixinKeyEncTab.reduce((acc, n) => acc + orig[n], "").slice(0, 32);
}

export async function encWbi(params: Record<string, string | number>) {
  const { img_key, sub_key } = await getWbiKeys();
  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g;
  params = { ...params, wts: curr_time };
  const query = Object.entries(params)
    .sort()
    .map(
      ([k, v]) =>
        encodeURIComponent(k) +
        "=" +
        encodeURIComponent(("" + v).replace(chr_filter, ""))
    );
  const query_str = query.join("&");
  const wbi_sign = md5(query_str + mixin_key, "", false);
  return query_str + "&w_rid=" + wbi_sign;
}
