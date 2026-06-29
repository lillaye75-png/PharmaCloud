import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 1,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    baseURL: "https://pharma-cloud-coral.vercel.app",
  },
  projects: [
    {
      name: "PharmaCloud Production",
      use: {
        baseURL: "https://pharma-cloud-coral.vercel.app",
      },
    },
  ],
});
