<script setup lang="ts">
import { UserInfo } from "@/stores/lib";
const props = defineProps({
  userInfo: {
    type: UserInfo,
    default: {
      face: "./noface.jpg",
      name: "",
      sign: "",
      sex: "",
      level: 6,
      mid: 0,
      fans: 0,
    },
    required: true,
  },
  imgsize: {
    type: String,
    default: "normal",
  },
});

let size = "48";
let classSize = "normal";
if (props.imgsize === "large") {
  size = "96";
  classSize = "large";
}
const sizeStr = `@${size}w_${size}h_1c_1s.webp`;
const convertIntToString = (n: number): string => {
  let retVal = "粉丝：";
  if (n === undefined) {
    return "";
  }
  if (n >= 1e4) {
    retVal += Math.floor(n / 1e3) / 10 + "万";
    return retVal;
  }
  return retVal + n.toString();
};
</script>
<template>
  <div :class="['authorinfo', classSize]">
    <span>
      <img
        :src="userInfo.face + sizeStr"
        referrerpolicy="no-referrer"
        :width="size"
        :height="size"
      />
    </span>
    <div class="info">
      <h3>
        <a
          :href="'https://space.bilibili.com/' + userInfo.mid"
          target="_blank"
          >{{ userInfo.name }}</a
        >
      </h3>
      <div>
        {{ userInfo.sex }} · LV {{ userInfo.level }}&nbsp;&nbsp;&nbsp;{{
          convertIntToString(userInfo.fans)
        }}
      </div>
      <div>{{ userInfo.sign }}</div>
    </div>
  </div>
</template>
<style scoped>
.authorinfo {
  border: thin #c0c0c0 solid;
  padding: 5px;
  margin: auto;
  display: flex;
  max-width: fit-content;
}
.authorinfo.large h3 {
  font-size: large;
  font-weight: bold;
}
/* .authorinfo img {
  max-width: 48px;
  max-height: 48px;
}
.authorinfo img.large {
  max-width: 96px;
  max-height: 96px;
} */
.authorinfo .info {
  font: smaller sans-serif;
  padding: 3px;
  padding-left: 1em;
}
.authorinfo.large .info {
  font-size: 13px;
}
.info a {
  color: black;
}
</style>
