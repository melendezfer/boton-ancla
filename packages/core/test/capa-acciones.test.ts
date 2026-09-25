import { describe, expect, it } from "vitest";
import { etiquetaOpcion } from "../src/banda";
import { layoutParaPantalla, pantallaDeCapa, type Slot } from "../src/layout";
import { crearGeometria } from "../src/machine/states";
import { DEFAULT_PARAMS } from "../src/params";
import type { AnchorScreen } from "../src/types";
import { ID_ATRAS, ID_CERRAR, ID_DESHACER, ID_OCULTAR_TECLADO, validateScreen } from "../src/validate";
import { accion, mapa, perfilVisitante, productoDueno } from "./fixtures/pantallas-ruteando";

// HM-08 (acciones de capa) y HM-06/RF-17 (Ocultar teclado a 180°).

const P = DEFAULT_PARAMS;
const base = { viewport: { x: 0, y: 0, width: 375, height: 667 }, safeArea: { top: 0, right: 0, bottom: 0, left: 0 }, hand: "right" as const, params: P };
const angulos = (slots: Slot[]) => Object.fromEntries(slots.map((s) => [s.id, s.anguloBase]));
const lay = (screen: AnchorScreen, o: { capa?: boolean; deshacer?: boolean; teclado?: boolean } = {}) => layoutParaPantalla({ ...base, screen, ...o }).slots;

const favoritos = { icon: "ListHeart", label: "Favoritos", actions: [accion("ordenar", "Ordenar", { priority: 1 }), accion("ver-en-mapa", "Ver en el mapa", { priority: 2 })] };

describe("pantallaDeCapa (HM-08)", () => {
  it("'Cerrar' a 90° + las acciones de la capa; las del fondo no están", () => {
    const s = angulos(lay(pantallaDeCapa(mapa, favoritos), { capa: true }));
    expect(s).toEqual({ [ID_CERRAR]: 90, ordenar: 135, "ver-en-mapa": 180 });
    for (const id of ["buscar", "mi-ubicacion", "ofertas-cerca", "favoritos"]) expect(s[id]).toBeUndefined();
  });

  it("ícono y nombre de la capa (D-09, 2-A); sin ellos, los del fondo", () => {
    const p = pantallaDeCapa(mapa, favoritos);
    expect(p.sectionIcon).toBe("ListHeart");
    expect(p.sectionLabel).toBe("Favoritos");
    const sinDatos = pantallaDeCapa(mapa, {});
    expect(sinDatos.sectionIcon).toBe(mapa.sectionIcon);
    expect(sinDatos.sectionLabel).toBe("Mapa");
  });

  it("sin acciones declaradas: solo 'Cerrar', arriba", () => {
    expect(angulos(lay(pantallaDeCapa(mapa, {}), { capa: true }))).toEqual({ [ID_CERRAR]: 90 });
  });

  it("al cerrar la capa, el fondo vuelve con sus mismas posiciones", () => {
    const antes = angulos(lay(mapa));
    lay(pantallaDeCapa(mapa, favoritos), { capa: true });
    expect(angulos(lay(mapa))).toEqual(antes);
  });

  it("1-A: 'Deshacer' reemplaza a la prioridad 1 de la capa, sin mover nada más", () => {
    const capa = pantallaDeCapa(productoDueno, favoritos);
    const normal = angulos(lay(capa, { capa: true }));
    const conDeshacer = angulos(lay(capa, { capa: true, deshacer: true }));
    expect(conDeshacer[ID_DESHACER]).toBe(normal.ordenar);
    expect(conDeshacer.ordenar).toBeUndefined();
    expect(conDeshacer["ver-en-mapa"]).toBe(normal["ver-en-mapa"]);
    expect(conDeshacer[ID_CERRAR]).toBe(90);
  });

  it("valida el tope: 'Cerrar' + 4 acciones de capa está bien; 5 no", () => {
    const cuatro = pantallaDeCapa(mapa, { actions: ["a", "b", "c", "d"].map((id) => accion(id, id)) });
    expect(validateScreen(cuatro, P)).toEqual([]);
    const cinco = pantallaDeCapa(mapa, { actions: ["a", "b", "c", "d", "e"].map((id) => accion(id, id)) });
    expect(validateScreen(cinco, P)[0]).toContain('6 opciones contando "Atrás"');
  });
});

describe("'Ocultar teclado' fijo a 180° (RF-17, HM-06 3-A)", () => {
  it("Buscar con teclado: Cerrar (90°) · Borrar texto · Ocultar teclado (180°)", () => {
    const buscar = pantallaDeCapa(mapa, { label: "Buscar", actions: [accion("borrar-texto", "Borrar texto", { priority: 1 })] });
    expect(angulos(lay(buscar, { capa: true, teclado: true }))).toEqual({ [ID_CERRAR]: 90, "borrar-texto": 135, [ID_OCULTAR_TECLADO]: 180 });
  });

  it("sin teclado, no aparece", () => {
    const buscar = pantallaDeCapa(mapa, { label: "Buscar", actions: [accion("borrar-texto", "Borrar texto")] });
    expect(angulos(lay(buscar, { capa: true }))[ID_OCULTAR_TECLADO]).toBeUndefined();
  });

  it("en una capa sin acciones: Cerrar arriba y Ocultar teclado al costado", () => {
    expect(angulos(lay(pantallaDeCapa(mapa, {}), { capa: true, teclado: true }))).toEqual({ [ID_CERRAR]: 90, [ID_OCULTAR_TECLADO]: 180 });
  });

  it("sin capa (campo en la pantalla): se agrega a 180° al abanico de la pantalla", () => {
    const s = angulos(lay(productoDueno, { teclado: true })); // 4 → 5 opciones
    expect(s[ID_OCULTAR_TECLADO]).toBe(180);
    expect(s[ID_ATRAS]).toBe(90);
    expect(Object.keys(s)).toHaveLength(5);
  });

  it("con 5 opciones ya, sale la de menor prioridad y el total sigue en 5", () => {
    const s = angulos(lay(perfilVisitante, { teclado: true })); // Atrás + 4
    expect(Object.keys(s)).toHaveLength(5);
    expect(s[ID_OCULTAR_TECLADO]).toBe(180);
    expect(s.compartir).toBeUndefined(); // prioridad 4, la menor
    expect(s[ID_ATRAS]).toBe(90);
  });

  it("única opción: va al extremo lateral, no a la diagonal", () => {
    const vacia = { ...mapa, actions: [] };
    expect(angulos(lay(vacia, { teclado: true }))).toEqual({ [ID_OCULTAR_TECLADO]: 180 });
  });

  it("con la mano izquierda queda al extremo lateral reflejado (0°)", () => {
    const slots = layoutParaPantalla({ ...base, hand: "left", screen: mapa, teclado: true }).slots;
    expect(slots.find((s) => s.id === ID_OCULTAR_TECLADO)!.angulo).toBeCloseTo(0, 9);
  });

  it("la prioridad 1 (foco inicial con teclado físico) nunca es 'Ocultar teclado' ni 'Cerrar'", () => {
    const buscar = pantallaDeCapa(mapa, { label: "Buscar", actions: [accion("borrar-texto", "Borrar texto")] });
    expect(crearGeometria({ ...base, screen: buscar, capa: true, teclado: true }).prioridad1).toBe("borrar-texto");
  });

  it("etiqueta 'Ocultar teclado' e id reservado", () => {
    expect(etiquetaOpcion(mapa, ID_OCULTAR_TECLADO)).toBe("Ocultar teclado");
    expect(validateScreen({ ...mapa, actions: [accion(ID_OCULTAR_TECLADO, "x")] }, P)[0]).toContain("reservado");
  });
});
