import { defineConfig } from "vitest/config";

// Batasi test runner ke test aplikasi. Tanpa ini Vitest juga memindai file
// .test.mjs di folder skill (.agents/.claude) yang bukan test suite dan
// membuat `npm test` gagal walaupun seluruh test aplikasi lulus.
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".agents/**", ".claude/**"],
  },
});
