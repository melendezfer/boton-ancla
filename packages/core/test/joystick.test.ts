import { describe, expect, it } from "vitest";
import { indicadorJoystick, velocidadDesplazamiento, velocidadJoystick } from "../src/desplazamiento";
import { puntoEnDireccion } from "../src/geometry";
import { crearGeometria, type AnchorEvent, type AnchorState } from "../src/machine/states";
import { transition } from "../src/machine/transition";
import { derivarMetricas, type MetricEvent } from "../src/metrics";
import { DEFAULT_PARAMS } from "../src/params";
import type { Hand } from "../src/types";
import { mapa } from "./fixtures/pantallas-ruteando";
import { ev, final, recorrer } from "./machine/ayudas";

// HM-11, RF-19: joystick libre en el mapa.

const P = DEFAULT_PARAMS;
const geoMapa = (hand: Hand = "right", teclado = false) =>
  crearGeometria({
    screen: mapa,
    viewport: { x: 0, y: 0, width: 375, height: 667 },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    hand,
    params: P,
    teclado,
    desplazable: true,
    modoDesplazar: "libre",
  });

describe("velocidad en 2D (misma curva que el vertical, con la distancia)", () => {
  it("en la zona muerta, quieto en cualquier dirección", () => {
    for (const [dx, dy] of [[0, 0], [5, 5], [-P.R_MUERTA_DESPLAZAR, 0]]) expect(velocidadJoystick(dx, dy, P)).toEqual({ vx: 0, vy: 0 });
  });

  it("apunta hacia el pulgar: derecha → vx > 0; arriba → vy < 0", () => {
    const der = velocidadJoystick(40, 0, P);
    expect(der.vx).toBeGreaterThan(0);
    expect(der.vy).toBe(0);
    const arr = velocidadJoystick(0, -40, P);
    expect(arr.vy).toBeLessThan(0);
    expect(arr.vx).toBeCloseTo(0, 9);
  });

  it("la rapidez depende de la distancia, no del eje: en diagonal es igual que en vertical", () => {
    const d = 50;
    const { vx, vy } = velocidadJoystick(d / Math.SQRT2, d / Math.SQRT2, P);
    expect(Math.hypot(vx, vy)).toBeCloseTo(velocidadDesplazamiento(d, P), 6);
    expect(vx).toBeCloseTo(vy, 9);
  });

  it("máxima desde R_MAX_DESPLAZAR; menor con movimiento reducido", () => {
    const { vx, vy } = velocidadJoystick(-300, 400, P);
    expect(Math.hypot(vx, vy)).toBeCloseTo(P.V_MAX_DESPLAZAR, 6);
    const r = velocidadJoystick(-300, 400, P, true);
    expect(Math.hypot(r.vx, r.vy)).toBeCloseTo(P.V_MAX_REDUCIDO, 6);
  });
});

describe("indicador: flecha hacia la dirección real y anillo de velocidad", () => {
  it("zona muerta: sin ángulo y anillo vacío", () => {
    expect(indicadorJoystick(3, -4, P)).toEqual({ angulo: null, llenado: 0 });
  });

  it.each([
    [40, 0, 0],
    [0, -40, 90],
    [-40, 0, 180],
    [0, 40, 270],
    [30, 30, 315],
  ])("dx=%s, dy=%s → %s°", (dx, dy, angulo) => {
    expect(indicadorJoystick(dx, dy, P).angulo).toBeCloseTo(angulo, 9);
  });

  it("el anillo llega a 1 en la máxima", () => {
    expect(indicadorJoystick(0, P.R_MAX_DESPLAZAR, P).llenado).toBeCloseTo(1, 9);
    expect(indicadorJoystick(20, 20, P).llenado).toBeGreaterThan(0);
    expect(indicadorJoystick(20, 20, P).llenado).toBeLessThan(1);
  });
});

describe("entrada al joystick del mapa (igual que HM-09)", () => {
  it("el primer movimiento hacia abajo entra; después el pulgar es libre (sigue en 'desplazando')", () => {
    const g = geoMapa();
    const abajo = puntoEnDireccion(g.centro, 20, 270);
    const s = final([ev.down(g, g.centro, 0), ev.move(abajo, 30), ev.move({ x: abajo.x - 60, y: abajo.y - 50 }, 80)]);
    expect(s).toMatchObject({ tipo: "desplazando", origen: abajo });
  });

  it("scroll_start lleva modo 'libre'", () => {
    const g = geoMapa();
    const eventos: AnchorEvent[] = [ev.down(g, g.centro, 0), ev.move(puntoEnDireccion(g.centro, 20, 270), 30)];
    let estado: AnchorState = { tipo: "reposo" };
    const m: MetricEvent[] = [];
    for (const e of eventos) {
      const next = transition(estado, e);
      m.push(...derivarMetricas(estado, next, e));
      estado = next;
    }
    expect(m).toContainEqual({ type: "scroll_start", modo: "libre" });
  });
});

describe("modo experto (D-08, C-05): un deslizamiento rápido NO activa el joystick", () => {
  const casos: [Hand, boolean][] = [
    ["right", false],
    ["left", false],
    ["right", true],
    ["left", true],
  ];

  for (const [mano, teclado] of casos) {
    const g = geoMapa(mano, teclado);
    const nombre = `mano ${mano === "right" ? "derecha" : "izquierda"}${teclado ? ", con teclado" : ""}`;

    it.each(g.slots.map((s) => [s.id, s.angulo] as const))(`${nombre}: rápido hacia '%s' ejecuta como experto`, (id, angulo) => {
      const estados = recorrer([
        ev.down(g, g.centro, 0),
        ev.move(puntoEnDireccion(g.centro, 30, angulo), 8),
        ev.up(puntoEnDireccion(g.centro, 110, angulo), 40),
      ]);
      expect(estados.some((e) => e.tipo === "desplazando")).toBe(false);
      expect(estados.at(-1)).toMatchObject({ tipo: "ejecutando", id, experto: true });
    });

    it.each(g.slots.map((s) => [s.id, s.angulo] as const))(`${nombre}: relámpago C-05 (sin movimientos) hacia '%s' no pasa por el joystick`, (id, angulo) => {
      const estados = recorrer([ev.down(g, g.centro, 0), ev.up(puntoEnDireccion(g.centro, 110, angulo), 12)]);
      expect(estados.some((e) => e.tipo === "desplazando")).toBe(false);
      expect(estados.at(-1)).toMatchObject({ tipo: "ejecutando", id });
    });

    it(`${nombre}: aunque el primer tramo se desvíe ±25° de la opción, no entra al joystick`, () => {
      for (const s of g.slots) {
        for (const desvio of [-25, 25]) {
          const estados = recorrer([ev.down(g, g.centro, 0), ev.move(puntoEnDireccion(g.centro, 30, s.angulo + desvio), 8)]);
          expect(estados.some((e) => e.tipo === "desplazando")).toBe(false);
        }
      }
    });
  }

  it("un relámpago hacia abajo (sin movimientos) tampoco entra: se cancela fuera del arco", () => {
    const g = geoMapa();
    const estados = recorrer([ev.down(g, g.centro, 0), ev.up(puntoEnDireccion(g.centro, 100, 270), 12)]);
    expect(estados.some((e) => e.tipo === "desplazando")).toBe(false);
    expect(estados.at(-1)).toEqual({ tipo: "cancelado", motivo: "fuera_de_arco" });
  });
});
