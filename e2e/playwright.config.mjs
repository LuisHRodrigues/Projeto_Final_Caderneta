import { defineConfig, devices } from '@playwright/test';

// BASE_URL: http://localhost:3000 (compose) ou a URL de homologação (Firebase Hosting).
export default defineConfig({
  testDir: '.',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  // Navegadores suportados (decisão do responsável, 11/11/2026): Chrome / Edge (Chromium).
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
