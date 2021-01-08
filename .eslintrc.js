module.exports = {
  extends: [
    'standard'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    'no-debugger': 'off'
  }
}
