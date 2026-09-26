"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { EspacioBarra } from "@/components/barra-demo";
import { filasApuntables } from "@/components/hojas";
import { useAnchorScroll } from "@boton-ancla/react";
import { usePantallaCarta } from "@/components/pantallas-conectadas";
import { NEGOCIO_DEMO, formatoPesos, type Producto } from "@/lib/datos";
import { useDemo } from "@/lib/demo-store";

export default function PaginaCarta() {
  usePantallaCarta();
  const { productos, prefs, abrirHoja } = useDemo();
  const router = useRouter();
  const lista = useRef<HTMLUListElement>(null);
  const visibles = productos.filter((p) => !p.eliminado);
  const esDueno = prefs.rol === "dueno";
  // HM-09: la carta se desplaza con el ancla. HM-12b: y sus platos se pueden apuntar y elegir.
  useAnchorScroll("ventana", {
    elementos: () => filasApuntables(lista.current),
    elegir: (id) => (esDueno ? router.push(`/producto/${id}`) : abrirHoja({ tipo: "plato", productoId: id })),
  });

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-3 px-4 pb-48">
      <EspacioBarra />
      <header className="pt-2">
        <h1 className="font-heading text-title-1 font-bold text-text">Carta</h1>
        <p className="font-sans text-body text-text-muted">{NEGOCIO_DEMO.nombre}</p>
      </header>
      {!esDueno && (
        <p className="rounded-input bg-background px-3 py-2 font-sans text-body-sm text-text-muted">
          El detalle de producto es del dueño (spec §8). Para abrirlo, cambia el rol a Dueño en Ajustes.
        </p>
      )}
      <ul ref={lista} className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {visibles.map((p) => (
          <li key={p.id} data-fila={p.id} data-etiqueta={p.nombre}>{esDueno ? <Link href={`/producto/${p.id}`} className="block"><Fila p={p} flecha /></Link> : <Fila p={p} />}</li>
        ))}
      </ul>
      {visibles.length === 0 && <p className="font-sans text-body text-text-muted">No quedan productos. Recarga la página para restaurarlos.</p>}
    </main>
  );
}

function Fila({ p, flecha = false }: { p: Producto; flecha?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-title-2 font-semibold text-text">{p.nombre}</p>
        <p className="font-sans text-body-sm text-text-muted">{formatoPesos(p.precio)}</p>
      </div>
      {!p.disponible && (
        <span className="rounded-full bg-ambar/20 px-2 py-1 font-sans text-caption font-medium tracking-wide text-ambar uppercase">No disponible</span>
      )}
      {flecha && <CaretRight size={20} className="text-text-muted" />}
    </div>
  );
}
