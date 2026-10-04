// ESLint 9 native flat config.
// Uses typescript-eslint directly to avoid FlatCompat circular-ref issues
// with eslint-config-next in ESLint 9.x.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['.next/**', 'node_modules/**', 'supabase/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Allow `any` in a few places while typing is being developed
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow unused vars only if prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // next-intl t.raw() returns unknown — allow type assertions
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
