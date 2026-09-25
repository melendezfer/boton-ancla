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

/**
 * Íconos de las opciones fijas que agrega el ancla. Los pone la app porque los
 * íconos se registran en la app (RNF-09). No están en AnchorScreen (spec §7).
 */
export type AnchorIcons = {
  /** Opción fija "Atrás" (D-10). */
  back: ReactAnchorIcon;
  /** Opción temporal "Deshacer" (C-21). */
  undo: ReactAnchorIcon;
  /** Opción temporal "Cerrar" mientras hay una capa abierta (HM-03). */
  close: ReactAnchorIcon;
  /** Opción "Ocultar teclado" con un teclado virtual abierto (HM-06, RF-17). */
  hideKeyboard: ReactAnchorIcon;
};

export type AnchorProviderProps = {
  prefs: AnchorPrefs;
  theme: AnchorTheme;
  icons: AnchorIcons;
  /** Métricas locales (spec §9). */
  onEvent?: (evento: MetricEvent) => void;
  /** Ajustes de parámetros para las pruebas (por ejemplo ANCLA_ALTURA, HM-01). */
  params?: Partial<Params>;
  /** HM-09 (experimental): desplazar el contenido con el ancla. Por defecto false. */
  desplazar?: boolean;
  children: ReactNode;
};
