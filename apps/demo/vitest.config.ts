import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.join(__dirname, "src") },
  },
  test: {
    // Solo lógica pura de la demo (registro de íconos, definiciones de pantalla).
    // Lo visual se prueba con Playwright (e2e/).
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
