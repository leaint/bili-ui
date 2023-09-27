<script setup lang="ts">
import type { TypeItem } from "@/stores/interface";
import { onMounted, ref, watch, type PropType } from "vue";

const keywordinput = ref<HTMLInputElement>();
const searchbtn = ref<HTMLButtonElement>();
const keyword = ref("");

const props = defineProps({
  suggestwords: {
    type: Array,
  },
  typelist: {
    type: Array as PropType<TypeItem[]>,
    required: true,
    default: () => [],
  },
  keyword: {
    type: String,
  },
  autofocus: {
    type: Boolean,
    required: false,
    default: false,
  },
});
const selectedtype = ref();

const emits = defineEmits(["searchevent", "getsuggest", "typeselect"]);

watch(
  () => props.keyword,
  () => {
    keyword.value = props.keyword || "";
  },
  {
    immediate: true,
  }
);
watch(
  () => props.typelist,
  () => {
    if (props.typelist.length > 1) {
      const defaultType =
        props.typelist.find((i) => i.default === true) || props.typelist[0];
      selectedtype.value = defaultType.value;
    }
  },
  {
    immediate: true,
    deep: true,
  }
);
function clearkeyword() {
  keyword.value = "";
  keywordinput.value?.focus();
  getsuggest(null);
}
function search() {
  emits("searchevent", keyword.value);
}
function getsuggest(paylod: Event | null) {
  emits("getsuggest", keyword.value);
  // 点击下拉列表，该判断方法并不确定有效
  if (paylod?.type === "input" && !(paylod instanceof InputEvent)) {
    keywordinput.value?.blur();
    searchbtn.value?.click();
  }
}
function typeselect() {
  emits("typeselect", selectedtype.value);
}
onMounted(() => {
  if (props.autofocus)
    keywordinput.value!.onmouseenter = (e) => {
      if (document.activeElement !== e.target) {
        keywordinput.value?.focus();
        keywordinput.value?.select();
      }
    };
});
</script>
<template>
  <div class="searchtool">
    <div class="searchbar">
      <select
        class="search"
        v-if="selectedtype !== ''"
        @change="typeselect"
        v-model="selectedtype"
      >
        <option
          v-for="(item, index) of typelist"
          :key="index"
          :value="item.value"
        >
          {{ item.name }}
        </option>
      </select>
      <button class="search" @click="clearkeyword">x</button>
      <datalist id="words">
        <option
          v-for="(item, index) of suggestwords"
          :value="item"
          :key="index"
        />
      </datalist>
      <input
        autocomplete="off"
        ref="keywordinput"
        class="search text"
        list="words"
        name="keyword"
        type="text"
        v-model="keyword"
        @keydown.enter="search()"
        @keyup.enter="keywordinput?.blur()"
        @input="getsuggest"
      />
      <button ref="searchbtn" class="search" @click="search()">
        🔎️Search
      </button>
    </div>
  </div>
</template>
<style>
:root {
  --one-gray: #9e9e9e;
  --two-gray: #eeeeee;
  --two-hover-gray: #f5f5f5;
}
</style>
<style scoped>
.searchtool {
  /* max-width: fit-content; */
  margin-left: auto;
  margin-right: auto;
  /* min-width: max-content; */
  margin-bottom: 0.5em;
}

.searchbar {
  border: 2px solid var(--one-gray);
  border-radius: 18px;
  background-color: var(--two-gray);
  display: flex;
}
.searchbar > button,
.searchbar > select {
  cursor: pointer;
}
.searchbar :first-child {
  border-radius: 18px 0 0 18px;
}
.searchbar :last-child {
  border-radius: 0 18px 18px 0;
}
.searchbar > :focus-visible {
  outline: 0;
}
.searchbar > :hover {
  background-color: var(--two-hover-gray);
}
input {
  font-family: sans-serif;
}

.search {
  padding: 5px 7px;
  border: 0;
  height: 30px;
  background-color: var(--two-gray);
  /* padding: 0.5em 0.2em; */
  /* margin: 2px; */
}
button.search {
  white-space: nowrap;
}
input.search.text:focus-visible {
  background-color: white;
}

input.search.text {
  background-color: #fafafa;
  padding-left: 0.5em;
  flex-grow: 1;
  width: 100%;
}
.text {
  padding: 0.5em 0.2em;

  /* width: 20em; */
}
</style>
