"use client";

import { useEffect, useRef, useState } from "react";

// Señales del entorno que cancelan la interacción u ocultan el ancla (T-20).

/** Si el alto visible cae más que esto, se asume que hay un teclado virtual abierto. */
const CAIDA_TECLADO_PX = 150;

function esEditable(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !["button", "checkbox", "radio", "range", "submit", "reset", "file", "color"].includes(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

/**
 * RF-13: ¿hay un teclado virtual abierto? (L-04: no hay API estándar en iOS).
 * - El alto visible (visualViewport) cayó más de 150 px respecto de la ventana; o
 * - en un dispositivo táctil, hay un campo de texto enfocado (el teclado sale siempre).
 */
export function useTecladoAbierto(): boolean {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const tactil = window.matchMedia("(pointer: coarse)");
    const revisar = () => {
      const vv = window.visualViewport;
      const cayo = vv ? window.innerHeight - vv.height > CAIDA_TECLADO_PX : false;
      setAbierto(cayo || (tactil.matches && esEditable(document.activeElement)));
    };
    revisar();
    document.addEventListener("focusin", revisar);
    document.addEventListener("focusout", revisar);
    window.visualViewport?.addEventListener("resize", revisar);
    return () => {
      document.removeEventListener("focusin", revisar);
      document.removeEventListener("focusout", revisar);
      window.visualViewport?.removeEventListener("resize", revisar);
    };
  }, []);

  return abierto;
}

/** RF-09: llama `alCambiar` cuando cambia la orientación (screen.orientation, o matchMedia en iOS < 16.4: L-11). */
export function useCambioOrientacion(alCambiar: () => void) {
  const ref = useRef(alCambiar);
  useEffect(() => {
    ref.current = alCambiar;
  });

  useEffect(() => {
    const avisar = () => ref.current();
    const orientacion = typeof screen !== "undefined" ? screen.orientation : undefined;
    if (orientacion) {
      orientacion.addEventListener("change", avisar);
      return () => orientacion.removeEventListener("change", avisar);
    }
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", avisar);
    return () => mq.removeEventListener("change", avisar);
  }, []);
}
