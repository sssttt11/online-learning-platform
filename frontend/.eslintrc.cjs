module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential'
  ],
  parser: 'vue-eslint-parser', 
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // ⬇️ 下面这排规则就是为你量身定制的“免死金牌” ⬇️
    'vue/multi-word-component-names': 'off', 
    'no-unused-vars': 'off',         // 忽略：定义了但没使用的变量
    'no-undef': 'off',               // 忽略：未定义的变量 (如 axios)
    'vue/no-unused-vars': 'off',     // 忽略：Vue 模板里没用到的变量 (如 idx)
    'vue/no-ref-as-operand': 'off',  // 忽略：忘记写 .value 的错误
    'no-useless-escape': 'off'       // 忽略：多余的斜杠转义
  }
}