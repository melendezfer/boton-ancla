"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { NEGOCIOS, NEGOCIO_DEMO, OFERTAS, formatoPesos } from "@/lib/datos";
import { useDemo, type Hoja } from "@/lib/demo-store";
import { ANCHOR_ICONS, SEMANTIC_ICONS } from "@/lib/icons/semantic-icons";

// Hojas inferiores de la demo, con z-[1000] como en RUTEANDO: el ancla debe
// quedar por encima (RF-14). Solo una abierta a la vez (useDemo().hoja).

export function HojaInferior({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" data-testid="hoja-inferior">
      <section
        role="dialog"
        aria-label={titulo}
        className="mx-auto flex max-h-[60vh] max-w-lg flex-col overflow-hidden rounded-card border border-border bg-surface shadow-lg motion-safe:animate-[subir_160ms_ease-out]"
      >
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="flex-1 font-heading text-title-2 font-semibold text-text">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-9 items-center justify-center rounded-full text-text-muted hover:bg-background">
            <X size={20} />
          </button>
        </header>
        <div className="overflow-y-auto px-4 py-3">{children}</div>
      </section>
    </div>
  );
}

export function HojasDemo() {
  const { hoja, cerrarHoja } = useDemo();
  if (!hoja) return null;
  return <HojaSegunTipo hoja={hoja} cerrar={cerrarHoja} />;
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
      return (
        <HojaInferior titulo="Buscar" onCerrar={cerrar}>
          <CampoBusqueda />
        </HojaInferior>
      );
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

/** El campo ya existe en el DOM cuando se enfoca: requisito de iOS para abrir el teclado (L-04). */
function CampoBusqueda() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <input
      ref={ref}
      type="search"
      placeholder="Negocio, producto o categoría"
      className="h-btn w-full rounded-input border border-border bg-background px-3 font-sans text-body text-text outline-none focus:border-terracota"
    />
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
