// import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import onlyWarn from 'eslint-plugin-only-warn'
import tsdoc from 'eslint-plugin-tsdoc'
import tsEslint from 'typescript-eslint'

export default tsEslint.config(
  {
    ignores: ['eslint.config.js', 'dist', 'vite.config.ts'],
  },
  js.configs.recommended,
  tsEslint.configs.recommendedTypeChecked,
  tsEslint.configs.strictTypeChecked,
  tsEslint.configs.eslintRecommended,
  tsEslint.configs.stylisticTypeChecked,
  reactRefresh.configs.recommended,
  reactHooks.configs['recommended-latest'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      // https://github.com/microsoft/tsdoc/tree/master/eslint-plugin
      tsdoc: tsdoc,
      // https://github.com/bfanger/eslint-plugin-only-warn
      onlyWarn,
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/quotes': ['warn', 'backtick'],
      '@typescript-eslint/consistent-type-imports': 'warn',
      'tsdoc/syntax': 'warn',
      // TypeScript makes these safe & effective
      'no-case-declarations': 'off',
      // Same approach used by TypeScript noUnusedLocals
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
      // Needed when working with .mts/.cts where a lone e.g. <T> is not allowed
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      // Useful for organizing Types
      '@typescript-eslint/no-namespace': 'off',
      // Turn training wheels off. When we want these we want these.
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-expect-error': false }],
    },
  },
)
