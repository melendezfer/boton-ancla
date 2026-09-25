"use client";

import { useAnchorLayer, useAnchorReserva, useMedidas, useTeclado } from "@boton-ancla/react";
import Link from "next/link";
import { createRef } from "react";
import { NEGOCIOS, NEGOCIO_DEMO, OFERTAS, formatoPesos } from "@/lib/datos";
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

export function HojaInferior({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  // HM-03: la hoja es una capa: el ancla ofrece "Cerrar" y el atrás del sistema la cierra.
  // Su X usa el `cerrar` que devuelve el hook, para que el historial quede limpio.
  const cerrar = useAnchorLayer(true, onCerrar);
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
  const cerrarEstado = () => {
    refBuscador.current?.blur();
    cerrarHoja();
  };
  const cerrar = useAnchorLayer(abierta, cerrarEstado); // HM-03: su X cierra por el historial
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
    case "ofertas": {
      const Oferta = SEMANTIC_ICONS.offer;
      return (
        <HojaInferior titulo="Ofertas cerca" onCerrar={cerrar}>
          <ul className="flex flex-col divide-y divide-border">
            {OFERTAS.map((o) => (
              <li key={o.id} className="flex items-start gap-3 py-2">
                <Oferta size={20} className="mt-0.5 text-terracota" />
                <div>
                  <p className="font-sans text-body font-semibold text-text">{o.titulo}</p>
                  <p className="font-sans text-body-sm text-text-muted">
                    {o.negocio} · {o.distancia}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </HojaInferior>
      );
    }
    case "favoritos": {
      const Lista = ANCHOR_ICONS.favoritesList;
      const lista = NEGOCIOS.filter((n) => favoritos.includes(n.id));
      return (
        <HojaInferior titulo="Favoritos" onCerrar={cerrar}>
          {lista.length === 0 ? (
            <p className="flex items-center gap-2 font-sans text-body text-text-muted">
              <Lista size={20} /> Todavía no tienes favoritos.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
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

export function AvisoDemo() {
  const { aviso } = useDemo();
  if (!aviso) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[1300] flex justify-center px-4">
      <p className="rounded-full bg-text px-4 py-2 font-sans text-body-sm text-surface shadow-lg">{aviso}</p>
    </div>
  );
}
