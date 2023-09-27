<script setup lang="ts">
import { genPageFunc } from "@/stores/lib";
import { ref, watch } from "vue";

const props = defineProps({
  numPages: {
    type: Number,
    default: 1,
    required: true,
  },
  currentPage: {
    type: Number,
    default: 1,
    required: true,
  },
  pageSize: {
    type: Number,
    default: 5,
    required: false,
  },
});

const emits = defineEmits<{
  (event: "pagechange", page: number): void;
}>();

const le = ref(false);
const re = ref(false);
const genPage = ref(Array<number>());

watch(
  props,
  () => {
    ({
      pages: genPage.value,
      le: le.value,
      re: re.value,
    } = genPageFunc(props.numPages, props.currentPage, props.pageSize));
  },
  {
    immediate: false,
  }
);

function changePage(e: MouseEvent) {
  const path = e.composedPath() as HTMLElement[];
  for (const elm of path) {
    if (elm.nodeName === "SPAN" && elm.dataset.index !== undefined) {
      emits("pagechange", parseInt(elm.dataset.index, 10));
      break;
    }
  }
}
</script>
<template>
  <div class="pagination">
    <div v-show="numPages > 1" @mousedown="changePage">
      <span data-index="1" :class="1 === currentPage ? 'cur pager' : 'pager'"
        >1</span
      >
      <span v-show="le" class="pagerph">...</span>
      <span
        v-for="i in genPage"
        :data-index="i"
        :class="i === currentPage ? 'cur pager' : 'pager'"
        :key="i"
        >{{ i }}</span
      >
      <span v-show="re" class="pagerph">...</span>

      <span
        :data-index="numPages"
        :class="numPages === currentPage ? 'cur pager' : 'pager'"
        >{{ numPages }}</span
      >
    </div>
    <div v-show="numPages === 1">
      <span class="cur pager">1</span>
    </div>
  </div>
</template>
<style scoped>
.pagination {
  user-select: none;
  max-width: 800px;
  margin: 1em auto;
}
.pager {
  display: inline-block;
  padding: 0.3em 0;
  cursor: pointer;
  margin: 0 0.2em;
  min-width: 2.5em;
  text-align: center;
  border-radius: 4px;
}
.pagerph {
  display: inline-block;
  padding: 0.5em 1em;
}
.pager:hover {
  background-color: lightsteelblue;
}
.cur {
  color: blue;

  background-color: lightblue;
}
</style>
