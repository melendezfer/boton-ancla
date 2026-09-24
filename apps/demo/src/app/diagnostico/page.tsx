"use client";

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
    </main>
  );
}
