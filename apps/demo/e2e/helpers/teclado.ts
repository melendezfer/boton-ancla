import type { Page } from "@playwright/test";

// Teclado virtual simulado (HM-04, HM-05, HM-06). Playwright no puede mostrar el teclado
// de un celular: se reemplaza window.visualViewport por uno controlable ANTES de que cargue
// la app, y window.__teclado(px) simula un teclado de `px` de alto (0 = bajado).

export async function tecladoFalso(page: Page) {
  await page.addInitScript(() => {
    const falso = new EventTarget();
    let alto = 0;
    const valores = {
      height: () => window.innerHeight - alto,
      width: () => window.innerWidth,
      offsetTop: () => 0,
      offsetLeft: () => 0,
      pageTop: () => window.scrollY,
      pageLeft: () => window.scrollX,
      scale: () => 1,
    };
    for (const [clave, leer] of Object.entries(valores)) Object.defineProperty(falso, clave, { get: leer });
    Object.defineProperty(window, "visualViewport", { configurable: true, get: () => falso });
    window.addEventListener("resize", () => falso.dispatchEvent(new Event("resize")));
    (window as unknown as { __teclado: (px: number) => void }).__teclado = (px: number) => {
      alto = px;
      falso.dispatchEvent(new Event("resize"));
    };
  });
}

export function ponerTeclado(page: Page, px: number) {
  return page.evaluate((p) => (window as unknown as { __teclado: (px: number) => void }).__teclado(p), px);
}
