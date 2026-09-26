"use client";

import {
  indicadorDesplazamiento,
  indicadorJoystick,
  mismoApuntado,
  resolverApuntado,
  velocidadDesplazamiento,
  velocidadJoystick,
  zoomParaSeparar,
  type AnchorEvent,
  type AnchorState,
  type Apuntado,
  type Machine,
  type MetricEvent,
  type Params,
} from "@boton-ancla/core";
import { useEffect, useRef, type RefObject } from "react";
import { esLibre, type ObjetivoApuntable, type ObjetivoDesplazar, type ObjetivoLibre, type OpcionesApuntar } from "../AnchorProvider";

// HM-09, RF-18: mientras la máquina está en "desplazando", desplaza el objetivo cuadro a
// cuadro con la velocidad del núcleo y mueve el punto de la guía. No usa estado de React
// (sería redibujar en cada cuadro: RNF-03); escribe directo en el DOM.
// HM-11: con un mapa, el joystick es libre. HM-12a: con apuntar, además mira, freno, imán
// y zoom automático (RF-21); y en "ajustando" mueve un deslizador como Zoom (RF-20).

/** Lo apuntado, con lo que hace falta para dibujarlo (RF-21). */
export type InfoApuntado = { apuntado: Apuntado; label: string; icon?: ObjetivoApuntable["icon"] };

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
  /** RF-20: el `onSlide` de una opción deslizador. */
  obtenerDeslizador: (id: string) => ((paso: number) => void) | undefined;
  /** RF-21: ¿apuntar y elegir está activado? */
  apuntar: boolean;
  /** La mira (se ubica y se marca desde aquí, sin redibujar React). */
  mira: RefObject<HTMLElement | null>;
  /** Envía un evento a la máquina (APUNTAR) por el controlador, para que salgan las métricas. */
  enviar: (evento: AnchorEvent) => void;
  /** Registra una métrica que no sale de la máquina (auto_zoom). */
  emitir: (metrica: MetricEvent) => void;
  /** Avisa a React que cambió lo apuntado (solo cuando cambia: para el ícono y el nombre). */
  alApuntar: (info: InfoApuntado | null) => void;
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

/** Centro de la parte visible (la mira por defecto, RF-21). */
export function miraPorDefecto(): { x: number; y: number } {
  const vv = window.visualViewport;
  return vv ? { x: vv.offsetLeft + vv.width / 2, y: vv.offsetTop + vv.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/** Opciones de apuntar del objetivo, si el mapa las ofrece y el interruptor está activado. */
export function opcionesApuntar(objetivo: ObjetivoDesplazar | null, activado: boolean): OpcionesApuntar | undefined {
  return activado && esLibre(objetivo) ? objetivo.apuntar() : undefined;
}

export function useBucleDesplazamiento(o: Opciones) {
  const { machine, estado, params } = o;
  const activo = estado.tipo === "desplazando" || estado.tipo === "ajustando";
  // Las funciones cambian en cada render; el bucle usa siempre la última.
  const ref = useRef(o);
  useEffect(() => {
    ref.current = o;
  });

  useEffect(() => {
    if (!activo) return;
    const inicial = machine.getState();
    const objetivo = inicial.tipo === "desplazando" ? ref.current.obtenerObjetivo() : null;
    if (inicial.tipo === "desplazando" && !objetivo) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let anterior = performance.now();
    let acumulado = 0; // fracciones de píxel: a velocidad baja, cada cuadro mueve menos de 1 px
    let acumuladoX = 0; // HM-11: en el joystick libre también en x
    let enBorde = 0; // -1 inicio, 1 final: para vibrar una sola vez al llegar
    let cuadro = 0;
    // RF-21, nivel 3: desde cuándo la mira está quieta sobre el mismo grupo.
    let grupoQuieto: { clave: string; desde: number; hecho: boolean } | null = null;
    let apuntadoAntes: Apuntado | null = null;
    const { puntoGuia, indicador, mira } = ref.current;

    /** Flecha y anillo (HM-10) para un movimiento vertical: desplazar o ajustar. */
    const guiaVertical = (dy: number) => {
      const punto = puntoGuia.current;
      if (punto) {
        const escala = Number(punto.dataset.escala ?? 1);
        const limitado = Math.max(-params.R_MAX_DESPLAZAR, Math.min(params.R_MAX_DESPLAZAR, dy)) * escala;
        punto.style.transform = `translate(-50%, calc(-50% + ${limitado}px))`;
      }
      const ancla = indicador.current;
      if (ancla) {
        const { direccion, llenado } = indicadorDesplazamiento(dy, params);
        ancla.dataset.direccion = direccion > 0 ? "abajo" : direccion < 0 ? "arriba" : "quieto";
        ancla.style.setProperty("--ba-llenado", llenado.toFixed(3));
      }
    };

    /** RF-21: qué hay en la mira; freno, imán y zoom automático. Devuelve el factor de freno. */
    const apuntarEnMapa = (libre: ObjetivoLibre, s: Extract<AnchorState, { tipo: "desplazando" }>, quieto: boolean, ahora: number): number => {
      const opciones = opcionesApuntar(libre, ref.current.apuntar);
      if (!opciones) return 1;
      const puntoMira = opciones.mira?.() ?? miraPorDefecto();
      const objetivos = opciones.objetivos();
      const { apuntado, destino } = resolverApuntado(puntoMira, objetivos, params);

      const el = mira.current;
      if (el) {
        el.style.left = `${puntoMira.x}px`;
        el.style.top = `${puntoMira.y}px`;
        el.style.visibility = "visible";
        if (apuntado) el.dataset.apuntado = apuntado.tipo;
        else delete el.dataset.apuntado;
      }

      if (!mismoApuntado(apuntadoAntes, apuntado)) {
        apuntadoAntes = apuntado;
        if (!mismoApuntado(s.apuntado ?? null, apuntado)) ref.current.enviar({ tipo: "APUNTAR", apuntado });
        if (!apuntado) ref.current.alApuntar(null);
        else if (apuntado.tipo === "uno") {
          const o = objetivos.find((x) => x.id === apuntado.id);
          ref.current.alApuntar({ apuntado, label: o?.label ?? apuntado.id, icon: o?.icon });
        } else {
          const n = apuntado.ids.length;
          ref.current.alApuntar({ apuntado, label: opciones.etiquetaGrupo?.(n) ?? `${n} lugares` });
        }
        if (apuntado) vibrar(params.VIB_MS);
      }

      // Imán: con el pulgar quieto, lo apuntado se acerca a la mira un poco en cada cuadro.
      if (apuntado && destino && quieto) {
        const ix = (destino.x - puntoMira.x) * params.IMAN_FUERZA;
        const iy = (destino.y - puntoMira.y) * params.IMAN_FUERZA;
        const rx = Math.abs(ix) < 1 ? Math.round(destino.x - puntoMira.x) : Math.round(ix);
        const ry = Math.abs(iy) < 1 ? Math.round(destino.y - puntoMira.y) : Math.round(iy);
        if (rx !== 0 || ry !== 0) libre.mover(rx, ry);
      }

      // Nivel 3: zoom automático solo con la mira QUIETA sobre el mismo grupo T_ZOOM_GRUPO.
      if (apuntado?.tipo === "grupo" && quieto && destino) {
        const clave = apuntado.ids.join("|");
        if (grupoQuieto?.clave !== clave) grupoQuieto = { clave, desde: ahora, hecho: false };
        else if (!grupoQuieto.hecho && ahora - grupoQuieto.desde >= params.T_ZOOM_GRUPO) {
          grupoQuieto.hecho = true;
          const miembros = objetivos.filter((x) => apuntado.ids.includes(x.id));
          opciones.acercar(zoomParaSeparar(miembros, params), destino);
          ref.current.emitir({ type: "auto_zoom", n: apuntado.ids.length });
        }
      } else grupoQuieto = null;

      return apuntado ? params.FRENO_APUNTAR : 1;
    };

    const paso = (ahora: number) => {
      const s = machine.getState();
      const dt = Math.min(64, ahora - anterior); // si la pestaña se pausó, no dar un salto
      anterior = ahora;

      if (s.tipo === "ajustando") {
        // RF-20: pulgar arriba = más (acercar), abajo = menos; con la curva de RF-18.
        const dy = s.ultimo.y - s.origen.y;
        const v = velocidadDesplazamiento(dy, params, reducido);
        if (v !== 0) ref.current.obtenerDeslizador(s.id)?.((-v * dt) / 1000);
        guiaVertical(dy);
        cuadro = requestAnimationFrame(paso);
        return;
      }
      if (s.tipo !== "desplazando" || !objetivo) return;
      const dx = s.ultimo.x - s.origen.x;
      const dy = s.ultimo.y - s.origen.y;

      if (esLibre(objetivo)) {
        // HM-11: joystick libre (mapa). La vista avanza hacia donde apunta el pulgar.
        const vel = velocidadJoystick(dx, dy, params, reducido);
        const quieto = vel.vx === 0 && vel.vy === 0;
        const freno = apuntarEnMapa(objetivo, s, quieto, ahora);
        acumuladoX += (vel.vx * freno * dt) / 1000;
        acumulado += (vel.vy * freno * dt) / 1000;
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
      guiaVertical(dy);
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
      if (apuntadoAntes) ref.current.alApuntar(null);
    };
  }, [activo, machine, params]);
}
