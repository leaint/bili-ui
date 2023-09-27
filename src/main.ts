import { createApp } from "vue";
// import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import "./assets/main.css";

const app = createApp(App);

// app.use(createPinia());
app.use(router);

app.mount("#app");

router.beforeEach((to, from, next) => {
  if (
    to.meta?.title !== undefined &&
    Object.getOwnPropertyNames(to.query).length === 0
  ) {
    document.title = (to.meta.title as string) || document.title;
  }
  next();
});
