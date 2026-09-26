import { distancia } from "./geometry";
import type { Apuntado } from "./machine/states";
import type { Params } from "./params";
import type { Point } from "./types";

// RF-21 (HM-12a): apuntar y elegir en el mapa. Funciones puras: el adaptador les pasa
// la mira y los objetivos en coordenadas de pantalla, cuadro a cuadro.

export type ObjetivoEnPantalla = { id: string; x: number; y: number };

export type Resultado = {
  apuntado: Apuntado | null;
  /** Dónde está lo apuntado (el pin, o el centro del grupo): el imán lo lleva a la mira. */
  destino: Point | null;
};

/** Grupos: pines a menos de GRUPO_DISTANCIA entre sí (y en cadena) van juntos. */
export function agrupar(objetivos: ObjetivoEnPantalla[], params: Params): ObjetivoEnPantalla[][] {
  const padre = objetivos.map((_, i) => i);
  const raiz = (i: number): number => (padre[i] === i ? i : (padre[i] = raiz(padre[i])));
  for (let i = 0; i < objetivos.length; i++) {
    for (let j = i + 1; j < objetivos.length; j++) {
      if (distancia(objetivos[i], objetivos[j]) < params.GRUPO_DISTANCIA) padre[raiz(i)] = raiz(j);
    }
  }
  const grupos = new Map<number, ObjetivoEnPantalla[]>();
  objetivos.forEach((o, i) => grupos.set(raiz(i), [...(grupos.get(raiz(i)) ?? []), o]));
  return [...grupos.values()];
}

/**
 * Qué hay en la mira. Nivel 1 (asistencia): cada pin tiene un imán de IMAN_RADIO, que se
 * achica a la mitad de la distancia a su vecino más cercano (nunca bajo IMAN_RADIO_MIN),
 * así no se imanta el equivocado. Nivel 2 (grupos): los pines que no se pueden separar se
 * apuntan juntos, con el imán completo en su centro. Gana el más cercano a la mira.
 */
export function resolverApuntado(mira: Point, objetivos: ObjetivoEnPantalla[], params: Params): Resultado {
  const candidatos = agrupar(objetivos, params).map((grupo) => {
    if (grupo.length > 1) {
      const centro = { x: promedio(grupo.map((o) => o.x)), y: promedio(grupo.map((o) => o.y)) };
      const ids = grupo.map((o) => o.id).sort();
      return { apuntado: { tipo: "grupo", ids } as Apuntado, punto: centro, radio: params.IMAN_RADIO };
    }
    const [o] = grupo;
    const vecino = Math.min(...objetivos.filter((x) => x !== o).map((x) => distancia(o, x)));
    const radio = Math.max(params.IMAN_RADIO_MIN, Math.min(params.IMAN_RADIO, vecino / 2));
    return { apuntado: { tipo: "uno", id: o.id } as Apuntado, punto: { x: o.x, y: o.y }, radio };
  });

  let mejor: (typeof candidatos)[number] | null = null;
  for (const c of candidatos) {
    const d = distancia(mira, c.punto);
    if (d <= c.radio && (!mejor || d < distancia(mira, mejor.punto))) mejor = c;
  }
  return mejor ? { apuntado: mejor.apuntado, destino: mejor.punto } : { apuntado: null, destino: null };
}

/**
 * Nivel 3: cuánto acercar para separar un grupo. Devuelve el factor que deja al par más
 * cercano a 1,5 × GRUPO_DISTANCIA (con margen, para que no vuelvan a juntarse al moverse).
 */
export function zoomParaSeparar(grupo: ObjetivoEnPantalla[], params: Params): number {
  let minimo = Infinity;
  for (let i = 0; i < grupo.length; i++) {
    for (let j = i + 1; j < grupo.length; j++) minimo = Math.min(minimo, distancia(grupo[i], grupo[j]));
  }
  if (!Number.isFinite(minimo)) return 1;
  return (1.5 * params.GRUPO_DISTANCIA) / Math.max(minimo, 1);
}

function promedio(v: number[]): number {
  return v.reduce((a, b) => a + b, 0) / v.length;
}
