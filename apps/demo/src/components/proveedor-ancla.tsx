"use client";

import { AnchorProvider, type AnchorTheme } from "@boton-ancla/react";
import type { PrefsAncla } from "@boton-ancla/core";
import { useDemo } from "@/lib/demo-store";
import { ANCHOR_ICONS } from "@/lib/icons/semantic-icons";

// Íconos de las opciones fijas, desde el registro de la demo (RNF-09).
const ICONOS = {
  back: ANCHOR_ICONS.back,
  undo: ANCHOR_ICONS.undo,
  close: ANCHOR_ICONS.close,
  hideKeyboard: ANCHOR_ICONS.hideKeyboard,
  scrollUp: ANCHOR_ICONS.scrollUp,
  scrollDown: ANCHOR_ICONS.scrollDown,
};

// Tokens de RUTEANDO para el ancla (D-19). El componente no trae colores propios.
const TEMA: AnchorTheme = {
  accent: "var(--color-terracota)",
  surface: "var(--color-surface)",
  border: "var(--color-border)",
  text: "var(--color-text)",
  textMuted: "var(--color-text-muted)",
  zIndex: 1100, // mayor que el z-[1000] de las hojas inferiores (RF-14)
};

/** Conecta las preferencias de la demo (mano, altura, colocación por orientación) con el proveedor del ancla. */
export function ProveedorAncla({ children }: { children: React.ReactNode }) {
  const { prefs, setPref, registrarMetrica } = useDemo();
  // Fase 3 (RF3-06): la vertical es `mano` + `anclaAltura`; la horizontal, aparte.
  const placement: PrefsAncla = {
    vertical: { lado: prefs.mano, altura: prefs.anclaAltura },
    ...(prefs.horizontal ? { horizontal: prefs.horizontal } : {}),
  };
  const guardar = (p: PrefsAncla) => {
    setPref("mano", p.vertical.lado);
    setPref("anclaAltura", p.vertical.altura);
    setPref("horizontal", p.horizontal ?? null);
  };
  return (
    <AnchorProvider
      prefs={{ hand: prefs.mano }}
      placement={placement}
      onPlacementChange={guardar}
      theme={TEMA}
      icons={ICONOS}
      params={{ T_ESPERA_CENTRADO: prefs.tEsperaCentrado, T_CENTRADO: prefs.tCentrado }}
      onEvent={registrarMetrica}
      desplazar={prefs.desplazar}
      desplazarLibre={prefs.moverMapa}
      apuntar={prefs.apuntar}
      guiaDesplazar={prefs.guiaDesplazar}
    >
      {children}
    </AnchorProvider>
  );
}
