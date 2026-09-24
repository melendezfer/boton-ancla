import { anguloParaMano, puntoEnDireccion, radioParaCuerda } from "./geometry";
import type { Params } from "./params";
import type { Hand, Insets, Point, Rect } from "./types";

// Posición del ancla y geometría del abanico (design.md §4.2 y §4.3).

export type FanSlot = {
  /** 0 = extremo "arriba" … n−1 = extremo lateral. */
  index: number;
  /** Ángulo en espacio de mano derecha (ARCO_DESDE … ARCO_HASTA). */
  anguloBase: number;
  /** Ángulo real en pantalla (reflejado con la mano izquierda). */
  angulo: number;
  /** Centro de la opción en pantalla. */
  punto: Point;
  /** Sector de selección en espacio de mano derecha; los extremos incluyen EXT_EXTREMOS. */
  sector: { desde: number; hasta: number };
};

export type FanLayout = {
  /** Radio adaptativo (C-01). */
  radio: number;
  /** Radio del anillo exterior para confirmar irreversibles. */
  rExterior: number;
  slots: FanSlot[];
  /** true si alguna opción, a tamaño preseleccionado, se sale de la zona útil (RF-12). */
  fueraDePantalla: boolean;
};

type EntradaPosicion = { viewport: Rect; safeArea: Insets; hand: Hand; params: Params };

/**
 * Centro del ancla: abajo a la derecha o a la izquierda, respetando área segura y márgenes.
 * Se usa D_ACTIVO (no D_REPOSO) para que al crecer no invada el margen.
 */
export function computeAnchorPosition({ viewport, safeArea, hand, params }: EntradaPosicion): Point {
  const distanciaLateral = params.MARGEN_LATERAL + params.D_ACTIVO / 2;
  const x =
    hand === "right"
      ? viewport.x + viewport.width - safeArea.right - distanciaLateral
      : viewport.x + safeArea.left + distanciaLateral;
  const y = viewport.y + viewport.height - safeArea.bottom - params.MARGEN_INFERIOR - params.D_ACTIVO / 2;
  return { x, y };
}

/** Separación angular entre opciones vecinas; 0 si hay menos de 2. */
function paso(count: number, params: Params): number {
  return count < 2 ? 0 : (params.ARCO_HASTA - params.ARCO_DESDE) / (count - 1);
}

/**
 * Radio adaptativo (C-01): el mínimo R_ARCO, o más si hace falta para que
 * opciones vecinas no se encimen: max(R_ARCO, (D_OPCION + SEPARACION_MIN) / (2·sin(Δ/2))).
 */
export function radioAdaptativo(count: number, params: Params): number {
  if (count < 2) return params.R_ARCO;
  return Math.max(params.R_ARCO, radioParaCuerda(params.D_OPCION + params.SEPARACION_MIN, paso(count, params)));
}

/** Ángulos base: en los extremos del arco y a intervalos iguales; con 1 opción, la diagonal. */
function angulosBase(count: number, params: Params): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(params.ARCO_DESDE + params.ARCO_HASTA) / 2];
  const delta = paso(count, params);
  return Array.from({ length: count }, (_, i) => params.ARCO_DESDE + i * delta);
}

type EntradaAbanico = {
  anchor: Point;
  viewport: Rect;
  safeArea: Insets;
  count: number;
  hand: Hand;
  params: Params;
};

export function computeFanLayout({ anchor, viewport, safeArea, count, hand, params }: EntradaAbanico): FanLayout {
  const radio = radioAdaptativo(count, params);
  const angulos = angulosBase(count, params);
  const inicio = params.ARCO_DESDE - params.EXT_EXTREMOS;
  const fin = params.ARCO_HASTA + params.EXT_EXTREMOS;

  const slots = angulos.map((anguloBase, index): FanSlot => {
    const anterior = angulos[index - 1];
    const siguiente = angulos[index + 1];
    const angulo = anguloParaMano(anguloBase, hand);
    return {
      index,
      anguloBase,
      angulo,
      punto: puntoEnDireccion(anchor, radio, angulo),
      sector: {
        // Bisectriz con la vecina; en los extremos, el borde del arco más la tolerancia.
        desde: anterior === undefined ? inicio : (anterior + anguloBase) / 2,
        hasta: siguiente === undefined ? fin : (anguloBase + siguiente) / 2,
      },
    };
  });

  return {
    radio,
    rExterior: radio + params.EXTRA_EXTERIOR,
    slots,
    fueraDePantalla: slots.some((s) => !cabeEnZonaUtil(s.punto, viewport, safeArea, params)),
  };
}

/**
 * Zona útil (RF-12): viewport menos área segura, menos MARGEN_LATERAL a los lados
 * y MARGEN_INFERIOR abajo. Arriba solo el área segura: el abanico nunca llega cerca.
 */
function cabeEnZonaUtil(centro: Point, viewport: Rect, safeArea: Insets, params: Params): boolean {
  const mitad = (params.D_OPCION * params.ESCALA_PRESEL) / 2;
  const tolerancia = 1e-6; // errores de redondeo de seno y coseno
  const izquierda = viewport.x + safeArea.left + params.MARGEN_LATERAL;
  const derecha = viewport.x + viewport.width - safeArea.right - params.MARGEN_LATERAL;
  const arriba = viewport.y + safeArea.top;
  const abajo = viewport.y + viewport.height - safeArea.bottom - params.MARGEN_INFERIOR;
  return (
    centro.x - mitad >= izquierda - tolerancia &&
    centro.x + mitad <= derecha + tolerancia &&
    centro.y - mitad >= arriba - tolerancia &&
    centro.y + mitad <= abajo + tolerancia
  );
}
