<script setup lang="ts">
import WelcomeItem from "./WelcomeItem.vue";
import SettingView from "../views/SettingView.vue";
import HistoryView from "../views/StarListView.vue";
</script>

<template>
  <WelcomeItem>
    <template #heading>设置</template>

    <SettingView />
  </WelcomeItem>
  <WelcomeItem>
    <template #heading>收藏列表</template>
    <HistoryView />
  </WelcomeItem>
</template>
