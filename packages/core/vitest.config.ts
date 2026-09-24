import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node puro, sin jsdom: el núcleo no debe necesitar un navegador (RNF-07).
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
