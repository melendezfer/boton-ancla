import { describe, expect, it } from "vitest";
import { PISTA_BIENVENIDA, posicionBanda, textoBanda } from "../src/banda";
import { computeAnchorPosition, computeFanLayout, layoutParaPantalla } from "../src/layout";
import type { AnchorState } from "../src/machine/states";
import { transition } from "../src/machine/transition";
import { DEFAULT_PARAMS } from "../src/params";
import { ID_ATRAS } from "../src/validate";
import { mapa, productoDueno } from "./fixtures/pantallas-ruteando";
import { ev, final, geometria, hacia } from "./machine/ayudas";

// HM-02: banda de etiqueta (spec RF-06b, design.md §4.6).

const P = DEFAULT_PARAMS;
const SIN_AREA = { top: 0, right: 0, bottom: 0, left: 0 };

describe("posicionBanda", () => {
  const viewport = { x: 0, y: 0, width: 375, height: 667 };

  for (const hand of ["right", "left"] as const) {
    it(`mano ${hand === "right" ? "derecha" : "izquierda"}: encima de la opción de arriba y centrada sobre el arco`, () => {
      const anchor = computeAnchorPosition({ viewport, safeArea: SIN_AREA, hand, params: P });
      const layout = computeFanLayout({ anchor, viewport, safeArea: SIN_AREA, count: 5, hand, params: P });
      const b = posicionBanda({ anchor, layout, viewport, safeArea: SIN_AREA, hand, params: P });
      const arriba = layout.slots[0]!.punto; // la opción de 90°
      expect(b.yBase).toBeCloseTo(arriba.y - (P.D_OPCION * P.ESCALA_PRESEL) / 2 - P.BANDA_MARGEN, 9);
      expect(b.x).toBeCloseTo(anchor.x + (hand === "right" ? -1 : 1) * (layout.radio / 2), 9);
      expect(b.izquierda).toBe(24);
      expect(b.derecha).toBe(375 - 24);
    });
  }

  it("la banda entera cabe por arriba en todas las pantallas de prueba, con 0,38 y con el máximo del control (0,6)", () => {
    for (const [w, h] of [[320, 568], [375, 667], [412, 915], [430, 932]] as const) {
      for (const altura of [0.38, 0.44, 0.6, 1]) {
        const params = { ...P, ANCLA_ALTURA: altura };
        const vp = { x: 0, y: 0, width: w, height: h };
        const anchor = computeAnchorPosition({ viewport: vp, safeArea: SIN_AREA, hand: "right", params });
        const layout = computeFanLayout({ anchor, viewport: vp, safeArea: SIN_AREA, count: 5, hand: "right", params });
        const b = posicionBanda({ anchor, layout, viewport: vp, safeArea: SIN_AREA, hand: "right", params });
        expect(b.yBase - P.BANDA_ALTO).toBeGreaterThanOrEqual(-1e-9);
      }
    }
  });
});

describe("textoBanda", () => {
  const geo = geometria(); // Producto dueño: Atrás 90 · Marcar 120 · Editar 150 · Eliminar 180
  const c = geo.centro;
  const texto = (estado: AnchorState, bienvenida = false) => textoBanda({ estado, screen: productoDueno, bienvenida });

  it("cerrado (reposo, armado, descanso, transitorios) → sin banda", () => {
    expect(texto({ tipo: "reposo" })).toBeNull();
    expect(texto(final([ev.down(geo, c, 0)]))).toBeNull();
    expect(texto(final([ev.down(geo, c, 0), ev.tick(400)]))).toBeNull();
    expect(texto({ tipo: "cancelado", motivo: "zona_muerta" })).toBeNull();
  });

  it("gesto con preselección → nombre de la opción (RF-06b)", () => {
    const s = final([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 80), 30)]);
    expect(texto(s)).toEqual({ texto: "Editar", tipo: "opcion" });
  });

  it('"Atrás" también tiene nombre', () => {
    const s = final([ev.down(geo, c, 0), ev.move(hacia(geo, 90, 80), 30)]);
    expect(texto(s)).toEqual({ texto: "Atrás", tipo: "opcion" });
    expect(s.tipo === "abierto_gesto" && s.presel).toBe(ID_ATRAS);
  });

  it("zona muerta → nombre de la sección (D-09)", () => {
    const s = final([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 15), 30)]);
    expect(s.tipo).toBe("abierto_gesto");
    expect(texto(s)).toEqual({ texto: "Detalle de producto", tipo: "seccion" });
  });

  it("zona muerta durante la bienvenida → 'Desliza hacia una opción' (HU-12)", () => {
    const s = final([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 15), 30)]);
    expect(texto(s, true)).toEqual({ texto: PISTA_BIENVENIDA, tipo: "pista" });
  });

  it("con preselección, la bienvenida muestra igual el nombre de la opción", () => {
    const s = final([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 80), 30)]);
    expect(texto(s, true)).toEqual({ texto: "Editar", tipo: "opcion" });
  });

  it("irreversible: pista para confirmar, y otra al armar la confirmación (HU-08)", () => {
    const pre = final([ev.down(geo, c, 0), ev.move(hacia(geo, 180, 100), 30)]);
    expect(texto(pre)?.texto).toBe("Eliminar · desliza más allá para confirmar");
    const armada = transition(pre, ev.move(hacia(geo, 180, 170), 60));
    expect(armada.tipo).toBe("confirmacion_armada");
    expect(texto(armada)?.texto).toBe("Eliminar · suelta para confirmar");
  });

  it("opción deshabilitada → '… · no disponible' (C-09)", () => {
    const g = geometria({ ...productoDueno, actions: productoDueno.actions.map((a) => (a.id === "editar" ? { ...a, disabled: true } : a)) });
    const s = final([ev.down(g, g.centro, 0), ev.move(hacia(g, 150, 80), 30)]);
    expect(textoBanda({ estado: s, screen: productoDueno, bienvenida: false })?.texto).toBe("Editar · no disponible");
  });

  it("modo toque: sin dedo → sección; con el dedo sobre una opción → su nombre antes de soltar (HM-02)", () => {
    const abierto = final([ev.down(geo, c, 0), ev.up(c, 100)]);
    expect(texto(abierto)).toEqual({ texto: "Detalle de producto", tipo: "seccion" });
    const apoyado = transition(abierto, ev.down(geo, hacia(geo, 150, 100), 500, { id: "editar" }, 2));
    expect(texto(apoyado)).toEqual({ texto: "Editar", tipo: "opcion" });
    const enCentro = transition(abierto, ev.down(geo, c, 500, "ancla", 2));
    expect(texto(enCentro)?.tipo).toBe("seccion");
  });

  it("confirmación en modo toque → nombre de la opción a confirmar", () => {
    const e = hacia(geo, 180, 100);
    const s = final([ev.down(geo, c, 0), ev.up(c, 100), ev.down(geo, e, 500, { id: "eliminar" }, 2), ev.up(e, 550, 2)]);
    expect(s.tipo).toBe("confirmacion_toque");
    expect(texto(s)?.texto).toBe("Eliminar");
  });

  it("teclado → la opción con foco", () => {
    const s = final([{ tipo: "TECLA", tecla: "Enter", t: 0, geo }]);
    expect(texto(s)).toEqual({ texto: "Editar", tipo: "opcion" });
  });

  it("en el mapa, 'Buscar' preseleccionada se lee entera (el caso de HM-02)", () => {
    const g = geometria(mapa);
    const { slots } = layoutParaPantalla({ screen: mapa, viewport: { x: 0, y: 0, width: 375, height: 667 }, safeArea: SIN_AREA, hand: "right", params: P });
    expect(slots.find((s) => s.id === "buscar")!.anguloBase).toBe(150);
    const s = final([ev.down(g, g.centro, 0), ev.move(hacia(g, 150, 90), 30)]);
    expect(textoBanda({ estado: s, screen: mapa, bienvenida: false })).toEqual({ texto: "Buscar", tipo: "opcion" });
  });
});
