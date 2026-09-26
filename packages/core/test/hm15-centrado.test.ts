import { describe, expect, it } from "vitest";
import { pasoCentrado } from "../src/apuntar";
import { DEFAULT_PARAMS } from "../src/params";

// HM-15: el centrado (imán de la mira y foco de las listas) se mide en tiempo.

const P = DEFAULT_PARAMS;

/** Simula el centrado cuadro a cuadro y devuelve lo que falta en cada instante. */
function simular(inicial: number, params = P, cuadroMs = 16, reducido = false) {
  let restante = inicial;
  const trazo: { t: number; restante: number }[] = [];
  for (let t = 0; t <= 1000; t += cuadroMs) {
    restante -= pasoCentrado({ restante, inicial, transcurrido: t, params, reducido });
    trazo.push({ t, restante });
  }
  return trazo;
}

describe("centrado por tiempo (HM-15)", () => {
  it("valores de inicio: sin espera y 100 ms de duración", () => {
    expect(P.T_ESPERA_CENTRADO).toBe(0);
    expect(P.T_CENTRADO).toBe(100);
  });

  it("termina justo en T_ESPERA_CENTRADO + T_CENTRADO, sin pasarse", () => {
    const params = { ...P, T_ESPERA_CENTRADO: 50, T_CENTRADO: 200 };
    const trazo = simular(40, params, 10);
    expect(trazo.find((x) => x.t === 250)!.restante).toBeCloseTo(0, 9);
    for (const x of trazo) expect(x.restante).toBeGreaterThanOrEqual(-1e-9);
  });

  it("no se mueve durante la espera", () => {
    const params = { ...P, T_ESPERA_CENTRADO: 120 };
    for (const x of simular(30, params, 10).filter((x) => x.t < 120)) expect(x.restante).toBe(30);
  });

  it("salida suave: avanza rápido al principio y frena al final", () => {
    const trazo = simular(100, { ...P, T_CENTRADO: 100 }, 10);
    const a = (t: number) => trazo.find((x) => x.t === t)!.restante;
    expect(100 - a(20)).toBeGreaterThan(a(80) - a(100)); // el primer tramo recorre más que el último
    expect(a(50)).toBeLessThan(50); // a mitad de tiempo ya pasó la mitad
  });

  it("no depende de los cuadros por segundo: a 60 y a 30 cuadros/s termina en el mismo tiempo", () => {
    const rapido = simular(60, P, 1000 / 60);
    const lento = simular(60, P, 1000 / 30);
    const fin = (trazo: { t: number; restante: number }[]) => trazo.find((x) => Math.abs(x.restante) < 1e-9)!.t;
    expect(Math.abs(fin(rapido) - fin(lento))).toBeLessThanOrEqual(1000 / 30);
    expect(fin(lento)).toBeLessThanOrEqual(P.T_ESPERA_CENTRADO + P.T_CENTRADO + 1000 / 30);
  });

  it("si algo de afuera ya lo acercó más que la curva, espera (nunca lo empuja hacia atrás) y nunca se pasa", () => {
    // Faltaban 50; a los 40 ms algo lo dejó en 5, menos de lo que marca la curva (≈ 10,8).
    expect(pasoCentrado({ restante: 5, inicial: 50, transcurrido: 40, params: P })).toBe(0);
    // Al final de la curva, mueve exactamente lo que falta.
    expect(pasoCentrado({ restante: 5, inicial: 50, transcurrido: 500, params: P })).toBe(5);
    expect(pasoCentrado({ restante: -5, inicial: -50, transcurrido: 40, params: P })).toBe(0);
  });

  it("movimiento reducido (o duración 0): instantáneo, después de la espera", () => {
    expect(pasoCentrado({ restante: 37, inicial: 37, transcurrido: 0, params: P, reducido: true })).toBe(37);
    expect(pasoCentrado({ restante: 37, inicial: 37, transcurrido: 0, params: { ...P, T_CENTRADO: 0 } })).toBe(37);
    expect(pasoCentrado({ restante: 37, inicial: 37, transcurrido: 10, params: { ...P, T_ESPERA_CENTRADO: 50 }, reducido: true })).toBe(0);
  });

  it("funciona en ambos sentidos (valores negativos)", () => {
    const trazo = simular(-25);
    expect(trazo.at(-1)!.restante).toBeCloseTo(0, 9);
  });
});
