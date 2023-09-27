//@ts-check

"use strict";
//import { createApp, reactive } from "./assets/petite-vue.es.js";

const uid = localStorage.getItem("uid") || "";
const cookie = localStorage.getItem("cookie") || "";

const apiPrefix = localStorage.getItem("apiprefix") || "";
const vapiPrefix = localStorage.getItem("vapiprefix") || "http://";

let myHeaders;
if (apiPrefix) {
    myHeaders = new Headers([
        ["X-Cookie", cookie],
        ["X-Referer", "https://www.bilibili.com"],
        ["X-Origin", "https://www.bilibili.com"],
    ]);
} else {
    myHeaders = new Headers;
}

const apiFetch = async (url) => {
    const res = await fetch(apiPrefix + url, { headers: myHeaders, referrerPolicy: 'no-referrer' });
    return res.json();
}

/**@enum {number} */
const VIDEOMODE = {
    DASH: 0, FLV: 1, __proto__: null
}

const DATAMODE = {
    NORMAL: 0, SEASON: 1, EPISODE: 2
}
/**
 * 视频数据格式
 * 0: dash; 1: flv
 * @type {VIDEOMODE}
 * */
let videoMode = parseInt(localStorage.getItem("videoMode")) == 1 ? 1 : 0;
/**视频质量 */
let quality = 32;

/**@type {Promise} */
let bvidData = null;
/**@type {Promise} */
let seasonData = null;
/**@type {Promise} */
let videoData = null;

const u = new URL(location.href);
let p = parseInt(u.searchParams.get("p")) - 1 || 0;
const id = u.searchParams.get("id");
const jump_to_time = u.searchParams.get("t")
if (jump_to_time !== null) {
    u.searchParams.delete("t")
    window.history.replaceState(null, "", u);
}

let avid = '';
let bvid = '';
let ssId = '';
let epId = '';
/**视频模式。普通视频或剧集*/
let dataMode = null;

switch (id.toLowerCase().substring(0, 2)) {
    case 'bv':
        bvid = id;
        dataMode = DATAMODE.NORMAL;
        break;
    case 'ss':
        ssId = id.substring(2);
        dataMode = DATAMODE.SEASON;
        break;
    case 'ep':
        epId = id.substring(2);
        dataMode = DATAMODE.EPISODE;
        break;
    case 'av':
        avid = id.substring(2);
        dataMode = DATAMODE.NORMAL;
        break;
    default:
        const msg = '视频代码格式不正确';
        alert(msg);
        throw msg;
}

const starList = JSON.parse(localStorage.getItem("starlist") || "[]")

function getVideoUrl(bvid, cid, quality, videoMode) {
    const url = videoMode === VIDEOMODE.FLV ?
        `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=${quality}&fnver=0&fnval=0&fourk=1` :
        `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=112&fnver=0&fnval=16&fourk=1`;
    videoData = apiFetch(
        url
    )
        .then(({ data }) => { return { data }; });
}
function fetchAvidData() {
    return apiFetch("https://api.bilibili.com/x/web-interface/view?aid=" + avid)
        .then(({ data }) => {
            bvid = data.bvid;
            const cid = data.pages[p].cid;
            getVideoUrl(bvid, cid, quality, videoMode)
            return { data };
        })
}
function fetchBvidData() {
    return apiFetch("https://api.bilibili.com/x/web-interface/view?bvid=" + bvid)
        .then(({ data }) => {

            const cid = data.pages[p].cid;
            getVideoUrl(bvid, cid, quality, videoMode)
            return { data };
        })
}

/**
 *
 * @param {number} d
 * @returns [hh:]mm::ss
 */
function convertDurationToString(d) {
    const h = "00" + Math.floor(d / 3600);
    const m = "00" + Math.floor((d / 60) % 60);
    const s = "00" + Math.floor(d % 60);

    if (h === "000") {
        return m.slice(-2) + ":" + s.slice(-2);
    } else {
        return h.slice(-2) + ":" + m.slice(-2) + ":" + s.slice(-2);
    }
};

if (dataMode === DATAMODE.NORMAL) {

    if (bvid !== '') {
        bvidData = fetchBvidData();
    } else if (avid !== '') {
        bvidData = fetchAvidData();
    }
} else {
    const apiUrl = dataMode === DATAMODE.SEASON ?
        `https://api.bilibili.com/pgc/view/web/season?season_id=${ssId}` :
        `https://api.bilibili.com/pgc/view/web/season?ep_id=${epId}`;

    seasonData = apiFetch(apiUrl)
        .then(({ result }) => {
            if (dataMode === DATAMODE.EPISODE) {
                ssId = result.season_id;
                let localP = result.episodes.findIndex((i) => i.id == epId);
                if (localP === -1) {
                    const sectionIdx = result.section.findIndex(i => {
                        localP = i.episodes.findIndex((i) => i.id == epId);
                        return localP !== -1;
                    });

                    const section = result.section[sectionIdx];
                    result.season_title += ' ' + section.title;
                    section.title = "剧集";

                    [section.episodes, result.episodes] = [result.episodes, section.episodes];

                }
                p = localP;
            }
            const ssData = result.episodes[p];

            if (ssData !== undefined) {
                bvid = ssData.bvid
                getVideoUrl(bvid, ssData.cid, quality, videoMode)
            }
            return { result };
        })
}

const PLAYMODE = {
    __proto__: null,
    SINGLE: 0,
    ALL: 1,
    ROUND: 2,
}
const store = {
    __proto__: null,
    results: [],
    keyword: "",
    order: "totalrank",
    page: 1,
    numPages: 0,
    duration: 0,
    pagemode: 0,
    playmode: PLAYMODE.SINGLE
};
/**清晰度对应的字符串表示 */
const codecs = {
    __proto__: null,
    116: "",/*1080P60*/
    112: "",/*1080P+*/
    80: "1080P",
    64: "720P",
    32: "480P",
    16: "360P"
}
/**@type  {0|1} */
let orient = 0; /*0:land, 1:port*/

const dims = {
    __proto__: null,
    80: [["1920px", "1080px"], ["1080px", "1920px"]],
    64: [["1280px", "720px"], ["720px", "1080px"]],
    32: [["853px", "480px"], ["480px", "852px"]],
    16: [["640px", "360px"], ["360px", "640px"]]
}

const OPT = {
    __proto__: null,
    VOLUME: 1,/* volume: number*/
    DASHMODE: 2, /*mode: bool*/
    TITLE: 3, /*title: string*/
    PLAYSTATUS: 4,
    QUALITYCHANGE: 5,/* qualitity_index: number*/
    VIDEOSIZE: 6,/*index: number, dimArr*/
    VIDEOSRC: 7,
    EPCHANGE: 8, /* index: number*/
    ERROR: 9,
}
/**@type {HTMLVideoElement} */
let vi = null;
/**@type {HTMLAudioElement} */
let au = null;
/**@type {HTMLElement} */
let pl = null;
/**@type {HTMLElement} */
let exitbtn = null;
/**@type {HTMLElement} */
let shotimg = null;

const AVC = 7;

let autoplay = false;
let manual = false;

let dimArr = [];

/** 不同清晰度，音视频合并在同一文件*/
const getvideoQuality = async (bvid, cid, quality) => {
    const f = ({ data }) => {
        let index = 0;
        videoData = null;
        let vcodecs = [];
        let vurl = '';
        quality = data.quality;

        vcodecs.push(...data.accept_quality);
        index = vcodecs.indexOf(quality);

        if (index !== -1) {
            vurl = vApiUrlMapper(data.durl[0].url);
            if (dimArr[index] === undefined) {
                dimArr[index] = dims[quality], dims[quality][orient];
            }
        }
        return { index, vurl, vcodecs };
    };
    if (videoData !== null) { return videoData.then(f); }
    else {
        return apiFetch(
            `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=${quality}&fnver=0&fnval=0&fourk=1`
        )
            .then(f);
    }
};
/**@type {Promise} */
let videoInit;
/**@type {Promise} */
let audioInit;


const processVideoData = ({ data }, qual = 32) => {
    videoData = null;
    dimArr.length = 0;

    let vurls = [];
    let vcodecs = [];
    let videoSegmentBases = []
    // let sel = false;
    let index = -1;
    data.dash.video.filter((i) => i.codecid === AVC).forEach((i) => {
        const validUrl = i.baseUrl.includes('mcdn.bilivideo.cn') ? i.backupUrl[0] : i.baseUrl;
        vurls.push(
            vApiUrlMapper(validUrl)
        );
        vcodecs.push(i.id)
        videoSegmentBases.push(parseInt(i.SegmentBase.indexRange.split('-')[1]))
        dimArr.push([i.width + "px", i.height + "px"])
        if (i.id === qual) {
            index = vcodecs.length - 1;
            // sel = true;
        }
    })
    const audioData = data.dash.audio[0];
    const validUrl = audioData.baseUrl.includes('mcdn.bilivideo.cn') ? audioData.backupUrl[0] : audioData.baseUrl;
    const asrc = vApiUrlMapper(validUrl);
    if (index < 0 || index >= vcodecs.length) index = vcodecs.length - 1;
    videoInit = fetch(vurls[index], {
        headers: {
            Range: `bytes=0-${videoSegmentBases[index]}`,
        },
    });
    const audioSegmentBase = audioData.SegmentBase.indexRange.split("-")[1];
    audioInit = fetch(asrc, {
        headers: {
            Range: `bytes=0-${audioSegmentBase}`,
        },
    });

    return { index, asrc, audioSegmentBase, vcodecs, vurls, videoSegmentBases };
};

/** 不同清晰度，音视频分离*/
const getvideo = async (bvid, cid, qual) => {

    if (videoData !== null) { return videoData.then((res) => processVideoData(res, qual)); }
    else {
        return apiFetch(
            `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=112&fnver=0&fnval=16&fourk=1`
        )
            .then((res) => processVideoData(res, qual));
    }

};
const isStar = () => {
    if (dataMode === DATAMODE.NORMAL) {
        return bvid && starList.findIndex((v) => v.id === bvid) !== -1

    } else {
        return ssId && starList.findIndex((v) => v.id === 'ss' + ssId) !== -1
    }
}
const REPLY_MODE = {
    NEW: 2,
    HOT: 3
}
function timeToStr(d) {
    const diff = Math.floor(Date.now() / 1000 - d);

    let s = "刚刚";
    if (diff < 60) {
        return s;
    } else if (diff < 3600) {
        s = Math.floor(diff / 60) + "分钟前";
    } else if (diff < 86400) {
        s = Math.floor(diff / 3600) + "小时前";
    } else {
        const a = new Date(d * 1000);
        let m = "0" + (a.getMonth() + 1);
        m = m.slice(-2);
        let day = "0" + a.getDate();
        day = day.slice(-2);
        s = `${a.getFullYear()}-${m}-${day} ${a.toLocaleTimeString()}`;
    }

    return s;
}
/**
 * 生成对应的“时：分：秒”
 * @param {number} d 精确到秒的时间戳
 *
 */
function convertDuration(d) {
    const h = "00" + Math.floor(d / 3600);
    const m = "00" + Math.floor((d / 60) % 60);
    const s = "00" + Math.floor(d % 60);

    if (h === "000") {
        return m.slice(-2) + ":" + s.slice(-2);
    } else {
        return h.slice(-2) + ":" + m.slice(-2) + ":" + s.slice(-2);
    }
}
function convertDateTime(d) {
    const a = new Date(d * 1000);

    return a.toLocaleString();
}

function replyMapper(i) {
    return {
        message: i.content.message,
        like: i.like,
        uname: i.member.uname,
        ctime_str: timeToStr(i.ctime),
    }
}
function fetchReplyData(aid, mode) {
    return apiFetch(`https://api.bilibili.com/x/v2/reply/main?mode=${mode}&next=0&plat=1&seek_rpid=&type=1&oid=${aid}`)
        .then((e) => {
            return e.data.replies.map((i) => {
                return {
                    ...replyMapper(i),
                    replies: i.replies?.map(replyMapper) || [],
                };
            })
        })
}
function fetchVideoShot(bvid, cid) {

    return apiFetch(`https://api.bilibili.com/x/player/videoshot?bvid=${bvid}&cid=${cid}`)
        .then((e) => {
            e.data.img_x_size = 160
            e.data.img_y_size = 90

            const w = e.data.img_x_size * e.data.img_x_len;
            const h = e.data.img_y_size * e.data.img_y_len;
            e.data.image = e.data.image.map((i) =>
                `url("${apiPrefix}http:${i}@${w}w_${h}h_80q.avif")`
            )
            return e.data
        })
}

function fetchPvData(url) {
    return fetch(apiPrefix + 'http:' + url, { headers: myHeaders, referrerPolicy: 'no-referrer' })
        .then((res) => res.arrayBuffer())
        .then((dataBuf) => {
            const data = new Uint8Array(dataBuf)
            const data16 = new Uint16Array(data.byteLength / 2)
            for (let i = 0; i < data.byteLength; i++) {
                data16[i] = data[i * 2] * 256 + data[i * 2 + 1]
            }

            return data16;
        })
}

const vApiUrlMapper = (str = '') => vapiPrefix + str.replace(/https?:\/\//, "");

let enable_peek_e_ = false;
let peekend_v_num = 0;

/**@type {CSSStyleDeclaration} */
let viStyle;

const obj = {

    vcodecs: [],
    aid: 0,
    vsrc: "",
    asrc: "",
    title: "",
    desc: "",
    bvid: bvid,
    pages: [],
    /**当前播放视频索引值*/
    cur: 0,
    /**当前视频清晰度列表索引值*/
    curQuality: 0,
    /** */
    /**不同清晰度的视频地址 */
    vurls: [],
    /**不同清晰度的视频头大小 */
    videoSegmentBases: [],
    audioSegmentBase: 0,
    owner: {
        face: "",
        mid: 0,
        name: "",
    },
    pubdate: "",
    _volume: 0.5,
    PLAYMODE: PLAYMODE,
    store: store,
    codecs: codecs,
    firstshow: false,
    /**播放列表各视频字幕信息加载状态数组 */
    vtts: [],
    /**播放列表各视频字幕信息数组 */
    vtturls: [],
    ensub: false,
    webfull: false,
    canplay: false,
    star: false,
    errormsg: '',
    shotdata: null,
    pvdata: null,
    hovertime: '',
    REPLY_MODE,
    _replyMode: REPLY_MODE.HOT,
    replyData: [],
    _auonly: false,
    sections: [],
    dataMode,
    OPT,
    peekstart_v: '',
    peekend_v: '',
    enable_peek_s: false,

    set enable_peek_e(v) {
        enable_peek_e_ = v;
        if (v) {
            peekend_v_num = this.get_peek(1);
        }
    },
    get enable_peek_e() {
        return enable_peek_e_;
    },

    get auonly() {
        return this._auonly;
    },
    set auonly(v) {

        if (v) {
            vi.pause();
            au.currentTime = vi.currentTime;
            au.src = this.asrc
        } else {
            au.pause();
            vi.currentTime = au.currentTime;
        }

        this._auonly = v;

    },

    get dashmode() { return videoMode === VIDEOMODE.DASH; },
    set dashmode(v) {

        this.commitOpt(OPT.DASHMODE, v)
    },
    get volume() {
        return this._volume;
    },
    set volume(v) {

        if (typeof v !== "number") {
            v = parseFloat(v);
        }
        this.commitOpt(OPT.VOLUME, v);
    },
    get replyMode() {
        return this._replyMode;
    },
    set replyMode(v) {
        if (v !== this._replyMode) {

            fetchReplyData(this.bvid, v)
                .then((data) => {
                    this.replyData = data;
                })
            this._replyMode = v;
        }
    },

    /**@param {Event} e */
    showComment(e) {
        if (e.target.open && this.replyData.length === 0) {
            fetchReplyData(this.aid, this.replyMode)
                .then((data) => {
                    this.replyData = data;
                });
        }
    },

    async commitOpt(opt, args) {
        this.errormsg = ''

        switch (opt) {
            case OPT.VOLUME:
                this._volume = args;

                au.volume = args;
                vi.volume = args;

                localStorage.setItem("volume", args.toString());
                break;
            case OPT.DASHMODE:

                const localVideoMode = args ? VIDEOMODE.DASH : VIDEOMODE.FLV;
                if (localVideoMode !== videoMode) {
                    dimArr.length = 0;
                }
                videoMode = localVideoMode;
                localStorage.setItem("videoMode", videoMode.toString());

                args = this.cur;
            case OPT.EPCHANGE:
                {
                    const index = args;

                    if (index >= this.pages.length) { return; }

                    const cid = this.pages[index].cid;
                    const oldIdx = this.cur;
                    this.cur = index;
                    this.pvdata = null;
                    setTimeout(() => {
                        pl.children[oldIdx].classList.toggle("cur", false);
                        pl.children[index].classList.toggle("cur", true);
                    }, 0);
                    if (dataMode === DATAMODE.NORMAL) {
                        document.title = this.pages.length === 1 ? this.title : this.pages[index].part;
                        setTimeout(() => {
                            const url = new URL(location.href);
                            const p = url.searchParams.get("p");

                            if (p !== null && p !== (index + 1).toString() || p === null && index > 0) {
                                // const url = new URL(window.location);
                                url.searchParams.set("p", index + 1);

                                window.history.pushState({}, "", url);
                            }
                        }, 0);
                    } else {
                        document.title = this.pages.length === 1 ? this.title : this.mapEPTitle(this.pages[index]);
                        this.bvid = this.pages[index].bvid;
                        setTimeout(() => {
                            const url = new URL(location.href);
                            epId = this.pages[index].id;
                            url.searchParams.set("id", "ep" + epId);
                            window.history.pushState({}, "", url);
                        }, 0);
                    }

                    try {
                        if (videoMode === VIDEOMODE.DASH) {

                            const res = await getvideo(this.bvid, cid, this.vcodecs[this.curQuality]);
                            this.vcodecs = res.vcodecs;
                            this.vurls = res.vurls;
                            this.asrc = res.asrc;
                            this.videoSegmentBases = res.videoSegmentBases;
                            this.audioSegmentBase = res.audioSegmentBase;
                            args = res.index;
                        } else {
                            const res = await getvideoQuality(this.bvid, cid, quality);
                            this.vcodecs = res.vcodecs;
                            this.vurls[res.index] = res.vurl;
                            args = res.index;
                        }
                        // quality index
                    } catch (e) {
                        console.error(e);
                        this.commitOpt(OPT.ERROR)
                        return;
                    }

                }
            case OPT.QUALITYCHANGE: {
                // au.pause();
                if (args < 0) {
                    args = this.vcodecs.length - 1
                }
                this.curQuality = args;
                quality = this.vcodecs[args];
                if (dimArr[args] === undefined) {
                    const gotQuality = getvideoQuality(this.bvid, this.pages[this.cur].cid, quality)
                    const res = await gotQuality;
                    this.vcodecs = res.vcodecs;
                    this.vurls[res.index] = res.vurl;
                    const idx = res.index;
                    // 如果fallback清晰度，仍获取不到信息，则抛出错误
                    if (idx === -1 && args === this.vcodecs.length - 1) {
                        this.commitOpt(OPT.ERROR, '找不到对应的视频清晰度')
                        return
                    }
                    if (idx !== args) {
                        this.commitOpt(OPT.QUALITYCHANGE, idx)
                        return;
                    }
                }
            }

            case OPT.VIDEOSIZE: {
                const [width, height] = dimArr[args];
                if (vi.style.width !== width) {
                    vi.style.width = width;
                }

                // if (vi.style.height !== height) {
                //     vi.style.height = height;
                // }
                vi.style.height = viStyle.getPropertyValue('height');

            }
            case OPT.VIDEOSRC:

                if (!this.firstshow) this.firstshow = true;
                if (videoMode === VIDEOMODE.DASH) {
                    if (window.ms && window.ms.readyState === 'open') {
                        window?.ms?.endOfStream();
                    }

                    vi.onseeking = null;
                    vi.onwaiting = null;
                    this.combineData()
                } else if (videoMode === VIDEOMODE.FLV) {
                    vi.src = this.vurls[args];
                }
                break;
            case OPT.ERROR:
                const msg = args || '找不到该视频的播放信息';

                this.firstshow = true
                this.errormsg = msg
        }
    },

    combineData() {
        const inspect = window.mp4Inspector.inspect
        const audioCodec = 'audio/mp4; codecs="mp4a.40.2"'
        const videoCodec = 'video/mp4; codecs="avc1.64001E"'

        const mediaSource = new MediaSource();
        if (window.ms) {
            for (let buf of window.ms.sourceBuffers) {
                window.ms.removeSourceBuffer(buf)
            }
        }
        window.ms = mediaSource;
        const videoInfo = {
            offset: 0,
            timescale: 1,
            maxSize: 0,
            duration: 0,
            firstduration: 0,
            references: []
        };
        const audioInfo = {
            offset: 0,
            timescale: 1,
            maxSize: 0,
            duration: 0,
            firstduration: 0,
            references: []
        };
        const videoUrl = this.vurls[this.curQuality];
        const audioUrl = this.asrc;

        let audioBuffer;
        let videoBuffer;

        const audioBufArr = [];
        const videoBufArr = [];

        let audioBufEmpty = false;
        let noNextUpdateendEvent = false;

        function printTimeRange(timeRanges) {
            for (let i = 0; i < timeRanges.length; i++) {
                console.log(timeRanges.start(i), timeRanges.end(i));
            }
        }
        const timerId = setInterval(() => {
            if (vi.onseeking === null || vi.error !== null || window.ms !== mediaSource) {
                console.warn('stop sheduler.')
                clearInterval(timerId);
                audioBuffer = videoBuffer = null;
                noNextUpdateendEvent = false;
                return;
            }
            if (!audioBuffer.updating && !videoBuffer.updating) {
                let startTime = vi.currentTime;

                if (!isBuffered(startTime + 8) && !fetching && !isFetching(startTime + 8)) {
                    let vStartTime = startTime, aStartTime = startTime;
                    for (let i = 0; i < videoBuffer.buffered.length; i++) {
                        if (vStartTime < videoBuffer.buffered.end(i)) {
                            vStartTime = videoBuffer.buffered.end(i);
                            break;
                        }
                    }
                    for (let i = 0; i < audioBuffer.buffered.length; i++) {
                        if (aStartTime < audioBuffer.buffered.end(i)) {
                            aStartTime = audioBuffer.buffered.end(i);
                            break;
                        }
                    }
                    // if (vi.buffered.length === 1) {
                    // 	startTime = videoBuffer.buffered.end(vi.buffered.length - 1)
                    // }

                    seekTo(Math.min(vStartTime, aStartTime), 30)
                }
            }

        }, 4000);
        function timeout(sec) {
            const ac = new AbortController()
            setTimeout(() => {
                ac.abort();
            }, sec * 1000);
            return ac.signal;
        }

        function isFetching(time) {
            console.log(videoBufArr)
            printTimeRange(videoBuffer.buffered)
            return audioBufArr.filter((i) => i.fetching).findIndex((i) => i.startTime < time && time < i.startTime + i.duration) !== -1
                && videoBufArr.filter((i) => i.fetching).findIndex((i) => i.startTime < time && time < i.startTime + i.duration) !== -1;

        }
        function isBuffered(targetTime) {
            if (targetTime < 0) {
                targetTime = 0;
            }
            let videoTargetTime = targetTime, audioTargetTime = targetTime;
            if (videoTargetTime > videoInfo.duration) {
                videoTargetTime = videoInfo.duration;
            }
            if (audioTargetTime > audioInfo.duration) {
                audioTargetTime = audioInfo.duration;
            }
            let viBuffered = false;
            const timeRanges = videoBuffer.buffered;
            printTimeRange(timeRanges)

            for (let i = 0; i < timeRanges.length; i++) {
                let beginDuration = timeRanges.start(i);
                if (beginDuration < videoInfo.firstduration) {
                    beginDuration = 0;
                }
                if (videoTargetTime >= beginDuration && videoTargetTime < timeRanges.end(i) + 0.2) {
                    viBuffered = true;
                    break;
                }
            }

            let auBuffered = false;
            const auTimeRanges = audioBuffer.buffered;
            printTimeRange(auTimeRanges)
            for (let i = 0; i < auTimeRanges.length; i++) {
                let beginDuration = auTimeRanges.start(i);
                if (beginDuration < audioInfo.firstduration) {
                    beginDuration = 0;
                }
                if (audioTargetTime >= beginDuration && audioTargetTime < auTimeRanges.end(i) + 0.2) {
                    auBuffered = true;
                    break;
                }
            }

            return viBuffered && auBuffered;
        }
        function onSeeking() {
            if (isBuffered(vi.currentTime)) {
                return
            }
            seekTo(vi.currentTime);
        }
        const BufTime = 5;
        let ended = false;

        let fetching = false;
        const FetchTimeoutFactor = 1.7;

        function seekTo(targetTime, needDuration = BufTime) {
            const videoRange = getRange(targetTime, needDuration, videoInfo);
            const audioRange = getRange(targetTime, needDuration, audioInfo);

            if (Math.abs(videoRange.end - videoInfo.maxSize) < 3) {
                ended = true;
            }

            console.log(videoRange);
            console.log(audioRange);

            fetching = true
            let localTimeout = timeout(needDuration * FetchTimeoutFactor)
            localTimeout.onabort = () => {
                viBufObj.fetching = auBufObj.fetching = fetching = false
            }
            let fetchArr = [];
            const auBufObj = {
                startTime: audioRange.startTime,
                duration: audioRange.duration,
                fetching: false,
                process: false,
                buf: null
            }
            if (auBufObj.duration > 0) {
                auBufObj.fetching = true;
                audioBufArr.push(auBufObj)
                const fa = fetchRange(audioUrl, audioRange.start, audioRange.end, localTimeout).then(async (buf) => {
                    // audioBuffer.abort();
                    auBufObj.buf = buf;
                    auBufObj.fetching = false;
                    // console.log(mp4Inspector.inspect(new Uint8Array(buf)))
                    if (audioBufEmpty && !audioBuffer.updating) {
                        audioBuffer.appendBuffer(auBufObj.buf);
                    }

                });
                fetchArr.push(fa);
            }
            const viBufObj = {
                startTime: videoRange.startTime,
                duration: videoRange.duration,
                fetching: false,
                process: false,
                buf: null
            }
            if (viBufObj.duration > 0) {
                viBufObj.fetching = true;
                videoBufArr.push(viBufObj)
                const fv = fetchRange(videoUrl, videoRange.start, videoRange.end, localTimeout).then(async (buf) => {
                    // videoBuffer.abort();
                    viBufObj.buf = buf;
                    viBufObj.fetching = false;
                    // console.log(mp4Inspector.inspect(new Uint8Array(buf)))

                    // printTimeRange(videoBuffer.buffered);
                    if (noNextUpdateendEvent && !videoBuffer.updating) {
                        videoBuffer.appendBuffer(viBufObj.buf);
                    }

                });
                fetchArr.push(fv);
            }

            Promise.all(fetchArr).finally(() => {
                viBufObj.fetching = auBufObj.fetching = fetching = false
                if (viBufObj.buf === null) {
                    const idx = videoBufArr.indexOf(viBufObj);
                    if (idx !== -1) {
                        videoBufArr.splice(idx);
                    }
                }
                if (auBufObj.buf === null) {
                    const idx = audioBufArr.indexOf(auBufObj);
                    if (idx !== -1) {
                        audioBufArr.splice(idx);
                    }
                }
            })
        }
        vi.onseeking = onSeeking;
        vi.onwaiting = onSeeking;
        function getRange(targetTime, needDuration, info) {
            let accTime = 0;
            const timescale = info.timescale;
            let accSize = 0;
            const ret = {
                start: 0,
                end: 0,
                duration: 0,
                startTime: 0
            };
            if (targetTime < 0) {
                targetTime = 0;
            }
            // 视频片段时长有微小的误差，大概小于0.03秒
            targetTime += 0.05
            for (let i = 0; i < info.references.length; i++) {
                const size = info.references[i].referencedSize;
                const duration = info.references[i].subsegmentDuration / timescale;
                if (targetTime >= accTime && targetTime < accTime + duration) {
                    // console.log(targetTime, " -> ", accTime, accTime + duration);
                    ret.start = info.offset + accSize;
                    ret.end = ret.start + size - 1;
                    ret.duration = duration;
                    ret.startTime = accTime;
                    for (let j = i + 1; j < info.references.length; j++) {

                        const size = info.references[j].referencedSize;
                        const duration = info.references[j].subsegmentDuration / timescale;

                        accTime += duration;
                        accSize += size;
                        if (accTime < targetTime + needDuration) {

                            ret.end += size;
                            ret.duration += duration;


                        } else {
                            break
                        }
                    }
                    console.log(targetTime + " -> " + ret.startTime.toFixed(1) + '  ' + (ret.startTime + ret.duration).toFixed(2));

                    return ret;
                }


                accTime += duration;
                accSize += size;

            }
            return ret;
        }
        async function fetchRange(url, start, end2, signal = null) {
            return await fetch(url, {
                headers: {
                    "Range": `bytes=${start}-${end2}`,
                },
                signal
            }).then((r) => r.arrayBuffer());
        }

        const onsourceopen = () => {

            // mediaSource.removeEventListener("sourceopen", onsourceopen)

            audioBuffer = mediaSource.addSourceBuffer(audioCodec);
            videoBuffer = mediaSource.addSourceBuffer(videoCodec);

            let avEnded = 0;

            audioBuffer.addEventListener('updateend', () => {
                const idx = audioBufArr.findIndex((i) => i.process)
                if (idx > -1) {

                    audioBufArr.splice(idx)
                }

                const bufObj = audioBufArr.find((i) => i.buf !== null)
                if (bufObj) {
                    if (!audioBuffer.updating) {
                        audioBufEmpty = false
                        audioBuffer.appendBuffer(bufObj.buf)
                        bufObj.process = true
                    }

                } else {
                    audioBufEmpty = true
                    const auFetching = audioBufArr.findIndex((i) => i.fetching) !== -1;
                    if (ended && !auFetching) {
                        avEnded |= 1;
                        if (avEnded === 3 && mediaSource.readyState === 'open') {
                            let updating = false;
                            for (const buffer of mediaSource.activeSourceBuffers) {
                                updating ||= buffer.updating;
                                if (updating) {
                                    break;
                                }
                            }
                            if (!updating) {
                                mediaSource.endOfStream()
                            }
                        }
                    }
                }
            })
            videoBuffer.addEventListener('updateend', () => {
                const idx = videoBufArr.findIndex((i) => i.process)
                if (idx > -1) {
                    videoBufArr.splice(idx)
                }

                const bufObj = videoBufArr.find((i) => i.buf !== null)
                if (bufObj) {
                    if (!videoBuffer.updating) {
                        noNextUpdateendEvent = false
                        videoBuffer.appendBuffer(bufObj.buf)
                        bufObj.process = true
                    }
                } else {
                    noNextUpdateendEvent = true
                    const viFetching = videoBufArr.findIndex((i) => i.fetching) !== -1;
                    if (ended && !viFetching) {
                        avEnded |= 2;
                        if (avEnded === 3 && mediaSource.readyState === 'open') {
                            let updating = false;
                            for (const buffer of mediaSource.activeSourceBuffers) {
                                updating ||= buffer.updating;
                                if (updating) {
                                    break;
                                }
                            }
                            if (!updating) {
                                mediaSource.endOfStream()
                            }
                        }
                    }
                }
            })
            if (audioInit === null) {
                audioInit = fetch(audioUrl, {
                    headers: {
                        Range: `bytes=0-${this.audioSegmentBase}`,
                    },
                });
            }
            const audioProcess = audioInit
                .then((r) => r.arrayBuffer()).then((buf) => {

                    audioBuffer.appendBuffer(buf);
                    const value = new Uint8Array(buf)
                    const parsedData = inspect(value);
                    const sidxIdx = parsedData.findIndex((i) => i.type === "sidx");
                    audioInfo.references = parsedData[sidxIdx].references;
                    audioInfo.timescale = parsedData[sidxIdx].timescale;
                    for (let i = 0; i <= sidxIdx; i++) {
                        audioInfo.offset += parsedData[i].size;
                    }
                    audioInfo.maxSize = audioInfo.references.reduce((acc, i) => acc + i.referencedSize, 0) + audioInfo.offset;
                    const timescale = audioInfo.timescale;
                    audioInfo.duration = audioInfo.references.reduce((acc, i) => acc + i.subsegmentDuration / timescale, 0)
                    audioInfo.firstduration = audioInfo.references[0].subsegmentDuration / timescale;
                    // console.log(parsedData);
                    return Promise.resolve()
                }).finally(() => { audioInit = null; });
            if (videoInit === null) {
                videoInit = fetch(videoUrl, {
                    headers: {
                        Range: `bytes=0-${this.videoSegmentBases[this.curQuality]}`,
                    },
                });
            }
            const videoProcess = videoInit
                .then((r) => r.arrayBuffer()).then((buf) => {

                    videoBuffer.appendBuffer(buf);
                    const value = new Uint8Array(buf)
                    const parsedData = inspect(value);
                    const sidxIdx = parsedData.findIndex((i) => i.type === "sidx");
                    videoInfo.references = parsedData[sidxIdx].references;
                    videoInfo.timescale = parsedData[sidxIdx].timescale;
                    for (let i = 0; i <= sidxIdx; i++) {
                        videoInfo.offset += parsedData[i].size;
                    }
                    videoInfo.maxSize = videoInfo.references.reduce((acc, i) => acc + i.referencedSize, 0) + videoInfo.offset;
                    const timescale = videoInfo.timescale;
                    videoInfo.duration = videoInfo.references.reduce((acc, i) => acc + i.subsegmentDuration / timescale, 0)
                    videoInfo.firstduration = videoInfo.references[0].subsegmentDuration / timescale;

                    // console.log(parsedData);
                    return Promise.resolve()
                }).finally(() => { videoInit = null; });
            Promise.all([audioProcess, videoProcess]).then(() => {
                seekTo(0, 10)
            })
        };
        mediaSource.addEventListener("sourceopen", onsourceopen, {
            once: true
        })
        mediaSource.addEventListener("sourceclose", () => {
            videoBuffer = audioBuffer = null;
            clearInterval(timerId);
        })
        if (vi.src) {
            try {
                URL.revokeObjectURL(vi.src);
            } catch (error) {
                console.error(error);
            }
        }
        vi.src = URL.createObjectURL(mediaSource);
        // this.initvolume()
    },
    loadvtt() {
        const index = this.cur;
        if (!this.ensub) {
            for (const v of vi.textTracks) v.mode = "hidden";
            return;
        }

        if (this.vtturls[index] !== undefined) {
            this.getvtt(index);
            return;
        }
        apiFetch(`https://api.bilibili.com/x/player/v2?aid=${this.aid}&cid=${this.pages[index].cid}`)
            .then(({ data }) => {
                const arr = [];
                data.subtitle.subtitles.forEach((j) =>
                    arr.push({ lan: j.lan, lan_doc: j.lan_doc, subtitle_url: j.subtitle_url.replace("//", "http://") })
                )
                this.vtturls[index] = arr;
                this.getvtt(index);
            })
    },
    getvtt(index) {
        let hs = "";
        let arr = this.vtts[index]; //array
        const da = this.vtturls[index]; //array

        vi.innerHTML = "";

        if (arr !== undefined) {
            da.forEach((i, index) => {
                const defaultmark = index === 0 ? "default" : "";
                hs += `<track label="${i.lan_doc}" kind="subtitles" srclang="${i.lan}" src="${i.subtitle_url}" ${defaultmark}>`
            }

            )
            vi.insertAdjacentHTML("beforeend", hs);
            return;
        }
        arr = [];
        this.vtts[index] = arr;
        da.forEach((i) =>
            apiFetch(i.subtitle_url)
                .then(a => {
                    const vtt = a.body.reduce((acc, el) => {
                        /*00:01:14.815 --> 00:01:18.114*/
                        const h = "0" + (el.from / 3600).toFixed().slice(-2);
                        const m = "0" + ((el.from / 60) % 60).toFixed().slice(-2);
                        const s = ("00" + (el.from % 60).toFixed(3)).slice(-6);

                        const h1 = "0" + (el.to / 3600).toFixed().slice(-2);
                        const m1 = "0" + ((el.to / 60) % 60).toFixed().slice(-2);
                        const s1 = ("00" + (el.to % 60).toFixed(3)).slice(-6);

                        return acc + `${h}:${m}:${s} --> ${h1}:${m1}:${s1}\n${el.content}\n\n`;
                    }, "WEBVTT\n");
                    const q = URL.createObjectURL(new Blob([vtt], { type: "text/vtt; charset=UTF-8" }))
                    i.subtitle_url = q;
                    arr.push(true);
                    const defaultmark = arr.length === 1 ? "default" : "";
                    vi.insertAdjacentHTML("beforeend", `<track label="${i.lan_doc}" kind="subtitles" srclang="${i.lan}" src="${q}" ${defaultmark}>`);
                })
        )
    },
    onplay() {
        exitbtn.style.top = "-100px";
        if (videoMode === VIDEOMODE.FLV) return;
        // au.currentTime = vi.currentTime;
        // au.play();
    },
    autop() {
        if (autoplay) {
            if (this.auonly) {
                au.play();
            } else {
                vi.play();
            }
        }
    },
    onpause() {
        exitbtn.style.top = "20px";
        if (videoMode === VIDEOMODE.FLV) return;
        // au.pause();
        // au.currentTime = vi.currentTime;
    },
    onseeking() {
        if (manual) {
            console.log("ignore manual onseek");
            return;
        }
        if (videoMode === VIDEOMODE.DASH) au.currentTime = vi.currentTime;
    },
    initvolume() {
        const volume = parseFloat(localStorage.getItem("volume")) || 0.5;

        this.commitOpt(OPT.VOLUME, volume);

        dimArr[this.curQuality][0] = vi.videoWidth + "px";
        dimArr[this.curQuality][1] = vi.videoHeight + "px";
        if (vi.style.width !== dimArr[this.curQuality][0]) {
            vi.style.width = dimArr[this.curQuality][0];
        }
        vi.style.height = ''
        // if (vi.style.height !== dimArr[this.curQuality][1]) {
        // 	vi.style.height = dimArr[this.curQuality][1];
        // }
        if (!this.canplay) {
            setTimeout(() => {
                this.canplay = true;
            }, 2000);
        }
        this.autop()
    },
    /**@param {Event} e  */
    updatevolume(e) {
        const vol = e.target.volume;

        if (this.volume === vol) {
            return;
        } else {
            this.commitOpt(OPT.VOLUME, vol);
        }
    },
    scrollto() {
        pl.children[this.cur].scrollIntoView();
    },
    /**
     * @param {0|1} src  0 : video ended; 1 : audio ended;
     * */
    nexturl(src) {
        if (this.auonly && src === 0) {
            return;
        } else if (!this.auonly && src === 1) {
            return;
        }
        autoplay = false;

        if (store.playmode === PLAYMODE.ALL) {
            this.commitOpt(OPT.EPCHANGE, this.cur + 1)
            autoplay = true;
        } else if (store.playmode === PLAYMODE.ROUND) {
            this.commitOpt(OPT.EPCHANGE, (this.cur + 1) % this.pages.length)
            autoplay = true;
        }
    },

    onUnmounted() {

    },
    savestar() {

        const starList = JSON.parse(localStorage.getItem("starlist") || "[]")
        const itemBvid = this.bvid
        let idx = -1;
        let param_id = id;
        let starId = id;
        let title = '';
        let cur = 0;
        switch (dataMode) {
            case DATAMODE.NORMAL:
                title = this.pages[this.cur].part;
                cur = this.cur;
                idx = starList.findIndex((v) => v.id === itemBvid)
                break;
            case DATAMODE.EPISODE:
            case DATAMODE.SEASON:
                title = this.mapEPTitle(this.pages[this.cur]);
                starId = 'ss' + ssId
                param_id = 'ep' + epId;
                idx = starList.findIndex((v) => v.id === 'ss' + ssId)
                break;
            default:
                break;
        }

        const data = {
            id: starId,
            param_id,
            cur,
            current_time: vi.currentTime,
            title: this.title + " " + title
        };
        if (idx !== -1) {
            starList.splice(idx, 1);

        }
        if (this.star) {
            starList.push(data)
        }

        localStorage.setItem("starlist", JSON.stringify(starList));

    },
    setupRouting() {
        vi = document.getElementsByTagName("video")[0];
        viStyle = getComputedStyle(vi);
        au = document.getElementsByTagName("audio")[0];
        pl = document.getElementById("playlist");
        shotimg = document.getElementById('shotimg');

        exitbtn = document.getElementById("exitfull");

        if (id.length < 5) {
            this.commitOpt(OPT.ERROR, 'invalid id: ' + id)
            return;
        }
        window.addEventListener("pagehide", this.savestar)
        vi.onerror = (e) => {
            this.commitOpt(OPT.ERROR, vi.error)
            console.error(e);
            console.error(vi.error);
        };

        vi.addEventListener("durationchange", () => {
            if (this.enable_peek_s) {
                let t = this.get_peek(0);
                if (t > 0) {
                    vi.currentTime = t;
                }
            }
        });

        vi.addEventListener("timeupdate", () => {
            if (enable_peek_e_ && vi.currentTime > peekend_v_num && peekend_v_num > 0) {
                vi.pause();
                this.nexturl(0);
            }
        })

        const videoshotElm = document.getElementById("videoshot");
        // const playerBox = document.getElementById("playerbox");

        /**@type {Promise} */
        let ans = null;

        vi.addEventListener('pointermove', (e) => {
            const offset = vi.clientHeight - e.offsetY
            if (offset > 70) {
                if (videoshotElm.style.left !== '-1000px') {
                    videoshotElm.style.left = '-1000px'
                }
                return;
            }
            if (offset > 20) {
                return
            }
            if (this.pvdata === null) {
                const page = this.pages[this.cur];
                if (ans === null && page !== undefined) {
                    shotimg.dataset.iidx = '-1';
                    ans = fetchVideoShot(bvid, page.cid)
                        .then((data) => {
                            this.shotdata = data;
                            return fetchPvData(data.pvdata)
                        })
                        .then((data) => {
                            this.pvdata = data;
                            return Promise.resolve()
                        });
                    ans.finally(() => ans = null)

                }
                return
            }
            const duration = vi.duration;
            let offsetX = e.offsetX - 22;
            if (offsetX < 0) {
                offsetX = 0;
            } else if (offsetX > vi.clientWidth - 44) {
                offsetX = vi.clientWidth - 44;
            }
            const t = offsetX / (vi.clientWidth - 44) * duration;

            this.hovertime = convertDurationToString(t);
            videoshotElm.style.left = e.offsetX - 80 + 'px'
            let idx = this.pvdata.findIndex((i) => i >= t) - 2;
            if (idx < 0) idx = this.pvdata.length - 2;
            const iidx = Math.floor(idx / (this.shotdata.img_x_len * this.shotdata.img_y_len));
            if (shotimg.dataset.iidx !== iidx.toString()) {
                const shotimgsrc = this.shotdata.image[iidx];
                shotimg.dataset.iidx = iidx.toString();
                shotimg.style.backgroundImage = shotimgsrc;
            }
            const pidx = idx % (this.shotdata.img_x_len * this.shotdata.img_y_len);
            shotimg.style.backgroundPosition = `${pidx % this.shotdata.img_x_len * -this.shotdata.img_x_size}px ${Math.floor(pidx / this.shotdata.img_y_len) * -this.shotdata.img_y_size}px`
        })
        vi.addEventListener('pointerout', (e) => {
            if (e.offsetX < 0 || e.offsetX > vi.clientWidth || e.offsetY < 0 || e.offsetY > vi.clientHeight) {
                videoshotElm.style.left = '-1000px'
            }
        })
        const f = ({ data }) => {

            this.title = data.title;
            this.desc = data.desc;
            const len = data.pages.length;
            for (let i = 0; i < len; i++) {
                data.pages[i].duration = convertDuration(data.pages[i].duration);
            }
            this.pages = data.pages;
            this.owner = data.owner;
            this.pubdate = convertDateTime(data.pubdate);
            this.aid = data.aid;
            this.bvid = data.bvid;
            orient = data.dimension.height > data.dimension.width ? 1 : 0;

            if (p === 0) {
                const arr = [];

                data.subtitle.list.forEach((j) =>
                    arr.push({ lan: j.lan, lan_doc: j.lan_doc, subtitle_url: j.subtitle_url })
                )
                this.vtturls[0] = arr;
            }
            this.star = isStar();
            this.commitOpt(OPT.EPCHANGE, p);
        };
        const g = ({ result }) => {

            this.title = result.season_title;
            this.desc = result.evaluate;
            const len = result.episodes.length;
            for (let i = 0; i < len; i++) {
                result.episodes[i].duration = convertDuration(result.episodes[i].duration / 1000);
            }
            if (result.section == undefined) {
                result.section = [];
            }
            result.section.push({
                title: '系列',
                episodes: result.seasons.map((i) => ({ title: i.season_title, season_id: i.season_id, badge: i.badge }))
            });
            this.sections = result.section;
            this.pages = result.episodes;
            // this.owner = result.owner;
            this.pubdate = result.publish.pub_time;
            if (result.episodes.length !== 0) {

                const ssData = result.episodes[this.cur];
                this.aid = ssData.aid;
                orient = ssData.dimension.height > ssData.dimension.width ? 1 : 0;

                this.star = isStar();
                this.commitOpt(OPT.EPCHANGE, p);
            } else {
                let errstr = '找不到视频列表信息';
                if (result.payment) {
                    errstr = result.payment.tip;
                }
                this.commitOpt(OPT.ERROR, errstr)
            }
        }
        if (bvidData !== null) { bvidData.then(f); }
        else if (seasonData !== null) { seasonData.then(g); }
        else {
            //FIXME 获取ep格式的数据
            apiFetch("https://api.bilibili.com/x/web-interface/view?bvid=" + this.bvid)
                .then(f);
        }
        document.querySelector("#playlist").addEventListener("mousedown", this.liclick)
        document.querySelector("#extralist").addEventListener("mousedown", this.extraclick)
    },
    /**@param {Event} e */
    extraclick(e) {

        for (const elm of e.composedPath()) {
            if (elm.tagName === "LI") {
                const index = parseInt(elm.dataset.index) || 0;
                const pindex = parseInt(elm.dataset.pindex) || 0;

                const ep = this.sections[pindex].episodes[index];
                let url = ''
                if (ep.season_id) {
                    url = 'ss' + ep.season_id
                } else if (ep.bvid) {
                    url = ep.bvid
                } else if (ep.aid) {
                    url = 'av' + ep.aid;
                }
                window.open('?id=' + url, "_blank");
                break;
            }
        }
    },
    /**@param {Event} e */
    liclick(e) {

        for (const elm of e.composedPath()) {
            if (elm.tagName === "LI") {
                const index = parseInt(elm.dataset.index) || 0;
                e.currentTarget.children[this.cur].classList.toggle("cur", false)
                this.commitOpt(OPT.EPCHANGE, index);
                break;
            }
        }

    },
    openbili() {
        const url = dataMode === DATAMODE.NORMAL ?
            "https://www.bilibili.com/video/" + this.bvid + (this.cur > 0 ? "?p=" + (this.cur + 1) : "") :
            "https://www.bilibili.com/bangumi/play/ep" + this.pages[this.cur].id;
        window.open(url, "_blank");
    },
    mapEPTitle(item) {
        if (!item) {
            return '';
        }

        if (!isNaN(parseInt(item.title))) {
            return `第${item.title}话 ${item.long_title} ${item.badge}`;
        }
        else {
            return `${item.title} ${item.long_title} ${item.badge}`;
        }
    },

    get_cur(i) {
        const curtime = convertDurationToString(vi.currentTime);

        if (i === 0) {
            this.peekstart_v = curtime;
        } else if (i === 1) {
            this.peekend_v = curtime;
        }
    },

    get_peek(i) {
        let v = this.peekstart_v;
        if (i === 1) {
            v = this.peekend_v;
        }

        if (v.length > 0) {
            let [s, m, h] = v.split(':').map(i => parseInt(i)).reverse();
            if (s !== undefined) {
                let t = s;
                if (m !== undefined) {
                    t += m * 60;
                }
                if (h !== undefined) {
                    t += m * 3600;
                }
                return t;
            }

        }
        return 0;
    },
};

window.onload = () => {
    const app = PetiteVue.createApp(obj);
    app.mount("#app");
    // setTimeout(() =>, 0);
    vi = document.getElementsByTagName("video")[0];
    /*if (VIDEOMODE.FLV === videoMode) { vi.autoplay = true; }*/
    vi.autoplay = true;

    if (jump_to_time !== null) {
        vi.addEventListener('canplay', () => {
            vi.currentTime = parseInt(jump_to_time);
        }, { once: true });
    }

};
