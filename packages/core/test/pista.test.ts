import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS, posicionBanda, posicionPista } from "../src";

// PJ-01 (v0.8.0): la pista de bienvenida va junto al ancla, en el hueco del arco.
describe("posicionPista", () => {
  const viewport = { x: 0, y: 0, width: 412, height: 915 };
  const safeArea = { top: 0, right: 0, bottom: 0, left: 0 };
  const anchor = { x: 350, y: 590 };
  const params = DEFAULT_PARAMS;

  it("con el abanico hacia arriba, justo debajo del ancla (donde no hay opciones)", () => {
    const p = posicionPista({ anchor, viewport, safeArea, params });
    expect(p.x).toBe(anchor.x);
    expect(p.yBase - params.BANDA_PISTA_ALTO).toBe(anchor.y + params.D_ACTIVO / 2 + params.BANDA_MARGEN);
  });

  it("con el abanico hacia abajo, justo encima", () => {
    const p = posicionPista({ anchor, viewport, safeArea, params, abreHacia: "abajo" });
    expect(p.yBase).toBe(anchor.y - params.D_ACTIVO / 2 - params.BANDA_MARGEN);
  });

  it("si debajo no cabe (ancla pegada abajo), va encima, pegada al ancla", () => {
    const abajo = { x: 350, y: viewport.height - 40 };
    const p = posicionPista({ anchor: abajo, viewport, safeArea, params });
    expect(p.yBase).toBe(abajo.y - params.D_ACTIVO / 2 - params.BANDA_MARGEN);
  });

  it("queda mucho más cerca del ancla que la banda de las opciones (PJ-04)", () => {
    const pista = posicionPista({ anchor, viewport, safeArea, params });
    const banda = posicionBanda({ anchor, layout: { radio: 153 }, viewport, safeArea, hand: "right", params });
    expect(Math.abs(pista.yBase - anchor.y)).toBeLessThan((anchor.y - banda.yBase) / 2);
  });

  it("pequeña y con su tiempo para irse (PJ-02, PJ-03)", () => {
    expect(params.BANDA_PISTA_ALTO).toBeLessThan(params.BANDA_ALTO);
    expect(params.T_PISTA).toBeGreaterThanOrEqual(1000);
    expect(params.T_PISTA).toBeLessThanOrEqual(2000);
  });
});
