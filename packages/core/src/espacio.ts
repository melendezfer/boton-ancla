import type { Params } from "./params";
import type { Hand, Rect } from "./types";

// Fase 3 (adaptación al espacio): dónde queda el ancla. Funciones puras, sin DOM (D-18);
// el adaptador mide la vista, las áreas seguras, el teclado y las zonas, y dibuja.

/** Vertical u horizontal (ancho > alto). Cada una recuerda su propia colocación (RF3-06). */
export type Orientacion = "vertical" | "horizontal";

/** Costado del ancla. La mano se deduce de él (H13): "left" = mano izquierda. */
export type Lado = Hand;

/** Dónde queda el ancla en una orientación: costado y altura (fracción del alto útil, como ANCLA_ALTURA). */
export type Colocacion = { lado: Lado; altura: number };

/** Colocaciones guardadas por orientación. Sin la horizontal, se deduce de la vertical (RF3-08). */
export type PrefsAncla = { vertical: Colocacion; horizontal?: Colocacion };

/**
 * Zona reservada (RF3-10, RF3-13): un rectángulo de la vista que el ancla, su abanico, la banda
 * y los avisos no deben tapar. Las obligatorias nunca se tapan; las preferidas, solo si no hay lugar.
 */
export type Zona = { rect: Rect; prioridad: "obligatoria" | "preferida" };

/** Compatibilidad con la Fase 1 (`AnchorPrefs = { hand }`): la mano es el costado vertical, a la altura de inicio. */
export function prefsDesdeMano(hand: Hand, params: Params): PrefsAncla {
  return { vertical: { lado: hand, altura: params.ANCLA_ALTURA } };
}

/**
 * La colocación de una orientación (RF3-06, RF3-08). La primera vez en horizontal usa el costado
 * de la vertical y la altura de inicio horizontal (ANCLA_ALTURA_H).
 */
export function colocacionPara(prefs: PrefsAncla, orientacion: Orientacion, params: Params): Colocacion {
  if (orientacion === "vertical") return prefs.vertical;
  return prefs.horizontal ?? { lado: prefs.vertical.lado, altura: params.ANCLA_ALTURA_H };
}

/** La orientación de una vista: horizontal si es más ancha que alta. */
export function orientacionDe(ancho: number, alto: number): Orientacion {
  return ancho > alto ? "horizontal" : "vertical";
}
