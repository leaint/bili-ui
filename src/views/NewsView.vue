<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import { settingStore } from "@/stores/counter";

import type { CardItemContent } from "@/stores/counter";
import { myAPIGen } from "@/stores/api";
import CardItem from "../components/CardItem.vue";
import {
  type CardInfo,
  type BgmInfo,
  biligcID,
  biliID,
} from "@/stores/interface";
import { convertDurationToString } from "@/stores/interface";
import EmptyBox from "../components/EmptyBox.vue";

const d = ref(Array<CardInfo>());
const hasMore = ref(true);
const showEmpty = ref(false);

/**处理数据，统一番剧和普通稿件的差异 */
const processData = (data: any) => {
  return (
    data.cards.map((i: any) => {
      const obj = JSON.parse(i.card);
      if (obj.owner) {
        const card = obj as CardInfo;
        card.url = card.short_link;
        card.bvid = i.desc.bvid;
        card.duration_str = convertDurationToString(card.duration);
        card.pubdate_str = convertDateTimeToString(card.pubdate);
        return card;
      } else if (obj.apiSeasonInfo) {
        const bgm = obj as BgmInfo;
        return {
          title: bgm.new_desc,
          owner: {
            name:
              biliID[bgm.apiSeasonInfo.bgm_type].name ||
              bgm.apiSeasonInfo.title,
            mid: biliID[bgm.apiSeasonInfo.bgm_type].mid || biligcID,
          },
          pic: bgm.cover,
          url: bgm.url,
          bvid: "ep" + bgm.episode_id,
          duration_str: "",
          pubdate_str: convertDateTimeToString(i.desc.timestamp),
        } as CardInfo;
      }
    }) || []
  );
};

let history_offset = 0;

onBeforeMount(() => {
  myAPIGen
    .doFetch("get-news", { uid: settingStore.uid })
    .then(getInitNews)
    .catch((e) => {
      console.error(e);
      showEmpty.value = true;
    });
});

function getInitNews(e: any) {
  history_offset = e.data.history_offset;
  hasMore.value = e.data.max_dynamic_id > history_offset;

  d.value = processData(e.data);
}
let loading = false;
/**最多动态加载页数 */
const MaxnewsCount = 3;
let loadcount = 1;

function getMore() {
  if (!hasMore.value || loading || loadcount > MaxnewsCount) {
    return;
  }
  loadcount++;
  loading = true;
  myAPIGen
    .doFetch("get-more-news", {
      uid: settingStore.uid,
      offset_dynamic_id: history_offset,
    })
    .then((e) => {
      history_offset = e.data.next_offset;
      hasMore.value = e.data.has_more > 0;
      d.value.push(...processData(e.data));
    })
    .catch((e) => {
      console.error(e);
    })
    .finally(() => {
      loading = false;
    });
}

function convertDateTimeToString(d: number): string {
  const diff = Math.floor(Date.now() / 1000 - d);

  let s = "刚刚";
  if (diff < 60) {
    return s;
  } else if (diff < 3600) {
    s = Math.floor(diff / 60) + "分钟前";
  } else if (diff < 86400) {
    s = Math.floor(diff / 3600) + "小时前";
  } else {
    s = Math.floor(diff / 86400) + "天前";
  }

  return s;
}

function cardAdapter(item: CardInfo): CardItemContent {
  const content: CardItemContent = {
    bvid: item.bvid,
    pic: item.pic,
    mid: item.owner.mid,
    author: item.owner.name,
    title: item.title,
    url: item.url,
    duration: item.duration_str,
  };
  return content;
}
</script>

<template>
  <div>
    <ul class="resultbox">
      <li v-for="(item, index) of d" :key="index">
        <CardItem :item="cardAdapter(item)">
          <template #header>
            <div>
              <a target="_blank" :href="'/space?mid=' + item.owner.mid">{{
                item.owner.name
              }}</a>
            </div>
          </template>
          <template #detail>
            <div>
              <span>🕒️{{ item.pubdate_str }}</span>
            </div>
          </template>
        </CardItem>
      </li>
    </ul>
    <EmptyBox v-if="showEmpty" />
    <div class="loadmore" title="加载更多" @click="getMore">• • •</div>
  </div>
</template>
<style scoped>
ul {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 0;
  list-style: none;
  gap: 1em;
}
.resultbox {
  margin-top: 2em;
  max-width: min-content;
  margin-left: auto;
  margin-right: auto;
}

.loadmore:hover {
  background-color: aliceblue;
}
.loadmore {
  width: 100px;
  text-align: center;
  margin: 1em auto;
  /* font-size: 3em; */
  cursor: pointer;
}
@media (max-width: 900px), (orientation: portrait) {
  ul.resultbox {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
