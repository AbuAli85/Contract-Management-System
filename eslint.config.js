module.exports = {
  extends: [
    "next/core-web-vitals"
  ],
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
    "@typescript-eslint/no-explicit-any": "warn", // Allow any but warn
    
    // General rules
    "no-var": "error",
    "prefer-const": "warn",
    "no-case-declarations": "warn"
  },
  ignorePatterns: [
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
