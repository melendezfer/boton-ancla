"use client";

import { AnchorProvider, type AnchorTheme } from "@boton-ancla/react";
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

/** Conecta las preferencias de la demo (mano, altura) con el proveedor del ancla. */
export function ProveedorAncla({ children }: { children: React.ReactNode }) {
  const { prefs, registrarMetrica } = useDemo();
  return (
    <AnchorProvider
      prefs={{ hand: prefs.mano }}
      theme={TEMA}
      icons={ICONOS}
      params={{ ANCLA_ALTURA: prefs.anclaAltura }}
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
