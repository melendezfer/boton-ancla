import { describe, expect, it } from "vitest";

// T-27, RNF-06: contraste del ancla con los colores reales de la demo (tokens de RUTEANDO)
// y el CSS del adaptador. Ícono ≥ 3:1 sobre el fondo real en reposo; texto ≥ 4,5:1.
// Fórmula WCAG 2.x. El reposo es translúcido: se mezcla `surface` al 60 % con el fondo.

type RGB = [number, number, number];

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const lineal = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminancia = ([r, g, b]: RGB) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
export function contraste(a: RGB, b: RGB): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
const mezclar = (arriba: RGB, abajo: RGB, alfa: number): RGB => arriba.map((v, i) => Math.round(v * alfa + abajo[i]! * (1 - alfa))) as RGB;

// Tokens (apps/demo/src/app/globals.css).
const T = {
  accent: hex("#5b3df5"),
  surface: hex("#ffffff"),
  text: hex("#1b1b1b"),
  textMuted: hex("#555555"),
};

// Fondos reales detrás del ancla: mapa claro, mapa oscuro, foto de respaldo y los extremos.
const FONDOS: Record<string, RGB> = {
  "negro (peor caso)": hex("#000000"),
  "blanco": hex("#ffffff"),
  "mapa claro · manzana": hex("#e6e1d8"),
  "mapa claro · avenida": hex("#fbe7b5"),
  "mapa claro · río": hex("#aad3df"),
  "mapa oscuro · manzana": hex("#262a31"),
  "mapa oscuro · calle": hex("#3a3f48"),
  "foto · zona oscura": hex("#1a0f0a"),
  "foto · cielo": hex("#1b2a4a"),
  "foto · atardecer": hex("#c8643b"),
};

describe("RNF-06: ícono del ancla en reposo ≥ 3:1 (C-02: ícono `text` sobre `surface` al 60 %)", () => {
  for (const [nombre, fondo] of Object.entries(FONDOS)) {
    it(nombre, () => {
      const fondoAncla = mezclar(T.surface, fondo, 0.6);
      expect(contraste(T.text, fondoAncla)).toBeGreaterThanOrEqual(3);
    });
  }

  it("con el ícono violeta en reposo NO se cumpliría (por eso C-02)", () => {
    expect(contraste(T.accent, mezclar(T.surface, FONDOS["negro (peor caso)"]!, 0.6))).toBeLessThan(3);
  });
});

describe("RNF-06: resto del ancla (fondos sólidos)", () => {
  it.each([
    ["ancla activa: ícono violeta sobre surface", T.accent, T.surface, 3],
    ["opción: ícono text sobre surface", T.text, T.surface, 3],
    ["opción preseleccionada: ícono surface sobre violeta", T.surface, T.accent, 3],
    ["banda: nombre de la opción (text sobre surface)", T.text, T.surface, 4.5],
    ["banda: sección o pista (text-muted sobre surface)", T.textMuted, T.surface, 4.5],
    ["aviso: surface sobre text", T.surface, T.text, 4.5],
    ["botón Confirmar: surface sobre violeta", T.surface, T.accent, 4.5],
  ] as const)("%s", (_, a, b, minimo) => {
    expect(contraste(a, b)).toBeGreaterThanOrEqual(minimo);
  });
});
