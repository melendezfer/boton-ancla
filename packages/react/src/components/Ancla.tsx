"use client";

import { layoutParaPantalla, type AnchorPrefs, type AnchorScreen, type MetricEvent, type Params } from "@boton-ancla/core";
import { useMemo, type CSSProperties, type RefObject } from "react";
import { useMedidas } from "../dom/medidas";
import type { AnchorTheme, ReactAnchorIcon } from "../types";

// El ancla y todo lo que dibuja (design.md §6).

export type PropsAncla = {
  /** Copia para dibujar (cambia cuando cambia algo visible). */
  pantalla: AnchorScreen | null;
  /** La más reciente, para ejecutar acciones. */
  pantallaRef: RefObject<AnchorScreen | null>;
  prefs: AnchorPrefs;
  theme: AnchorTheme;
  params: Params;
  onEventRef: RefObject<((evento: MetricEvent) => void) | undefined>;
};

export function Ancla({ pantalla, prefs, theme, params }: PropsAncla) {
  const medidas = useMedidas();

  const calculo = useMemo(() => {
    if (!pantalla || !medidas) return null;
    return layoutParaPantalla({ screen: pantalla, viewport: medidas.viewport, safeArea: medidas.safeArea, hand: prefs.hand, params });
  }, [pantalla, medidas, prefs.hand, params]);

  if (!pantalla || !calculo) return null;

  const { anchor } = calculo;
  const IconoSeccion = pantalla.sectionIcon as ReactAnchorIcon;

  return (
    <div className="ba-raiz" style={variablesCss(theme, params)} data-estado="reposo">
      <button
        type="button"
        className="ba-ancla"
        data-testid="ancla"
        aria-haspopup="menu"
        aria-expanded={false}
        aria-label={`Menú, sección ${pantalla.sectionLabel}`}
        style={{ left: anchor.x, top: anchor.y }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <IconoSeccion size={26} aria-hidden />
      </button>
    </div>
  );
}

/** Colores de la app y medidas de los parámetros como variables CSS (--ba-*). */
function variablesCss(theme: AnchorTheme, params: Params): CSSProperties {
  return {
    "--ba-accent": theme.accent,
    "--ba-surface": theme.surface,
    "--ba-border": theme.border,
    "--ba-text": theme.text,
    "--ba-text-muted": theme.textMuted,
    "--ba-z": String(theme.zIndex ?? 1100),
    "--ba-d-reposo": `${params.D_REPOSO}px`,
    "--ba-d-activo": `${params.D_ACTIVO}px`,
    "--ba-d-opcion": `${params.D_OPCION}px`,
    "--ba-escala-presel": String(params.ESCALA_PRESEL),
    "--ba-escala-activo": String(params.D_ACTIVO / params.D_REPOSO),
    "--ba-opacidad-reposo": `${Math.round(params.OPACIDAD_REPOSO * 100)}%`,
    "--ba-t-anim": `${params.T_ANIM}ms`,
    "--ba-banda-alto": `${params.BANDA_ALTO}px`,
  } as CSSProperties;
}
