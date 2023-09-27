<script setup lang="ts">
import router from "@/router";
import { settingStore, store, PLAYMODE, myHeaders } from "@/stores/counter";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { convertDurationToString } from "@/stores/interface";

interface Page {
  cid: string;
  part: string;
  duration: number;
}

const src = ref("");
const src2 = ref("");
const title = ref("");
const desc = ref("");
const bvid = ref("");
const pages = ref(Array<Page>());
const cur = ref(0);
const urls = ref(Array<string>());
const curp = ref(0);
const owner = ref({
  face: "",
  mid: 2026561407,
  name: "",
});
const pubdate = ref(0);
const firstshow = ref(false);

const playmode = ref(store.playmode);

onMounted(() => {
  document.body.classList.add("blackbg");
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

      setTimeout(() => {
        firstshow.value = true;
      }, 3000);
      getvideo(cur.value);
    });
});
onBeforeUnmount(() => {
  document.body.classList.remove("blackbg");
});
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
    router.push(`/play?bvid=${bvid.value}&p=${cur.value + 1}`);
  }

  if (pages.value.length === 1) {
    document.title = title.value;
  } else {
    document.title = pages.value[index].part;
  }

  fetch(
    `${settingStore.apiprefix}https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid.value}&qn=32&fnver=0&fnval=0&fourk=1`,
    {
      headers: myHeaders,
    }
  )
    .then((e) => e.json())
    .then((e) => {
      urls.value.splice(0, urls.value.length);
      for (const i of e.data.durl) {
        urls.value.push(
          settingStore.vapiprefix + i.url.replace("https://", "")
        );
      }
      bufi = -1;
      nexturl(0, 0);
    });
}
let bufi = -1;
/**
 * @parm mode 1 自动切换片段,  0 手动
 */
function nexturl(index: number, mode: number) {
  if (index < 0) {
    return;
  }
  if (index >= urls.value.length) {
    if (playmode.value === PLAYMODE.ALL) {
      getvideo(cur.value + 1);
    } else if (playmode.value === PLAYMODE.ROUND) {
      getvideo((cur.value + 1) % pages.value.length);
    }
    return;
  }
  const vel = document.getElementsByTagName("video")[index % 2];
  if (mode === 1) vel.controls = false;

  if (index % 2 === 0) {
    if (bufi !== index) {
      src2.value = urls.value[index].toString();
    }
    nextTick(() => {
      vel.play();
    });
    if (index + 1 < urls.value.length) {
      src.value = urls.value[index + 1].toString();
      bufi = index + 1;
    }
  } else {
    if (bufi !== index) {
      src.value = urls.value[index].toString();
    }
    nextTick(() => {
      vel.play();
    });
    if (index + 1 < urls.value.length) {
      src2.value = urls.value[index + 1].toString();
      bufi = index + 1;
    }
  }

  setTimeout(() => {
    vel.controls = true;
  }, 3000);
  // src.value = urls.value[index].toString();
  curp.value = index;
  // if (!firstshow.value) firstshow.value = true;
}

function initvolume(event: Event) {
  const v = event.target as HTMLVideoElement;
  v.volume = parseFloat(localStorage.getItem("volume") || "0.5");
}

function savevolume(event: Event) {
  const v = event.target as HTMLVideoElement;
  localStorage.setItem("volume", v.volume.toString());
}
function convertDateTime(d: number): string {
  const a = new Date(d * 1000);

  return a.toLocaleString();
}
</script>

<template>
  <div class="videoplayer" v-show="firstshow">
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

      <span>· {{ convertDateTime(pubdate) }}</span>
    </div>
    <div>
      <video
        v-show="curp % 2 === 0"
        preload="auto"
        @ended="nexturl(curp + 1, 1)"
        @loadeddata="initvolume"
        @volumechange="savevolume"
        @loadedmetadata.once="firstshow = true"
        controls
        :src="src2"
      ></video>
      <video
        v-show="curp % 2 === 1"
        preload="auto"
        @ended="nexturl(curp + 1, 1)"
        @loadeddata="initvolume"
        @volumechange="savevolume"
        controls
        :src="src"
      ></video>
    </div>
    <div class="desc blackscrollbar">{{ desc }}</div>
    <ul class="plist">
      <li
        v-for="(item, index) in urls"
        @click="nexturl(index, 0)"
        :class="index === curp ? 'cur' : ''"
        :key="index"
      >
        {{ index + 1 }}
      </li>
      <li class="extra">
        <label :class="playmode === PLAYMODE.SINGLE ? 'enabled' : 'disabled'">
          <input
            hidden
            type="radio"
            v-model="playmode"
            :value="PLAYMODE.SINGLE"
          />
          S
        </label>
        <label :class="playmode === PLAYMODE.ALL ? 'enabled' : 'disabled'">
          <input hidden type="radio" v-model="playmode" :value="PLAYMODE.ALL" />
          A
        </label>
        <label :class="playmode === PLAYMODE.ROUND ? 'enabled' : 'disabled'">
          <input
            hidden
            type="radio"
            v-model="playmode"
            :value="PLAYMODE.ROUND"
          />
          R
        </label>
      </li>
    </ul>
    <div class="ebox blackscrollbar">
      <ol class="elist">
        <li
          v-for="(item, index) in pages"
          :key="index"
          :class="index === cur ? 'cur' : ''"
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
  padding: 1em;
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
.elist {
  position: relative;
}
.elist li {
  padding: 3px 3px 3px 5px;
}
li:hover {
  background-color: rgb(78 58 33);
}
.videoplayer {
  padding-top: 3em;
  color: #d5c1c1;
  margin: 0 auto;
  /* align-content: center; */
  max-width: fit-content;
}
video {
  max-width: 100%;
}
.title {
  color: rgb(201 201 201);
  max-width: fit-content;
  font-size: 18px;
}

.show {
  visibility: visible;
}
.hide {
  visibility: hidden;
}

.desc {
  font-size: 0.9em;
  max-width: fit-content;
  margin-bottom: 5px;
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
