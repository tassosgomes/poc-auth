import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.e2e.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173'
  },
  webServer: [
    {
      command: 'node ./e2e/mock-runtime-server.mjs',
      url: 'http://127.0.0.1:6201/healthz',
      reuseExistingServer: false,
      timeout: 30_000
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173/',
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        VITE_BFF_BASE_URL: 'http://127.0.0.1:6201'
      }
    }
  ]
});