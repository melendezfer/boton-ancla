import type { AnchorPrefs, MetricEvent, Params } from "@boton-ancla/core";
import type { ComponentType, ReactNode } from "react";

/** Un ícono como componente (compatible con los de Phosphor). */
export type ReactAnchorIcon = ComponentType<{
  size?: number | string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

/**
 * Colores de la app (D-19): el componente no trae colores fijos.
 * Cualquier valor CSS sirve, por ejemplo "var(--color-terracota)".
 */
export type AnchorTheme = {
  accent: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  /** Debe ser mayor que el de las hojas inferiores de la app (RF-14). Por defecto 1100. */
  zIndex?: number;
};

export type AnchorProviderProps = {
  prefs: AnchorPrefs;
  theme: AnchorTheme;
  /** Métricas locales (spec §9). */
  onEvent?: (evento: MetricEvent) => void;
  /** Ajustes de parámetros para las pruebas (por ejemplo ANCLA_ALTURA, HM-01). */
  params?: Partial<Params>;
  children: ReactNode;
};
