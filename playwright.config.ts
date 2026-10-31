import { defineConfig } from "@playwright/test";

export default defineConfig({
  globalSetup: "./tests/browser/business.setup.ts",
  globalTeardown: "./tests/browser/business.teardown.ts",
  testDir: "./tests/browser",
  outputDir: "./work/browser-results",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    storageState: "work/browser-auth.json",
    channel: "chrome",
    headless: true,
    baseURL: "http://127.0.0.1:3001",
    viewport: { width: 1440, height: 1050 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
