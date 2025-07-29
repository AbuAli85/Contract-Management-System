import nextJest from "next/jest.js"

const createJestConfig = nextJest({
  dir: "./",
})

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^pp/(.*)$": "<rootDir>/app/$1",
    "^components/(.*)$": "<rootDir>/components/$1",
    "^lib/(.*)$": "<rootDir>/lib/$1",
    "^hooks/(.*)$": "<rootDir>/hooks/$1",
    "^types/(.*)$": "<rootDir>/types/$1",
    "^utils/(.*)$": "<rootDir>/utils/$1",
    "^constants/(.*)$": "<rootDir>/constants/$1",
    "^styles/(.*)$": "<rootDir>/styles/$1",
  },
  preset: "ts-jest",
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/cypress/**",
    "!**/tests/**",
    "!**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ["text", "lcov", "html", "json"],
  coverageDirectory: "coverage",
  testMatch: [
    "<rootDir>/tests/**/*.test.{ts,tsx}",
    "<rootDir>/__tests__/**/*.test.{ts,tsx}",
    "<rootDir>/tests/**/*.integration.test.{ts,tsx}",
    "<rootDir>/__tests__/**/*.integration.test.{ts,tsx}",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/coverage/",
    "<rootDir>/cypress/",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: "tsconfig.json",
    }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testTimeout: 30000,
  verbose: true,
}

export default createJestConfig(config)
