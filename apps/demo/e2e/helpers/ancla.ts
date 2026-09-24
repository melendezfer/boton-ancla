import { expect, type Page } from "@playwright/test";
import type { Punto } from "./gestos";

// Ayudas para ubicar el ancla y sus opciones en las E2E.
// El ancla publica su geometría en data-geometria (dónde está cada opción aunque
// el menú esté cerrado); así las pruebas apuntan igual que lo haría un pulgar experto.

export type GeometriaAncla = {
  centro: Punto;
  radio: number;
  rExterior: number;
  slots: { id: string; x: number; y: number; angulo: number; kind: string; disabled: boolean }[];
};

export async function leerGeometria(page: Page): Promise<GeometriaAncla> {
  const ancla = page.getByTestId("ancla");
  await expect(ancla).toBeVisible();
  return JSON.parse((await ancla.getAttribute("data-geometria"))!) as GeometriaAncla;
}

/** Punto a `r` px del centro en la dirección de la opción `id` (por defecto, sobre la opción). */
export function haciaOpcion(g: GeometriaAncla, id: string, r = g.radio): Punto {
  const s = g.slots.find((x) => x.id === id);
  if (!s) throw new Error(`No hay opción "${id}" en el abanico: ${g.slots.map((x) => x.id).join(", ")}`);
  const a = (s.angulo * Math.PI) / 180;
  return { x: g.centro.x + r * Math.cos(a), y: g.centro.y - r * Math.sin(a) };
}

export function estadoAncla(page: Page) {
  return page.locator(".ba-raiz").getAttribute("data-estado");
}
