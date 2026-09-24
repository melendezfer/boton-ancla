import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "../src/params";
import type { AnchorScreen } from "../src/types";
import { ID_ATRAS, ID_DESHACER, validateScreen } from "../src/validate";
import { accion, mapa, pantallasSpec8, perfilDueno, perfilVisitante } from "./fixtures/pantallas-ruteando";

const P = DEFAULT_PARAMS;

describe("validateScreen", () => {
  describe("acepta las pantallas de spec §8", () => {
    for (const pantalla of pantallasSpec8) {
      it(`${pantalla.id} (${pantalla.actions.length} acciones${pantalla.back ? " + Atrás" : ""})`, () => {
        expect(validateScreen(pantalla, P)).toEqual([]);
      });
    }
  });

  describe("máximo de opciones (MAX_OPCIONES = 5, contando Atrás)", () => {
    it("5 acciones sin Atrás es válido", () => {
      const pantalla = { ...mapa, actions: [...mapa.actions, accion("quinta", "Quinta")] };
      expect(validateScreen(pantalla, P)).toEqual([]);
    });

    it("4 acciones + Atrás es válido (el perfil de visitante)", () => {
      expect(validateScreen(perfilVisitante, P)).toEqual([]);
    });

    it("5 acciones + Atrás son 6 y se rechaza", () => {
      const pantalla = { ...perfilVisitante, actions: [...perfilVisitante.actions, accion("quinta", "Quinta")] };
      const errores = validateScreen(pantalla, P);
      expect(errores).toHaveLength(1);
      expect(errores[0]).toContain('6 opciones contando "Atrás"');
    });

    it("6 acciones sin Atrás se rechaza", () => {
      const acciones = ["a", "b", "c", "d", "e", "f"].map((id) => accion(id, id.toUpperCase()));
      expect(validateScreen({ ...mapa, actions: acciones }, P)).toHaveLength(1);
    });

    it("respeta un MAX_OPCIONES distinto en los parámetros", () => {
      expect(validateScreen(mapa, { ...P, MAX_OPCIONES: 3 })).toHaveLength(1);
    });
  });

  describe("ids", () => {
    it("rechaza ids repetidos", () => {
      const pantalla = { ...mapa, actions: [accion("buscar", "Buscar"), accion("buscar", "Buscar otra vez")] };
      expect(validateScreen(pantalla, P)).toEqual([
        'La pantalla "mapa" repite el id de acción "buscar".',
      ]);
    });

    it.each([ID_ATRAS, ID_DESHACER])('rechaza el id reservado "%s"', (id) => {
      const pantalla = { ...mapa, actions: [accion(id, "Algo")] };
      expect(validateScreen(pantalla, P)).toEqual([`El id "${id}" está reservado por el ancla; usa otro.`]);
    });

    it("rechaza una acción sin id", () => {
      const pantalla = { ...mapa, actions: [accion("  ", "Algo")] };
      expect(validateScreen(pantalla, P)).toEqual(['La pantalla "mapa" tiene una acción sin id.']);
    });

    it("rechaza una pantalla sin id", () => {
      expect(validateScreen({ ...mapa, id: "" }, P)[0]).toContain("necesita un id");
    });
  });

  describe("textos accesibles (RNF-05)", () => {
    it("rechaza una acción sin label", () => {
      const pantalla = { ...mapa, actions: [accion("buscar", "")] };
      expect(validateScreen(pantalla, P)[0]).toContain("necesita label");
    });

    it("rechaza una pantalla sin sectionLabel", () => {
      expect(validateScreen({ ...mapa, sectionLabel: " " }, P)[0]).toContain("necesita sectionLabel");
    });
  });

  describe("priority", () => {
    it.each([0, -1, 1.5, Number.NaN])("rechaza priority %s", (priority) => {
      const pantalla = { ...mapa, actions: [accion("buscar", "Buscar", { priority })] };
      expect(validateScreen(pantalla, P)[0]).toContain("debe ser un entero desde 1");
    });

    it("acepta acciones sin priority y prioridades repetidas", () => {
      const pantalla = { ...mapa, actions: [accion("a", "A"), accion("b", "B", { priority: 2 }), accion("c", "C", { priority: 2 })] };
      expect(validateScreen(pantalla, P)).toEqual([]);
    });
  });

  describe("acciones reversibles (C-13)", () => {
    it("rechaza una reversible sin onUndo", () => {
      const sinUndo: AnchorScreen = {
        ...perfilDueno,
        actions: [accion("marcar-no-disponible", "Marcar no disponible", { kind: "reversible" })],
      };
      expect(validateScreen(sinUndo, P)).toEqual([
        'La acción "marcar-no-disponible" es reversible y necesita onUndo (D-14, RF-08).',
      ]);
    });

    it("no exige onUndo a las normales ni a las irreversibles", () => {
      const pantalla = { ...mapa, actions: [accion("a", "A", { kind: "normal" }), accion("b", "B", { kind: "irreversible" })] };
      expect(validateScreen(pantalla, P)).toEqual([]);
    });
  });

  it("junta todos los errores en vez de parar en el primero", () => {
    const pantalla: AnchorScreen = {
      ...perfilVisitante,
      actions: [
        accion("x", "X"),
        accion("x", ""),
        accion("r", "R", { kind: "reversible" }),
        accion("d", "D"),
        accion("e", "E"),
      ],
    };
    // 6 con Atrás + id repetido + label vacío + reversible sin onUndo
    expect(validateScreen(pantalla, P)).toHaveLength(4);
  });
});
