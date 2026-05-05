module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module' // 解决 import/export 错误
  },
  rules: {
    'indent': ['warn', 2],
    'linebreak-style': ['off'], // 关掉换行符检查
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'always'],
    'no-unused-vars': ['warn'], // 只警告不报错
    'no-undef': ['error'] // undefined 必须保留为 error
  }
};