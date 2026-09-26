import { DEFAULT_PARAMS, ID_ATRAS, layoutParaPantalla, validateScreen, type AnchorScreen } from "@boton-ancla/core";
import { describe, expect, it } from "vitest";
import { ANCHOR_ICONS, MOBILITY_ICONS, SEMANTIC_ICONS } from "./icons/semantic-icons";
import {
  pantallaCarta,
  pantallaMapa,
  pantallaPerfilDueno,
  pantallaPerfilVisitante,
  pantallaProducto,
  pantallaSoloAtras,
} from "./pantallas";

const nada = () => {};
const PANTALLAS: AnchorScreen[] = [
  pantallaMapa({ buscar: nada, miUbicacion: nada, ofertasCerca: nada, favoritos: nada, zoomPaso: nada, zoomDeslizar: nada }),
  pantallaPerfilVisitante({ carta: nada, comoLlegar: nada, favorito: nada, compartir: nada, atras: nada }, false),
  pantallaPerfilDueno({ agregarPlato: nada, editar: nada, atras: nada }),
  pantallaCarta({ compartir: nada, favorito: nada, atras: nada }, true),
  pantallaProducto({ editar: nada, marcarNoDisponible: nada, deshacerNoDisponible: nada, eliminar: nada, atras: nada }, true),
  pantallaSoloAtras("ajustes", "Ajustes", ANCHOR_ICONS.sectionSettings, nada),
];

const iconosRegistrados = new Set<unknown>([
  ...Object.values(SEMANTIC_ICONS),
  ...Object.values(MOBILITY_ICONS),
  ...Object.values(ANCHOR_ICONS),
]);

describe("pantallas de la demo (spec §8)", () => {
  for (const p of PANTALLAS) {
    describe(p.id, () => {
      it("pasa validateScreen", () => {
        expect(validateScreen(p, DEFAULT_PARAMS)).toEqual([]);
      });

      it("usa solo íconos del registro (RNF-09)", () => {
        expect(iconosRegistrados.has(p.sectionIcon)).toBe(true);
        for (const a of p.actions) expect(iconosRegistrados.has(a.icon), a.id).toBe(true);
      });

      it("el abanico cabe en un celular de 320 × 568", () => {
        const { layout } = layoutParaPantalla({
          screen: p,
          viewport: { x: 0, y: 0, width: 320, height: 568 },
          safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
          hand: "right",
          params: DEFAULT_PARAMS,
        });
        expect(layout.fueraDePantalla).toBe(false);
      });
    });
  }

  it("las acciones y tipos coinciden con la tabla de §8", () => {
    const resumen = Object.fromEntries(
      PANTALLAS.slice(0, 5).map((p) => [
        p.id,
        [...(p.back ? ["Atrás"] : []), ...p.actions.map((a) => `${a.label} (${a.priority}${a.kind && a.kind !== "normal" ? `, ${a.kind}` : ""}${a.onSlide ? ", deslizador" : ""})`)],
      ]),
    );
    expect(resumen).toEqual({
      mapa: ["Buscar (1)", "Mi ubicación (2)", "Ofertas cerca (3)", "Favoritos (4)", "Zoom (5, deslizador)"],
      "perfil-negocio": ["Atrás", "Carta (1)", "Cómo llegar (2)", "Favorito (3)", "Compartir (4)"],
      "perfil-negocio-dueno": ["Atrás", "Agregar plato (1)", "Editar (2)"],
      carta: ["Atrás", "Compartir (1)", "Quitar de favoritos (2)"],
      producto: ["Atrás", "Editar (1)", "Marcar no disponible (2, reversible)", "Eliminar (3, irreversible)"],
    });
  });

  it('una pantalla con solo "Atrás" lo pone arriba (C-22)', () => {
    const { slots } = layoutParaPantalla({
      screen: PANTALLAS[5]!,
      viewport: { x: 0, y: 0, width: 375, height: 667 },
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      hand: "right",
      params: DEFAULT_PARAMS,
    });
    expect(slots).toMatchObject([{ id: ID_ATRAS, anguloBase: 90 }]);
  });

  it("producto no disponible: la opción de marcar queda deshabilitada (C-09)", () => {
    const p = pantallaProducto({ editar: nada, marcarNoDisponible: nada, deshacerNoDisponible: nada, eliminar: nada, atras: nada }, false);
    expect(p.actions.find((a) => a.id === "marcar-no-disponible")?.disabled).toBe(true);
  });
});
