import { describe, expect, it } from "vitest";
import { posicionBanda } from "../src/banda";
import { puntoEnDireccion } from "../src/geometry";
import { anguloBaseDe, anguloEnPantalla, layoutParaPantalla } from "../src/layout";
import { crearGeometria } from "../src/machine/states";
import { DEFAULT_PARAMS } from "../src/params";
import { resolveSelection } from "../src/selection";
import type { Hand } from "../src/types";
import { mapa, productoDueno } from "./fixtures/pantallas-ruteando";
import { ev, final } from "./machine/ayudas";

// T3-04 (Fase 3, RF3-15, P-05): el abanico hacia abajo cuando no cabe hacia arriba.

const P = DEFAULT_PARAMS;
const base = (hand: Hand, abreHacia: "arriba" | "abajo") => ({
  screen: mapa,
  viewport: { x: 0, y: 0, width: 915, height: 412 },
  safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  hand,
  params: P,
  ancla: { x: hand === "right" ? 859 : 56, y: 80 },
  abreHacia,
});

describe("ángulos: espejo vertical", () => {
  it.each<Hand>(["right", "left"])("mano %s: pantalla ↔ base es ida y vuelta, y 'abajo' refleja arriba ↔ abajo", (hand) => {
    for (const b of [90, 112.5, 135, 157.5, 180]) {
      expect(anguloBaseDe(anguloEnPantalla(b, hand, "abajo"), hand, "abajo")).toBeCloseTo(b, 9);
      expect(anguloEnPantalla(b, hand, "abajo")).toBeCloseTo((360 - anguloEnPantalla(b, hand, "arriba")) % 360, 9);
    }
    expect(anguloEnPantalla(90, hand, "abajo")).toBe(270); // la de "arriba" queda justo debajo del ancla
  });
});

describe("abanico hacia abajo", () => {
  it.each<Hand>(["right", "left"])("mano %s: todas las opciones debajo del ancla, con el mismo orden de prioridades", (hand) => {
    const arriba = layoutParaPantalla(base(hand, "arriba"));
    const abajo = layoutParaPantalla(base(hand, "abajo"));
    for (const s of abajo.slots) expect(s.punto.y).toBeGreaterThanOrEqual(80 - 1e-9);
    // Misma opción en el mismo ángulo base (solo cambia la dirección vertical).
    expect(abajo.slots.map((s) => [s.id, s.anguloBase])).toEqual(arriba.slots.map((s) => [s.id, s.anguloBase]));
    for (const s of abajo.slots) {
      const par = arriba.slots.find((x) => x.id === s.id)!;
      expect(s.punto.x).toBeCloseTo(par.punto.x, 6);
      expect(s.punto.y - 80).toBeCloseTo(80 - par.punto.y, 6);
    }
  });

  it("la selección y el anillo exterior funcionan con el dedo debajo del ancla", () => {
    const g = crearGeometria(base("right", "abajo"));
    for (const s of g.slots) {
      const sel = resolveSelection({ center: g.centro, pointer: s.punto, slots: g.slots, hand: "right", params: P, abreHacia: "abajo" });
      expect(sel.id).toBe(s.id);
    }
    const producto = crearGeometria({ ...base("right", "abajo"), screen: productoDueno });
    const eliminar = producto.slots.find((s) => s.id === "eliminar")!;
    const lejos = puntoEnDireccion(producto.centro, 250, eliminar.angulo);
    expect(resolveSelection({ center: producto.centro, pointer: lejos, slots: producto.slots, hand: "right", params: P, abreHacia: "abajo" }).beyondOuter).toBe(true);
  });

  it("un gesto completo hacia una opción de abajo la ejecuta (máquina)", () => {
    const g = crearGeometria(base("right", "abajo"));
    const buscar = g.slots.find((s) => s.id === "buscar")!;
    const s = final([ev.down(g, g.centro, 0), ev.move(puntoEnDireccion(g.centro, 40, buscar.angulo), 40), ev.up(buscar.punto, 300)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "buscar" });
  });

  it("la banda va debajo del abanico", () => {
    const l = layoutParaPantalla(base("right", "abajo"));
    const b = posicionBanda({ anchor: { x: 859, y: 80 }, layout: l.layout, viewport: base("right", "abajo").viewport, safeArea: base("right", "abajo").safeArea, hand: "right", params: P, abreHacia: "abajo" });
    const fondoAbanico = Math.max(...l.slots.map((s) => s.punto.y)) + (P.D_OPCION * P.ESCALA_PRESEL) / 2;
    expect(b.yBase - P.BANDA_ALTO).toBeGreaterThanOrEqual(fondoAbanico);
  });
});

describe("joystick espejado (nunca comparte dirección con el abanico)", () => {
  const geo = (abreHacia: "arriba" | "abajo") => crearGeometria({ ...base("right", abreHacia), screen: productoDueno, desplazable: true });

  it("con el abanico abajo, el joystick entra hacia ARRIBA y ya no hacia abajo", () => {
    const g = geo("abajo");
    const arriba = final([ev.down(g, g.centro, 0), ev.move(puntoEnDireccion(g.centro, 20, 90), 30)]);
    expect(arriba.tipo).toBe("desplazando");
    const abajo = final([ev.down(g, g.centro, 0), ev.move(puntoEnDireccion(g.centro, 20, 270), 30)]);
    expect(abajo.tipo).toBe("abierto_gesto");
  });

  it("con el abanico arriba, como siempre: hacia abajo", () => {
    const g = geo("arriba");
    expect(final([ev.down(g, g.centro, 0), ev.move(puntoEnDireccion(g.centro, 20, 270), 30)]).tipo).toBe("desplazando");
    expect(final([ev.down(g, g.centro, 0), ev.move(puntoEnDireccion(g.centro, 20, 90), 30)]).tipo).toBe("abierto_gesto");
  });
});
