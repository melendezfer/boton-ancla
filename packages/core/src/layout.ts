import { anguloParaMano, puntoEnDireccion, radioParaCuerda } from "./geometry";
import type { Params } from "./params";
import type { ActionKind, AnchorScreen, Hand, Insets, Point, Rect } from "./types";
import { ID_ATRAS, ID_DESHACER } from "./validate";

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

// ---------------------------------------------------------------------------
// Asignación de acciones a posiciones (design.md §4.4; C-10, C-11, C-21)
// ---------------------------------------------------------------------------

/** Lo que la geometría necesita saber de cada acción. */
export type OrderedAction = { id: string; kind: ActionKind; disabled: boolean };

/** Una posición del abanico con su acción asignada. */
export type Slot = FanSlot & OrderedAction;

const ATRAS: OrderedAction = { id: ID_ATRAS, kind: "normal", disabled: false };
const DESHACER: OrderedAction = { id: ID_DESHACER, kind: "normal", disabled: false };

/**
 * Ordena las acciones de una pantalla: "Atrás" primero (si existe) y después
 * por priority ascendente; sin priority, al final en orden de declaración.
 * Con `deshacer`, "Deshacer" reemplaza a la acción de prioridad 1 (C-21).
 */
export function orderActions(screen: AnchorScreen, opciones: { deshacer?: boolean } = {}): OrderedAction[] {
  const propias = screen.actions
    .map((accion, orden) => ({ accion, orden }))
    .sort(
      (a, b) =>
        (a.accion.priority ?? Number.POSITIVE_INFINITY) - (b.accion.priority ?? Number.POSITIVE_INFINITY) ||
        a.orden - b.orden, // Infinity − Infinity = NaN (falso): desempata por orden de declaración
    )
    .map(({ accion }): OrderedAction => ({
      id: accion.id,
      kind: accion.kind ?? "normal",
      disabled: accion.disabled ?? false,
    }));

  if (opciones.deshacer) {
    if (propias.length === 0) propias.push(DESHACER);
    else propias[0] = DESHACER;
  }

  return screen.back ? [ATRAS, ...propias] : propias;
}

/**
 * Pone una acción en cada posición: "Atrás" en el extremo "arriba" (D-10) y el
 * resto por cercanía a la diagonal, desempatando según params.DESEMPATE (C-10).
 * Devuelve las posiciones en orden de index.
 */
export function assignActions(layout: FanLayout, ordered: OrderedAction[], params: Params): Slot[] {
  if (ordered.length !== layout.slots.length) {
    throw new Error(
      `assignActions: hay ${ordered.length} acciones para ${layout.slots.length} posiciones; ` +
        "computeFanLayout debe recibir count = orderActions(...).length.",
    );
  }

  let libres = [...layout.slots];
  let pendientes = ordered;
  const asignadas: Slot[] = [];

  const atras = ordered.find((a) => a.id === ID_ATRAS);
  if (atras) {
    // El extremo "arriba" es la posición de menor ángulo base (index 0).
    const arriba = libres.reduce((min, s) => (s.anguloBase < min.anguloBase ? s : min));
    asignadas.push({ ...arriba, ...atras });
    libres = libres.filter((s) => s !== arriba);
    pendientes = ordered.filter((a) => a !== atras);
  }

  const diagonal = (params.ARCO_DESDE + params.ARCO_HASTA) / 2;
  const porComodidad = libres.sort((a, b) => {
    const diferencia = Math.abs(a.anguloBase - diagonal) - Math.abs(b.anguloBase - diagonal);
    if (Math.abs(diferencia) > 1e-9) return diferencia;
    // Empate: "horizontal" prefiere el ángulo mayor (hacia el extremo lateral).
    return params.DESEMPATE === "horizontal" ? b.anguloBase - a.anguloBase : a.anguloBase - b.anguloBase;
  });

  pendientes.forEach((accion, i) => {
    asignadas.push({ ...porComodidad[i]!, ...accion });
  });

  return asignadas.sort((a, b) => a.index - b.index);
}
