export function crop(val: number, min: number, max: number) {
  let retVal = val;

  if (min > max) throw `min can't be larger than max, ${min} > ${max}`;

  if (retVal < min) retVal = min;
  if (retVal > max) retVal = max;

  return retVal;
}
/**
 * 生成页码
 * @param total 总页数
 * @param cur 当前页码，最小值为1
 * @param pagesize 页码项数量，[3, 11]，只能为奇数，若为偶数则加1
 * @returns pages 页码数组，le 左面的省略号， re 右面的省略号
 */
export const genPageFunc = (total: number, cur: number, pagesize = 5) => {
  //FIXME 支持不同页码项数量
  if (pagesize % 2 === 0) ++pagesize;
  pagesize = crop(pagesize, 3, 11);

  if (total < 1) {
    return {
      pages: [],
      le: false,
      re: false,
    };
  }
  if (cur < 1) cur = 1;
  total = crop(total, 1, total);
  cur = crop(cur, 1, total);

  const pages = [];
  let le = false;
  let re = false;

  const p = Math.floor(pagesize / 2);
  let minBound = 0;
  let maxBound = Math.min(total - 1, pagesize + 1);
  if (cur < maxBound - 1) {
    minBound = 2;
  } else {
    minBound = Math.max(2, cur - p);
    maxBound = Math.min(cur + p, total - 1);
  }
  for (let j = minBound; j <= maxBound; j++) {
    pages.push(j);
  }
  le = minBound > 2;
  re = maxBound < total - 1;

  return {
    pages,
    le,
    re,
  };
};

export class UserInfo {
  constructor(
    public face: string,
    public name: string,
    public sign: string,
    public sex: string,
    public level: number,
    public mid: number,
    public fans: number
  ) {}
  static from(obj: Record<string, any>) {
    return new UserInfo(
      obj?.face,
      obj?.name,
      obj?.sign,
      obj?.sex,
      obj?.level,
      obj?.mid,
      obj?.fans
    );
  }
  static nullUserInfo(): UserInfo {
    return new UserInfo("./noface.jpg", "", "", "", 1, 0, 0);
  }
}
