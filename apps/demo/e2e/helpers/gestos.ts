import type { CDPSession, Page } from "@playwright/test";

// Gestos táctiles para las E2E (design.md §7, L-07).
//
// Playwright solo trae `tap()` para pantallas táctiles: no sabe arrastrar un dedo.
// - Chromium: toques REALES con el protocolo de DevTools (Input.dispatchTouchEvent).
//   El navegador genera touch/pointer events, respeta touch-action y dispara click.
// - WebKit: no tiene ese protocolo. Se envían PointerEvent sintéticos (pointerType
//   "touch"). Como en un navegador real, move y up van al elemento donde empezó el
//   toque (captura implícita de los toques). Limitaciones: no hay click automático,
//   touch-action no se aplica y setPointerCapture puede fallar (el código lo tolera).
//
// Los gestos NO usan tap(): si una prueba debe hacerse "solo deslizando" (HU-09),
// estas funciones garantizan que no hubo ningún toque corto.

export type Punto = { x: number; y: number };

export type Gestos = {
  /** "cdp" (Chromium, toques reales) o "sintetico" (WebKit). */
  modo: "cdp" | "sintetico";
  presionar(p: Punto, dedo?: number): Promise<void>;
  mover(p: Punto, dedo?: number): Promise<void>;
  soltar(p: Punto, dedo?: number): Promise<void>;
  /** Presiona en `desde`, se mueve en `pasos` tramos iguales durante `ms` y suelta en `hasta`. */
  deslizar(desde: Punto, hasta: Punto, opciones?: { pasos?: number; ms?: number }): Promise<void>;
};

export async function crearGestos(page: Page): Promise<Gestos> {
  const esChromium = page.context().browser()?.browserType().name() === "chromium";
  const base = esChromium ? await gestosCdp(page) : gestosSinteticos(page);

  return {
    ...base,
    async deslizar(desde, hasta, { pasos = 10, ms = 150 } = {}) {
      await base.presionar(desde);
      for (let i = 1; i <= pasos; i++) {
        const t = i / pasos;
        await base.mover({ x: desde.x + (hasta.x - desde.x) * t, y: desde.y + (hasta.y - desde.y) * t });
        if (ms > 0) await page.waitForTimeout(ms / pasos);
      }
      await base.soltar(hasta);
    },
  };
}

async function gestosCdp(page: Page): Promise<Omit<Gestos, "deslizar">> {
  const cdp: CDPSession = await page.context().newCDPSession(page);
  const activos = new Map<number, Punto>();
  const puntos = () => [...activos].map(([id, p]) => ({ x: p.x, y: p.y, id }));

  return {
    modo: "cdp",
    async presionar(p, dedo = 1) {
      activos.set(dedo, p);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: puntos() });
    },
    async mover(p, dedo = 1) {
      activos.set(dedo, p);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: puntos() });
    },
    async soltar(_p, dedo = 1) {
      activos.delete(dedo);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: puntos() });
    },
  };
}

function gestosSinteticos(page: Page): Omit<Gestos, "deslizar"> {
  const enviar = (tipo: "pointerdown" | "pointermove" | "pointerup", p: Punto, dedo: number) =>
    page.evaluate(
      ({ tipo, p, dedo }) => {
        const w = window as unknown as { __objetivosGesto?: Map<number, Element> };
        w.__objetivosGesto ??= new Map();
        // Captura implícita: el toque sigue yendo al elemento donde empezó.
        const objetivo = tipo === "pointerdown" ? document.elementFromPoint(p.x, p.y) : w.__objetivosGesto.get(dedo);
        if (!objetivo) return;
        if (tipo === "pointerdown") w.__objetivosGesto.set(dedo, objetivo);
        if (tipo === "pointerup") w.__objetivosGesto.delete(dedo);
        objetivo.dispatchEvent(
          new PointerEvent(tipo, {
            pointerId: 100 + dedo,
            pointerType: "touch",
            isPrimary: dedo === 1,
            clientX: p.x,
            clientY: p.y,
            buttons: tipo === "pointerup" ? 0 : 1,
            bubbles: true,
            cancelable: true,
            composed: true,
          }),
        );
      },
      { tipo, p, dedo },
    );

  return {
    modo: "sintetico",
    presionar: (p, dedo = 1) => enviar("pointerdown", p, dedo),
    mover: (p, dedo = 1) => enviar("pointermove", p, dedo),
    soltar: (p, dedo = 1) => enviar("pointerup", p, dedo),
  };
}
