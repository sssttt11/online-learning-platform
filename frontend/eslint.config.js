import pluginVue from 'eslint-plugin-vue';

export default [
  // 引入 Vue 的基础语法检查规则
  ...pluginVue.configs['flat/essential'],
  {
    rules: {
      // 关闭“Vue 组件名必须是多个单词”的强制要求（防止初学者遇到大面积报错）
      'vue/multi-word-component-names': 'off',
      // 将未使用的变量定义为警告而不是致命错误
      'no-unused-vars': 'warn',
      'vue/no-unused-vars': 'warn'
    }
  }
];