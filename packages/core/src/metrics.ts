import type { AnchorEvent, AnchorState, CancelReason, ModoDesplazar, ModoEjecucion } from "./machine/states";
import { ID_DESHACER } from "./validate";

// Métricas locales (spec §9, design.md §3.5). Los nombres de eventos y campos
// son los de la spec porque terminan en el JSON que se exporta.

export type MetricEvent =
  | { type: "open"; mode: "gesto" | "toque" | "teclado" }
  | { type: "preselect"; id: string }
  | { type: "execute"; id: string; ms: number; pathPx: number; expert: boolean; mode: ModoEjecucion }
  | { type: "cancel"; reason: CancelReason }
  | { type: "rest_enter" }
  | { type: "sensitive_blocked"; id: string }
  | { type: "undo"; id: string }
  /** Una capa se cerró sin el abanico: botón atrás del sistema o Escape (HM-03). */
  | { type: "layer_close"; via: "sistema" | "teclado" }
  /** HM-09: empezó y terminó el modo desplazamiento. `modo`: listas (vertical) o mapa (libre, HM-11). */
  | { type: "scroll_start"; modo: ModoDesplazar }
  | { type: "scroll_end"; ms: number };

type Tipo = AnchorState["tipo"];

const ABRE_GESTO_DESDE: readonly Tipo[] = ["armado", "descanso", "abierto_toque"];
const ES_GESTO: readonly Tipo[] = ["abierto_gesto", "confirmacion_armada"];
const FINALES: readonly Tipo[] = ["ejecutando", "cancelado", "bloqueado_sensible"];

/** Preselección visible en un estado: la del gesto, o el foco con teclado. */
function preseleccion(estado: AnchorState): string | undefined {
  if (estado.tipo === "abierto_gesto" || estado.tipo === "confirmacion_armada") return estado.presel;
  if (estado.tipo === "abierto_teclado") return estado.geo.slots[estado.foco]?.id;
  return undefined;
}

/**
 * Qué métricas produce un cambio de estado. Pura: el adaptador la llama con
 * (anterior, nuevo, evento) después de cada transición.
 * "undo" no sale de aquí: lo registra el adaptador, que conoce la acción original.
 */
export function derivarMetricas(prev: AnchorState, next: AnchorState, evento: AnchorEvent): MetricEvent[] {
  if (prev === next) return [];
  const metricas: MetricEvent[] = [];

  // --- open ---
  const abreGesto = ABRE_GESTO_DESDE.includes(prev.tipo) && ES_GESTO.includes(next.tipo);
  // C-05: deslizamiento rápido que va de armado directo a un final, sin pasar por abierto_gesto.
  const gestoRelampago = prev.tipo === "armado" && evento.tipo === "POINTER_UP" && FINALES.includes(next.tipo);
  if (abreGesto || gestoRelampago) metricas.push({ type: "open", mode: "gesto" });
  if (next.tipo === "abierto_toque" && (prev.tipo === "armado" || prev.tipo === "reposo")) {
    metricas.push({ type: "open", mode: "toque" });
  }
  if (next.tipo === "abierto_teclado" && prev.tipo !== "abierto_teclado") metricas.push({ type: "open", mode: "teclado" });

  // --- preselect ---
  const presel = preseleccion(next);
  if (presel !== undefined && presel !== preseleccion(prev)) metricas.push({ type: "preselect", id: presel });

  // --- desplazamiento (HM-09) ---
  if (next.tipo === "desplazando" && prev.tipo !== "desplazando") metricas.push({ type: "scroll_start", modo: next.geo.modoDesplazar ?? "vertical" });
  if (prev.tipo === "desplazando" && next.tipo === "reposo" && evento.tipo === "POINTER_UP") {
    metricas.push({ type: "scroll_end", ms: Math.round(evento.t - prev.tInicio) });
  }

  // --- rest_enter ---
  if (prev.tipo === "armado" && next.tipo === "descanso") metricas.push({ type: "rest_enter" });

  // --- finales ---
  switch (next.tipo) {
    case "ejecutando":
      if (next.id !== ID_DESHACER) {
        metricas.push({
          type: "execute",
          id: next.id,
          ms: next.ms,
          pathPx: Math.round(next.recorridoPx),
          expert: next.experto,
          mode: next.modo,
        });
      }
      break;
    case "cancelado":
      metricas.push({ type: "cancel", reason: next.motivo });
      break;
    case "bloqueado_sensible":
      metricas.push({ type: "sensitive_blocked", id: next.id });
      break;
  }

  return metricas;
}
