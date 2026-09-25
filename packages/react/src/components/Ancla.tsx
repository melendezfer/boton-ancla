"use client";

import {
  createAnchorMachine,
  crearGeometria,
  distancia,
  etiquetaOpcion,
  ID_ATRAS,
  mostrarEtiqueta,
  necesitaDemostracion,
  ID_DESHACER,
  posicionBanda,
  radioDe,
  textoBanda,
  type AnchorPrefs,
  type AnchorScreen,
  type AnchorState,
  type Geometry,
  type MetricEvent,
  type Params,
} from "@boton-ancla/core";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { Controlador, menuAbierto, type EfectosAncla } from "../dom/controlador";
import { useBienvenida } from "../dom/bienvenida";
import { useCambioOrientacion, useTecladoAbierto } from "../dom/entorno";
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

/** Avisos del ancla (T-19): deshacer (RF-08), irreversible bloqueada (HU-08) o error (C-19). */
type Aviso =
  | { tipo: "deshacer"; texto: string; hasta: number }
  | { tipo: "bloqueado"; texto: string; hasta: number }
  | { tipo: "error"; texto: string; hasta: number };

const DURACION_AVISO_MS = 2500;

export function Ancla({ pantalla, pantallaRef, prefs, theme, icons, params, onEventRef }: PropsAncla) {
  const medidas = useMedidas();
  const [machine] = useState(() => createAnchorMachine());
  // RNF-03: el estado de la máquina cambia en CADA pointermove (última posición, recorrido),
  // pero en pantalla solo cambia algo con la preselección, el foco, el dedo apoyado, etc.
  // React solo se entera de los cambios visibles: evita redibujar el ancla en cada movimiento.
  const vista = useRef<AnchorState | null>(null);
  const leerVista = useCallback(() => {
    const actual = machine.getState();
    if (vista.current && mismaVista(vista.current, actual)) return vista.current;
    vista.current = actual;
    return actual;
  }, [machine]);
  const estado = useSyncExternalStore(machine.subscribe, leerVista, leerVista);

  // --- Avisos y deshacer (T-19) ---
  const [aviso, setAviso] = useState<Aviso | null>(null);
  /** Acción que se puede deshacer mientras dura el aviso (C-21: sigue aunque cambie la sección). */
  const deshacerRef = useRef<{ accionId: string; onUndo: () => void } | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => {
      if (aviso.tipo === "deshacer") deshacerRef.current = null;
      setAviso(null);
    }, Math.max(0, aviso.hasta - performance.now()));
    return () => clearTimeout(t);
  }, [aviso]);

  // --- Bienvenida (HU-12, T-23) ---
  const bienvenida = useBienvenida();

  const deshacer = () => {
    const d = deshacerRef.current;
    if (!d) return;
    deshacerRef.current = null;
    setAviso(null);
    try {
      d.onUndo();
    } catch (error) {
      console.error("[boton-ancla] deshacer falló:", error);
    }
    onEventRef.current?.({ type: "undo", id: d.accionId });
  };

  const efectos: EfectosAncla = {
    alEjecutar: (id, p, resultado) => {
      bienvenida.usar(id); // C-17: uso = ejecución
      const accion = p.actions.find((a) => a.id === id);
      const mostrarDeshacer = () => {
        if (accion?.kind !== "reversible" || !accion.onUndo) return;
        deshacerRef.current = { accionId: accion.id, onUndo: accion.onUndo };
        setAviso({ tipo: "deshacer", texto: accion.undoMessage ?? accion.label, hasta: performance.now() + params.T_DESHACER });
      };
      if (resultado instanceof Promise) {
        // C-19: con una promesa, el deshacer aparece al resolver; si falla, un aviso de error.
        resultado.then(mostrarDeshacer, (error: unknown) => {
          console.error("[boton-ancla] la acción falló:", error);
          setAviso({ tipo: "error", texto: "No se pudo completar la acción", hasta: performance.now() + DURACION_AVISO_MS });
        });
      } else mostrarDeshacer();
    },
    alBloquear: () =>
      setAviso({ tipo: "bloqueado", texto: "Desliza más allá para confirmar", hasta: performance.now() + DURACION_AVISO_MS }),
    alDeshacer: deshacer,
  };
  const efectosRef = useRef(efectos);
  useLayoutEffect(() => {
    efectosRef.current = efectos;
  });

  // Geometría para EMPEZAR una interacción. Mientras hay una abierta, se dibuja la de la máquina
  // (la foto tomada al empezar), así el abanico no se mueve bajo el dedo.
  const geo = useMemo<Geometry | null>(() => {
    if (!pantalla || !medidas) return null;
    return crearGeometria({
      screen: pantalla,
      viewport: medidas.viewport,
      safeArea: medidas.safeArea,
      hand: prefs.hand,
      params,
      // C-21: mientras hay algo para deshacer, "Deshacer" reemplaza a la prioridad 1.
      deshacer: aviso?.tipo === "deshacer",
    });
  }, [pantalla, medidas, prefs.hand, params, aviso?.tipo]);

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
        // Siempre la versión más reciente de los efectos (usan estado de React).
        efectos: {
          alEjecutar: (...a) => efectosRef.current.alEjecutar?.(...a),
          alBloquear: (...a) => efectosRef.current.alBloquear?.(...a),
          alDeshacer: () => efectosRef.current.alDeshacer?.(),
        },
      }),
  );
  useEffect(() => () => controlador.destruir(), [controlador]);

  const velo = useVelo(estado);

  // RF-09: un cambio de orientación cancela la interacción.
  useCambioOrientacion(() => controlador.enviar({ tipo: "ORIENTACION" }));

  // RF-10: si la app cambia de sección con el menú abierto, se cancela. El cambio que
  // provoca una acción ejecutada (p. ej. "Carta") llega cuando el ancla ya está en reposo.
  const idSeccion = pantalla?.id;
  const seccionAnterior = useRef(idSeccion);
  useEffect(() => {
    if (seccionAnterior.current !== idSeccion) {
      seccionAnterior.current = idSeccion;
      controlador.enviar({ tipo: "CAMBIO_SECCION" });
    }
  }, [idSeccion, controlador]);

  // RF-13: con el teclado abierto el ancla se oculta (valor por defecto de la spec).
  const teclado = useTecladoAbierto();

  // RNF-05: foco itinerante. Con teclado, el foco va a la opción activa; al cerrar, vuelve al ancla.
  const refBoton = useRef<HTMLButtonElement>(null);
  const refRaiz = useRef<HTMLDivElement>(null);
  const tipoAnterior = useRef(estado.tipo);
  const focoTeclado = estado.tipo === "abierto_teclado" ? estado.foco : -1;
  useEffect(() => {
    const raiz = refRaiz.current;
    if (estado.tipo === "abierto_teclado") {
      raiz?.querySelectorAll<HTMLElement>('[role="menuitem"]')[focoTeclado]?.focus();
    } else if (estado.tipo === "confirmacion_toque" && estado.modo === "teclado") {
      raiz?.querySelector<HTMLElement>('[data-testid="confirmar"]')?.focus();
    } else if (estado.tipo === "reposo" && ["abierto_teclado", "confirmacion_toque"].includes(tipoAnterior.current)) {
      // Si el foco quedó dentro del menú (que ya no existe), vuelve al ancla.
      const activo = document.activeElement;
      if (!activo || activo === document.body || raiz?.contains(activo)) refBoton.current?.focus();
    }
    tipoAnterior.current = estado.tipo;
  }, [estado, focoTeclado]);

  if (!pantalla || !geo || !medidas) return null;

  const geoDibujo = "geo" in estado ? estado.geo : geo;
  const abierto = menuAbierto(estado);
  const idActivo = opcionActiva(estado);
  // HU-12: la bienvenida sigue mientras alguna opción de la pantalla esté en sus primeros usos.
  const bienvenidaActiva =
    bienvenida.estado !== null && geoDibujo.slots.some((s) => mostrarEtiqueta(bienvenida.estado!, s.id, params));
  const demostrar = bienvenida.estado !== null && necesitaDemostracion(bienvenida.estado) && estado.tipo === "reposo";
  const slotDemostracion = geoDibujo.slots.find((s) => s.id === geoDibujo.prioridad1) ?? geoDibujo.slots[0];
  const iconoDe = (id: string): ReactAnchorIcon | undefined => {
    if (id === ID_ATRAS) return icons.back;
    if (id === ID_DESHACER) return icons.undo;
    return pantalla.actions.find((a) => a.id === id)?.icon as ReactAnchorIcon | undefined;
  };
  // D-09: el centro muestra la sección; con una opción activa, anticipa su ícono.
  const IconoCentro = (idActivo && iconoDe(idActivo)) || (pantalla.sectionIcon as ReactAnchorIcon);

  return (
    <div
      ref={refRaiz}
      className={`ba-raiz${teclado && estado.tipo === "reposo" ? " ba-raiz--oculta" : ""}`}
      style={variablesCss(theme, params)}
      data-estado={estado.tipo}
      data-mano={prefs.hand}
      data-oculta={(teclado && estado.tipo === "reposo") || undefined}
    >
      {velo.visible && (
        // RF-11, L-06: tapa el contenido mientras el menú está abierto sin dedo apoyado
        // (toque, teclado) y un momento después, para tragarse el "clic fantasma".
        <div
          className="ba-velo"
          data-testid="velo"
          aria-hidden
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            velo.retirar();
          }}
        />
      )}
      {abierto && (
        <Abanico
          estado={estado}
          geo={geoDibujo}
          pantalla={pantalla}
          iconoDe={iconoDe}
          idActivo={idActivo}
          medidas={medidas}
          bienvenida={bienvenidaActiva}
        />
      )}

      {demostrar && slotDemostracion && (
        // HU-12: la primera vez, la opción de prioridad 1 sale del ancla y vuelve.
        <div
          className="ba-demostracion"
          data-testid="demostracion"
          aria-hidden
          style={
            {
              left: slotDemostracion.punto.x,
              top: slotDemostracion.punto.y,
              "--ba-dx": `${geoDibujo.centro.x - slotDemostracion.punto.x}px`,
              "--ba-dy": `${geoDibujo.centro.y - slotDemostracion.punto.y}px`,
            } as CSSProperties
          }
          onAnimationEnd={bienvenida.terminarDemostracion}
        >
          <span className="ba-opcion-cuerpo">
            {(() => {
              const Icono = iconoDe(slotDemostracion.id);
              return Icono ? <Icono size={22} aria-hidden /> : null;
            })()}
          </span>
        </div>
      )}

      {estado.tipo === "confirmacion_toque" && (
        <ZonaAviso geo={estado.geo} medidas={medidas}>
          {/* Irreversible en modo toque: confirmar con un toque explícito (§3). */}
          <button
            type="button"
            className="ba-aviso ba-aviso--confirmar"
            data-ba-control
            data-testid="confirmar"
            onClick={() => controlador.enviar({ tipo: "CONFIRMAR", t: performance.now() })}
          >
            Confirmar: {etiquetaOpcion(pantalla, estado.id)}
          </button>
        </ZonaAviso>
      )}

      {aviso && estado.tipo !== "confirmacion_toque" && (
        <ZonaAviso geo={geoDibujo} medidas={medidas}>
          {aviso.tipo === "deshacer" ? (
            // RF-08: tocar el aviso también deshace (además de "Deshacer" en el abanico).
            <button type="button" className="ba-aviso" data-ba-control data-testid="aviso" onClick={deshacer}>
              {aviso.texto} · <strong>Deshacer</strong>
            </button>
          ) : (
            <div className={`ba-aviso ba-aviso--${aviso.tipo}`} data-ba-control data-testid="aviso">
              {aviso.texto}
            </div>
          )}
        </ZonaAviso>
      )}

      <button
        ref={refBoton}
        type="button"
        className={`ba-ancla${claseAncla(estado)}`}
        data-testid="ancla"
        data-geometria={JSON.stringify(resumenGeometria(geo))}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? "ba-menu" : undefined}
        aria-label={`Menú, sección ${pantalla.sectionLabel}`}
        style={{ left: geoDibujo.centro.x, top: geoDibujo.centro.y }}
        onPointerDown={(e) => controlador.bajarEnAncla(e.nativeEvent, e.currentTarget)}
        onKeyDown={(e) => controlador.teclaEnAncla(e.nativeEvent)}
        onClick={() => controlador.clicEnAncla()}
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
  bienvenida,
}: {
  estado: AnchorState;
  geo: Geometry;
  pantalla: AnchorScreen;
  iconoDe: (id: string) => ReactAnchorIcon | undefined;
  idActivo: string | undefined;
  medidas: Medidas;
  bienvenida: boolean;
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
      <Banda estado={estado} geo={geo} pantalla={pantalla} radio={radio} medidas={medidas} bienvenida={bienvenida} />
    </>
  );
}

/** Banda de etiqueta (HM-02, RF-06b): una sola etiqueta, encima del abanico. */
function Banda({
  estado,
  geo,
  pantalla,
  radio,
  medidas,
  bienvenida,
}: {
  estado: AnchorState;
  geo: Geometry;
  pantalla: AnchorScreen;
  radio: number;
  medidas: Medidas;
  bienvenida: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const contenido = textoBanda({ estado, screen: pantalla, bienvenida });
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

const ESTADOS_CON_VELO: readonly AnchorState["tipo"][] = ["abierto_toque", "confirmacion_toque", "abierto_teclado"];
/** Cuánto sigue el velo después de cerrar: cubre el click que llega tras el pointerup (L-06). */
const VELO_EXTRA_MS = 400;

function useVelo(estado: AnchorState) {
  const conVelo = ESTADOS_CON_VELO.includes(estado.tipo);
  const [demorado, setDemorado] = useState(false);
  const [antes, setAntes] = useState(conVelo);

  // Al salir de un estado con velo, el velo sigue VELO_EXTRA_MS más.
  if (antes !== conVelo) {
    setAntes(conVelo);
    if (!conVelo) setDemorado(true);
  }

  useEffect(() => {
    if (!demorado) return;
    const t = setTimeout(() => setDemorado(false), VELO_EXTRA_MS);
    return () => clearTimeout(t);
  }, [demorado]);

  return { visible: conVelo || demorado, retirar: () => setDemorado(false) };
}

/**
 * Aspecto del ancla: activa (sólida, más grande) al armar y con el menú abierto; en
 * descanso sigue translúcida y solo muestra un anillo sutil (HU-04): el pulgar está
 * apoyado para leer, no para actuar.
 */
function claseAncla(estado: AnchorState): string {
  if (estado.tipo === "reposo") return "";
  if (estado.tipo === "descanso") return " ba-ancla--descanso";
  return " ba-ancla--activa";
}

/**
 * Zona de avisos: justo encima de donde va la banda de etiqueta, fuera del alcance del
 * pulgar y sin tapar el ancla (design.md §6). Se corre para no salirse por los costados.
 */
function ZonaAviso({ geo, medidas, children }: { geo: Geometry; medidas: Medidas; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const radio = radioDe(geo.centro, geo.slots, geo.params);
  const pos = posicionBanda({ anchor: geo.centro, layout: { radio }, viewport: medidas.viewport, safeArea: medidas.safeArea, hand: geo.hand, params: geo.params });
  const abajo = pos.yBase - geo.params.BANDA_ALTO - 8;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ancho = el.offsetWidth;
    el.style.left = `${Math.min(Math.max(pos.x - ancho / 2, pos.izquierda), pos.derecha - ancho)}px`;
    el.style.top = `${Math.max(medidas.safeArea.top + 4, abajo - el.offsetHeight)}px`;
  });

  return (
    <div ref={ref} className="ba-zona-aviso" role="status" aria-live="polite" style={{ left: pos.x, top: abajo - 44, maxWidth: pos.derecha - pos.izquierda }}>
      {children}
    </div>
  );
}

/** ¿Dos estados se dibujan igual? (Todo lo que el render usa de `estado` tiene que estar aquí.) */
function mismaVista(a: AnchorState, b: AnchorState): boolean {
  if (a === b) return true;
  if (a.tipo !== b.tipo) return false;
  if (("geo" in a ? a.geo : null) !== ("geo" in b ? b.geo : null)) return false;
  const presion = (e: AnchorState) =>
    e.tipo === "abierto_toque" && e.presion ? (e.presion.sobre === "centro" ? "centro" : e.presion.sobre.id) : "";
  return (
    opcionActiva(a) === opcionActiva(b) &&
    presion(a) === presion(b) &&
    (a.tipo !== "confirmacion_toque" || (b.tipo === "confirmacion_toque" && a.modo === b.modo)) &&
    (a.tipo !== "abierto_teclado" || (b.tipo === "abierto_teclado" && a.foco === b.foco))
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
