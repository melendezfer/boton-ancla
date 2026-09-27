import { describe, expect, it } from "vitest";
import { frenoApuntado, resolverApuntado } from "../src/apuntar";
import { DEFAULT_PARAMS as P } from "../src/params";

// RF-24 (HM-16): imán fuerte. Radio mayor y freno que crece al acercarse al pin.
const mira = { x: 200, y: 400 };

describe("resolverApuntado con el imán fuerte (RF-24)", () => {
  it("el radio fuerte es mayor que el normal", () => {
    expect(P.IMAN_FUERTE_RADIO).toBeGreaterThan(P.IMAN_RADIO);
  });

  it("captura un pin fuera del radio normal pero dentro del fuerte", () => {
    const pin = [{ id: "a", x: 200 + (P.IMAN_RADIO + P.IMAN_FUERTE_RADIO) / 2, y: 400 }];
    expect(resolverApuntado(mira, pin, P).apuntado).toBeNull();
    const r = resolverApuntado(mira, pin, P, { fuerte: true });
    expect(r.apuntado).toEqual({ tipo: "uno", id: "a" });
    expect(r.radio).toBe(P.IMAN_FUERTE_RADIO);
  });

  it("fuera del radio fuerte no captura", () => {
    const r = resolverApuntado(mira, [{ id: "a", x: 200 + P.IMAN_FUERTE_RADIO + 1, y: 400 }], P, { fuerte: true });
    expect(r).toEqual({ apuntado: null, destino: null, radio: null });
  });

  it("con vecinos se sigue achicando (mitad de la distancia, nunca bajo el mínimo)", () => {
    const pins = [
      { id: "a", x: 200, y: 400 },
      { id: "b", x: 260, y: 400 }, // vecino a 60: radio 30
    ];
    expect(resolverApuntado({ x: 200, y: 400 - 29 }, pins, P, { fuerte: true }).radio).toBe(30);
    expect(resolverApuntado({ x: 200, y: 400 - 31 }, pins, P, { fuerte: true }).apuntado).toBeNull();
  });

  it("los grupos usan el radio fuerte en su centro", () => {
    const pins = [
      { id: "a", x: 230, y: 400 },
      { id: "b", x: 240, y: 400 },
    ];
    const r = resolverApuntado(mira, pins, P, { fuerte: true });
    expect(r.apuntado).toEqual({ tipo: "grupo", ids: ["a", "b"] });
    expect(r.radio).toBe(P.IMAN_FUERTE_RADIO);
  });

  it("el imán normal devuelve también su radio", () => {
    expect(resolverApuntado(mira, [{ id: "a", x: 210, y: 400 }], P).radio).toBe(P.IMAN_RADIO);
  });
});

describe("frenoApuntado (RF-21, RF-24)", () => {
  it("imán normal: siempre FRENO_APUNTAR", () => {
    expect(frenoApuntado({ distancia: 0, radio: 28, params: P })).toBe(P.FRENO_APUNTAR);
    expect(frenoApuntado({ distancia: 27, radio: 28, params: P })).toBe(P.FRENO_APUNTAR);
  });

  it("imán fuerte: FRENO_APUNTAR en el borde, FRENO_FUERTE_MIN sobre el pin y en línea recta entre ambos", () => {
    const R = P.IMAN_FUERTE_RADIO;
    expect(frenoApuntado({ distancia: R, radio: R, params: P, fuerte: true })).toBeCloseTo(P.FRENO_APUNTAR);
    expect(frenoApuntado({ distancia: 0, radio: R, params: P, fuerte: true })).toBeCloseTo(P.FRENO_FUERTE_MIN);
    expect(frenoApuntado({ distancia: R / 2, radio: R, params: P, fuerte: true })).toBeCloseTo((P.FRENO_APUNTAR + P.FRENO_FUERTE_MIN) / 2);
  });

  it("imán fuerte: más cerca, más freno (factor menor)", () => {
    const R = P.IMAN_FUERTE_RADIO;
    const lejos = frenoApuntado({ distancia: 30, radio: R, params: P, fuerte: true });
    const cerca = frenoApuntado({ distancia: 5, radio: R, params: P, fuerte: true });
    expect(cerca).toBeLessThan(lejos);
    expect(lejos).toBeLessThan(P.FRENO_APUNTAR);
  });

  it("fuera de rango se limita, y un radio 0 no divide por cero", () => {
    expect(frenoApuntado({ distancia: 100, radio: 44, params: P, fuerte: true })).toBeCloseTo(P.FRENO_APUNTAR);
    expect(frenoApuntado({ distancia: 0, radio: 0, params: P, fuerte: true })).toBe(P.FRENO_APUNTAR);
  });
});
