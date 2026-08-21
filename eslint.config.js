import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-web/**',
      '**/node_modules/**',
      'vendor/**',
      'packages/content/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Zha'elim is dependency-free browser JavaScript that ships as-is, with no
    // build step and no TypeScript. It needs the platform globals declared and
    // the type-aware rules kept out of its way.
    files: ['zhaelim/**/*.js', 'zhaelim/**/*.mjs'],
    languageOptions: {
      globals: {
        globalThis: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        performance: 'readonly',
        console: 'readonly',
        confirm: 'readonly',
        matchMedia: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        devicePixelRatio: 'readonly',
        URL: 'readonly',
        // service worker
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        // tools
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
