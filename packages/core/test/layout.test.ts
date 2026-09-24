import { describe, expect, it } from "vitest";
import { distancia } from "../src/geometry";
import { computeAnchorPosition, computeFanLayout, radioAdaptativo, type FanLayout } from "../src/layout";
import { DEFAULT_PARAMS, type Params } from "../src/params";
import type { Hand, Insets, Rect } from "../src/types";

const P = DEFAULT_PARAMS;
const SIN_AREA: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const IPHONE_AREA: Insets = { top: 47, right: 0, bottom: 34, left: 0 };

function viewport(width: number, height: number): Rect {
  return { x: 0, y: 0, width, height };
}

function abanico(opciones: { w?: number; h?: number; count: number; hand?: Hand; area?: Insets; params?: Params }): FanLayout {
  const { w = 375, h = 667, count, hand = "right", area = SIN_AREA, params = P } = opciones;
  const vp = viewport(w, h);
  const anchor = computeAnchorPosition({ viewport: vp, safeArea: area, hand, params });
  return computeFanLayout({ anchor, viewport: vp, safeArea: area, count, hand, params });
}

describe("computeAnchorPosition (design.md §4.2, L-02)", () => {
  it("mano derecha: 24 + 32 px del borde lateral y 16 + 32 px del inferior", () => {
    expect(computeAnchorPosition({ viewport: viewport(375, 667), safeArea: SIN_AREA, hand: "right", params: P })).toEqual({
      x: 375 - 56,
      y: 667 - 48,
    });
  });

  it("mano izquierda: mismo margen desde el borde izquierdo", () => {
    expect(computeAnchorPosition({ viewport: viewport(375, 667), safeArea: SIN_AREA, hand: "left", params: P })).toEqual({
      x: 56,
      y: 667 - 48,
    });
  });

  it("suma el área segura del lado que corresponde", () => {
    const area = { top: 47, right: 10, bottom: 34, left: 20 };
    const vp = viewport(375, 812);
    expect(computeAnchorPosition({ viewport: vp, safeArea: area, hand: "right", params: P })).toEqual({ x: 375 - 10 - 56, y: 812 - 34 - 48 });
    expect(computeAnchorPosition({ viewport: vp, safeArea: area, hand: "left", params: P })).toEqual({ x: 20 + 56, y: 812 - 34 - 48 });
  });

  it("respeta el origen del viewport", () => {
    const vp = { x: 10, y: 20, width: 375, height: 667 };
    expect(computeAnchorPosition({ viewport: vp, safeArea: SIN_AREA, hand: "right", params: P })).toEqual({ x: 10 + 375 - 56, y: 20 + 667 - 48 });
  });
});

describe("radioAdaptativo (C-01)", () => {
  it.each([0, 1, 2, 3, 4])("con %i opciones usa el mínimo R_ARCO = 100", (n) => {
    expect(radioAdaptativo(n, P)).toBe(100);
  });

  it("con 5 opciones sube a ~113 px para que no se encimen", () => {
    expect(radioAdaptativo(5, P)).toBeCloseTo(112.77, 1);
  });

  it("crece al subir SEPARACION_MIN", () => {
    const conEspacio = { ...P, SEPARACION_MIN: 6 };
    expect(radioAdaptativo(5, conEspacio)).toBeGreaterThan(radioAdaptativo(5, P));
    expect(radioAdaptativo(5, conEspacio)).toBeCloseTo(50 / (2 * Math.sin((22.5 * Math.PI) / 360)), 9); // ~128 px
    // Con 4 opciones (30° entre vecinas) 50 px piden ~96,6 px: todavía manda R_ARCO…
    expect(radioAdaptativo(4, conEspacio)).toBe(100);
    // …pero con 8 px piden 52 / (2·sin 15°) ≈ 100,46 px y el radio ya crece.
    expect(radioAdaptativo(4, { ...P, SEPARACION_MIN: 8 })).toBeCloseTo(100.46, 2);
  });

  it("un R_ARCO mayor que el necesario manda", () => {
    expect(radioAdaptativo(5, { ...P, R_ARCO: 130 })).toBe(130);
  });
});

describe("computeFanLayout", () => {
  it("sin opciones no hay posiciones", () => {
    const f = abanico({ count: 0 });
    expect(f.slots).toEqual([]);
    expect(f.fueraDePantalla).toBe(false);
  });

  it.each([
    [1, [135]],
    [2, [90, 180]],
    [3, [90, 135, 180]],
    [4, [90, 120, 150, 180]],
    [5, [90, 112.5, 135, 157.5, 180]],
  ])("con %i opciones, ángulos en los extremos y a intervalos iguales", (count, esperados) => {
    expect(abanico({ count }).slots.map((s) => s.anguloBase)).toEqual(esperados);
    expect(abanico({ count }).slots.map((s) => s.index)).toEqual(esperados.map((_, i) => i));
  });

  it("con 1 opción y unicaArriba va a 90°, con su sector completo (C-22)", () => {
    const vp = viewport(375, 667);
    const anchor = computeAnchorPosition({ viewport: vp, safeArea: SIN_AREA, hand: "right", params: P });
    const f = computeFanLayout({ anchor, viewport: vp, safeArea: SIN_AREA, count: 1, hand: "right", params: P, unicaArriba: true });
    expect(f.slots.map((s) => s.anguloBase)).toEqual([90]);
    expect(f.slots[0]!.sector).toEqual({ desde: 70, hasta: 200 });
    expect(f.fueraDePantalla).toBe(false);
    // Con más de una opción no tiene efecto:
    const tres = computeFanLayout({ anchor, viewport: vp, safeArea: SIN_AREA, count: 3, hand: "right", params: P, unicaArriba: true });
    expect(tres.slots.map((s) => s.anguloBase)).toEqual([90, 135, 180]);
  });

  it("R_EXTERIOR = radio + 48 (161 px con 5)", () => {
    expect(abanico({ count: 3 }).rExterior).toBe(148);
    expect(abanico({ count: 5 }).rExterior).toBeCloseTo(160.77, 1);
  });

  it("cada opción queda a la distancia del radio y en su ángulo", () => {
    const f = abanico({ count: 3 });
    const anchor = { x: 319, y: 619 };
    expect(f.slots[0]!.punto.x).toBeCloseTo(319, 9); // 90°: justo encima
    expect(f.slots[0]!.punto.y).toBeCloseTo(519, 9);
    expect(f.slots[1]!.punto.x).toBeCloseTo(319 - 100 * Math.SQRT1_2, 9); // 135°: diagonal
    expect(f.slots[1]!.punto.y).toBeCloseTo(619 - 100 * Math.SQRT1_2, 9);
    expect(f.slots[2]!.punto.x).toBeCloseTo(219, 9); // 180°: a la izquierda
    expect(f.slots[2]!.punto.y).toBeCloseTo(619, 9);
    for (const s of f.slots) expect(distancia(anchor, s.punto)).toBeCloseTo(100, 9);
  });

  describe("sectores (RF-03, RF-05)", () => {
    for (const count of [1, 2, 3, 4, 5]) {
      it(`con ${count}: contiguos de 70° a 200°, y cada ángulo dentro de su sector`, () => {
        const { slots } = abanico({ count });
        expect(slots[0]!.sector.desde).toBe(70);
        expect(slots.at(-1)!.sector.hasta).toBe(200);
        slots.forEach((s, i) => {
          expect(s.anguloBase).toBeGreaterThanOrEqual(s.sector.desde);
          expect(s.anguloBase).toBeLessThanOrEqual(s.sector.hasta);
          const siguiente = slots[i + 1];
          if (siguiente) expect(siguiente.sector.desde).toBe(s.sector.hasta);
        });
      });
    }

    it("con 3 opciones los bordes son las bisectrices 112,5° y 157,5°", () => {
      expect(abanico({ count: 3 }).slots.map((s) => s.sector)).toEqual([
        { desde: 70, hasta: 112.5 },
        { desde: 112.5, hasta: 157.5 },
        { desde: 157.5, hasta: 200 },
      ]);
    });
  });

  describe("sin solape (C-01)", () => {
    for (const count of [2, 3, 4, 5]) {
      it(`con ${count} opciones, vecinas a ≥ D_OPCION + SEPARACION_MIN`, () => {
        for (const params of [P, { ...P, SEPARACION_MIN: 6 }]) {
          const { slots } = abanico({ count, params });
          for (let i = 1; i < slots.length; i++) {
            expect(distancia(slots[i - 1]!.punto, slots[i]!.punto)).toBeGreaterThanOrEqual(
              params.D_OPCION + params.SEPARACION_MIN - 1e-9,
            );
          }
        }
      });
    }
  });

  describe("mano izquierda (HU-11)", () => {
    for (const count of [1, 3, 5]) {
      it(`con ${count}: espejo exacto de la derecha respecto a su ancla`, () => {
        const derecha = abanico({ count, hand: "right" });
        const izquierda = abanico({ count, hand: "left" });
        const anclaD = { x: 375 - 56, y: 667 - 48 };
        const anclaI = { x: 56, y: 667 - 48 };
        expect(izquierda.radio).toBe(derecha.radio);
        derecha.slots.forEach((d, i) => {
          const iz = izquierda.slots[i]!;
          expect(iz.anguloBase).toBe(d.anguloBase); // mismo orden relativo al pulgar
          expect(iz.sector).toEqual(d.sector);
          expect(iz.angulo).toBeCloseTo((180 - d.angulo + 360) % 360, 9);
          expect(iz.punto.x - anclaI.x).toBeCloseTo(-(d.punto.x - anclaD.x), 9);
          expect(iz.punto.y).toBeCloseTo(d.punto.y, 9);
        });
      });
    }

    it("la opción de 180° (izquierda) pasa a 0° (derecha); la de 90° sigue arriba", () => {
      const angulos = abanico({ count: 3, hand: "left" }).slots.map((s) => s.angulo);
      expect(angulos[0]).toBeCloseTo(90, 9);
      expect(angulos[1]).toBeCloseTo(45, 9);
      expect(angulos[2]).toBeCloseTo(0, 9);
    });
  });

  describe("todas las opciones caben en pantalla (RF-12, spec §10.1)", () => {
    const pantallas: [number, number][] = [
      [320, 568],
      [375, 667],
      [412, 915],
      [430, 932],
    ];
    for (const [w, h] of pantallas) {
      for (const hand of ["right", "left"] as const) {
        for (const [nombreArea, area] of [["sin área segura", SIN_AREA], ["área segura de iPhone", IPHONE_AREA]] as const) {
          it(`${w}×${h}, mano ${hand === "right" ? "derecha" : "izquierda"}, ${nombreArea}, 1–5 opciones`, () => {
            for (let count = 1; count <= 5; count++) {
              const f = abanico({ w, h, count, hand, area });
              expect(f.fueraDePantalla).toBe(false);
              // Comprobación independiente del cálculo interno:
              const mitad = (P.D_OPCION * P.ESCALA_PRESEL) / 2;
              for (const s of f.slots) {
                expect(s.punto.x - mitad).toBeGreaterThanOrEqual(area.left + P.MARGEN_LATERAL);
                expect(s.punto.x + mitad).toBeLessThanOrEqual(w - area.right - P.MARGEN_LATERAL + 1e-9);
                expect(s.punto.y - mitad).toBeGreaterThanOrEqual(area.top);
                expect(s.punto.y + mitad).toBeLessThanOrEqual(h - area.bottom - P.MARGEN_INFERIOR + 1e-9);
              }
            }
          });
        }
      }
    }

    it("en un viewport diminuto lo marca en vez de mover opciones en silencio", () => {
      expect(abanico({ w: 120, h: 120, count: 5 }).fueraDePantalla).toBe(true);
    });
  });
});
