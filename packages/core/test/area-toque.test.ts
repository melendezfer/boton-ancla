import { describe, expect, it } from "vitest";
import { distancia } from "../src/geometry";
import { layoutParaPantalla } from "../src/layout";
import { DEFAULT_PARAMS, diametroToque, TOQUE_MINIMO, type Params } from "../src/params";
import type { AnchorScreen } from "../src/types";

// Área de toque (v0.7.1, AT-01 a AT-03): opciones dibujadas pequeñas con un área de toque invisible ≥ 44 px
// (48 por defecto) que nunca se encima con la de la vecina; si haría falta, el radio se abre.
const seis: AnchorScreen = {
  id: "mapa",
  sectionIcon: () => null,
  sectionLabel: "Mapa",
  back: { onSelect: () => {} },
  actions: [1, 2, 3, 4, 5].map((i) => ({ id: `a${i}`, label: `A${i}`, icon: () => null, onSelect: () => {}, priority: i })),
};
const vista = { viewport: { x: 0, y: 0, width: 390, height: 844 }, safeArea: { top: 0, right: 0, bottom: 0, left: 0 }, hand: "right" as const };

function separacionMinima(params: Params) {
  const { slots } = layoutParaPantalla({ screen: seis, ...vista, params });
  const orden = [...slots].sort((a, b) => a.angulo - b.angulo);
  return Math.min(...orden.slice(1).map((s, i) => distancia(s.punto, orden[i]!.punto)));
}

describe("área de toque invisible", () => {
  it("con opciones de 36 px dibujadas, las áreas de 48 px de vecinas no se enciman (AT-02)", () => {
    const p: Params = { ...DEFAULT_PARAMS, D_OPCION: 36, SEPARACION_MIN: 4, D_TOQUE: 48 };
    expect(separacionMinima(p)).toBeGreaterThanOrEqual(48 - 1e-6);
  });

  it("nunca baja de 44 px aunque se pida menos (AT-01)", () => {
    expect(diametroToque({ D_TOQUE: 30, D_OPCION: 36 })).toBe(Math.max(TOQUE_MINIMO, 36));
    expect(diametroToque({ D_TOQUE: 30, D_OPCION: 20 })).toBe(TOQUE_MINIMO);
    const p: Params = { ...DEFAULT_PARAMS, D_OPCION: 20, SEPARACION_MIN: 0, D_TOQUE: 30 };
    expect(separacionMinima(p)).toBeGreaterThanOrEqual(TOQUE_MINIMO - 1e-6);
  });

  it("el arco se abre solo lo necesario: con 48 px, menos que el de las opciones de 44 px y 6 de separación", () => {
    const chicas = layoutParaPantalla({ screen: seis, ...vista, params: { ...DEFAULT_PARAMS, D_OPCION: 36, SEPARACION_MIN: 4, D_TOQUE: 48 } }).layout.radio;
    const deFabrica = layoutParaPantalla({ screen: seis, ...vista, params: DEFAULT_PARAMS }).layout.radio;
    expect(chicas).toBeLessThan(deFabrica);
  });
});
