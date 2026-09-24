"use client";

import {
  createAnchorMachine,
  crearGeometria,
  distancia,
  etiquetaOpcion,
  ID_ATRAS,
  ID_DESHACER,
  posicionBanda,
  textoBanda,
  type AnchorPrefs,
  type AnchorScreen,
  type AnchorState,
  type Geometry,
  type MetricEvent,
  type Params,
} from "@boton-ancla/core";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { Controlador, menuAbierto } from "../dom/controlador";
import { useMedidas, type Medidas } from "../dom/medidas";
import type { AnchorIcons, AnchorTheme, ReactAnchorIcon } from "../types";

// El ancla y todo lo que dibuja (design.md §6).

export type PropsAncla = {
  /** Copia para dibujar (cambia cuando cambia algo visible). */
  pantalla: AnchorScreen | null;
  /** La más reciente, para ejecutar acciones. */
  pantallaRef: RefObject<AnchorScreen | null>;
  prefs: AnchorPrefs;
  theme: AnchorTheme;
  icons: AnchorIcons;
  params: Params;
  onEventRef: RefObject<((evento: MetricEvent) => void) | undefined>;
};

export function Ancla({ pantalla, pantallaRef, prefs, theme, icons, params, onEventRef }: PropsAncla) {
  const medidas = useMedidas();
  const [machine] = useState(() => createAnchorMachine());
  const estado = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState);

  // Geometría para EMPEZAR una interacción. Mientras hay una abierta, se dibuja la de la máquina
  // (la foto tomada al empezar), así el abanico no se mueve bajo el dedo.
  const geo = useMemo<Geometry | null>(() => {
    if (!pantalla || !medidas) return null;
    return crearGeometria({ screen: pantalla, viewport: medidas.viewport, safeArea: medidas.safeArea, hand: prefs.hand, params });
  }, [pantalla, medidas, prefs.hand, params]);

  const geoRef = useRef<Geometry | null>(geo);
  useLayoutEffect(() => {
    geoRef.current = geo;
  });

  const [controlador] = useState(
    () =>
      new Controlador({
        machine,
        obtenerGeo: () => geoRef.current,
        obtenerPantalla: () => pantallaRef.current,
        onEvent: (m) => onEventRef.current?.(m),
        efectos: {},
      }),
  );
  useEffect(() => () => controlador.destruir(), [controlador]);

  if (!pantalla || !geo || !medidas) return null;

  const geoDibujo = "geo" in estado ? estado.geo : geo;
  const abierto = menuAbierto(estado);
  const idActivo = opcionActiva(estado);
  const iconoDe = (id: string): ReactAnchorIcon | undefined => {
    if (id === ID_ATRAS) return icons.back;
    if (id === ID_DESHACER) return icons.undo;
    return pantalla.actions.find((a) => a.id === id)?.icon as ReactAnchorIcon | undefined;
  };
  // D-09: el centro muestra la sección; con una opción activa, anticipa su ícono.
  const IconoCentro = (idActivo && iconoDe(idActivo)) || (pantalla.sectionIcon as ReactAnchorIcon);

  return (
    <div className="ba-raiz" style={variablesCss(theme, params)} data-estado={estado.tipo} data-mano={prefs.hand}>
      {abierto && <Abanico estado={estado} geo={geoDibujo} pantalla={pantalla} iconoDe={iconoDe} idActivo={idActivo} medidas={medidas} />}

      <button
        type="button"
        className={`ba-ancla${estado.tipo !== "reposo" ? " ba-ancla--activa" : ""}`}
        data-testid="ancla"
        data-geometria={JSON.stringify(resumenGeometria(geo))}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? "ba-menu" : undefined}
        aria-label={`Menú, sección ${pantalla.sectionLabel}`}
        style={{ left: geoDibujo.centro.x, top: geoDibujo.centro.y }}
        onPointerDown={(e) => controlador.bajarEnAncla(e.nativeEvent, e.currentTarget)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <IconoCentro size={26} aria-hidden />
      </button>
    </div>
  );
}

function Abanico({
  estado,
  geo,
  pantalla,
  iconoDe,
  idActivo,
  medidas,
}: {
  estado: AnchorState;
  geo: Geometry;
  pantalla: AnchorScreen;
  iconoDe: (id: string) => ReactAnchorIcon | undefined;
  idActivo: string | undefined;
  medidas: Medidas;
}) {
  const { centro, slots, params } = geo;
  const radio = slots[0] ? distancia(centro, slots[0].punto) : params.R_ARCO;
  const rExterior = radio + params.EXTRA_EXTERIOR;
  const slotActivo = slots.find((s) => s.id === idActivo);
  const mostrarAnillo =
    estado.tipo === "confirmacion_armada" || ((estado.tipo === "abierto_gesto") && slotActivo?.kind === "irreversible" && !slotActivo.disabled);

  return (
    <>
      {mostrarAnillo && (
        <div
          className={`ba-anillo${estado.tipo === "confirmacion_armada" ? " ba-anillo--armado" : ""}`}
          data-testid="anillo-exterior"
          style={{ left: centro.x, top: centro.y, width: 2 * rExterior, height: 2 * rExterior }}
          aria-hidden
        />
      )}
      <div id="ba-menu" className="ba-abanico" role="menu" aria-label={`Opciones de ${pantalla.sectionLabel}`}>
        {slots.map((s) => {
          const Icono = iconoDe(s.id);
          const activa = s.id === idActivo;
          return (
            <div
              key={s.id}
              role="menuitem"
              aria-label={etiquetaOpcion(pantalla, s.id)}
              aria-disabled={s.disabled || undefined}
              tabIndex={-1}
              className={`ba-opcion${activa ? " ba-opcion--activa" : ""}${s.disabled ? " ba-opcion--deshabilitada" : ""}${s.kind === "irreversible" ? " ba-opcion--irreversible" : ""}`}
              data-testid={`opcion-${s.id}`}
              data-activa={activa || undefined}
              style={
                {
                  left: s.punto.x,
                  top: s.punto.y,
                  "--ba-dx": `${centro.x - s.punto.x}px`,
                  "--ba-dy": `${centro.y - s.punto.y}px`,
                } as CSSProperties
              }
            >
              <span className="ba-opcion-cuerpo">{Icono && <Icono size={22} aria-hidden />}</span>
            </div>
          );
        })}
      </div>
      <Banda estado={estado} geo={geo} pantalla={pantalla} radio={radio} medidas={medidas} />
    </>
  );
}

/** Banda de etiqueta (HM-02, RF-06b): una sola etiqueta, encima del abanico. */
function Banda({ estado, geo, pantalla, radio, medidas }: { estado: AnchorState; geo: Geometry; pantalla: AnchorScreen; radio: number; medidas: Medidas }) {
  const ref = useRef<HTMLDivElement>(null);
  const contenido = textoBanda({ estado, screen: pantalla, bienvenida: false });
  const pos = posicionBanda({ anchor: geo.centro, layout: { radio }, viewport: medidas.viewport, safeArea: medidas.safeArea, hand: geo.hand, params: geo.params });

  // Se mide el texto y se corre la banda para que no se salga por los costados.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ancho = el.offsetWidth;
    const izquierda = Math.min(Math.max(pos.x - ancho / 2, pos.izquierda), pos.derecha - ancho);
    el.style.left = `${izquierda}px`;
  });

  if (!contenido) return null;
  return (
    <div
      ref={ref}
      className={`ba-banda ba-banda--${contenido.tipo}`}
      data-testid="banda"
      data-tipo={contenido.tipo}
      role="status"
      aria-live="polite"
      style={{ top: pos.yBase - geo.params.BANDA_ALTO, left: pos.x, maxWidth: pos.derecha - pos.izquierda }}
    >
      {contenido.texto}
    </div>
  );
}

/** Opción "activa" para el ícono del centro: preselección, foco o dedo apoyado. */
function opcionActiva(estado: AnchorState): string | undefined {
  switch (estado.tipo) {
    case "abierto_gesto":
    case "confirmacion_armada":
      return estado.presel;
    case "abierto_teclado":
      return estado.geo.slots[estado.foco]?.id;
    case "abierto_toque":
      return estado.presion && estado.presion.sobre !== "centro" ? estado.presion.sobre.id : undefined;
    case "confirmacion_toque":
      return estado.id;
    default:
      return undefined;
  }
}

/** Geometría legible para las pruebas E2E (dónde está cada opción antes de abrir). */
function resumenGeometria(geo: Geometry) {
  const radio = geo.slots[0] ? distancia(geo.centro, geo.slots[0].punto) : geo.params.R_ARCO;
  return {
    centro: redondear(geo.centro),
    radio: Math.round(radio * 10) / 10,
    rExterior: Math.round((radio + geo.params.EXTRA_EXTERIOR) * 10) / 10,
    slots: geo.slots.map((s) => ({ id: s.id, ...redondear(s.punto), angulo: s.angulo, kind: s.kind, disabled: s.disabled })),
  };
}

function redondear(p: { x: number; y: number }) {
  return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
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
