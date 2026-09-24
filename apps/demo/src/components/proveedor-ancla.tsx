"use client";

import { AnchorProvider, type AnchorTheme } from "@boton-ancla/react";
import { useDemo } from "@/lib/demo-store";

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
  const { prefs } = useDemo();
  return (
    <AnchorProvider prefs={{ hand: prefs.mano }} theme={TEMA} params={{ ANCLA_ALTURA: prefs.anclaAltura }}>
      {children}
    </AnchorProvider>
  );
}
