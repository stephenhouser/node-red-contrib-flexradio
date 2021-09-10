module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    "space-before-function-paren": ["error", "never"],
    "camelcase": "off",
    "semi": ["error", "always"],
    "indent": ["error", "tab", { "SwitchCase": 1 }],
    "no-tabs": ["error", { allowIndentationTabs: true }],
  }
}
