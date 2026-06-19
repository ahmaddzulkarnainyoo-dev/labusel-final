// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Matikan error any
    },
  },
]);

export default eslintConfig;// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Matikan error any
    },
  },
]);

export default eslintConfig;