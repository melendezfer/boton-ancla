"use client";

import type { AnchorScreen } from "@boton-ancla/core";
import { useAnchorMove, useAnchorReservedArea, useAnchorScreen } from "@boton-ancla/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EspacioBarra } from "@/components/barra-demo";
import { useDemo, useRegistrarPantalla } from "@/lib/demo-store";
import { ANCHOR_ICONS } from "@/lib/icons/semantic-icons";

// Página de PRUEBA de la Fase 3 (Bloque B): zonas reservadas configurables y "Mover ancla",
// antes de conectarlos a las pantallas de la demo (Bloque C). Se abre desde Diagnóstico.
// Zonas desde la dirección: ?zonas=obligatoria:x,y,ancho,alto;preferida:x,y,ancho,alto
// (x e y negativos se cuentan desde la derecha y desde abajo).

type ZonaPrueba = { prioridad: "obligatoria" | "preferida"; x: number; y: number; ancho: number; alto: number };

function leerZonas(texto: string | null): ZonaPrueba[] {
  if (!texto) return [];
  return texto.split(";").flatMap((parte) => {
    const [prioridad, numeros] = parte.split(":");
    const [x, y, ancho, alto] = (numeros ?? "").split(",").map(Number);
    if ((prioridad !== "obligatoria" && prioridad !== "preferida") || [x, y, ancho, alto].some((n) => !Number.isFinite(n))) return [];
    return [{ prioridad, x: x!, y: y!, ancho: ancho!, alto: alto! }];
  });
}

function Zona({ z, i }: { z: ZonaPrueba; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useAnchorReservedArea(ref, { prioridad: z.prioridad });
  return (
    <div
      ref={ref}
      data-testid={`zona-${i}`}
      data-prioridad={z.prioridad}
      className={`fixed z-[900] flex items-center justify-center rounded-input border-2 border-dashed font-sans text-caption font-semibold ${
        z.prioridad === "obligatoria" ? "border-terracota bg-terracota/10 text-terracota" : "border-border bg-surface/60 text-text-muted"
      }`}
      style={{
        [z.x < 0 ? "right" : "left"]: Math.abs(z.x) - (z.x < 0 ? z.ancho : 0),
        [z.y < 0 ? "bottom" : "top"]: Math.abs(z.y) - (z.y < 0 ? z.alto : 0),
        width: z.ancho,
        height: z.alto,
      }}
    >
      {z.prioridad}
    </div>
  );
}

export default function PruebaFase3() {
  const router = useRouter();
  const { avisar } = useDemo();
  const { mover, editando } = useAnchorMove();
  const [zonas, setZonas] = useState<ZonaPrueba[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la dirección solo existe en el navegador
    setZonas(leerZonas(new URLSearchParams(window.location.search).get("zonas")));
  }, []);

  const pantalla: AnchorScreen = {
    id: "prueba-fase3",
    sectionIcon: ANCHOR_ICONS.sectionDiagnostics,
    sectionLabel: "Prueba Fase 3",
    back: { onSelect: () => router.back() },
    actions: [
      { id: "aviso", label: "Aviso", icon: ANCHOR_ICONS.share, priority: 1, onSelect: () => avisar("Aviso de prueba") },
      // Fase 3 (DF3-01): quedarse quieto encima la engancha al dedo; soltar sin esperar = el botón.
      { id: "mover-ancla", label: "Mover ancla", icon: ANCHOR_ICONS.moveAnchor, priority: 2, moveAnchor: true, onSelect: mover },
    ],
  };
  useAnchorScreen(pantalla);
  useRegistrarPantalla(pantalla);

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-3 px-4 pb-48">
      <EspacioBarra />
      <h1 className="font-heading text-title-1 font-bold text-text">Prueba Fase 3</h1>
      <p className="font-sans text-body-sm text-text-muted">
        Zonas reservadas (recuadros punteados): el ancla, su abanico, la banda y los avisos no deben taparlas. Las obligatorias nunca; las
        preferidas, solo si no hay otro lugar.
      </p>
      <button
        type="button"
        data-testid="boton-mover-ancla"
        onClick={mover}
        className="flex h-btn items-center justify-center rounded-input bg-terracota font-sans text-button font-semibold text-white"
      >
        {editando ? "Toca el ancla y arrástrala" : "Mover el ancla"}
      </button>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="crecer-zona"
          className="rounded-input border border-border bg-surface px-3 py-2 font-sans text-body-sm text-text"
          onClick={() => setZonas((zs) => zs.map((z, i) => (i === 0 ? { ...z, alto: z.alto + 150 } : z)))}
        >
          Agrandar la zona 1
        </button>
        <button
          type="button"
          data-testid="quitar-zonas"
          className="rounded-input border border-border bg-surface px-3 py-2 font-sans text-body-sm text-text"
          onClick={() => setZonas([])}
        >
          Quitar las zonas
        </button>
        <button
          type="button"
          className="rounded-input border border-border bg-surface px-3 py-2 font-sans text-body-sm text-text"
          onClick={() => setZonas(leerZonas("obligatoria:-212,-60,200,60"))}
        >
          Zona como el crédito del mapa
        </button>
      </div>
      {zonas.map((z, i) => (
        <Zona key={i} z={z} i={i} />
      ))}
    </main>
  );
}
