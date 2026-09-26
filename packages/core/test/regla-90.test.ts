import { describe, expect, it } from "vitest";
import { layoutParaPantalla, pantallaDeCapa } from "../src/layout";
import { DEFAULT_PARAMS } from "../src/params";
import type { AnchorScreen } from "../src/types";
import { validateScreen } from "../src/validate";
import { accion, mapa, pantallasSpec8, perfilVisitante } from "./fixtures/pantallas-ruteando";

// HM-14, RF-22: la posición de 90° es de la familia "volver" (Atrás / Cerrar); sin "Atrás",
// una acción inofensiva marcada con atTop.

const P = DEFAULT_PARAMS;
const angulos = (screen: AnchorScreen, opciones: { capa?: boolean } = {}) =>
  Object.fromEntries(
    layoutParaPantalla({
      screen,
      viewport: { x: 0, y: 0, width: 375, height: 667 },
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      hand: "right",
      params: P,
      ...opciones,
    }).slots.map((s) => [s.id, Math.round(s.anguloBase * 10) / 10]),
  );

describe("regla de 90° (RF-22)", () => {
  it("en el mapa, Mi ubicación (atTop) va en 90° y Buscar (prioridad 1) toma la más cómoda que queda", () => {
    const a = angulos(mapa); // 4 opciones: 90°, 120°, 150°, 180° (la diagonal exacta no es una posición)
    expect(a["mi-ubicacion"]).toBe(90);
    expect(a.buscar).toBe(150);
    const conZoom = angulos({ ...mapa, actions: [...mapa.actions, accion("zoom", "Zoom", { priority: 5, onSlide: () => {} })] });
    expect(conZoom["mi-ubicacion"]).toBe(90);
    expect(conZoom.buscar).toBe(135); // con 5 opciones, la diagonal sí es una posición
  });

  it("con 'Atrás', 90° es de 'Atrás' aunque haya una acción atTop", () => {
    const conAtras: AnchorScreen = { ...perfilVisitante, actions: perfilVisitante.actions.map((x, i) => (i === 3 ? { ...x, atTop: true } : x)) };
    expect(angulos(conAtras).atras).toBe(90);
  });

  it("con una capa abierta, 90° es de 'Cerrar' aunque la capa marque atTop", () => {
    const capa = pantallaDeCapa(mapa, { label: "Hoja", actions: [accion("a", "A", { atTop: true }), accion("b", "B")] });
    const a = angulos(capa, { capa: true });
    expect(a.cerrar).toBe(90);
    expect(a.a).not.toBe(90);
  });

  it("en todas las pantallas de spec §8, en 90° hay 'Atrás' o una acción atTop", () => {
    for (const p of pantallasSpec8) {
      const a = angulos(p);
      const en90 = Object.entries(a).find(([, ang]) => ang === 90)?.[0];
      const permitidas = ["atras", ...p.actions.filter((x) => x.atTop).map((x) => x.id)];
      expect(permitidas, p.id).toContain(en90);
    }
  });

  describe("validación", () => {
    it("sin 'Atrás' y con 2+ acciones, exige una atTop", () => {
      const sin: AnchorScreen = { ...mapa, actions: mapa.actions.map((x) => ({ ...x, atTop: false })) };
      expect(validateScreen(sin, P).some((e) => e.includes("atTop"))).toBe(true);
    });

    it("una sola acción no la exige (va en la diagonal, C-22)", () => {
      expect(validateScreen({ ...mapa, actions: [accion("a", "A")] }, P)).toEqual([]);
    });

    it("a lo sumo una atTop", () => {
      const dos: AnchorScreen = { ...mapa, actions: mapa.actions.map((x) => ({ ...x, atTop: true })) };
      expect(validateScreen(dos, P).some((e) => e.includes("solo una"))).toBe(true);
    });

    it("la atTop debe ser inofensiva: ni reversible, ni irreversible, ni deslizador", () => {
      for (const extra of [{ kind: "irreversible" as const }, { kind: "reversible" as const, onUndo: () => {} }, { onSlide: () => {} }]) {
        const p: AnchorScreen = { ...mapa, actions: [accion("a", "A", { atTop: true, ...extra }), accion("b", "B")] };
        expect(validateScreen(p, P).some((e) => e.includes("inofensiva")), JSON.stringify(extra)).toBe(true);
      }
    });
  });
});
