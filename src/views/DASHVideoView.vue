<script setup lang="ts">
import router from "@/router";
import { settingStore, store, PLAYMODE, myHeaders } from "@/stores/counter";
import { convertDurationToString } from "@/stores/interface";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

interface Page {
  cid: string;
  part: string;
  duration: number;
}
interface flv {
  baseUrl: "";
  codecs: "";
  height: 0;
  width: 0;
  codecid: 0;
  id: 0;
  mimeType: "";
}
const codecs: Record<number, string> = {
  116: "1080P60",
  80: "1080P",
  64: "720P",
  32: "480P",
  16: "320P",
};
const vcodecs = ref(Array<number>());

const vsrc = ref("");
const asrc = ref("");
const title = ref("");
const desc = ref("");
const bvid = ref("");
const pages = ref(Array<Page>());
const cur = ref(0);
const curp = ref(0);

const vurls = ref(Array<string>());
const owner = ref({
  face: "",
  mid: 2026561407,
  name: "",
});
const pubdate = ref(0);
const volumn = ref(0.5);
const auonly = ref(false);

let vi: HTMLVideoElement;
let au: HTMLAudioElement;
onMounted(() => {
  document.body.classList.add("blackbg");
  vi = document.getElementsByTagName("video")[0];
  au = document.getElementsByTagName("audio")[0];

  bvid.value = router.currentRoute.value.query.bvid?.toString() || "";
  cur.value =
    parseInt(router.currentRoute.value.query.p?.toString() || "1", 10) - 1;

  if (bvid.value.length < 5) return;
  fetch(
    settingStore.apiprefix +
      "https://api.bilibili.com/x/web-interface/view?bvid=" +
      bvid.value,
    {
      headers: myHeaders,
    }
  )
    .then((e) => e.json())
    .then((e) => {
      title.value = e.data.title;
      desc.value = e.data.desc;
      pages.value = e.data.pages;
      owner.value = e.data.owner;
      pubdate.value = e.data.pubdate;

      getvideo(cur.value);
    });
});
onBeforeUnmount(() => {
  document.body.classList.remove("blackbg");
  clearInterval(timerid);
});
const AVC = 7;
function getvideo(index: number) {
  if (index >= pages.value.length) {
    return;
  }

  cur.value = index;
  const cid = pages.value[index].cid;
  const p = router.currentRoute.value.query.p;

  if (
    (p && p.toString() !== (cur.value + 1).toString()) ||
    (!p && cur.value > 0)
  ) {
    router.push(`/playalt?bvid=${bvid.value}&p=${cur.value + 1}`);
  }
  if (pages.value.length == 1) {
    document.title = title.value;
  } else {
    document.title = pages.value[index].part;
  }
  fetch(
    `${settingStore.apiprefix}https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid.value}&qn=112&fnver=0&fnval=16&fourk=1`,
    {
      headers: myHeaders,
    }
  )
    .then((e) => e.json())
    .then((e) => {
      vurls.value.splice(0, vurls.value.length);
      vcodecs.value.splice(0, vcodecs.value.length);
      let sel = false;
      for (const i of e.data.dash.video) {
        if (i.codecid == AVC) {
          vurls.value.push(
            settingStore.vapiprefix + i.baseUrl.replace("https://", "")
          );
          vcodecs.value.push(i.id);
          if (i.id == 32) {
            chooseurl(vcodecs.value.length - 1);
            sel = true;
          }
        }
      }
      if (!sel && vurls.value.length > 0) {
        chooseurl(0);
      }
      asrc.value =
        settingStore.vapiprefix +
        e.data.dash.audio[0].baseUrl.replace("https://", "");
    });
}

const po = watch(volumn, (n, o) => {
  au.volume = n;
  savevolume();
});

function chooseurl(index: number) {
  au.pause();
  curp.value = index;
  vsrc.value = vurls.value[index];
}
let autoplay = false;
/*src 0:video, 1:audio*/
function nexturl(index: number, src: number) {
  if (auonly.value && src == 0) {
    return;
  } else if (!auonly.value && src == 1) {
    return;
  }
  autoplay = false;

  if (store.playmode == PLAYMODE.ALL) {
    getvideo(cur.value + 1);
    autoplay = true;
  } else if (store.playmode == PLAYMODE.ROUND) {
    getvideo((cur.value + 1) % pages.value.length);
    autoplay = true;
  }
}
function onplay() {
  au.currentTime = vi.currentTime;
  au.play();
}
function autop() {
  if (autoplay) {
    if (auonly.value) {
      au.play();
    } else {
      vi.play();
    }
  }
}
function onpause() {
  au.pause();
  au.currentTime = vi.currentTime;
}
function onseeking() {
  au.currentTime = vi.currentTime;
}
function onratechange() {
  au.playbackRate = vi.playbackRate;
  vi.currentTime = au.currentTime;
}
const timerid = setInterval(() => {
  console.log("a-v : " + (au.currentTime - vi.currentTime));
  if (!vi.paused && Math.abs(au.currentTime - vi.currentTime) > 0.1) {
    vi.currentTime = au.currentTime;
    console.log("sync");
  }
}, 20000);
function convertDateTime(d: number): string {
  const a = new Date(d * 1000);

  return a.toLocaleString();
}
function initvolume() {
  au.volume = parseFloat(localStorage.getItem("volume") || "0.5");
  volumn.value = au.volume;
}

function savevolume() {
  localStorage.setItem("volume", au.volume.toString());
}
</script>

<template>
  <div class="videoplayer">
    <h3 class="title">
      <span>{{ title }}</span>
      <a
        title="在Bilibili中打开"
        target="_blank"
        :href="'https://www.bilibili.com/video/' + bvid"
        >---📎️</a
      >
      <a title="Single Player" target="_blank" :href="'/player.html?id=' + bvid"
        >---</a
      >
    </h3>
    <div class="author">
      <RouterLink target="_blank" :to="'/space?mid=' + owner.mid">
        {{ owner.name }}
      </RouterLink>
      <span> · {{ convertDateTime(pubdate) }} ·</span>
      <span>
        <input type="text" v-model="bvid" />
      </span>
    </div>
    <div>
      <video
        @play="onplay"
        @pause="onpause"
        @seeking="onseeking"
        @loadeddata="initvolume"
        @ratechange="onratechange"
        @ended="nexturl(cur + 1, 0)"
        v-show="!auonly"
        preload="auto"
        controls
        :src="vsrc"
      ></video>
      <audio
        preload="auto"
        @volumechange="savevolume"
        @loadeddata="autop"
        @ended="nexturl(cur + 1, 1)"
        :controls="auonly"
        :src="asrc"
      ></audio>
    </div>
    <div class="desc blackscrollbar">
      {{ desc }}
    </div>
    <ul class="plist">
      <li
        v-for="(item, index) in vcodecs"
        @click="chooseurl(index)"
        :class="index == curp ? 'cur' : ''"
        :key="index"
      >
        {{ codecs[item] }}
      </li>
      <li class="extra">
        <input type="range" min="0" max="1" step="0.1" v-model="volumn" />
      </li>
      <li class="extra">
        <label :class="auonly ? 'enabled' : 'disabled'">
          <input hidden type="checkbox" v-model="auonly" />AUDIO
        </label>
      </li>
      <li class="extra">
        <label
          :class="store.playmode == PLAYMODE.SINGLE ? 'enabled' : 'disabled'"
        >
          <input
            hidden
            type="radio"
            v-model="store.playmode"
            :value="PLAYMODE.SINGLE"
          />S
        </label>
        <label :class="store.playmode == PLAYMODE.ALL ? 'enabled' : 'disabled'">
          <input
            hidden
            type="radio"
            v-model="store.playmode"
            :value="PLAYMODE.ALL"
          />A
        </label>
        <label
          :class="store.playmode == PLAYMODE.ROUND ? 'enabled' : 'disabled'"
        >
          <input
            hidden
            type="radio"
            v-model="store.playmode"
            :value="PLAYMODE.ROUND"
          />R
        </label>
      </li>
    </ul>
    <div class="ebox blackscrollbar">
      <ol class="elist">
        <li
          v-for="(item, index) in pages"
          :key="index"
          :class="index == cur ? 'cur' : ''"
        >
          <div @click="getvideo(index)">
            {{ item.part }}
            <span class="duration">{{
              convertDurationToString(item.duration)
            }}</span>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.cur {
  color: rgb(201 201 201);

  background-color: rgb(15 30 36);
}
li {
  cursor: pointer;
}
.plist li {
  display: inline-block;
  padding: 5px 8px;
}
.elist li {
  padding: 3px 3px 3px 5px;
}
li:hover {
  background-color: rgb(78 58 33);
}
li.extra:hover {
  background-color: transparent;
}

.disabled {
  color: #4a3d3d;
}
.enabled {
  color: #d5c1c1;
}
.videoplayer {
  padding-top: 3em;
  color: #d5c1c1;
}
video {
  max-width: 100%;
}
.title {
  color: rgb(201 201 201);
  max-width: fit-content;
}

.show {
  visibility: visible;
}
.hide {
  visibility: hidden;
}

.desc {
  max-width: fit-content;
  margin-bottom: 5px;
  font-size: 0.9em;
  overflow-wrap: anywhere;
  max-height: 3.2em;
  overflow-y: auto;
}
.blackscrollbar:hover::-webkit-scrollbar-thumb {
  background-color: black;
}
.blackscrollbar:hover::-webkit-scrollbar {
  background-color: #3a3a3a;
}
.blackscrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0);
}
.blackscrollbar::-webkit-scrollbar {
  background-color: rgba(0, 0, 0, 0);
  width: 5px;
}
.ebox {
  max-height: 20em;
  overflow-y: auto;
}
.author {
  font-size: 0.9em;
  margin-bottom: 0.5em;
  color: #858e96;
}

div.author a {
  color: #858e96;
}
.author input {
  color: #858e96;
  background-color: transparent;
  border: none;
}
input[type="range"] {
  height: 20px;
  -webkit-appearance: none;
  margin: 10px 0;
  background-color: transparent;
}
input[type="range"]:focus {
  outline: none;
}

input[type="range"]::-webkit-slider-runnable-track {
  width: 100%;
  height: 5px;
  box-shadow: 0px;
  background: #051927;
  border-radius: 1px;
  border: 0px;
}
input[type="range"]::-webkit-slider-thumb {
  border: 0px;
  height: 14px;
  width: 14px;
  border-radius: 14px;
  background: #39536b;
  -webkit-appearance: none;
  margin-top: -4.5px;
}

input[type="range"]::-moz-range-track {
  width: 100%;
  height: 5px;
  box-shadow: 0px 0px 0px #000000;
  background: #0d3854;
  border-radius: 1px;
  border: 0px solid #000000;
}
input[type="range"]::-moz-range-thumb {
  box-shadow: 0px 0px 0px #000000;
  border: 0px solid #2497e3;
  height: 14px;
  width: 14px;
  border-radius: 14px;
  background: #6583a1;
}
.duration {
  right: 0;
  position: absolute;
}
.elist li div {
  padding-right: 3.1em;
}
</style>

<style>
.blackbg {
  /* background-image: linear-gradient(180deg, #101012 3%, #242429 85%); */
  background-color: #101012;
  transition: none;
}
</style>
