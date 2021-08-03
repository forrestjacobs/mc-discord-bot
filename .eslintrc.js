module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
  },
  plugins: ["simple-import-sort"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended", // must be last
  ],
  rules: {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
};
