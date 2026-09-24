import { defineConfig, devices } from "@playwright/test";

// E2E de la demo con emulación táctil (spec §10.2, design.md §7, L-07).
// - pixel-7: Chromium con pantalla táctil; los gestos usan toques reales vía CDP.
// - iphone-14: WebKit de escritorio con tamaño y agente de iPhone. NO es Safari de iOS:
//   no reproduce la lupa, los gestos del sistema ni el teclado. La prueba manual en un
//   iPhone real sigue siendo obligatoria.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Si la demo ya está corriendo (npm run dev), se reutiliza; si no, Playwright la levanta.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3002/diagnostico",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "pixel-7", use: { ...devices["Pixel 7"] } },
    { name: "iphone-14", use: { ...devices["iPhone 14"] } },
  ],
});
