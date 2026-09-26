"use client";

import { DEFAULT_PARAMS, type AnchorScreen, type Hand, type MetricEvent } from "@boton-ancla/core";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FAVORITOS_INICIALES, PRODUCTOS_INICIALES, type Producto } from "./datos";
import type { RegistroMetrica } from "./exportar";

// Estado simulado de la demo (design.md §8).
// - Preferencias: se guardan en localStorage (sobreviven a recargar).
// - Datos (favoritos, productos): en memoria; recargar la página los reinicia.

export type Rol = "visitante" | "dueno";
export type Fondo = "claro" | "foto" | "oscuro";

export type Preferencias = {
  mano: Hand;
  rol: Rol;
  fondo: Fondo;
  /** Parámetro ANCLA_ALTURA (HM-01), ajustable con el control deslizante de Ajustes. */
  anclaAltura: number;
  /** HM-09 (experimental): desplazar con el ancla. Activado por defecto en la demo. */
  desplazar: boolean;
  /** HM-11 (experimental): mover el mapa con el ancla (joystick libre). Activado por defecto en la demo. */
  moverMapa: boolean;
  /** HM-10: dónde se ve la guía al desplazar. "ancla" por defecto. */
  guiaDesplazar: "ancla" | "arriba";
};

export const PREFERENCIAS_INICIALES: Preferencias = {
  mano: "right",
  rol: "visitante",
  fondo: "claro",
  anclaAltura: DEFAULT_PARAMS.ANCLA_ALTURA,
  desplazar: true,
  moverMapa: true,
  guiaDesplazar: "ancla",
};

/** Hojas inferiores de la demo; solo una abierta a la vez. */
export type Hoja =
  | { tipo: "resumen-negocio"; negocioId: string }
  | { tipo: "buscar" }
  | { tipo: "ofertas" }
  | { tipo: "favoritos" }
  | { tipo: "agregar-plato" }
  | { tipo: "editar-negocio" }
  | { tipo: "editar-producto"; productoId: string };

type Demo = {
  prefs: Preferencias;
  /** true después de leer localStorage: evita que la vista previa salte al cargar. */
  prefsListas: boolean;
  setPref: <K extends keyof Preferencias>(clave: K, valor: Preferencias[K]) => void;

  favoritos: string[];
  alternarFavorito: (negocioId: string) => void;

  productos: Producto[];
  marcarDisponible: (productoId: string, disponible: boolean) => void;
  eliminarProducto: (productoId: string) => void;

  hoja: Hoja | null;
  abrirHoja: (hoja: Hoja) => void;
  cerrarHoja: () => void;

  /** Aviso breve de la demo (no es el aviso del ancla, que llega en T-19). */
  aviso: string | null;
  avisar: (texto: string) => void;

  /** Pantalla actual, para el título de la barra de la demo (el ancla usa useAnchorScreen). */
  pantalla: AnchorScreen | null;
  setPantalla: (pantalla: AnchorScreen | null) => void;

  /** Se incrementa para pedirle al mapa que vuelva al centro ("Mi ubicación"). */
  recentrarMapa: number;
  pedirRecentrar: () => void;

  /** Métricas locales (spec §9, RNF-08): solo en este dispositivo. */
  metricas: RegistroMetrica[];
  registrarMetrica: (evento: MetricEvent) => void;
  borrarMetricas: () => void;
};

const CLAVE_PREFS = "boton-ancla-demo:v1:prefs";
const CLAVE_METRICAS = "boton-ancla-demo:v1:metricas";
/** Tope de registros guardados: evita llenar el almacenamiento del navegador. */
const MAX_METRICAS = 2000;

function leerMetricas(): RegistroMetrica[] {
  try {
    const d = JSON.parse(window.localStorage.getItem(CLAVE_METRICAS) ?? "[]") as unknown;
    return Array.isArray(d) ? (d as RegistroMetrica[]) : [];
  } catch {
    return [];
  }
}

function guardarMetricas(m: RegistroMetrica[]) {
  try {
    window.localStorage.setItem(CLAVE_METRICAS, JSON.stringify(m));
  } catch {
    // Sin almacenamiento: las métricas se pierden al recargar, la demo sigue.
  }
}

function leerPrefs(): Preferencias {
  try {
    const texto = window.localStorage.getItem(CLAVE_PREFS);
    if (!texto) return PREFERENCIAS_INICIALES;
    const d = JSON.parse(texto) as Partial<Preferencias>;
    return {
      mano: d.mano === "left" ? "left" : "right",
      rol: d.rol === "dueno" ? "dueno" : "visitante",
      fondo: d.fondo === "foto" || d.fondo === "oscuro" ? d.fondo : "claro",
      anclaAltura: typeof d.anclaAltura === "number" && Number.isFinite(d.anclaAltura) ? d.anclaAltura : PREFERENCIAS_INICIALES.anclaAltura,
      desplazar: d.desplazar !== false,
      moverMapa: d.moverMapa !== false,
      guiaDesplazar: d.guiaDesplazar === "arriba" ? "arriba" : "ancla",
    };
  } catch {
    return PREFERENCIAS_INICIALES;
  }
}

function guardarPrefs(prefs: Preferencias) {
  try {
    window.localStorage.setItem(CLAVE_PREFS, JSON.stringify(prefs));
  } catch {
    // Navegación privada o almacenamiento bloqueado: la demo sigue funcionando sin guardar.
  }
}

const DemoContext = createContext<Demo | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_INICIALES);
  const [prefsListas, setPrefsListas] = useState(false);
  const [favoritos, setFavoritos] = useState<string[]>(FAVORITOS_INICIALES);
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIALES);
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pantalla, setPantalla] = useState<AnchorScreen | null>(null);
  const [recentrarMapa, setRecentrarMapa] = useState(0);
  const temporizadorAviso = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [metricas, setMetricas] = useState<RegistroMetrica[]>([]);
  // Pantalla actual para anotar cada evento (el callback de métricas no debe cambiar en cada render).
  const pantallaRef = useRef<AnchorScreen | null>(null);
  useLayoutEffect(() => {
    pantallaRef.current = pantalla;
  });

  // localStorage solo existe en el navegador: se lee después de montar para que
  // el HTML del servidor y el primer render del cliente coincidan.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con un sistema externo (localStorage) una sola vez
    setPrefs(leerPrefs());
    setPrefsListas(true);
    setMetricas(leerMetricas());
  }, []);

  const setPref = useCallback(<K extends keyof Preferencias>(clave: K, valor: Preferencias[K]) => {
    setPrefs((actual) => {
      const nuevas = { ...actual, [clave]: valor };
      guardarPrefs(nuevas);
      return nuevas;
    });
  }, []);

  const alternarFavorito = useCallback((negocioId: string) => {
    setFavoritos((f) => (f.includes(negocioId) ? f.filter((id) => id !== negocioId) : [...f, negocioId]));
  }, []);

  const marcarDisponible = useCallback((productoId: string, disponible: boolean) => {
    setProductos((ps) => ps.map((p) => (p.id === productoId ? { ...p, disponible } : p)));
  }, []);

  const eliminarProducto = useCallback((productoId: string) => {
    setProductos((ps) => ps.map((p) => (p.id === productoId ? { ...p, eliminado: true } : p)));
  }, []);

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    clearTimeout(temporizadorAviso.current);
    temporizadorAviso.current = setTimeout(() => setAviso(null), 2500);
  }, []);

  const registrarMetrica = useCallback((evento: MetricEvent) => {
    const p = pantallaRef.current;
    const registro: RegistroMetrica = {
      t: Date.now(),
      pantalla: p?.id ?? "(ninguna)",
      opciones: p ? p.actions.length + (p.back ? 1 : 0) : 0,
      evento,
    };
    setMetricas((m) => {
      const nuevas = [...m, registro].slice(-MAX_METRICAS);
      guardarMetricas(nuevas);
      return nuevas;
    });
  }, []);

  const borrarMetricas = useCallback(() => {
    setMetricas([]);
    guardarMetricas([]);
  }, []);

  const valor = useMemo<Demo>(
    () => ({
      prefs,
      prefsListas,
      setPref,
      favoritos,
      alternarFavorito,
      productos,
      marcarDisponible,
      eliminarProducto,
      hoja,
      abrirHoja: setHoja,
      cerrarHoja: () => setHoja(null),
      aviso,
      avisar,
      pantalla,
      setPantalla,
      recentrarMapa,
      pedirRecentrar: () => setRecentrarMapa((n) => n + 1),
      metricas,
      registrarMetrica,
      borrarMetricas,
    }),
    [
      prefs,
      prefsListas,
      setPref,
      favoritos,
      alternarFavorito,
      productos,
      marcarDisponible,
      eliminarProducto,
      hoja,
      aviso,
      avisar,
      pantalla,
      recentrarMapa,
      metricas,
      registrarMetrica,
      borrarMetricas,
    ],
  );

  return <DemoContext.Provider value={valor}>{children}</DemoContext.Provider>;
}

export function useDemo(): Demo {
  const demo = useContext(DemoContext);
  if (!demo) throw new Error("useDemo debe usarse dentro de <DemoProvider>.");
  return demo;
}

/**
 * Registra la pantalla actual para la barra de la demo. Detecta el cambio por id y
 * por las etiquetas y estados de las acciones, no por identidad del objeto.
 */
export function useRegistrarPantalla(pantalla: AnchorScreen) {
  const { setPantalla } = useDemo();
  const firma = [pantalla.id, pantalla.back ? "atras" : "", ...pantalla.actions.map((a) => `${a.id}:${a.label}:${a.disabled ? 1 : 0}`)].join("|");
  const ultima = useRef(pantalla);
  // Los refs no se escriben durante el render (React 19): se actualiza en un efecto de
  // layout, que corre antes que el efecto de abajo.
  useLayoutEffect(() => {
    ultima.current = pantalla;
  });

  useEffect(() => {
    setPantalla(ultima.current);
  }, [firma, setPantalla]);

  useEffect(() => () => setPantalla(null), [setPantalla]);
}
