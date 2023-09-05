module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:import/electron',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['prettier', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    createDefaultProgram: true,
  },
  rules: {
    'no-unused-vars': [0],
    'import/no-named-as-default': [0],
    'import/no-named-as-default-member': [0],
    'react/react-in-jsx-scope': 'off',
    'no-useless-constructor': 'off',
    'no-constant-condition': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'auto',
      },
    ],
    'no-console': 'off',
    'no-empty': [0],
    quotes: [1, 'single', { avoidEscape: true, allowTemplateLiterals: false }],
    semi: [1, 'never'],
    'max-len': [
      1,
      {
        code: 100,
        ignoreUrls: true,
        ignoreComments: true,
        ignoreTemplateLiterals: true,
        ignoreStrings: true,
      },
    ],

    indent: 'off',
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'SequenceExpression',
        message: 'The comma operator is confusing and a common mistake. Dont use it!',
      },
    ],
  },
}
