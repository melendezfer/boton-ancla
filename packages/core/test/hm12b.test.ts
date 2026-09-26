import { describe, expect, it } from "vitest";
import { pasosApuntar } from "../src/apuntar";
import { crearGeometria, type AnchorEvent, type Apuntado } from "../src/machine/states";
import { DEFAULT_PARAMS } from "../src/params";
import type { Hand } from "../src/types";
import { carta } from "./fixtures/pantallas-ruteando";
import { ev, final, recorrer } from "./machine/ayudas";

// HM-12b (RF-23): apuntar y elegir en listas (filas 51–53 de design.md §3.3).

const P = DEFAULT_PARAMS;
const geo = (opciones: { hand?: Hand; apuntarLista?: boolean; libre?: boolean } = {}) =>
  crearGeometria({
    screen: carta,
    viewport: { x: 0, y: 0, width: 375, height: 667 },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    hand: opciones.hand ?? "right",
    params: P,
    desplazable: true,
    modoDesplazar: opciones.libre ? "libre" : "vertical",
    apuntarLista: opciones.apuntarLista ?? true,
  });

/** Entra al joystick y deja el pulgar `dx` px hacia el centro de la pantalla (según la mano). */
function hacia(g: ReturnType<typeof geo>, haciaCentro: number, dy = 0): AnchorEvent[] {
  const signo = g.hand === "right" ? -1 : 1;
  const origen = { x: g.centro.x, y: g.centro.y + 20 };
  return [ev.down(g, g.centro, 0), ev.move(origen, 30), ev.move({ x: origen.x + signo * haciaCentro, y: origen.y + dy }, 80)];
}
const plato: Apuntado = { tipo: "uno", id: "arepa-queso" };
const apuntar = (a: Apuntado | null): AnchorEvent => ({ tipo: "APUNTAR", apuntado: a });

describe("desplazar ↔ apuntar (filas 51–52)", () => {
  it.each<Hand>(["right", "left"])("mano %s: hacia el centro más de UMBRAL_APUNTAR pasa a 'apuntar' (con su origen)", (hand) => {
    const g = geo({ hand });
    const s = final(hacia(g, P.UMBRAL_APUNTAR + 1));
    expect(s).toMatchObject({ tipo: "desplazando", submodo: "apuntar" });
    expect(s.tipo === "desplazando" && s.origenApuntar).toEqual(s.tipo === "desplazando" ? s.ultimo : null);
  });

  it("justo en el umbral, o hacia el borde de la pantalla, sigue desplazando", () => {
    const g = geo();
    expect(final(hacia(g, P.UMBRAL_APUNTAR))).not.toMatchObject({ submodo: "apuntar" });
    expect(final(hacia(g, -80))).not.toMatchObject({ submodo: "apuntar" });
  });

  it("histéresis: vuelve a 'desplazar' solo bajo UMBRAL − HISTERESIS, y suelta el foco", () => {
    const g = geo();
    const entrar = hacia(g, P.UMBRAL_APUNTAR + 10);
    const x0 = g.centro.x;
    const y0 = g.centro.y + 20;
    const conFoco = [...entrar, apuntar(plato)];
    // Entre los dos umbrales: sigue apuntando.
    const medio = final([...conFoco, ev.move({ x: x0 - (P.UMBRAL_APUNTAR - P.HISTERESIS_APUNTAR + 1), y: y0 }, 120)]);
    expect(medio).toMatchObject({ submodo: "apuntar", apuntado: plato });
    // Por debajo: desplaza otra vez y ya no hay nada en foco.
    const fuera = final([...conFoco, ev.move({ x: x0 - (P.UMBRAL_APUNTAR - P.HISTERESIS_APUNTAR - 1), y: y0 }, 120)]);
    expect(fuera).toMatchObject({ submodo: "desplazar", apuntado: null });
  });

  it("sin elementos para apuntar (o en el mapa) el pulgar de costado no cambia nada", () => {
    expect(final(hacia(geo({ apuntarLista: false }), 80))).not.toMatchObject({ submodo: "apuntar" });
    expect(final(hacia(geo({ libre: true }), 80))).not.toMatchObject({ submodo: "apuntar" });
  });
});

describe("elegir en una lista (fila 53)", () => {
  it("soltar en 'apuntar' con un elemento en foco lo elige (aunque el pulgar no esté en la zona muerta)", () => {
    const g = geo();
    const eventos = [...hacia(g, 60, 3 * P.PASO_APUNTAR), apuntar(plato), ev.up({ x: g.centro.x - 60, y: g.centro.y + 20 + 3 * P.PASO_APUNTAR }, 700)];
    expect(final(eventos)).toEqual({ tipo: "elegido", apuntado: plato, ms: 700 });
  });

  it("soltar en 'desplazar' solo detiene", () => {
    const g = geo();
    const estados = recorrer([...hacia(g, 10), ev.up({ x: g.centro.x - 10, y: g.centro.y + 20 }, 300)]);
    expect(estados.at(-1)).toEqual({ tipo: "reposo" });
  });

  it("soltar en 'apuntar' sin nada en foco solo detiene", () => {
    const g = geo();
    expect(final([...hacia(g, 60), ev.up({ x: g.centro.x - 60, y: g.centro.y + 20 }, 300)])).toEqual({ tipo: "reposo" });
  });
});

describe("pasos al apuntar", () => {
  it("cada PASO_APUNTAR px es un elemento; hacia abajo el siguiente, hacia arriba el anterior", () => {
    expect(pasosApuntar(0, P)).toBe(0);
    expect(pasosApuntar(P.PASO_APUNTAR - 1, P)).toBe(0);
    expect(pasosApuntar(P.PASO_APUNTAR, P)).toBe(1);
    expect(pasosApuntar(3 * P.PASO_APUNTAR + 5, P)).toBe(3);
    expect(pasosApuntar(-P.PASO_APUNTAR, P)).toBe(-1);
    expect(Object.is(pasosApuntar(-5, P), 0)).toBe(true); // sin -0
  });
});
