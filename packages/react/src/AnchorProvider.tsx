"use client";

import { DEFAULT_PARAMS, pantallaDeCapa, validateScreen, type AnchorScreen, type CapaAncla, type Params } from "@boton-ancla/core";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Ancla } from "./components/Ancla";
import { useCapas, type CapaReact, type ControlCapas } from "./dom/capas";
import type { AnchorProviderProps } from "./types";

// Proveedor del botón-ancla (spec §7). Guarda la pantalla actual y dibuja el
// ancla en un portal sobre document.body, fuera del contenido de la app
// (así los eventos no llegan, por ejemplo, al mapa).

type Registro = {
  /** Pantalla más reciente (se actualiza en cada render: los onSelect siempre al día). */
  pantallaRef: RefObject<AnchorScreen | null>;
  /** Qué llamada a useAnchorScreen registró la pantalla actual (solo ella la puede quitar). */
  duenoRef: RefObject<symbol | null>;
  /** Publica una copia para dibujar cuando cambia algo visible (id, etiquetas, deshabilitadas). */
  publicar: (pantalla: AnchorScreen | null) => void;
};

const ContextoRegistro = createContext<Registro | null>(null);
const ContextoCapas = createContext<ControlCapas | null>(null);

/** Contenido principal que desplaza el ancla (HM-09): un elemento o la ventana. */
export type ObjetivoDesplazar = HTMLElement | "ventana";
type RegistroDesplazar = {
  objetivo: RefObject<ObjetivoDesplazar | null>;
  /** Avisa que se registró o quitó un objetivo (para recalcular si hay algo desplazable). */
  avisar: () => void;
};
const ContextoDesplazar = createContext<RegistroDesplazar | null>(null);

/** Espacio que ocupa el ancla desde el borde de su lado (HM-07). */
export type ReservaAncla = { lado: "right" | "left"; ancho: number };
const ContextoReserva = createContext<ReservaAncla | null>(null);

export function AnchorProvider({ prefs, theme, icons, onEvent, params: parciales, desplazar = false, children }: AnchorProviderProps) {
  const pantallaRef = useRef<AnchorScreen | null>(null);
  const duenoRef = useRef<symbol | null>(null);
  // Copia para DIBUJAR. Para EJECUTAR se usa pantallaRef (siempre la más reciente).
  const [pantalla, publicar] = useState<AnchorScreen | null>(null);
  const [montado, setMontado] = useState(false);

  // Los parámetros se comparan por valor: un objeto nuevo en cada render no los cambia.
  const clave = JSON.stringify(parciales ?? {});
  const params: Params = useMemo(() => Object.freeze({ ...DEFAULT_PARAMS, ...(JSON.parse(clave) as Partial<Params>) }), [clave]);

  const onEventRef = useRef(onEvent);
  useLayoutEffect(() => {
    onEventRef.current = onEvent;
  });

  // El portal necesita document: solo después de montar en el navegador.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- esperar al navegador para usar document.body
    setMontado(true);
  }, []);

  const registro = useMemo<Registro>(() => ({ pantallaRef, duenoRef, publicar }), []);
  const capas = useCapas(onEventRef);
  const objetivoDesplazar = useRef<ObjetivoDesplazar | null>(null);
  const [versionObjetivo, setVersionObjetivo] = useState(0);
  const registroDesplazar = useMemo<RegistroDesplazar>(
    () => ({ objetivo: objetivoDesplazar, avisar: () => setVersionObjetivo((v) => v + 1) }),
    [],
  );
  const reserva = useMemo<ReservaAncla>(
    () => ({ lado: prefs.hand, ancho: params.MARGEN_LATERAL + params.D_ACTIVO }),
    [prefs.hand, params.MARGEN_LATERAL, params.D_ACTIVO],
  );

  return (
    <ContextoRegistro.Provider value={registro}>
      <ContextoReserva.Provider value={reserva}>
      <ContextoDesplazar.Provider value={registroDesplazar}>
      <ContextoCapas.Provider value={capas}>
        {children}
        {montado &&
          createPortal(
            <Ancla
              pantalla={pantalla}
              pantallaRef={pantallaRef}
              prefs={prefs}
              theme={theme}
              icons={icons}
              params={params}
              onEventRef={onEventRef}
              capas={capas}
              desplazar={desplazar}
              objetivoDesplazar={objetivoDesplazar}
              versionObjetivo={versionObjetivo}
            />,
            document.body,
          )}
      </ContextoCapas.Provider>
      </ContextoDesplazar.Provider>
      </ContextoReserva.Provider>
    </ContextoRegistro.Provider>
  );
}

/**
 * HM-09: registra el contenido principal que desplaza el ancla (el perfil, una lista, un
 * documento). "ventana" = la página entera. Sin registro no hay modo desplazamiento: así
 * el mapa, que no se registra, sigue igual (HU-13). Mientras una capa esté abierta, se
 * desplaza la capa (su `scrollRef`), no esto.
 */
export function useAnchorScroll(objetivo: RefObject<HTMLElement | null> | "ventana"): void {
  const registro = useContext(ContextoDesplazar);
  if (!registro) throw new Error("useAnchorScroll debe usarse dentro de <AnchorProvider>.");
  const { objetivo: ref, avisar } = registro;
  useLayoutEffect(() => {
    const el = objetivo === "ventana" ? "ventana" : objetivo.current;
    if (!el) return;
    ref.current = el;
    avisar();
    return () => {
      if (ref.current === el) {
        ref.current = null;
        avisar();
      }
    };
  }, [objetivo, ref, avisar]);
}

/**
 * HM-07: lado del ancla y ancho que ocupa desde ese borde (MARGEN_LATERAL + D_ACTIVO).
 * Las hojas y barras de la app reservan ese espacio para que sus controles (p. ej. la X)
 * no queden debajo del ancla.
 */
export function useAnchorReserva(): ReservaAncla {
  const reserva = useContext(ContextoReserva);
  if (!reserva) throw new Error("useAnchorReserva debe usarse dentro de <AnchorProvider>.");
  return reserva;
}

/**
 * Declara una capa abierta encima del contenido (HM-03, HM-08, RF-15): una hoja, una
 * lista, la búsqueda. Mientras `abierta` sea true, el abanico muestra "Cerrar" a 90° y
 * las acciones de la capa (las de la pantalla de fondo se ocultan); el centro muestra su
 * ícono y nombre. El botón atrás del sistema y Escape llaman `onClose` en vez de navegar.
 *
 * Devuelve `cerrar`: úsala en el botón de cerrar propio de la capa (su X). Cierra por el
 * historial, así el "atrás" siguiente navega normal. Si la capa se cierra porque se
 * navega (un enlace dentro de ella), basta con cerrar el estado como siempre.
 */
export function useAnchorLayer(abierta: boolean, onClose: () => void, capa: CapaReact = {}): () => void {
  const capas = useContext(ContextoCapas);
  if (!capas) throw new Error("useAnchorLayer debe usarse dentro de <AnchorProvider>.");
  const { agregar, quitar, cerrar, actualizar } = capas;
  const onCloseRef = useRef(onClose);
  const datosRef = useRef<CapaReact>(capa);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    datosRef.current = capa;
  });

  // Se vuelve a dibujar solo si cambia algo visible de la capa (como la firma de useAnchorScreen).
  const firma = [
    capa.label ?? "",
    ...(capa.actions ?? []).map((a) => `${a.id}:${a.label}:${a.kind ?? "normal"}:${a.disabled ? 1 : 0}:${a.priority ?? ""}`),
  ].join("|");
  const icono = capa.icon;
  const conDesplazar = Boolean(capa.scrollRef);
  useLayoutEffect(() => {
    if (!abierta) return;
    if (process.env.NODE_ENV !== "production") {
      const errores = validateScreen(pantallaDeCapa({ id: "capa", sectionIcon: null, sectionLabel: "capa", actions: [] }, datosRef.current), {
        ...DEFAULT_PARAMS,
      });
      if (errores.length > 0) throw new Error(`Capa del ancla inválida:\n- ${errores.join("\n- ")}`);
    }
    actualizar();
  }, [abierta, firma, icono, conDesplazar, actualizar]);
  const claveRef = useRef<symbol | null>(null);
  useLayoutEffect(() => {
    if (!abierta) return;
    const clave = Symbol("capa");
    claveRef.current = clave;
    agregar({ clave, onClose: onCloseRef, datos: datosRef });
    return () => {
      quitar(clave);
      if (claveRef.current === clave) claveRef.current = null;
    };
  }, [abierta, agregar, quitar]);
  return useCallback(() => {
    if (claveRef.current) cerrar(claveRef.current);
    else onCloseRef.current();
  }, [cerrar]);
}

/**
 * Registra la pantalla actual del ancla (spec §7). Llamarlo en cada sección.
 * El cambio de sección se detecta por screen.id (RF-10), no por identidad del objeto.
 */
export function useAnchorScreen(screen: AnchorScreen): void {
  const registro = useContext(ContextoRegistro);
  if (!registro) throw new Error("useAnchorScreen debe usarse dentro de <AnchorProvider>.");
  const { pantallaRef, duenoRef, publicar } = registro;
  const [yo] = useState(() => Symbol("useAnchorScreen"));

  const firma = [
    screen.id,
    screen.sectionLabel,
    screen.back ? "atras" : "",
    ...screen.actions.map((a) => `${a.id}:${a.label}:${a.kind ?? "normal"}:${a.disabled ? 1 : 0}:${a.priority ?? ""}`),
  ].join("|");

  // Siempre la versión más reciente, para que los onSelect no queden viejos.
  useLayoutEffect(() => {
    pantallaRef.current = screen;
    duenoRef.current = yo;
  });

  useLayoutEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const errores = validateScreen(screen, { ...DEFAULT_PARAMS });
      if (errores.length > 0) throw new Error(`Pantalla del ancla inválida:\n- ${errores.join("\n- ")}`);
    }
    publicar(screen);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando cambia lo visible (firma)
  }, [firma, publicar]);

  // Al salir de la sección. Es de layout (no useEffect) para correr ANTES de que la
  // pantalla nueva se registre; y solo limpia si el registro sigue siendo suyo.
  useLayoutEffect(
    () => () => {
      if (duenoRef.current !== yo) return;
      pantallaRef.current = null;
      duenoRef.current = null;
      publicar(null);
    },
    [pantallaRef, duenoRef, publicar, yo],
  );
}
