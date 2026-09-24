import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El núcleo publica su código TypeScript sin compilar (packages/core/src);
  // Next lo compila junto con la demo.
  transpilePackages: ["@boton-ancla/core"],

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
