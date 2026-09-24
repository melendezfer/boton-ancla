import type { AnchorState } from "./states";

/**
 * Cuándo debe el adaptador enviar el próximo TICK (design.md §3.4).
 * Devuelve un instante absoluto (en la misma escala que `t` de los eventos) o
 * undefined si el estado no tiene plazo. El adaptador mantiene un solo
 * setTimeout hacia ese instante.
 */
export function proximoPlazo(estado: AnchorState): number | undefined {
  switch (estado.tipo) {
    case "armado":
      return estado.t0 + estado.geo.params.T_DESCANSO;
    default:
      return undefined;
  }
}
