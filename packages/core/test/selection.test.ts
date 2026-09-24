import { describe, expect, it } from "vitest";
import { puntoEnDireccion } from "../src/geometry";
import { layoutParaPantalla } from "../src/layout";
import { DEFAULT_PARAMS } from "../src/params";
import { resolveSelection } from "../src/selection";
import type { AnchorScreen, Hand } from "../src/types";
import { ID_ATRAS } from "../src/validate";
import { mapa, productoDueno } from "./fixtures/pantallas-ruteando";

const P = DEFAULT_PARAMS;
const viewport = { x: 0, y: 0, width: 375, height: 667 };
const safeArea = { top: 0, right: 0, bottom: 0, left: 0 };

function preparar(screen: AnchorScreen, hand: Hand = "right") {
  const { anchor, layout, slots } = layoutParaPantalla({ screen, viewport, safeArea, hand, params: P });
  /**
   * Selección con el dedo a `r` px del centro, en el ángulo `anguloBase` expresado
   * en espacio de mano derecha (así la misma prueba sirve para las dos manos).
   */
  const en = (anguloBase: number, r: number, previous?: string) => {
    const angulo = hand === "right" ? anguloBase : 180 - anguloBase;
    const pointer = puntoEnDireccion(anchor, r, angulo);
    return resolveSelection({ center: anchor, pointer, slots, previous, hand, params: P });
  };
  return { anchor, layout, slots, en };
}

// Producto dueño (3 + Atrás): Atrás 90°, Marcar no disponible 120°, Editar 150°, Eliminar 180°.
// Bordes de sector: 70 | 105 | 135 | 165 | 200.

describe("resolveSelection", () => {
  for (const hand of ["right", "left"] as const) {
    describe(`mano ${hand === "right" ? "derecha" : "izquierda"}`, () => {
      const { en } = preparar(productoDueno, hand);

      describe("zona muerta (RF-02)", () => {
        it("a menos de R_MUERTA no hay preselección", () => {
          expect(en(150, 0).id).toBeUndefined();
          expect(en(150, 23.9).id).toBeUndefined();
        });

        it("apenas pasando R_MUERTA ya preselecciona", () => {
          expect(en(150, 24.001).id).toBe("editar");
        });

        it("gana a la histéresis: volver al centro borra la preselección (HU-03)", () => {
          expect(en(150, 10, "editar").id).toBeUndefined();
        });
      });

      describe("sectores (RF-03)", () => {
        it.each([
          [90, ID_ATRAS],
          [100, ID_ATRAS],
          [106, "marcar-no-disponible"],
          [120, "marcar-no-disponible"],
          [140, "editar"],
          [150, "editar"],
          [170, "eliminar"],
          [180, "eliminar"],
        ])("a %s° preselecciona %s", (angulo, id) => {
          expect(en(angulo, 100).id).toBe(id);
        });

        it("los bordes están en las bisectrices 105°, 135° y 165°", () => {
          expect(en(104.999, 100).id).toBe(ID_ATRAS);
          expect(en(105.001, 100).id).toBe("marcar-no-disponible");
          expect(en(134.999, 100).id).toBe("marcar-no-disponible");
          expect(en(135.001, 100).id).toBe("editar");
          expect(en(164.999, 100).id).toBe("editar");
          expect(en(165.001, 100).id).toBe("eliminar");
        });

        it("la distancia no cambia el sector (antes o después del radio)", () => {
          expect(en(150, 40).id).toBe("editar");
          expect(en(150, 140).id).toBe("editar");
        });
      });

      describe("extremos (RF-05) y fuera del arco (C-08)", () => {
        it("acepta hasta 20° fuera del arco en cada extremo", () => {
          expect(en(70.001, 100).id).toBe(ID_ATRAS);
          expect(en(199.999, 100).id).toBe("eliminar");
        });

        it("más allá no preselecciona nada", () => {
          expect(en(69.999, 100).id).toBeUndefined();
          expect(en(200.001, 100).id).toBeUndefined();
          expect(en(270, 100).id).toBeUndefined(); // hacia abajo
          expect(en(0, 100).id).toBeUndefined(); // hacia el borde lateral
        });

        it("la histéresis no estira el arco: fuera es fuera aunque hubiera preselección", () => {
          expect(en(205, 100, "eliminar").id).toBeUndefined();
        });
      });

      describe("histéresis de 8° (RF-04)", () => {
        it("mantiene la anterior hasta pasar el borde más de 8°", () => {
          // Borde Editar | Eliminar en 165°.
          expect(en(170, 100, "editar").id).toBe("editar");
          expect(en(172.999, 100, "editar").id).toBe("editar");
          expect(en(173.001, 100, "editar").id).toBe("eliminar");
        });

        it("funciona en los dos sentidos", () => {
          expect(en(160, 100, "eliminar").id).toBe("eliminar");
          expect(en(157.001, 100, "eliminar").id).toBe("eliminar");
          expect(en(156.999, 100, "eliminar").id).toBe("editar");
        });

        it("sin anterior, el borde exacto decide", () => {
          expect(en(166, 100).id).toBe("eliminar");
        });

        it("un previous que no está en el abanico se ignora", () => {
          expect(en(150, 100, "no-existe").id).toBe("editar");
        });
      });

      describe("anillo exterior (RF-07)", () => {
        // 4 opciones → radio 100 → R_EXTERIOR 148.
        it("beyondOuter solo al pasar R_EXTERIOR", () => {
          expect(en(180, 147.999).beyondOuter).toBe(false);
          expect(en(180, 148.001).beyondOuter).toBe(true);
        });

        it("es independiente de la preselección (también fuera del arco)", () => {
          expect(en(270, 200).beyondOuter).toBe(true);
          expect(en(270, 200).id).toBeUndefined();
        });
      });
    });
  }

  it("con 5 opciones el anillo sigue al radio adaptativo (113 + 48 ≈ 161 px)", () => {
    const cinco = { ...mapa, actions: [...mapa.actions, { ...mapa.actions[0]!, id: "quinta", priority: 5 }] };
    const { en, layout } = preparar(cinco);
    expect(layout.rExterior).toBeCloseTo(160.77, 1);
    expect(en(135, 160).beyondOuter).toBe(false);
    expect(en(135, 161).beyondOuter).toBe(true);
  });

  it("devuelve la distancia y el ángulo real del dedo", () => {
    const { en } = preparar(productoDueno, "left");
    const s = en(150, 80);
    expect(s.distancia).toBeCloseTo(80, 9);
    expect(s.angulo).toBeCloseTo(30, 9); // 180 − 150 con la mano izquierda
  });

  it("sin opciones nunca preselecciona", () => {
    const vacia = { ...mapa, actions: [] };
    const { en } = preparar(vacia);
    const s = en(135, 100);
    expect(s.id).toBeUndefined();
    expect(s.beyondOuter).toBe(false);
  });
});
