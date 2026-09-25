import { describe, expect, it } from "vitest";
import { etiquetaOpcion } from "../src/banda";
import { layoutParaPantalla, type Slot } from "../src/layout";
import { crearGeometria } from "../src/machine/states";
import { DEFAULT_PARAMS } from "../src/params";
import type { AnchorScreen } from "../src/types";
import { ID_ATRAS, ID_CERRAR, ID_DESHACER, validateScreen } from "../src/validate";
import { accion, mapa, perfilVisitante, productoDueno } from "./fixtures/pantallas-ruteando";

// HM-03: capas. "Cerrar" reemplaza lo que esté a 90° sin mover nada más (spec RF-15, D-10).

const P = DEFAULT_PARAMS;
const base = { viewport: { x: 0, y: 0, width: 375, height: 667 }, safeArea: { top: 0, right: 0, bottom: 0, left: 0 }, hand: "right" as const, params: P };
const angulos = (slots: Slot[]) => Object.fromEntries(slots.map((s) => [s.id, s.anguloBase]));
const con = (screen: AnchorScreen, opciones: { capa?: boolean; deshacer?: boolean } = {}) => layoutParaPantalla({ ...base, screen, ...opciones }).slots;

describe("capa abierta (HM-03)", () => {
  it("con 'Atrás': 'Cerrar' toma su lugar a 90° y nada más se mueve", () => {
    const normal = angulos(con(perfilVisitante));
    const conCapa = angulos(con(perfilVisitante, { capa: true }));
    expect(conCapa[ID_CERRAR]).toBe(90);
    expect(conCapa[ID_ATRAS]).toBeUndefined();
    for (const id of ["carta", "como-llegar", "favorito", "compartir"]) expect(conCapa[id]).toBe(normal[id]);
  });

  it("sin 'Atrás' (Mapa): 'Cerrar' reemplaza a la opción de 90° (Favoritos) y nada más se mueve (sub-pregunta A-1)", () => {
    const normal = angulos(con(mapa));
    expect(normal.favoritos).toBe(90);
    const conCapa = angulos(con(mapa, { capa: true }));
    expect(conCapa).toEqual({ [ID_CERRAR]: 90, "mi-ubicacion": 120, buscar: 150, "ofertas-cerca": 180 });
  });

  it("nunca cambia el número de opciones (tope de 5)", () => {
    expect(con(perfilVisitante, { capa: true })).toHaveLength(5);
    const cinco = { ...mapa, actions: [...mapa.actions, accion("quinta", "Quinta", { priority: 5 })] };
    expect(con(cinco, { capa: true })).toHaveLength(5);
  });

  it("convive con 'Deshacer' (C-21): cada uno en su lugar", () => {
    const s = angulos(con(productoDueno, { capa: true, deshacer: true }));
    expect(s).toEqual({ [ID_CERRAR]: 90, "marcar-no-disponible": 120, [ID_DESHACER]: 150, eliminar: 180 });
  });

  it("sin opciones: 'Cerrar' sola, arriba", () => {
    const vacia = { ...mapa, actions: [] };
    expect(angulos(con(vacia, { capa: true }))).toEqual({ [ID_CERRAR]: 90 });
  });

  it("solo 'Atrás' (Ajustes): 'Cerrar' lo reemplaza arriba", () => {
    expect(angulos(con({ ...perfilVisitante, actions: [] }, { capa: true }))).toEqual({ [ID_CERRAR]: 90 });
  });

  it("una única acción sin 'Atrás': 'Cerrar' se agrega arriba y la acción pasa al extremo", () => {
    expect(angulos(con({ ...mapa, actions: [accion("unica", "Única")] }, { capa: true }))).toEqual({ [ID_CERRAR]: 90, unica: 180 });
  });

  it("con la mano izquierda también queda arriba", () => {
    const slots = layoutParaPantalla({ ...base, hand: "left", screen: mapa, capa: true }).slots;
    expect(slots.find((s) => s.id === ID_CERRAR)!.angulo).toBeCloseTo(90, 9);
  });

  it("la prioridad 1 (foco inicial con teclado) nunca es 'Cerrar'", () => {
    expect(crearGeometria({ ...base, screen: mapa, capa: true }).prioridad1).toBe("buscar");
    expect(crearGeometria({ ...base, screen: { ...mapa, actions: [accion("unica", "Única")] }, capa: true }).prioridad1).toBe("unica");
  });

  it("la etiqueta es 'Cerrar' y el id está reservado", () => {
    expect(etiquetaOpcion(mapa, ID_CERRAR)).toBe("Cerrar");
    expect(validateScreen({ ...mapa, actions: [accion(ID_CERRAR, "X")] }, P)).toContain(`El id "${ID_CERRAR}" está reservado por el ancla; usa otro.`);
  });
});
