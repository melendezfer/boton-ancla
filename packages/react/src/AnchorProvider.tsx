"use client";

import { DEFAULT_PARAMS, validateScreen, type AnchorScreen, type Params } from "@boton-ancla/core";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Ancla } from "./components/Ancla";
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

export function AnchorProvider({ prefs, theme, icons, onEvent, params: parciales, children }: AnchorProviderProps) {
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

  return (
    <ContextoRegistro.Provider value={registro}>
      {children}
      {montado &&
        createPortal(
          <Ancla pantalla={pantalla} pantallaRef={pantallaRef} prefs={prefs} theme={theme} icons={icons} params={params} onEventRef={onEventRef} />,
          document.body,
        )}
    </ContextoRegistro.Provider>
  );
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
