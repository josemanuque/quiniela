import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ignore build output
  globalIgnores(['dist', 'node_modules']),

  // ─────────────────────────────
  // Browser / Frontend code
  // ─────────────────────────────
  {
    files: ['**/*.{ts,tsx,js,jsx}'],

    languageOptions: {
      globals: {
        ...globals.browser
      }
    },

    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier
    ],

    rules: {
      // React safety (important for your app: realtime + state heavy)
      'react-hooks/exhaustive-deps': 'warn'
    }
  },

  // ─────────────────────────────
  // Node / Vite config files
  // ─────────────────────────────
  {
    files: ['vite.config.ts', 'eslint.config.js'],

    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
])