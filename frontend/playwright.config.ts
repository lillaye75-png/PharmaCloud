import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 1,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    timeout: 120000,
    reuseExistingServer: true,
  },
});
