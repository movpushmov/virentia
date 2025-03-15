import DefaultTheme from "vitepress/theme";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import CodeRow from "./components/CodeRow.vue";
import NodeFlow from "./components/NodeFlow.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("CodeRow", CodeRow);
    app.component("NodeFlow", NodeFlow);
  },
};
