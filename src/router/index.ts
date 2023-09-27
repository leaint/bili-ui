import { MODE } from "@/stores/counter";
import SearchView from "@/views/SearchView.vue";
import SettingViewVue from "@/views/SettingView.vue";
import VideoViewVue from "@/views/VideoView.vue";
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import NewView from "../views/NewsView.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        title: "Bilibili Lite",
      },
    },
    {
      path: "/news",
      name: "news",
      component: NewView,
      meta: {
        title: "我的动态",
      },
    },
    {
      path: "/search",
      name: "search",
      component: SearchView,
      meta: {
        keepAlive: true,
        pagemode: MODE.SEARCH,
      },
    },
    {
      path: "/play",
      name: "play",
      component: VideoViewVue,
    },
    {
      path: "/setting",
      name: "setting",
      component: SettingViewVue,
    },
    {
      path: "/space",
      name: "space",
      component: SearchView,
      meta: {
        keepAlive: true,
        pagemode: MODE.SPACE,
      },
    },
    {
      path: "/upuser",
      name: "upuser",
      component: SearchView,
      meta: {
        keepAlive: true,
        pagemode: MODE.USER,
      },
    },
    {
      path: "/bgft",
      name: "bgft",
      component: SearchView,
      meta: {
        keepAlive: true,
        pagemode: MODE.MEDIA_BANGUMI_FT,
      },
    },
  ],
});

export default router;
