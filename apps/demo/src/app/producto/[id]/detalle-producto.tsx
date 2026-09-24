"use client";

import Link from "next/link";
import { EspacioBarra } from "@/components/barra-demo";
import { usePantallaProducto } from "@/components/pantallas-conectadas";
import { formatoPesos } from "@/lib/datos";
import { useDemo } from "@/lib/demo-store";

export function DetalleProducto({ id }: { id: string }) {
  const { productos } = useDemo();
  const p = productos.find((x) => x.id === id);
  usePantallaProducto(id, p?.disponible ?? false);

  if (!p || p.eliminado) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-3 px-4 pb-48">
        <EspacioBarra />
        <p className="pt-4 font-sans text-body text-text">{p ? "Este producto fue eliminado." : "Producto no encontrado."}</p>
        <Link href="/negocio/carta" className="font-sans text-body font-semibold text-terracota">
          Volver a la carta
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-3 px-4 pb-48">
      <EspacioBarra />
      <div className="h-40 rounded-card bg-cover bg-center" style={{ backgroundImage: "url(/fondos/foto.jpg), url(/fondos/foto.svg)" }} role="img" aria-label={`Foto de ${p.nombre}`} />
      <h1 className="font-heading text-title-1 font-bold text-text">{p.nombre}</h1>
      <p className="font-sans text-title-2 text-text">{formatoPesos(p.precio)}</p>
      {p.disponible ? (
        <p className="self-start rounded-full bg-verde/10 px-3 py-1 font-sans text-body-sm text-verde">Disponible</p>
      ) : (
        <p className="self-start rounded-full bg-ambar/20 px-3 py-1 font-sans text-caption font-medium tracking-wide text-ambar uppercase">No disponible</p>
      )}
      <p className="font-sans text-body text-text-muted">{p.descripcion}</p>
      <p className="rounded-input bg-background px-3 py-2 font-sans text-body-sm text-text-muted">
        Editar, marcar no disponible y eliminar se harán desde el ancla (T-24). Eliminar es irreversible: habrá que deslizar más allá del anillo.
      </p>
    </main>
  );
}
