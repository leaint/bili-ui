<script setup lang="ts">
import apiClient from "@/stores/api";
import { settingStore } from "@/stores/counter";
import { onBeforeMount, ref } from "vue";

onBeforeMount(() => {
  // 初始化设置项的值和消息
  ks.forEach((k) => {
    v.value.push(settingStore[k as keyof typeof settingStore] || "");
    m.value.push("");
  });

  // 若cookie为空，则获取一个默认的cookie
  const cookieIdx = ks.indexOf("cookie");
  if (v.value[cookieIdx].length === 0) {
    apiClient.getVisitorCookie().then((e) => {
      if (v.value[cookieIdx].length > 0) return;
      v.value[cookieIdx] = e.cookie || "";
      save(cookieIdx);
    });
  }
});
/**设置项对应的值 */
const v = ref(Array<string>());
/**设置项对应的消息*/
const m = ref(Array<string>());
const ks = ["cookie", "apiprefix", "uid", "vapiprefix"];
/**设置项高度 */
const kl = [5, 2, 2, 2];
/**设置项标题 */
const kd = ["Bilibili Cookie", "API prefix", "UID", "Video API prefix"];

/**
 * 保存设置项
 * @param ki 设置项索引值
 */
function save(ki: number) {
  settingStore[ks[ki] as keyof typeof settingStore] = v.value[ki];
  v.value[ki] = settingStore[ks[ki] as keyof typeof settingStore] || "";

  m.value[ki] = "✔️已保存";
  setTimeout(() => {
    m.value[ki] = "";
  }, 2000);
}
</script>
<template>
  <div id="bilicookie">
    <details>
      <summary>展开</summary>
      <fieldset
        v-for="(_, index) of ks"
        :key="index"
        @change="m[index] = ' - *'"
      >
        <legend>{{ kd[index] }} {{ m[index] }}</legend>
        <textarea v-model="v[index]" cols="50" :rows="kl[index]"></textarea>
        <div>
          <button @click="save(index)">保存</button>
        </div>
      </fieldset>
    </details>
  </div>
</template>
<style scoped>
#bilicookie {
  max-width: fit-content;
}
fieldset textarea {
  width: 100%;
  min-width: 5em;
}
</style>
