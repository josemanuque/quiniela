import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ignore build output and generated files
  globalIgnores(['dist', 'node_modules', 'src/types/database.types.ts']),

  // ─────────────────────────────
  // Browser / Frontend TypeScript code
  // ─────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },

    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],

    rules: {
      // React safety (important for your app: realtime + state heavy)
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // ─────────────────────────────
  // Browser / Frontend JavaScript code
  // ─────────────────────────────
  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },

    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
  },

  // ─────────────────────────────
  // Node / Vite config files
  // ─────────────────────────────
  {
    files: ['vite.config.ts', 'eslint.config.js'],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
])
