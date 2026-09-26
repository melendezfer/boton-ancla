import path from "node:path";
import type { NextConfig } from "next";

// Publicación en GitHub Pages (EXPORTAR_PAGES=1, lo usa .github/workflows/pages.yml): sitio
// estático (sin servidor) bajo https://melendezfer.github.io/boton-ancla/. En desarrollo y en
// las pruebas no cambia nada.
const paraPages = process.env.EXPORTAR_PAGES === "1";
const BASE_PATH = paraPages ? "/boton-ancla" : "";

const nextConfig: NextConfig = {
  ...(paraPages && {
    output: "export",
    basePath: BASE_PATH,
    // Carpeta de compilación aparte: no pisa la de `next dev` si está corriendo.
    distDir: ".next-pages",
  }),
  // Para las rutas escritas a mano (imágenes de fondo en estilos): ver lib/ruta.ts.
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },

  // El núcleo publica su código TypeScript sin compilar (packages/core/src);
  // Next lo compila junto con la demo.
  transpilePackages: ["@boton-ancla/core", "@boton-ancla/react"],

  // Raíz del monorepo: ahí está el package-lock.json de los workspaces.
  turbopack: {
    root: path.join(__dirname, "../.."),
  },

  // El indicador de Next en desarrollo ocupa una esquina inferior, justo donde
  // va el ancla (L-12). Mismo criterio que RUTEANDO.
  devIndicators: false,

  // L-09: en desarrollo, Next 16 responde 403 a sus recursos internos
  // (/_next/*, incluido el WebSocket de recarga en vivo /_next/hmr) si el
  // origen no es localhost. Desde el celular el origen es la IP de la red
  // local, así que sin esto React no llega a hidratar. Se permiten solo los
  // rangos privados de red doméstica. No afecta a `next build` / `next start`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
