"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ANCHOR_ICONS } from "@/lib/icons/semantic-icons";
import { useDemo } from "@/lib/demo-store";

// Barra superior de la demo. Es navegación de la DEMO, no del ancla:
// sirve para moverse entre pantallas mientras el ancla no existe (T-15).

const Atras = ANCHOR_ICONS.back;
const Ajustes = ANCHOR_ICONS.sectionSettings;
const Metricas = ANCHOR_ICONS.sectionMetrics;
const Diagnostico = ANCHOR_ICONS.sectionDiagnostics;

export function BarraDemo() {
  const ruta = usePathname();
  const router = useRouter();
  const { pantalla } = useDemo();
  const enMapa = ruta === "/mapa";

  return (
    <header className="fixed inset-x-0 top-0 z-[1200] border-b border-border bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-12 max-w-3xl items-center gap-1 px-2">
        {enMapa ? (
          <span className="w-10" />
        ) : (
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/mapa"))}
            className="flex size-10 items-center justify-center rounded-full text-text hover:bg-background"
            aria-label="Atrás"
          >
            <Atras size={22} />
          </button>
        )}
        <p className="min-w-0 flex-1 truncate font-heading text-title-2 font-semibold text-text">{pantalla?.sectionLabel ?? "Demo"}</p>
        <Enlace href="/diagnostico" etiqueta="Diagnóstico" activo={ruta === "/diagnostico"}>
          <Diagnostico size={22} />
        </Enlace>
        <Enlace href="/metricas" etiqueta="Métricas" activo={ruta === "/metricas"}>
          <Metricas size={22} />
        </Enlace>
        <Enlace href="/ajustes" etiqueta="Ajustes" activo={ruta === "/ajustes"}>
          <Ajustes size={22} />
        </Enlace>
      </div>
    </header>
  );
}

function Enlace({ href, etiqueta, activo, children }: { href: string; etiqueta: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={etiqueta}
      aria-current={activo ? "page" : undefined}
      className={`flex size-10 items-center justify-center rounded-full ${activo ? "bg-terracota/10 text-terracota" : "text-text-muted hover:bg-background"}`}
    >
      {children}
    </Link>
  );
}

/** Espacio para que el contenido no quede debajo de la barra fija. */
export function EspacioBarra() {
  return <div className="h-[calc(3rem+1px+env(safe-area-inset-top))]" aria-hidden />;
}
