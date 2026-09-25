import { describe, expect, it } from "vitest";
import { indicadorDesplazamiento, posicionGuiaArriba } from "../src/desplazamiento";
import { DEFAULT_PARAMS } from "../src/params";

// HM-10: las dos variantes de la guía de desplazamiento (spec RF-18).

const P = DEFAULT_PARAMS;

describe("variante 'ancla': flecha y anillo", () => {
  it("en la zona muerta: sin dirección y el anillo vacío", () => {
    for (const dy of [0, 5, -P.R_MUERTA_DESPLAZAR]) expect(indicadorDesplazamiento(dy, P)).toEqual({ direccion: 0, llenado: 0 });
  });

  it("pulgar abajo = flecha ↓ (1); pulgar arriba = flecha ↑ (-1)", () => {
    expect(indicadorDesplazamiento(40, P).direccion).toBe(1);
    expect(indicadorDesplazamiento(-40, P).direccion).toBe(-1);
  });

  it("el anillo se llena con la velocidad: crece con la distancia y llega a 1 en la máxima", () => {
    const llenados = [15, 30, 50, 70].map((dy) => indicadorDesplazamiento(dy, P).llenado);
    for (let i = 1; i < llenados.length; i++) expect(llenados[i]).toBeGreaterThan(llenados[i - 1]);
    expect(indicadorDesplazamiento(P.R_MAX_DESPLAZAR, P).llenado).toBeCloseTo(1, 10);
    expect(indicadorDesplazamiento(-500, P).llenado).toBeCloseTo(1, 10);
  });
});

describe("variante 'arriba': la cápsula no queda bajo el pulgar", () => {
  const centro = { x: 340, y: 500 };
  const origen = { x: 340, y: 520 };
  const alto = 2 * P.R_MAX_DESPLAZAR + 36;

  it("con la mano derecha se corre a la izquierda (hacia el centro); con la izquierda, a la derecha", () => {
    expect(posicionGuiaArriba({ centro, origen, hand: "right", params: P, alto, techo: 0 }).x).toBe(340 - P.GUIA_CORRIMIENTO);
    expect(posicionGuiaArriba({ centro: { x: 40, y: 500 }, origen, hand: "left", params: P, alto, techo: 0 }).x).toBe(40 + P.GUIA_CORRIMIENTO);
  });

  it("no sale de la columna del ancla (MARGEN_LATERAL + D_ACTIVO desde el borde): no le quita ancho a la lista", () => {
    const ANCHO_CAPSULA = 28; // anchor.css
    const ancho = 412;
    const eje = ancho - P.MARGEN_LATERAL - P.D_ACTIVO / 2;
    const g = posicionGuiaArriba({ centro: { x: eje, y: 500 }, origen, hand: "right", params: P, alto, techo: 0 });
    expect(g.x - ANCHO_CAPSULA / 2).toBeGreaterThanOrEqual(ancho - P.MARGEN_LATERAL - P.D_ACTIVO);
  });

  it("su borde de abajo queda GUIA_SEPARACION sobre lo más alto que llega el pulgar", () => {
    const g = posicionGuiaArriba({ centro, origen, hand: "right", params: P, alto, techo: 0 });
    const alcance = Math.min(centro.y - P.D_ACTIVO / 2, origen.y - P.R_MAX_DESPLAZAR);
    expect(g.top + g.alto).toBe(alcance - P.GUIA_SEPARACION);
    expect(g.alto).toBe(alto);
  });

  it("si no cabe entera, se achica contra el techo en vez de bajar hacia el dedo", () => {
    const bajo = { x: 340, y: 200 };
    const g = posicionGuiaArriba({ centro: bajo, origen: { x: 340, y: 220 }, hand: "right", params: P, alto, techo: 24 });
    expect(g.top).toBe(24);
    expect(g.top + g.alto).toBe(Math.min(200 - P.D_ACTIVO / 2, 220 - P.R_MAX_DESPLAZAR) - P.GUIA_SEPARACION);
    expect(g.alto).toBeLessThan(alto);
  });
});
