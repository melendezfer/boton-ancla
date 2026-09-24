import { describe, expect, it } from "vitest";
import { ANCHOR_ICONS, MOBILITY_ICONS, SEMANTIC_ICONS } from "./semantic-icons";

// RNF-09: cada ícono tiene un único significado.

const registros = { SEMANTIC_ICONS, MOBILITY_ICONS, ANCHOR_ICONS };

describe("registro de íconos (RNF-09)", () => {
  it("ningún ícono aparece con dos significados, en ningún registro", () => {
    const vistos = new Map<unknown, string>();
    const repetidos: string[] = [];
    for (const [registro, iconos] of Object.entries(registros)) {
      for (const [significado, icono] of Object.entries(iconos)) {
        const nombre = `${registro}.${significado}`;
        const previo = vistos.get(icono);
        if (previo) repetidos.push(`${previo} y ${nombre}`);
        vistos.set(icono, nombre);
      }
    }
    expect(repetidos).toEqual([]);
  });

  it("Storefront solo significa 'local fijo' y no se usa para secciones (C-16)", () => {
    const secciones = Object.entries(ANCHOR_ICONS).filter(([k]) => k.startsWith("section"));
    for (const [, icono] of secciones) expect(icono).not.toBe(MOBILITY_ICONS.fixed);
  });

  it("favorito (marcar) y favoritos (lista) son íconos distintos (C-16)", () => {
    expect(ANCHOR_ICONS.favoriteToggle).not.toBe(ANCHOR_ICONS.favoritesList);
  });
});
