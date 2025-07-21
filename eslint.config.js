import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js"

export default tseslint.config(
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  {
    rules: {
      // React specific rules
      "react/react-in-jsx-scope": "off", // Next.js doesn't require React to be in scope
      "react/no-unescaped-entities": "warn", // Downgrade from error to warning
      "react/prop-types": "off", // We're using TypeScript for prop validation
      "react/display-name": "warn", // Downgrade from error to warning
      "react/no-unknown-property": "warn", // Downgrade from error to warning
      
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-empty-object-type": "warn", // Downgrade from error to warning
      "@typescript-eslint/no-unsafe-function-type": "warn", // Downgrade from error to warning
      "@typescript-eslint/no-require-imports": "warn", // Downgrade from error to warning
      
      // General rules
      "no-var": "error",
      "prefer-const": "warn",
      "no-case-declarations": "warn",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.mjs",
      "scripts/**/*.js",
      "scripts/**/*.cjs"
    ]
  }
)
