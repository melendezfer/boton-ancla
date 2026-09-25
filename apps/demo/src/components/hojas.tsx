"use client";

import type { AnchorAction, CapaAncla } from "@boton-ancla/core";
import { useAnchorLayer, useAnchorReserva, useMedidas, useTeclado } from "@boton-ancla/react";
import Link from "next/link";
import { createRef, useCallback, useLayoutEffect, useRef, useState } from "react";
import { CATEGORIAS_OFERTA, NEGOCIOS, NEGOCIO_DEMO, OFERTAS, formatoPesos } from "@/lib/datos";
import { useDemo, type Hoja } from "@/lib/demo-store";
import { ANCHOR_ICONS, SEMANTIC_ICONS } from "@/lib/icons/semantic-icons";

const X = ANCHOR_ICONS.close;

/**
 * HM-05: ubica la hoja sobre el teclado virtual. `bottom` = lo que tapa el teclado; el alto
 * máximo = lo visible menos la barra superior. Funciona en Chrome Android y en iOS (que
 * ignora interactive-widget), porque solo usa visualViewport.
 */
/** Margen lateral del contenedor de la hoja (px-3 = 12 px). */
const MARGEN_HOJA = 12;

function usePosicionHoja() {
  const { alto } = useTeclado();
  const medidas = useMedidas();
  const reserva = useAnchorReserva();
  const visible = (medidas?.viewport.height ?? 0) - alto;
  // HM-07: del lado del ancla, la hoja deja libre el espacio que ocupa el ancla desde el
  // borde, para que su X y su contenido no queden debajo.
  const libre = Math.max(0, reserva.ancho - MARGEN_HOJA);
  return {
    contenedor: { bottom: alto } as React.CSSProperties,
    reserva: (reserva.lado === "right" ? { paddingRight: libre } : { paddingLeft: libre }) as React.CSSProperties,
    // 3,5rem de la barra superior + margen; nunca más del 60 % del alto (como antes).
    hoja: { maxHeight: visible > 0 ? `min(60vh, calc(${visible}px - 4.5rem - env(safe-area-inset-top)))` : undefined } as React.CSSProperties,
  };
}

// Hojas inferiores de la demo, con z-[1000] como en RUTEANDO: el ancla debe
// quedar por encima (RF-14). Solo una abierta a la vez (useDemo().hoja).

export function HojaInferior({
  titulo,
  onCerrar,
  icono,
  acciones,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  /** Ícono de la capa: lo muestra el centro del ancla mientras está abierta (HM-08). */
  icono?: CapaAncla["icon"];
  /**
   * Acciones propias de la capa en el abanico (HM-08). Como función, recibe `cerrar`
   * (cierra por el historial, igual que la X) para acciones que además cierran la hoja.
   */
  acciones?: AnchorAction[] | ((cerrar: () => void) => AnchorAction[]);
  children: React.ReactNode;
}) {
  // HM-03/HM-08: la hoja es una capa: el ancla ofrece "Cerrar" + sus acciones, y el atrás del
  // sistema la cierra. Su X usa el `cerrar` que devuelve el hook, para que el historial quede limpio.
  const cerrarRef = useRef<() => void>(onCerrar);
  // Las acciones se arman antes de tener `cerrar` (lo devuelve el mismo hook): se pasa una
  // función estable que lo llama cuando se ejecuta la acción, no durante el render.
  const cerrarDesdeAccion = useCallback(() => cerrarRef.current(), []);
  // eslint-disable-next-line react-hooks/refs -- cerrarDesdeAccion solo se ejecuta al elegir la acción, nunca durante el render
  const lista = typeof acciones === "function" ? acciones(cerrarDesdeAccion) : acciones;
  const cerrar = useAnchorLayer(true, onCerrar, { label: titulo, icon: icono, actions: lista });
  useLayoutEffect(() => {
    cerrarRef.current = cerrar;
  });
  const pos = usePosicionHoja();
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" data-testid="hoja-inferior" style={pos.contenedor}>
      <section
        role="dialog"
        aria-label={titulo}
        style={pos.hoja}
        className="mx-auto flex max-h-[60vh] max-w-lg flex-col overflow-hidden rounded-card border border-border bg-surface shadow-lg motion-safe:animate-[subir_160ms_ease-out]"
      >
        <div className="flex min-h-0 flex-1 flex-col" style={pos.reserva} data-testid="hoja-reserva">
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <h2 className="flex-1 font-heading text-title-2 font-semibold text-text">{titulo}</h2>
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="flex size-9 items-center justify-center rounded-full text-text-muted hover:bg-background">
              <X size={20} />
            </button>
          </header>
          <div className="overflow-y-auto px-4 py-3">{children}</div>
        </div>
      </section>
    </div>
  );
}

export function HojasDemo() {
  const { hoja, cerrarHoja } = useDemo();
  return (
    <>
      <BuscadorPersistente />
      {hoja && hoja.tipo !== "buscar" && <HojaSegunTipo hoja={hoja} cerrar={cerrarHoja} />}
    </>
  );
}

/**
 * Campo de búsqueda SIEMPRE montado (invisible cuando está cerrado). iOS solo abre el
 * teclado si focus() ocurre dentro del gesto (L-04): la acción "Buscar" del ancla llama
 * enfocarBuscador() de forma síncrona, antes de que React muestre la hoja (HU-01).
 */
const refBuscador = createRef<HTMLInputElement>();

export function enfocarBuscador() {
  refBuscador.current?.focus({ preventScroll: true });
}

function BuscadorPersistente() {
  const { hoja, cerrarHoja } = useDemo();
  const abierta = hoja?.tipo === "buscar";
  const [texto, setTexto] = useState("");
  const teclado = useTeclado();
  const cerrarEstado = () => {
    refBuscador.current?.blur();
    cerrarHoja();
  };
  // HM-08: acciones de la capa de búsqueda. Con el teclado abierto, "Ocultar teclado" lo
  // agrega el ancla a 180° (RF-17); aquí solo lo propio de la búsqueda.
  const borrar: AnchorAction = { id: "borrar-texto", label: "Borrar texto", icon: ANCHOR_ICONS.clearText, priority: 2, onSelect: () => setTexto("") };
  const escribir: AnchorAction = {
    id: "escribir",
    label: "Escribir",
    icon: ANCHOR_ICONS.write,
    priority: 1,
    onSelect: enfocarBuscador, // síncrono dentro del gesto: iOS abre el teclado (L-04)
  };
  const acciones = teclado.abierto ? [borrar] : [escribir, borrar];
  const cerrar = useAnchorLayer(abierta, cerrarEstado, { label: "Buscar", icon: ANCHOR_ICONS.search, actions: acciones }); // HM-03/HM-08
  const pos = usePosicionHoja(); // HM-05: sobre el teclado
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[1000] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${abierta ? "" : "pointer-events-none translate-y-[120%] opacity-0"}`}
      data-testid={abierta ? "hoja-inferior" : undefined}
      aria-hidden={!abierta || undefined}
      style={pos.contenedor}
    >
      <section role="dialog" aria-label="Buscar" style={{ ...pos.hoja, ...pos.reserva }} className="mx-auto flex max-w-lg flex-col overflow-hidden rounded-card border border-border bg-surface shadow-lg">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="flex-1 font-heading text-title-2 font-semibold text-text">Buscar</h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar" tabIndex={abierta ? 0 : -1} className="flex size-9 items-center justify-center rounded-full text-text-muted hover:bg-background">
            <X size={20} />
          </button>
        </header>
        <div className="px-4 py-3">
          <input
            ref={refBuscador}
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Negocio, producto o categoría"
            tabIndex={abierta ? 0 : -1}
            data-testid="campo-busqueda"
            className="h-btn w-full rounded-input border border-border bg-background px-3 font-sans text-body text-text outline-none focus:border-terracota"
          />
        </div>
      </section>
    </div>
  );
}

function HojaSegunTipo({ hoja, cerrar }: { hoja: Hoja; cerrar: () => void }) {
  const { favoritos, productos } = useDemo();

  switch (hoja.tipo) {
    case "resumen-negocio": {
      const n = NEGOCIOS.find((x) => x.id === hoja.negocioId);
      if (!n) return null;
      const esDemo = n.id === NEGOCIO_DEMO.id;
      return (
        <HojaInferior titulo={n.nombre} onCerrar={cerrar}>
          <p className="font-sans text-body text-text-muted">{n.categoria}</p>
          {esDemo ? (
            <Link href="/negocio" onClick={cerrar} className="mt-3 flex h-btn items-center justify-center rounded-input bg-terracota font-sans text-button font-semibold text-white">
              Ver perfil
            </Link>
          ) : (
            <p className="mt-3 font-sans text-body-sm text-text-muted">En la demo solo &quot;{NEGOCIO_DEMO.nombre}&quot; tiene perfil.</p>
          )}
        </HojaInferior>
      );
    }
    case "buscar":
      return null; // lo dibuja BuscadorPersistente
    case "ofertas":
      return <HojaOfertas cerrar={cerrar} />;
    case "favoritos":
      return <HojaFavoritos cerrar={cerrar} favoritos={favoritos} />;
    case "agregar-plato":
      return (
        <HojaInferior titulo="Agregar plato (simulado)" onCerrar={cerrar}>
          <p className="font-sans text-body text-text-muted">Aquí iría el formulario de un plato nuevo. En la demo no se guarda nada.</p>
        </HojaInferior>
      );
    case "editar-negocio":
      return (
        <HojaInferior titulo="Editar negocio (simulado)" onCerrar={cerrar}>
          <p className="font-sans text-body text-text-muted">Aquí iría el formulario del perfil. En la demo no se guarda nada.</p>
        </HojaInferior>
      );
    case "editar-producto": {
      const p = productos.find((x) => x.id === hoja.productoId);
      return (
        <HojaInferior titulo="Editar producto (simulado)" onCerrar={cerrar}>
          <p className="font-sans text-body text-text-muted">
            {p ? `${p.nombre} · ${formatoPesos(p.precio)}. ` : ""}Aquí iría el formulario. En la demo no se guarda nada.
          </p>
        </HojaInferior>
      );
    }
  }
}

/** Ofertas cerca, con sus acciones de capa (HM-08): ordenar por distancia y filtrar por categoría. */
function HojaOfertas({ cerrar }: { cerrar: () => void }) {
  const { avisar } = useDemo();
  const [porDistancia, setPorDistancia] = useState(false);
  const [categoria, setCategoria] = useState(0);
  const Oferta = SEMANTIC_ICONS.offer;
  const filtro = CATEGORIAS_OFERTA[categoria]!;
  const lista = OFERTAS.filter((o) => filtro === "Todas" || o.categoria === filtro).sort((a, b) => (porDistancia ? a.metros - b.metros : 0));
  const acciones: AnchorAction[] = [
    {
      id: "ordenar-distancia",
      label: "Ordenar por distancia",
      icon: ANCHOR_ICONS.sort,
      priority: 1,
      onSelect: () => {
        setPorDistancia(true);
        avisar("Ordenadas por distancia");
      },
    },
    {
      id: "filtrar-categoria",
      label: "Filtrar por categoría",
      icon: ANCHOR_ICONS.filter,
      priority: 2,
      onSelect: () => {
        const siguiente = (categoria + 1) % CATEGORIAS_OFERTA.length;
        setCategoria(siguiente);
        avisar(`Categoría: ${CATEGORIAS_OFERTA[siguiente]}`);
      },
    },
  ];
  return (
    <HojaInferior titulo="Ofertas cerca" onCerrar={cerrar} icono={SEMANTIC_ICONS.offer} acciones={acciones}>
      <p className="mb-1 font-sans text-caption text-text-muted" data-testid="estado-ofertas">
        {filtro} · {porDistancia ? "por distancia" : "sin ordenar"}
      </p>
      <ul className="flex flex-col divide-y divide-border" data-testid="lista-ofertas">
        {lista.map((o) => (
          <li key={o.id} className="flex items-start gap-3 py-2">
            <Oferta size={20} className="mt-0.5 text-terracota" />
            <div>
              <p className="font-sans text-body font-semibold text-text">{o.titulo}</p>
              <p className="font-sans text-body-sm text-text-muted">
                {o.negocio} · {o.categoria} · {o.metros} m
              </p>
            </div>
          </li>
        ))}
      </ul>
    </HojaInferior>
  );
}

/** Favoritos, con sus acciones de capa (HM-08): ordenar y ver en el mapa. */
function HojaFavoritos({ cerrar, favoritos }: { cerrar: () => void; favoritos: string[] }) {
  const { avisar, pedirRecentrar } = useDemo();
  const [zA, setZA] = useState(false);
  const Lista = ANCHOR_ICONS.favoritesList;
  const lista = NEGOCIOS.filter((n) => favoritos.includes(n.id)).sort((a, b) => (zA ? -1 : 1) * a.nombre.localeCompare(b.nombre, "es"));
  return (
    <HojaInferior
      titulo="Favoritos"
      onCerrar={cerrar}
      icono={ANCHOR_ICONS.favoritesList}
      acciones={(cerrarCapa) => [
        { id: "ordenar", label: "Ordenar", icon: ANCHOR_ICONS.sort, priority: 1, onSelect: () => setZA((v) => !v) },
        {
          id: "ver-en-mapa",
          label: "Ver en el mapa",
          icon: ANCHOR_ICONS.showOnMap,
          priority: 2,
          onSelect: () => {
            cerrarCapa(); // por el historial, como la X
            pedirRecentrar();
            avisar("Favoritos en el mapa (simulado)");
          },
        },
      ]}
    >
      {lista.length === 0 ? (
        <p className="flex items-center gap-2 font-sans text-body text-text-muted">
          <Lista size={20} /> Todavía no tienes favoritos.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border" data-testid="lista-favoritos">
          {lista.map((n) => (
            <li key={n.id} className="py-2 font-sans text-body text-text">
              {n.nombre}
            </li>
          ))}
        </ul>
      )}
    </HojaInferior>
  );
}

export function AvisoDemo() {
  const { aviso } = useDemo();
  if (!aviso) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[1300] flex justify-center px-4">
      <p className="rounded-full bg-text px-4 py-2 font-sans text-body-sm text-surface shadow-lg">{aviso}</p>
    </div>
  );
}
