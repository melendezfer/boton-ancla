import { describe, expect, it } from "vitest";
import { assignActions, computeAnchorPosition, computeFanLayout, orderActions, type Slot } from "../src/layout";
import { DEFAULT_PARAMS, type Params } from "../src/params";
import type { AnchorScreen, Hand } from "../src/types";
import { ID_ATRAS, ID_DESHACER } from "../src/validate";
import { accion, carta, mapa, perfilDueno, perfilVisitante, productoDueno } from "./fixtures/pantallas-ruteando";

const P = DEFAULT_PARAMS;

/** Recorrido completo como lo hará el adaptador: ordenar → geometría → asignar. */
function asignar(screen: AnchorScreen, opciones: { hand?: Hand; params?: Params; deshacer?: boolean } = {}): Slot[] {
  const { hand = "right", params = P, deshacer = false } = opciones;
  const viewport = { x: 0, y: 0, width: 375, height: 667 };
  const safeArea = { top: 0, right: 0, bottom: 0, left: 0 };
  const ordered = orderActions(screen, { deshacer });
  const anchor = computeAnchorPosition({ viewport, safeArea, hand, params });
  const layout = computeFanLayout({ anchor, viewport, safeArea, count: ordered.length, hand, params });
  return assignActions(layout, ordered, params);
}

/** { id: ánguloBase } para leer los resultados como en design.md §4.4. */
function mapaDeAngulos(slots: Slot[]): Record<string, number> {
  return Object.fromEntries(slots.map((s) => [s.id, s.anguloBase]));
}

const sinNada = (screen: AnchorScreen): AnchorScreen => ({ ...screen, back: undefined, actions: [] });

describe("orderActions", () => {
  it("ordena por priority ascendente", () => {
    const pantalla = { ...mapa, actions: [...mapa.actions].reverse() };
    expect(orderActions(pantalla).map((a) => a.id)).toEqual(["buscar", "mi-ubicacion", "ofertas-cerca", "favoritos"]);
  });

  it("las acciones sin priority van al final, en orden de declaración", () => {
    const pantalla = {
      ...mapa,
      actions: [accion("sin-1", "S1"), accion("p2", "P2", { priority: 2 }), accion("sin-2", "S2"), accion("p1", "P1", { priority: 1 })],
    };
    expect(orderActions(pantalla).map((a) => a.id)).toEqual(["p1", "p2", "sin-1", "sin-2"]);
  });

  it("con prioridades repetidas respeta el orden de declaración", () => {
    const pantalla = { ...mapa, actions: [accion("b", "B", { priority: 1 }), accion("a", "A", { priority: 1 })] };
    expect(orderActions(pantalla).map((a) => a.id)).toEqual(["b", "a"]);
  });

  it('"Atrás" va primero cuando la pantalla trae back', () => {
    expect(orderActions(perfilVisitante).map((a) => a.id)).toEqual([ID_ATRAS, "carta", "como-llegar", "favorito", "compartir"]);
  });

  it("completa kind y disabled con sus valores por defecto", () => {
    const pantalla = { ...mapa, actions: [accion("x", "X"), accion("y", "Y", { kind: "irreversible", disabled: true })] };
    expect(orderActions(pantalla)).toEqual([
      { id: "x", kind: "normal", disabled: false },
      { id: "y", kind: "irreversible", disabled: true },
    ]);
  });

  it("no modifica la pantalla original", () => {
    const antes = mapa.actions.map((a) => a.id);
    orderActions({ ...mapa, actions: mapa.actions.slice().reverse() });
    expect(mapa.actions.map((a) => a.id)).toEqual(antes);
  });

  describe('con aviso de deshacer (C-21)', () => {
    it('"Deshacer" reemplaza a la prioridad 1 y el resto no cambia', () => {
      expect(orderActions(productoDueno, { deshacer: true }).map((a) => a.id)).toEqual([
        ID_ATRAS,
        ID_DESHACER,
        "marcar-no-disponible",
        "eliminar",
      ]);
    });

    it("no cambia el número de opciones (nunca pasa de 5)", () => {
      expect(orderActions(perfilVisitante, { deshacer: true })).toHaveLength(orderActions(perfilVisitante).length);
    });

    it('si la pantalla solo tiene "Atrás", "Deshacer" se agrega', () => {
      const soloAtras = { ...perfilDueno, actions: [] };
      expect(orderActions(soloAtras, { deshacer: true }).map((a) => a.id)).toEqual([ID_ATRAS, ID_DESHACER]);
    });

    it("sin acciones ni back, queda solo Deshacer", () => {
      expect(orderActions(sinNada(mapa), { deshacer: true }).map((a) => a.id)).toEqual([ID_DESHACER]);
    });
  });
});

describe("assignActions", () => {
  describe("ejemplos de design.md §4.4 (mano derecha, DESEMPATE horizontal)", () => {
    it("Mapa (4): Buscar 150°, Mi ubicación 120°, Ofertas cerca 180°, Favoritos 90°", () => {
      expect(mapaDeAngulos(asignar(mapa))).toEqual({
        buscar: 150,
        "mi-ubicacion": 120,
        "ofertas-cerca": 180,
        favoritos: 90,
      });
    });

    it("Perfil visitante (4 + Atrás): Atrás 90°, Carta 135°, Cómo llegar 157,5°, Favorito 112,5°, Compartir 180°", () => {
      expect(mapaDeAngulos(asignar(perfilVisitante))).toEqual({
        [ID_ATRAS]: 90,
        carta: 135,
        "como-llegar": 157.5,
        favorito: 112.5,
        compartir: 180,
      });
    });

    it("Producto dueño (3 + Atrás): Atrás 90°, Editar 150°, Marcar no disponible 120°, Eliminar 180°", () => {
      expect(mapaDeAngulos(asignar(productoDueno))).toEqual({
        [ID_ATRAS]: 90,
        editar: 150,
        "marcar-no-disponible": 120,
        eliminar: 180,
      });
    });

    it("Producto dueño con aviso: Deshacer toma el lugar de Editar y nada más se mueve (C-21)", () => {
      const normal = mapaDeAngulos(asignar(productoDueno));
      const conAviso = mapaDeAngulos(asignar(productoDueno, { deshacer: true }));
      expect(conAviso).toEqual({ [ID_ATRAS]: 90, [ID_DESHACER]: 150, "marcar-no-disponible": 120, eliminar: 180 });
      expect(conAviso[ID_DESHACER]).toBe(normal.editar);
      for (const id of [ID_ATRAS, "marcar-no-disponible", "eliminar"]) expect(conAviso[id]).toBe(normal[id]);
    });

    it("Carta (2 + Atrás): Atrás 90°, Compartir 135°, Favorito 180°", () => {
      expect(mapaDeAngulos(asignar(carta))).toEqual({ [ID_ATRAS]: 90, compartir: 135, favorito: 180 });
    });
  });

  it('con DESEMPATE "vertical", los empates van hacia arriba', () => {
    const vertical = { ...P, DESEMPATE: "vertical" as const };
    expect(mapaDeAngulos(asignar(mapa, { params: vertical }))).toEqual({
      buscar: 120,
      "mi-ubicacion": 150,
      "ofertas-cerca": 90,
      favoritos: 180,
    });
  });

  describe("reglas generales", () => {
    const acciones = ["p1", "p2", "p3", "p4", "p5"].map((id, i) => accion(id, id.toUpperCase(), { priority: i + 1 }));

    for (let n = 1; n <= 5; n++) {
      it(`con ${n} opciones: la prioridad 1 queda en la posición más cercana a 135°`, () => {
        const slots = asignar({ ...mapa, actions: acciones.slice(0, n) });
        const distanciaP1 = Math.abs(slots.find((s) => s.id === "p1")!.anguloBase - 135);
        for (const s of slots) expect(distanciaP1).toBeLessThanOrEqual(Math.abs(s.anguloBase - 135));
      });

      it(`con ${n} opciones: menor prioridad nunca queda más cerca de la diagonal que una mayor`, () => {
        const slots = asignar({ ...mapa, actions: acciones.slice(0, n) });
        const cercania = (id: string) => Math.abs(slots.find((s) => s.id === id)!.anguloBase - 135);
        for (let i = 1; i < n; i++) expect(cercania(`p${i}`)).toBeLessThanOrEqual(cercania(`p${i + 1}`));
      });
    }

    for (let propias = 1; propias <= 4; propias++) {
      it(`"Atrás" siempre en 90° (con ${propias} acciones propias)`, () => {
        const slots = asignar({ ...perfilVisitante, actions: acciones.slice(0, propias) });
        expect(slots.find((s) => s.id === ID_ATRAS)!.anguloBase).toBe(90);
      });
    }

    it("cada acción aparece una sola vez y todas las posiciones tienen dueña", () => {
      const slots = asignar(perfilVisitante);
      expect(new Set(slots.map((s) => s.id)).size).toBe(5);
      expect(slots.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);
    });

    it("conserva kind y disabled de cada acción", () => {
      const eliminar = asignar(productoDueno).find((s) => s.id === "eliminar")!;
      expect(eliminar.kind).toBe("irreversible");
      expect(eliminar.disabled).toBe(false);
    });

    it("sin acciones devuelve una lista vacía", () => {
      expect(asignar(sinNada(mapa))).toEqual([]);
    });
  });

  it("mano izquierda: cada acción conserva su ángulo base (HU-11) y en pantalla se refleja", () => {
    const derecha = asignar(perfilVisitante, { hand: "right" });
    const izquierda = asignar(perfilVisitante, { hand: "left" });
    expect(mapaDeAngulos(izquierda)).toEqual(mapaDeAngulos(derecha));
    for (const d of derecha) {
      const iz = izquierda.find((s) => s.id === d.id)!;
      expect(iz.angulo).toBeCloseTo((180 - d.angulo + 360) % 360, 9);
    }
  });

  it("lanza un error si no coinciden acciones y posiciones", () => {
    const viewport = { x: 0, y: 0, width: 375, height: 667 };
    const safeArea = { top: 0, right: 0, bottom: 0, left: 0 };
    const anchor = computeAnchorPosition({ viewport, safeArea, hand: "right", params: P });
    const layout = computeFanLayout({ anchor, viewport, safeArea, count: 3, hand: "right", params: P });
    expect(() => assignActions(layout, orderActions(mapa), P)).toThrow("hay 4 acciones para 3 posiciones");
  });
});
