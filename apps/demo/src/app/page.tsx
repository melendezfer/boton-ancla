import { Diagnostico } from "@/components/diagnostico";

// T-12: página de diagnóstico. Las pantallas simuladas de RUTEANDO llegan en T-13
// y el ancla interactiva en T-15.
export default function Inicio() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-40">
      <header className="flex flex-col gap-1">
        <p className="font-sans text-caption font-medium tracking-wide text-text-muted uppercase">Fase 1 · T-12</p>
        <h1 className="font-heading text-title-1 font-bold text-text">Botón-ancla · demo</h1>
        <p className="font-sans text-body text-text-muted">
          Página de diagnóstico. Sirve para confirmar que la demo abre en el PC y en el celular antes de construir las
          pantallas.
        </p>
      </header>
      <Diagnostico />
    </main>
  );
}
