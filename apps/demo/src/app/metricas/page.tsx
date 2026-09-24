"use client";

import { EspacioBarra } from "@/components/barra-demo";
import { usePantallaDemo } from "@/components/pantallas-conectadas";

export default function PaginaMetricas() {
  usePantallaDemo("metricas");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-3 px-4 pb-48">
      <EspacioBarra />
      <h1 className="pt-2 font-heading text-title-1 font-bold text-text">Métricas</h1>
      <p className="font-sans text-body text-text-muted">
        Aquí aparecerán los eventos del ancla (abrir, preseleccionar, ejecutar, cancelar…) y el botón para exportarlos a JSON. Llega en T-25,
        cuando el ancla ya registre eventos.
      </p>
    </main>
  );
}
