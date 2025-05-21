import globals from 'globals'
// import reactHooks from 'eslint-plugin-react-hooks'
// import reactRefresh from 'eslint-plugin-react-refresh'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import onlyWarn from 'eslint-plugin-only-warn'
import tsdoc from 'eslint-plugin-tsdoc'
import unusedImports from 'eslint-plugin-unused-imports'
import tsEslint from 'typescript-eslint'

export default tsEslint.config(
  js.configs.recommended,
  tsEslint.configs.recommendedTypeChecked,
  tsEslint.configs.strictTypeChecked,
  tsEslint.configs.eslintRecommended,
  tsEslint.configs.stylisticTypeChecked,
  {
    ignores: [
      'build',
      'eslint.config.js',
      'vite.config.ts',
      '**/__snapshots__/**/*',
      'examples',
      '.bundle-explorer',
    ],
  },
  // reactRefresh.configs.recommended,
  // todo apply to non test files -- messes with playwright fixtures
  // reactHooks.configs['recommended-latest'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
      // https://github.com/microsoft/tsdoc/tree/master/eslint-plugin
      tsdoc: tsdoc,
      // https://github.com/bfanger/eslint-plugin-only-warn
      onlyWarn,
      '@stylistic': stylistic,
    },
    rules: {
      'no-empty-pattern': 'off', // incompatible with playwright fixtures
      'unused-imports/no-unused-imports': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'tsdoc/syntax': 'warn',
      // TypeScript makes these safe & effective
      'no-case-declarations': 'off',
      // Same approach used by TypeScript noUnusedLocals
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^___',
        argsIgnorePattern: '^___',
      }],
      // TODO make issue that this rule doens't handle case of template literals: https://typescript-eslint.io/rules/no-unused-expressions/
      '@typescript-eslint/no-unused-expressions': 'off',
      // Useful for organizing Types
      '@typescript-eslint/no-namespace': 'off',
      // Turn training wheels off. When we want these we want these.
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-expect-error': false }],
      // Disable dprint conflicts:
      '@stylistic/member-delimiter-style': 'off',
      '@stylistic/no-multi-spaces': 'off',
      '@stylistic/comma-spacing': 'off',
      '@stylistic/quotes': ['warn', 'backtick'],
    },
  },
)
