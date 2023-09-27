//有关bilibili的接口返回数据格式

import type { UserInfo } from "./lib";

export interface SearchItem {
  type: "video";
  id: 720783904;
  author: "刘庸干净又卫生";
  mid: 533459953;
  typeid: "219";
  typename: "汪星人";
  arcurl: "http://www.bilibili.com/video/av720783904";
  aid: 720783904;
  bvid: "BV1PQ4y167xk";
  title: '\u003cem class="keyword"\u003e刘庸\u003c/em\u003e神作，万人要求的海盗狗。';
  description: "-";
  arcrank: "0";
  pic: "//i1.hdslb.com/bfs/archive/ddf7c50a3679caccf968584829061aec9ef82554.jpg";
  play: 18407526;
  video_review: 9273;
  favorites: 105156;
  tag: "海盗狗,干净又卫生,打卡中国游记,旅行";
  review: 14517;
  pubdate: 1633264236;
  senddate: 1633310988;
  duration: "0:33";
  badgepay: false;
  hit_columns: ["title", "author", "tag"];
  view_type: "";
  is_pay: 0;
  is_union_video: 0;
  rec_tags: null;
  new_rec_tags: [];
  rank_score: 105156;
  like: 514661;
  upic: "http://i1.hdslb.com/bfs/face/0af3de753fbbea996e4cce0073751981614cd16d.jpg";
  corner: "";
  cover: "";
  desc: "";
  url: "";
  rec_reason: "";
  danmaku: 9273;
  length: "";
  created: 0;
}

export interface CardInfo {
  title: string;
  owner: {
    name: string;
    mid: number;
  };
  first_frame: string;
  pic: string;
  url: string;
  short_link: string;
  bvid: string;
  duration: number;
  pubdate: number;
  duration_str: string;
  pubdate_str: string;
}

export interface BgmInfo {
  aid: 854866605;
  apiSeasonInfo: {
    bgm_type: 3;
    cover: "https://i0.hdslb.com/bfs/bangumi/image/14064a724fde3130be5c9587eb90deb66651e30a.png";
    is_finish: 0;
    season_id: 41863;
    title: "世界历史";
    total_count: 100;
    ts: 1660901737;
    type_name: "纪录片";
  };
  bullet_count: 10;
  cover: "https://i0.hdslb.com/bfs/archive/50f3441454cecdd53cdf2eeb3337f5e17b5ad036.png";
  episode_id: 635497;
  index: "45";
  index_title: "神圣同盟";
  new_desc: "第45集 神圣同盟";
  online_finish: 0;
  play_count: 7858;
  reply_count: 10;
  url: "https://www.bilibili.com/bangumi/play/ep635497";
}

export interface UpUserList {
  seid: "3665109718595656163";
  page: 1;
  pagesize: 20;
  numResults: 1;
  numPages: 1;
  suggest_keyword: "";
  rqt_type: "search";
  cost_time: {
    params_check: "0.000663";
    "get upuser live status": "0.000002";
    is_risk_query: "0.000098";
    illegal_handler: "0.000065";
    as_response_format: "0.000296";
    as_request: "0.156438";
    save_cache: "0.000845";
    deserialize_response: "0.000073";
    as_request_format: "0.000472";
    total: "0.162646";
    main_handler: "0.157513";
  };
  exp_list: {
    "5504": true;
    "7704": true;
    "6606": true;
  };
  egg_hit: 0;
  result: [
    {
      type: "bili_user";
      mid: 25583;
      uname: "8";
      usign: "";
      fans: 5;
      videos: 0;
      upic: "//i2.hdslb.com/bfs/face/df767d715aba8a53e5520ff18db73cc31a9f6bd0.jpg";
      face_nft: 0;
      face_nft_type: 0;
      verify_info: "";
      level: 4;
      gender: 3;
      is_upuser: 0;
      is_live: 0;
      room_id: 0;
      res: [
        {
          aid: 607794554;
          bvid: "BV1Y84y1h7ti";
          title: "【亮记生物鉴定】真有邮票里那么蓝的兔子？";
          pubdate: 1674037800;
          arcurl: "http://www.bilibili.com/video/av607794554";
          pic: "//i2.hdslb.com/bfs/archive/6c799de232a92f9fe8e5531f747d63af806cac6c.jpg";
          play: "1868350";
          dm: 3432;
          coin: 4430;
          fav: 5311;
          desc: "";
          duration: "2:16";
          is_pay: 0;
          is_union_video: 0;
        }
      ];
      official_verify: {
        type: 127;
        desc: "";
      };
      hit_columns: ["uname"];
      is_senior_member: 0;
    }
  ];
  show_column: 0;
  in_black_key: 0;
  in_white_key: 0;
}
interface UpUserVideo {
  aid: 607794554;
  bvid: "BV1Y84y1h7ti";
  title: "【亮记生物鉴定】真有邮票里那么蓝的兔子？";
  pubdate: 1674037800;
  arcurl: "http://www.bilibili.com/video/av607794554";
  pic: "//i2.hdslb.com/bfs/archive/6c799de232a92f9fe8e5531f747d63af806cac6c.jpg";
  play: "1868350";
  dm: 3432;
  coin: 4430;
  fav: 5311;
  desc: "";
  duration: "2:16";
  is_pay: 0;
  is_union_video: 0;
}
export interface UpUserInfo {
  userInfo: UserInfo;
  res: UpUserVideo[];
}
export interface UpUser {
  type: "bili_user";
  mid: 25583;
  uname: "8";
  usign: "";
  fans: 5;
  videos: 0;
  upic: "//i2.hdslb.com/bfs/face/df767d715aba8a53e5520ff18db73cc31a9f6bd0.jpg";
  face_nft: 0;
  face_nft_type: 0;
  verify_info: "";
  level: 4;
  gender: 3;
  is_upuser: 0;
  is_live: 0;
  room_id: 0;
  res: UpUserVideo[];
  official_verify: {
    type: 127;
    desc: "";
  };
  hit_columns: ["uname"];
  is_senior_member: 0;
}

export const convertDateToString = (d: number): string => {
  const a = new Date(d * 1000);
  let m = "0" + (a.getMonth() + 1);
  m = m.slice(-2);
  let day = "0" + a.getDate();
  day = day.slice(-2);
  return a.getFullYear() + "-" + m + "-" + day;
};

export const convertDurationToString = (d: number): string => {
  const h = "00" + Math.floor(d / 3600);
  const m = "00" + Math.floor((d / 60) % 60);
  const s = "00" + Math.floor(d % 60);

  if (h === "000") {
    return m.slice(-2) + ":" + s.slice(-2);
  } else {
    return h.slice(-2) + ":" + m.slice(-2) + ":" + s.slice(-2);
  }
};
/**bilibili国创帐号UID */
export const biligcID = 98627270;

export const biliID = {
  1: {
    name: "哔哩哔哩番剧",
    mid: 928123,
  },
  2: {
    name: "哔哩哔哩电影",
    mid: 15773384,
  },
  3: {
    name: "哔哩哔哩纪录片",
    mid: 7584632,
  },
  4: {
    name: "哔哩哔哩国创",
    mid: 98627270,
  },
};
export type AllSearchOrder = "totalrank" | "pubdate" | "click" | "dm";

export interface AllSearchParam {
  keyword: string;
  page: number;
  order: AllSearchOrder;
  duration: number;
}
export type BgFtSearchType = "media_ft" | "media_bangumi";
export interface BangumiSearchParm {
  keyword: string;
  page: number;
  search_type: BgFtSearchType;
}

export type SpaceSearchOrder = "click" | "pubdate" | "stow";
export interface SpaceSearchParm {
  keyword: string;
  page: number;
  order: SpaceSearchOrder;
  mid: number;
}

export interface SpaceSearchRequestParm {
  keyword: string;
  pn: number;
  order: SpaceSearchOrder;
  mid: number;
  ps: number;
  tid: number;
}

export type UserSearchOrder = "fans" | "level" | "0";
export type UserSearchOrderSort = 0 | 1;
export interface UserSearchParm {
  keyword: string;
  page: number;
  order: UserSearchOrder;
  order_sort: UserSearchOrderSort;
}
/**此order可转换为bilibili使用的order和order_sort参数 */
export type LocalUserSearchOrder = "0" | "1" | "2" | "3" | "4";

export interface LocalUserSearchParm {
  keyword: string;
  page: number;
  order: LocalUserSearchOrder;
}

export type SearchParam = Record<string, any>;

// | AllSearchParam
// | SpaceSearchParm
// | LocalUserSearchParm
// | BangumiSearchParm;

/**被SearchBar使用 */
export type TypeItem = {
  name: string;
  value: number;
  default?: boolean;
};

/**收藏列表项 */
export type StarItem = {
  id: string;
  param_id: string;
  cur: number;
  current_time: number;
  title: string;
};
/** 番剧和影视表项*/
export interface Media_BG_FT {
  cover: "http://i0.hdslb.com/bfs/bangumi/85992826bc6c729ad992acd6ac871ae551cae133.jpg";
  badges:
    | null
    | [
        {
          text: "会员专享";
        }
      ];
  ep_size: 1;
  eps: [];
  season_id: 2597;
  season_type: 2;
  title: '<em class="keyword">东京教父</em>';
  url: "https://www.bilibili.com/bangumi/play/ss2597?theme=movie";
  pubtime: 1068220800;
}
