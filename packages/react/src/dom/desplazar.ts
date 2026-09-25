"use client";

import { velocidadDesplazamiento, type AnchorState, type Machine, type Params } from "@boton-ancla/core";
import { useEffect, type RefObject } from "react";
import type { ObjetivoDesplazar } from "../AnchorProvider";

// HM-09, RF-18: mientras la máquina está en "desplazando", desplaza el objetivo cuadro a
// cuadro con la velocidad del núcleo y mueve el punto de la guía. No usa estado de React
// (sería redibujar en cada cuadro: RNF-03); escribe directo en el DOM.

type Opciones = {
  machine: Machine;
  estado: AnchorState;
  params: Params;
  /** Qué desplazar ahora (la capa de arriba o el contenido principal). */
  obtenerObjetivo: () => ObjetivoDesplazar | null;
  /** El punto de la guía que sigue al dedo. */
  puntoGuia: RefObject<HTMLElement | null>;
};

function posicion(o: ObjetivoDesplazar): number {
  return o === "ventana" ? window.scrollY : o.scrollTop;
}

function desplazar(o: ObjetivoDesplazar, px: number) {
  if (o === "ventana") window.scrollBy(0, px);
  else o.scrollTop += px;
}

function vibrar(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Solo Android; sin activación del usuario algunos navegadores lo bloquean (L-01).
  }
}

export function useBucleDesplazamiento({ machine, estado, params, obtenerObjetivo, puntoGuia }: Opciones) {
  const activo = estado.tipo === "desplazando";

  useEffect(() => {
    if (!activo) return;
    const objetivo = obtenerObjetivo();
    if (!objetivo) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let anterior = performance.now();
    let acumulado = 0; // fracciones de píxel: a velocidad baja, cada cuadro mueve menos de 1 px
    let enBorde = 0; // -1 inicio, 1 final: para vibrar una sola vez al llegar
    let cuadro = 0;

    const paso = (ahora: number) => {
      const s = machine.getState();
      if (s.tipo !== "desplazando") return;
      const dy = s.ultimo.y - s.origen.y;
      const v = velocidadDesplazamiento(dy, params, reducido);
      const dt = Math.min(64, ahora - anterior); // si la pestaña se pausó, no dar un salto
      anterior = ahora;

      acumulado += (v * dt) / 1000;
      const entero = Math.trunc(acumulado);
      if (entero !== 0) {
        const antes = posicion(objetivo);
        desplazar(objetivo, entero);
        acumulado -= entero;
        const movio = Math.abs(posicion(objetivo) - antes) >= 0.5;
        const borde = movio ? 0 : Math.sign(entero);
        // Vibración corta al llegar al inicio o al final (RF-18; solo Android, D-02).
        if (borde !== 0 && borde !== enBorde) vibrar(params.VIB_MS * 2);
        enBorde = borde;
      }

      // La guía: el punto sigue al dedo, limitado a la zona (R_MAX_DESPLAZAR).
      const limitado = Math.max(-params.R_MAX_DESPLAZAR, Math.min(params.R_MAX_DESPLAZAR, dy));
      if (puntoGuia.current) puntoGuia.current.style.transform = `translate(-50%, calc(-50% + ${limitado}px))`;

      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [activo, machine, params, obtenerObjetivo, puntoGuia]);
}
