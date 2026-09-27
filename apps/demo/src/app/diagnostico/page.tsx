"use client";

import Link from "next/link";
import { EspacioBarra } from "@/components/barra-demo";
import { Diagnostico } from "@/components/diagnostico";
import { usePantallaDemo } from "@/components/pantallas-conectadas";

// Página de diagnóstico de T-12: confirma que la demo carga y muestra datos del dispositivo.
export default function PaginaDiagnostico() {
  usePantallaDemo("diagnostico");
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-48">
      <EspacioBarra />
      <Diagnostico />
      {/* Fase 3 (Bloque B): zonas reservadas y mover el ancla, antes de llegar a las pantallas. */}
      <Link href="/prueba-fase3" className="flex h-btn items-center justify-center rounded-input border border-border bg-surface font-sans text-button font-semibold text-text">
        Prueba de la Fase 3
      </Link>
    </main>
  );
}
