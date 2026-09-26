"use client";

import {
  createAnchorMachine,
  crearGeometria,
  distancia,
  etiquetaOpcion,
  ID_ATRAS,
  ID_CERRAR,
  ID_DESHACER,
  ID_OCULTAR_TECLADO,
  mismoApuntado,
  pantallaDeCapa,
  posicionGuiaArriba,
  mostrarEtiqueta,
  necesitaDemostracion,
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
import { esLibre, type ObjetivoDesplazar } from "../AnchorProvider";
import { useBienvenida } from "../dom/bienvenida";
import { miraPorDefecto, opcionesApuntar, useBucleDesplazamiento, type InfoApuntado } from "../dom/desplazar";
import type { ControlCapas } from "../dom/capas";
import { useCambioOrientacion, useTeclado } from "../dom/entorno";
import { useMedidas, type Medidas } from "../dom/medidas";
import type { AnchorIcons, AnchorTheme, GuiaDesplazar, ReactAnchorIcon } from "../types";

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
  /** Capas abiertas encima del contenido (HM-03). */
  capas: ControlCapas;
  /** HM-09 (experimental): desplazar con el ancla. */
  desplazar: boolean;
  /** HM-11 (experimental): joystick libre para el mapa (useAnchorPan). */
  desplazarLibre: boolean;
  /** HM-12a (experimental): apuntar y elegir en el mapa (RF-21). */
  apuntar: boolean;
  /** Contenido principal registrado con useAnchorScroll. */
  objetivoDesplazar: RefObject<ObjetivoDesplazar | null>;
  /** Cambia cuando se registra o quita el contenido principal. */
  versionObjetivo: number;
  /** HM-10: variante de la guía al desplazar. */
  guiaDesplazar: GuiaDesplazar;
};

/** Avisos del ancla (T-19): deshacer (RF-08), irreversible bloqueada (HU-08) o error (C-19). */
type Aviso =
  | { tipo: "deshacer"; texto: string; hasta: number }
  | { tipo: "bloqueado"; texto: string; hasta: number }
  | { tipo: "error"; texto: string; hasta: number };

const DURACION_AVISO_MS = 2500;

export function Ancla({
  pantalla,
  pantallaRef,
  prefs,
  theme,
  icons,
  params,
  onEventRef,
  capas,
  desplazar,
  desplazarLibre,
  apuntar,
  objetivoDesplazar,
  versionObjetivo,
  guiaDesplazar,
}: PropsAncla) {
  const medidas = useMedidas();
  const [machine] = useState(() => createAnchorMachine());
  // RNF-03: el estado de la máquina cambia en CADA pointermove (última posición, recorrido),
  // pero en pantalla solo cambia algo con la preselección, el foco, el dedo apoyado, etc.
  // React solo se entera de los cambios visibles: evita redibujar el ancla en cada movimiento.
  const vistaCache = useRef<AnchorState | null>(null);
  const leerVista = useCallback(() => {
    const actual = machine.getState();
    if (vistaCache.current && mismaVista(vistaCache.current, actual)) return vistaCache.current;
    vistaCache.current = actual;
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

  // RF-20: pista del deslizador (aparte del aviso, para no borrar un "Deshacer" vigente).
  const [pista, setPista] = useState<{ texto: string; hasta: number } | null>(null);
  useEffect(() => {
    if (!pista) return;
    const t = setTimeout(() => setPista(null), Math.max(0, pista.hasta - performance.now()));
    return () => clearTimeout(t);
  }, [pista]);

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
    alCerrarCapa: () => capas.cerrarArriba("ancla"),
    // RF-20: soltó sobre un deslizador sin esperar: la banda muestra su pista.
    alPista: (id) => {
      const accion = vistaRef.current?.actions.find((a) => a.id === id);
      setPista({ texto: accion?.slideHint ?? `Mantén sobre ${accion?.label ?? id}`, hasta: performance.now() + DURACION_AVISO_MS });
    },
    // RF-21: soltó frenado sobre algo en la mira: la app abre su capa.
    alElegir: (apuntado) => opcionesApuntar(objetivoDesplazar.current, apuntar)?.elegir(apuntado),
  };
  const efectosRef = useRef(efectos);
  useLayoutEffect(() => {
    efectosRef.current = efectos;
  });

  // HM-08: con una capa abierta, lo que se ve es la capa (su ícono, nombre y acciones, con
  // "Cerrar" a 90°); la pantalla de fondo se oculta y vuelve al cerrar.
  const { version: versionCapas, cantidad: cantidadCapasVista, datosArriba } = capas;
  const hayCapa = cantidadCapasVista > 0;
  const vista = useMemo<AnchorScreen | null>(() => {
    if (!pantalla) return null;
    const arriba = hayCapa ? datosArriba() : null;
    return arriba ? pantallaDeCapa(pantalla, arriba) : pantalla;
    // versionCapas: se recalcula cuando una capa cambia sus datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantalla, hayCapa, versionCapas, datosArriba]);

  // HM-09: ¿hay algo que desplazar? Con una capa abierta, solo la capa (su scrollRef); si no,
  // el contenido principal (useAnchorScroll). El mapa no se registra: HU-13 intacta.
  const obtenerObjetivo = useCallback((): ObjetivoDesplazar | null => {
    if (capas.cantidad > 0) return capas.datosArriba()?.scrollRef?.current ?? null;
    return objetivoDesplazar.current;
  }, [capas, objetivoDesplazar]);
  // HM-11: sin capa y con un mapa registrado (useAnchorPan), el joystick es libre y tiene su propio interruptor.
  const { desplazable, modoDesplazar } = useMemo(() => {
    if (hayCapa) return { desplazable: desplazar && Boolean(datosArriba()?.scrollRef), modoDesplazar: "vertical" as const };
    const objetivo = objetivoDesplazar.current;
    if (esLibre(objetivo)) return { desplazable: desplazarLibre, modoDesplazar: "libre" as const };
    return { desplazable: desplazar && objetivo !== null, modoDesplazar: "vertical" as const };
    // versionCapas y versionObjetivo: se recalcula al registrar o quitar objetivos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desplazar, desplazarLibre, hayCapa, versionCapas, versionObjetivo, datosArriba, objetivoDesplazar]);

  // HM-06 / RF-13: con el teclado abierto el ancla NO se oculta: se ubica en el alto visible
  // (sobre el teclado) y agrega "Ocultar teclado" a 180° (RF-17).
  const teclado = useTeclado();

  // Geometría para EMPEZAR una interacción. Mientras hay una abierta, se dibuja la de la máquina
  // (la foto tomada al empezar), así el abanico no se mueve bajo el dedo.
  const geo = useMemo<Geometry | null>(() => {
    if (!vista || !medidas) return null;
    const viewport = teclado.abierto ? { ...medidas.viewport, height: medidas.viewport.height - teclado.alto } : medidas.viewport;
    return crearGeometria({
      screen: vista,
      viewport,
      safeArea: teclado.abierto ? { ...medidas.safeArea, bottom: 0 } : medidas.safeArea,
      hand: prefs.hand,
      params,
      // C-21: mientras hay algo para deshacer, "Deshacer" reemplaza a la prioridad 1 (de la capa, si hay: HM-08 1-A).
      deshacer: aviso?.tipo === "deshacer",
      // HM-03/HM-08: el "Atrás" de la capa se convierte en "Cerrar" a 90°.
      capa: hayCapa,
      teclado: teclado.abierto,
      desplazable,
      modoDesplazar,
    });
  }, [vista, medidas, prefs.hand, params, aviso?.tipo, hayCapa, teclado.abierto, teclado.alto, desplazable, modoDesplazar]);

  // Pantalla más reciente para EJECUTAR (acciones de la capa o de la sección, siempre al día).
  const vistaRef = useRef<AnchorScreen | null>(null);
  useLayoutEffect(() => {
    const fondo = pantallaRef.current;
    const arriba = capas.cantidad > 0 ? capas.datosArriba() : null;
    vistaRef.current = fondo && arriba ? pantallaDeCapa(fondo, arriba) : fondo;
  });

  const geoRef = useRef<Geometry | null>(geo);
  useLayoutEffect(() => {
    geoRef.current = geo;
  });

  const [controlador] = useState(
    () =>
      new Controlador({
        machine,
        obtenerGeo: () => geoRef.current,
        obtenerPantalla: () => vistaRef.current,
        onEvent: (m) => onEventRef.current?.(m),
        // Siempre la versión más reciente de los efectos (usan estado de React).
        efectos: {
          alEjecutar: (...a) => efectosRef.current.alEjecutar?.(...a),
          alBloquear: (...a) => efectosRef.current.alBloquear?.(...a),
          alDeshacer: () => efectosRef.current.alDeshacer?.(),
          alCerrarCapa: () => efectosRef.current.alCerrarCapa?.(),
          alPista: (id) => efectosRef.current.alPista?.(id),
          alElegir: (a) => efectosRef.current.alElegir?.(a),
        },
      }),
  );
  useEffect(() => () => controlador.destruir(), [controlador]);

  const velo = useVelo(estado);

  // HM-09: bucle de desplazamiento y punto de la guía (sin redibujar React en cada cuadro).
  const puntoGuia = useRef<HTMLDivElement>(null);
  const refMira = useRef<HTMLDivElement>(null);
  const [infoApuntado, setInfoApuntado] = useState<InfoApuntado | null>(null);
  const refRaiz = useRef<HTMLDivElement>(null);
  const indicador = guiaDesplazar === "ancla" ? refRaiz : SIN_ELEMENTO;
  useBucleDesplazamiento({
    machine,
    estado,
    params,
    obtenerObjetivo,
    puntoGuia,
    indicador,
    obtenerDeslizador: (id) => vistaRef.current?.actions.find((a) => a.id === id)?.onSlide,
    apuntar,
    mira: refMira,
    enviar: (e) => controlador.enviar(e),
    emitir: (m) => onEventRef.current?.(m),
    alApuntar: setInfoApuntado,
  });

  // RF-09: un cambio de orientación cancela la interacción.
  useCambioOrientacion(() => controlador.enviar({ tipo: "ORIENTACION" }));

  // RF-10: si la app cambia de sección con el menú abierto, se cancela. El cambio que
  // provoca una acción ejecutada (p. ej. "Carta") llega cuando el ancla ya está en reposo.
  const idSeccion = vista?.id; // abrir o cerrar una capa también cuenta (HM-08)
  const seccionAnterior = useRef(idSeccion);
  useEffect(() => {
    if (seccionAnterior.current !== idSeccion) {
      seccionAnterior.current = idSeccion;
      controlador.enviar({ tipo: "CAMBIO_SECCION" });
    }
  }, [idSeccion, controlador]);

  // HM-03 (sub-pregunta D): con una capa abierta y el menú cerrado, Escape cierra la capa.
  const { cantidad: cantidadCapas, cerrarArriba } = capas;
  useEffect(() => {
    if (cantidadCapas === 0) return;
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || machine.getState().tipo !== "reposo") return;
      e.preventDefault();
      cerrarArriba("teclado");
    };
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [cantidadCapas, cerrarArriba, machine]);


  // HU-12, C-17: ajustar un deslizador (Zoom) cuenta como un uso, igual que ejecutar una opción.
  const idAjustando = estado.tipo === "ajustando" ? estado.id : null;
  const usarBienvenida = bienvenida.usar;
  useEffect(() => {
    if (idAjustando) usarBienvenida(idAjustando);
  }, [idAjustando, usarBienvenida]);

  // RNF-05: foco itinerante. Con teclado, el foco va a la opción activa; al cerrar, vuelve al ancla.
  const refBoton = useRef<HTMLButtonElement>(null);
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

  if (!pantalla || !vista || !geo || !medidas) return null;

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
    if (id === ID_CERRAR) return icons.close;
    if (id === ID_OCULTAR_TECLADO) return icons.hideKeyboard;
    return vista.actions.find((a) => a.id === id)?.icon as ReactAnchorIcon | undefined;
  };
  // D-09: el centro muestra la sección (o la capa abierta, HM-08); con una opción activa, anticipa su ícono.
  const IconoCentro = (idActivo && iconoDe(idActivo)) || (vista.sectionIcon as ReactAnchorIcon);
  const desplazando = estado.tipo === "desplazando";
  const libre = desplazando && geoDibujo.modoDesplazar === "libre"; // HM-11
  // RF-20: ajustar un deslizador (Zoom) usa la misma guía vertical que desplazar.
  const conGuia = desplazando || estado.tipo === "ajustando";
  // RF-21: la mira se ve mientras el joystick del mapa está activo y la app ofrece apuntar.
  const opcionesMira = libre ? opcionesApuntar(objetivoDesplazar.current, apuntar) : undefined;
  const puntoMira = opcionesMira ? (opcionesMira.mira?.() ?? miraPorDefecto()) : null;
  const apuntadoVisible = conGuia ? infoApuntado : null;
  // HM-10, variante "arriba": la cápsula arriba del ancla, corrida hacia el centro y fuera del alcance del pulgar.
  // HM-11: en el joystick libre es un círculo (el punto se mueve en 2D a la mitad de la distancia).
  const altoGuia = libre ? DIAMETRO_CIRCULO(params) : 2 * params.R_MAX_DESPLAZAR + ALTO_EXTRA_GUIA;
  const guiaArriba =
    conGuia && guiaDesplazar === "arriba"
      ? posicionGuiaArriba({
          centro: geoDibujo.centro,
          origen: estado.origen,
          hand: prefs.hand,
          params,
          alto: altoGuia,
          techo: medidas.safeArea.top + 8,
        })
      : null;

  return (
    <div
      ref={refRaiz}
      className="ba-raiz"
      style={variablesCss(theme, params)}
      data-estado={estado.tipo}
      data-mano={prefs.hand}
      data-teclado={teclado.abierto || undefined}
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
          pantalla={vista}
          iconoDe={iconoDe}
          idActivo={idActivo}
          medidas={medidas}
          bienvenida={bienvenidaActiva}
        />
      )}

      {guiaArriba && libre && (
        // HM-11: círculo arriba del ancla; el punto sigue al pulgar en 2D y la flecha apunta a la dirección real.
        <div
          className="ba-guia-circulo"
          data-testid="guia-desplazar"
          data-variante="arriba"
          data-modo="libre"
          aria-hidden
          style={{ left: guiaArriba.x, top: guiaArriba.top + guiaArriba.alto / 2, width: guiaArriba.alto, height: guiaArriba.alto }}
        >
          <span className="ba-guia-cruz" />
          <span className="ba-flecha-libre" data-testid="flecha-libre">
            <FlechaIcono icono={icons.scrollUp} sentido="arriba" tamano={18} />
          </span>
          <div
            ref={puntoGuia}
            className="ba-guia-punto"
            data-escala={Math.max(0, guiaArriba.alto / 2 - 12) / params.R_MAX_DESPLAZAR}
          />
        </div>
      )}

      {guiaArriba && !libre && (
        // HM-10 A: cápsula translúcida arriba del ancla; su borde de abajo queda por encima del pulgar.
        <div
          className="ba-guia-desplazar"
          data-testid="guia-desplazar"
          data-variante="arriba"
          aria-hidden
          style={{ left: guiaArriba.x, top: guiaArriba.top, height: guiaArriba.alto }}
        >
          <span className="ba-guia-flecha ba-guia-flecha--arriba">↑</span>
          <span className="ba-guia-centro" />
          <div
            ref={puntoGuia}
            className="ba-guia-punto"
            data-escala={Math.min(1, Math.max(0, guiaArriba.alto - ALTO_EXTRA_GUIA) / (2 * params.R_MAX_DESPLAZAR))}
          />
          <span className="ba-guia-flecha ba-guia-flecha--abajo">↓</span>
        </div>
      )}

      {puntoMira && (
        // RF-21: la mira, fija en el centro de la vista; tenue, y encendida con algo apuntado.
        <div
          ref={refMira}
          className="ba-mira"
          data-testid="mira"
          data-apuntado={apuntadoVisible?.apuntado.tipo}
          aria-hidden
          style={{ left: puntoMira.x, top: puntoMira.y }}
        >
          {apuntadoVisible && (
            <span className="ba-mira-etiqueta" data-testid="mira-etiqueta">
              {apuntadoVisible.label}
            </span>
          )}
        </div>
      )}

      {pista && (
        // RF-20: pista en la banda al soltar sobre un deslizador sin esperar.
        <BandaPista geo={geo} medidas={medidas} texto={pista.texto} />
      )}

      {conGuia && guiaDesplazar === "ancla" && (
        // HM-10 B: anillo sobre el borde del ancla (no por fuera: no sale de su columna) que se llena con la velocidad (--ba-llenado).
        <svg
          className="ba-anillo-desplazar"
          data-testid="guia-desplazar"
          data-variante="ancla"
          data-modo={libre ? "libre" : "vertical"}
          aria-hidden
          viewBox="0 0 100 100"
          style={{ left: geoDibujo.centro.x, top: geoDibujo.centro.y, width: params.D_ACTIVO, height: params.D_ACTIVO }}
        >
          <circle className="ba-anillo-desplazar-fondo" cx="50" cy="50" r="46" pathLength={1} />
          <circle className="ba-anillo-desplazar-lleno" cx="50" cy="50" r="46" pathLength={1} />
        </svg>
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
            Confirmar: {etiquetaOpcion(vista, estado.id)}
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
        className={`ba-ancla${claseAncla(estado)}${apuntadoVisible ? " ba-ancla--apuntando" : ""}`}
        data-testid="ancla"
        data-apuntado={apuntadoVisible ? (apuntadoVisible.apuntado.tipo === "uno" ? apuntadoVisible.apuntado.id : "grupo") : undefined}
        data-geometria={JSON.stringify(resumenGeometria(geo))}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? "ba-menu" : undefined}
        aria-label={hayCapa ? `Menú, ${vista.sectionLabel}` : `Menú, sección ${vista.sectionLabel}`}
        style={{ left: geoDibujo.centro.x, top: geoDibujo.centro.y }}
        onPointerDown={(e) => controlador.bajarEnAncla(e.nativeEvent, e.currentTarget)}
        onKeyDown={(e) => controlador.teclaEnAncla(e.nativeEvent)}
        onClick={() => controlador.clicEnAncla()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {apuntadoVisible ? (
          // RF-21: el ancla se enciende con el ícono de lo apuntado (o cuántos hay en el grupo).
          apuntadoVisible.apuntado.tipo === "grupo" ? (
            <span className="ba-conteo-grupo" data-testid="conteo-grupo" aria-hidden>
              {apuntadoVisible.apuntado.ids.length}
            </span>
          ) : apuntadoVisible.icon ? (
            <apuntadoVisible.icon size={26} weight="fill" aria-hidden />
          ) : (
            <IconoCentro size={26} aria-hidden />
          )
        ) : libre && guiaDesplazar === "ancla" ? (
          // HM-11: una sola flecha, girada hacia donde apunta el pulgar (--ba-giro).
          <span className="ba-flecha-libre" data-testid="flecha-libre" aria-hidden>
            <FlechaIcono icono={icons.scrollUp} sentido="arriba" tamano={24} />
          </span>
        ) : conGuia && guiaDesplazar === "ancla" ? (
          // HM-10 B: el ícono pasa a flecha ↑/↓ (el bucle elige cuál con data-direccion).
          <>
            <FlechaDesplazar icono={icons.scrollUp} sentido="arriba" />
            <FlechaDesplazar icono={icons.scrollDown} sentido="abajo" />
          </>
        ) : (
          <IconoCentro size={26} aria-hidden />
        )}
      </button>
    </div>
  );
}

/** RF-20: la pista del deslizador, en el mismo lugar y con el mismo aspecto que la banda (HM-02). */
function BandaPista({ geo, medidas, texto }: { geo: Geometry; medidas: Medidas; texto: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const radio = radioDe(geo.centro, geo.slots, geo.params);
  const pos = posicionBanda({ anchor: geo.centro, layout: { radio }, viewport: medidas.viewport, safeArea: medidas.safeArea, hand: geo.hand, params: geo.params });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ancho = el.offsetWidth;
    el.style.left = `${Math.min(Math.max(pos.x - ancho / 2, pos.izquierda), pos.derecha - ancho)}px`;
  });
  return (
    <div
      ref={ref}
      className="ba-banda ba-banda--pista"
      data-testid="banda"
      data-tipo="pista-deslizador"
      role="status"
      aria-live="polite"
      style={{ top: pos.yBase - geo.params.BANDA_ALTO, left: pos.x, maxWidth: pos.derecha - pos.izquierda }}
    >
      {texto}
    </div>
  );
}

/** Espacio de la cápsula para sus flechas, además del recorrido del punto (HM-09). */
const ALTO_EXTRA_GUIA = 36;
const SIN_ELEMENTO: RefObject<HTMLElement | null> = { current: null };
/** HM-11: diámetro del círculo de la variante "arriba" en el joystick libre. */
const DIAMETRO_CIRCULO = (params: Params) => params.R_MAX_DESPLAZAR + 24;

function FlechaDesplazar({ icono, sentido }: { icono?: ReactAnchorIcon; sentido: "arriba" | "abajo" }) {
  return (
    <span className={`ba-flecha-desplazar ba-flecha-desplazar--${sentido}`} data-testid={`flecha-${sentido}`} aria-hidden>
      <FlechaIcono icono={icono} sentido={sentido} tamano={24} />
    </span>
  );
}

function FlechaIcono({ icono: Icono, sentido, tamano }: { icono?: ReactAnchorIcon; sentido: "arriba" | "abajo"; tamano: number }) {
  return Icono ? (
    <Icono size={tamano} weight="bold" aria-hidden />
  ) : (
    <svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={sentido === "arriba" ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} />
    </svg>
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
    (a.tipo !== "abierto_teclado" || (b.tipo === "abierto_teclado" && a.foco === b.foco)) &&
    (a.tipo !== "desplazando" || (b.tipo === "desplazando" && mismoApuntado(a.apuntado ?? null, b.apuntado ?? null)))
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
