<script setup lang="ts">
import { myAPIGen } from "@/stores/api";
import { convertDurationToString } from "@/stores/interface";
import { ref, watch } from "vue";

const props = defineProps<{
  bvid: string;
  isshow: boolean;
}>();

let duration = 1;
let durationStr = "";
const clientWidth = 160;
const padding = 10;

let shotdata: any = null;
let pvdata: any = null;
let ans: Promise<any> | null = null;
const hovertime = ref("");
const pname = ref("");
const shotimg = ref<HTMLDivElement>();
const show = ref(props.isshow);

watch(
  () => props.isshow,
  () => {
    if (props.isshow != show.value) {
      show.value = props.isshow;
      if (props.isshow) {
        loadData();
      }
    }
  }
);

function fetchVideoShot(bvid: string) {
  return myAPIGen.doFetch("get-videoshot", { bvid }).then((e) => {
    e.data.img_x_size = 160;
    e.data.img_y_size = 90;

    const w = e.data.img_x_size * e.data.img_x_len;
    const h = e.data.img_y_size * e.data.img_y_len;
    e.data.image = e.data.image.map(
      (i: string) =>
        `url("${myAPIGen.defaultStore.apiprefix}http:${i}@${w}w_${h}h_80q.avif")`
    );
    return e.data;
  });
}
function fetchPvData(url: string) {
  return myAPIGen
    .mkPlainFetch("http:" + url)
    .then((res) => res.arrayBuffer())
    .then((dataBuf) => {
      const data = new Uint8Array(dataBuf);
      const data16 = new Uint16Array(data.byteLength / 2);
      for (let i = 0; i < data.byteLength; i++) {
        data16[i] = data[i * 2] * 256 + data[i * 2 + 1];
      }

      return data16;
    });
}

function convertStringToDuration(d: string) {
  let m = 1 / 60;
  return d
    .split(":")
    .map((v) => parseInt(v))
    .reduceRight((acc, cur) => {
      m *= 60;
      return acc + cur * m;
    }, 0);
}

function toX(x: number) {
  let offsetX = x - padding;
  if (offsetX < 0) {
    offsetX = 0;
  } else if (offsetX > clientWidth - padding * 2) {
    offsetX = clientWidth - padding * 2;
  }

  const t = (offsetX / (clientWidth - padding * 2)) * duration;

  hovertime.value = convertDurationToString(t) + " / " + durationStr;

  let idx = pvdata.findIndex((i: number) => i >= t) - 2;
  if (idx < 0) idx = pvdata.length - 2;
  const iidx = Math.floor(idx / (shotdata.img_x_len * shotdata.img_y_len));
  if (shotimg.value && shotimg.value?.dataset.iidx !== iidx.toString()) {
    const shotimgsrc = shotdata.image[iidx];
    shotimg.value!.dataset.iidx = iidx.toString();
    shotimg.value!.style.backgroundImage = shotimgsrc;
  }
  const pidx = idx % (shotdata.img_x_len * shotdata.img_y_len);
  shotimg.value!.style.backgroundPosition = `${
    (pidx % shotdata.img_x_len) * -shotdata.img_x_size
  }px ${Math.floor(pidx / shotdata.img_y_len) * -shotdata.img_y_size}px`;
}
let lastOffsetX = clientWidth * 0.2;

function loadData() {
  if (props.bvid === "" || !props.bvid.startsWith("BV")) {
    show.value = false;
    return;
  }
  if (pvdata === null) {
    if (ans === null) {
      shotimg.value!.dataset.iidx = "-1";
      ans = fetchVideoShot(props.bvid)
        .then((data) => {
          shotdata = data;
          return fetchPvData(data.pvdata);
        })
        .then((data) => {
          pvdata = data;
        });
    }

    const durationPromise = myAPIGen
      .doFetch("get-video-info", { bvid: props.bvid })
      .then((e) => {
        duration = e.data?.pages[0].duration || 1;
        durationStr = convertDurationToString(duration);
        pname.value = e.data?.pages[0].part || "";
      });

    Promise.all([ans, durationPromise])
      .then(() => {
        toX(lastOffsetX);
      })
      .catch((e) => {
        console.error(e);
        show.value = false;
      })
      .finally(() => {
        ans = null;
      });
    return false;
  }
  return true;
}

function onpointermove(e: PointerEvent) {
  lastOffsetX = e.offsetX;

  if (loadData()) {
    toX(e.offsetX);
  }
}
</script>
<template>
  <div
    v-show="show"
    id="videoshot"
    @pointermove="onpointermove"
    @pointerenter="onpointermove"
  >
    <span>{{ pname }}</span>
    <div ref="shotimg" id="shotimg"></div>
    <span>{{ hovertime }}</span>
  </div>
</template>
<style scoped>
#videoshot {
  position: absolute;
  top: 0px;
  background-color: black;
  color: white;
  width: 160px;
  height: 100px;
}
#videoshot span {
  position: absolute;
  padding: 0 5px;
  background-color: #00000091;
  font-size: small;
  line-height: 1.6;
}
#videoshot span:nth-of-type(1) {
  text-align: start;
  top: 0;
  left: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
}
#videoshot span:nth-of-type(1):hover {
  max-width: unset;
  z-index: 1000;
}
#videoshot span:nth-of-type(2) {
  text-align: end;
  bottom: 0;
  right: 0;
}
#videoshot #shotimg {
  width: 160px;
  height: 90px;
  background-repeat: no-repeat;
  background-attachment: scroll;
}
</style>
