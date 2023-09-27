<script setup lang="ts">
import type { CardItemContent } from "@/stores/counter";
import { ref } from "vue";
import VideoShot from "./VideoShot.vue";

const props = defineProps<{
  item: CardItemContent;
  showAuthor?: boolean;
  leftToRight?: boolean;
}>();
const flexBox = props.leftToRight ?? false;
const showShot = ref(false);

let leave = false;
function onpointerenter(e: PointerEvent) {
  leave = false;
  setTimeout(() => {
    if (leave) {
      return;
    }
    showShot.value = true;
  }, 1500);
}

function onpointerleave() {
  leave = true;
  setTimeout(() => {
    if (!leave) {
      return;
    }
    showShot.value = false;
  }, 700);
}
</script>

<template>
  <div :class="{ flexbox: flexBox }">
    <div>
      <slot name="header"></slot>
      <RouterLink class="noam" :to="'/play?bvid=' + item.bvid">
        <div
          class="imgbox"
          @pointerenter="onpointerenter"
          @pointerleave="onpointerleave"
        >
          <img
            loading="lazy"
            :src="item.pic + '@160w_100h_1c.webp'"
            referrerpolicy="no-referrer"
          />
          <span class="duration">{{ item.duration }}</span>
          <VideoShot :bvid="item.bvid" :isshow="showShot"></VideoShot>
        </div>
      </RouterLink>
      <div>
        <a target="_blank" :href="item.url">---📎️</a>
        <a
          title="Single Player"
          target="SinglePlayer"
          :href="'/player.html?id=' + item.bvid"
          >------</a
        >
      </div>
    </div>
    <div>
      <RouterLink class="noam" :to="'/play?bvid=' + item.bvid">
        <div class="title">
          <span v-html="item.title"></span>
        </div>
      </RouterLink>

      <div class="small">
        <slot name="detail"></slot>
      </div>
      <div class="author small" v-if="showAuthor">
        <a target="_blank" :href="'/space?mid=' + item.mid">
          {{ item.author }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flexbox {
  display: flex;
}
.flexbox > div:last-child {
  padding-left: 8px;
}
.imgbox {
  text-align: center;
  line-height: 0;
  position: relative;
  width: 160px;
  height: 100px;
}

.duration {
  position: absolute;
  color: white;
  background-color: #00000091;
  right: 0;
  bottom: 0;
  font-size: 0.9em;
  font-family: sans-serif;
  padding: 0 5px;
  line-height: 1.6;
}

.title {
  color: black;
  margin-bottom: 0.5em;
  height: 3em;
  width: 160px;
  overflow: hidden;
}

.small {
  font-size: 13px;
}
.author {
  text-align: end;
}
div.author a {
  color: #858e96;
}
.duration {
  position: absolute;
  color: white;
  background-color: #00000091;
  right: 0;
  bottom: 0;
  font-size: 0.9em;
  font-family: sans-serif;
  padding: 0 5px;
  line-height: 1.6;
}
</style>

<style>
/*v-html的内容需要全局样式 */
.title .keyword {
  color: #f25d8e;
  font-style: normal;
}
</style>
