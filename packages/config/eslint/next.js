import nextPlugin from "@next/eslint-plugin-next";
import reactLibraryConfig from "./react-library.js";

export default [
  ...reactLibraryConfig,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
