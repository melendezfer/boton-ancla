"use client";

import {
  indicadorDesplazamiento,
  indicadorJoystick,
  velocidadDesplazamiento,
  velocidadJoystick,
  type AnchorState,
  type Machine,
  type Params,
} from "@boton-ancla/core";
import { useEffect, type RefObject } from "react";
import { esLibre, type ObjetivoDesplazar } from "../AnchorProvider";

// HM-09, RF-18: mientras la máquina está en "desplazando", desplaza el objetivo cuadro a
// cuadro con la velocidad del núcleo y mueve el punto de la guía. No usa estado de React
// (sería redibujar en cada cuadro: RNF-03); escribe directo en el DOM.

type Opciones = {
  machine: Machine;
  estado: AnchorState;
  params: Params;
  /** Qué desplazar ahora (la capa de arriba o el contenido principal). */
  obtenerObjetivo: () => ObjetivoDesplazar | null;
  /** El punto de la cápsula que sigue al dedo (variante "arriba"). Su `data-escala` ajusta el recorrido si la cápsula se achicó. */
  puntoGuia: RefObject<HTMLElement | null>;
  /** La raíz del ancla (variante "ancla", HM-10): recibe `data-direccion` y `--ba-llenado`. */
  indicador: RefObject<HTMLElement | null>;
};

type ObjetivoVertical = HTMLElement | "ventana";

function posicion(o: ObjetivoVertical): number {
  return o === "ventana" ? window.scrollY : o.scrollTop;
}

function desplazar(o: ObjetivoVertical, px: number) {
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

export function useBucleDesplazamiento({ machine, estado, params, obtenerObjetivo, puntoGuia, indicador }: Opciones) {
  const activo = estado.tipo === "desplazando";

  useEffect(() => {
    if (!activo) return;
    const objetivo = obtenerObjetivo();
    if (!objetivo) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let anterior = performance.now();
    let acumulado = 0; // fracciones de píxel: a velocidad baja, cada cuadro mueve menos de 1 px
    let acumuladoX = 0; // HM-11: en el joystick libre también en x
    let enBorde = 0; // -1 inicio, 1 final: para vibrar una sola vez al llegar
    let cuadro = 0;

    const paso = (ahora: number) => {
      const s = machine.getState();
      if (s.tipo !== "desplazando") return;
      const dx = s.ultimo.x - s.origen.x;
      const dy = s.ultimo.y - s.origen.y;
      const dt = Math.min(64, ahora - anterior); // si la pestaña se pausó, no dar un salto
      anterior = ahora;

      if (esLibre(objetivo)) {
        // HM-11: joystick libre (mapa). La vista avanza hacia donde apunta el pulgar.
        const { vx, vy } = velocidadJoystick(dx, dy, params, reducido);
        acumuladoX += (vx * dt) / 1000;
        acumulado += (vy * dt) / 1000;
        const ex = Math.trunc(acumuladoX);
        const ey = Math.trunc(acumulado);
        if (ex !== 0 || ey !== 0) {
          const movio = objetivo.mover(ex, ey) !== false;
          acumuladoX -= ex;
          acumulado -= ey;
          const borde = movio ? 0 : 1;
          if (borde !== 0 && enBorde === 0) vibrar(params.VIB_MS * 2);
          enBorde = borde;
        }
        const punto = puntoGuia.current;
        if (punto) {
          const escala = Number(punto.dataset.escala ?? 1);
          const d = Math.hypot(dx, dy);
          const k = d > params.R_MAX_DESPLAZAR ? params.R_MAX_DESPLAZAR / d : 1;
          punto.style.transform = `translate(calc(-50% + ${dx * k * escala}px), calc(-50% + ${dy * k * escala}px))`;
        }
        const raiz = indicador.current ?? puntoGuia.current?.parentElement;
        if (raiz) {
          const { angulo, llenado } = indicadorJoystick(dx, dy, params);
          raiz.dataset.direccion = angulo === null ? "quieto" : "libre";
          // CSS gira en sentido horario desde "arriba"; la geometría mide antihorario desde la derecha.
          if (angulo !== null) raiz.style.setProperty("--ba-giro", `${90 - angulo}deg`);
          raiz.style.setProperty("--ba-llenado", llenado.toFixed(3));
        }
        cuadro = requestAnimationFrame(paso);
        return;
      }

      const v = velocidadDesplazamiento(dy, params, reducido);
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

      // Variante "arriba": el punto sigue al dedo, limitado a la zona (R_MAX_DESPLAZAR).
      const punto = puntoGuia.current;
      if (punto) {
        const escala = Number(punto.dataset.escala ?? 1);
        const limitado = Math.max(-params.R_MAX_DESPLAZAR, Math.min(params.R_MAX_DESPLAZAR, dy)) * escala;
        punto.style.transform = `translate(-50%, calc(-50% + ${limitado}px))`;
      }
      // Variante "ancla" (HM-10): flecha según la dirección y anillo según la velocidad.
      const ancla = indicador.current;
      if (ancla) {
        const { direccion, llenado } = indicadorDesplazamiento(dy, params);
        ancla.dataset.direccion = direccion > 0 ? "abajo" : direccion < 0 ? "arriba" : "quieto";
        ancla.style.setProperty("--ba-llenado", llenado.toFixed(3));
      }

      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    const ancla = indicador.current;
    return () => {
      cancelAnimationFrame(cuadro);
      if (ancla) {
        delete ancla.dataset.direccion;
        ancla.style.removeProperty("--ba-llenado");
        ancla.style.removeProperty("--ba-giro");
      }
    };
  }, [activo, machine, params, obtenerObjetivo, puntoGuia, indicador]);
}
