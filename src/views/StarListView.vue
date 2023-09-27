<script setup lang="ts">
import { convertDurationToString, type StarItem } from "@/stores/interface";
import { onBeforeMount, ref } from "vue";

interface Star {
  url: string;
  title: string;
  current_time: string;
}

const starList = ref<Star[]>([]);

onBeforeMount(() => {
  const stars: StarItem[] = JSON.parse(
    localStorage.getItem("starlist") || "[]"
  );
  for (const i of stars) {
    const { param_id, cur, title, current_time } = i;

    starList.value.push({
      url:
        "/player.html?id=" + param_id + (cur === 0 ? "" : "&p=" + (+cur + 1)) + "&t=" + Math.ceil(current_time),
      title,
      current_time: convertDurationToString(current_time),
    });
  }
});
</script>
<template>
  <div>
    <details>
      <summary>展开</summary>
      <ul>
        <li v-for="(item, index) in starList" :key="index">
          <a
            :href="item.url"
            target="blank"
          >{{ item.title }} {{ item.current_time }}</a>
        </li>
      </ul>
    </details>
  </div>
</template>
