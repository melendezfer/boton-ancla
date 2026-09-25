import type { Params } from "./params";

// HM-09, RF-18: velocidad del desplazamiento según cuánto se alejó el pulgar (en vertical)
// del punto donde empezó el modo. Función pura: el adaptador la aplica cuadro a cuadro.

/**
 * Velocidad en px/s. Positiva = el contenido baja (se ve lo de más abajo), como al
 * deslizar la barra de desplazamiento; negativa = sube.
 * - Dentro de la zona muerta (R_MUERTA_DESPLAZAR): 0.
 * - Después crece con una curva (exponente CURVA_DESPLAZAR): lenta cerca del centro, para leer.
 * - En R_MAX_DESPLAZAR o más allá: la máxima, y se mantiene mientras el dedo siga ahí.
 * - Con movimiento reducido, la máxima es V_MAX_REDUCIDO.
 */
export function velocidadDesplazamiento(dy: number, params: Params, reducido = false): number {
  const distancia = Math.abs(dy);
  if (distancia <= params.R_MUERTA_DESPLAZAR) return 0;
  const recorrido = Math.min(1, (distancia - params.R_MUERTA_DESPLAZAR) / (params.R_MAX_DESPLAZAR - params.R_MUERTA_DESPLAZAR));
  const maxima = reducido ? params.V_MAX_REDUCIDO : params.V_MAX_DESPLAZAR;
  return Math.sign(dy) * maxima * recorrido ** params.CURVA_DESPLAZAR;
}
