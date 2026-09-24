"use client";

import { DEFAULT_PARAMS, ID_ATRAS, ID_DESHACER, layoutParaPantalla, type Params } from "@boton-ancla/core";
import type { Icon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { ANCHOR_ICONS } from "@/lib/icons/semantic-icons";
import { useDemo } from "@/lib/demo-store";
import { useMedidas } from "@/lib/use-medidas";

// Vista previa FANTASMA del ancla y del abanico, calculada con @boton-ancla/core.
// No responde al toque (pointer-events: none): sirve para juzgar la altura
// (HM-01) y el reparto de opciones hasta que llegue el ancla real (T-15).

export function VistaPreviaAncla() {
  const { pantalla, prefs, prefsListas } = useDemo();
  const medidas = useMedidas();

  const params: Params = useMemo(() => ({ ...DEFAULT_PARAMS, ANCLA_ALTURA: prefs.anclaAltura }), [prefs.anclaAltura]);

  const calculo = useMemo(() => {
    if (!pantalla || !medidas) return null;
    return layoutParaPantalla({ screen: pantalla, viewport: medidas.viewport, safeArea: medidas.safeArea, hand: prefs.mano, params });
  }, [pantalla, medidas, prefs.mano, params]);

  if (!calculo || !pantalla || !prefsListas) return null;

  const { anchor, layout, slots } = calculo;
  const IconoSeccion = pantalla.sectionIcon as Icon;
  const iconoDe = (id: string): Icon => {
    if (id === ID_ATRAS) return ANCHOR_ICONS.back;
    if (id === ID_DESHACER) return ANCHOR_ICONS.undo;
    return pantalla.actions.find((a) => a.id === id)?.icon as Icon;
  };
  const etiquetaDe = (id: string) => (id === ID_ATRAS ? "Atrás" : (pantalla.actions.find((a) => a.id === id)?.label ?? id));
  const d = params.D_REPOSO;
  const dOpcion = params.D_OPCION;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1100]" data-testid="vista-previa-ancla">
      {prefs.mostrarAbanico && (
        <>
          {/* Anillo exterior (confirmación de irreversibles), como referencia. */}
          <Circulo x={anchor.x} y={anchor.y} r={layout.rExterior} className="border border-dashed border-text-muted/25" />
          {slots.map((s) => {
            const Icono = iconoDe(s.id);
            return (
              <div
                key={s.id}
                className={`absolute flex flex-col items-center ${s.disabled ? "opacity-40" : ""}`}
                style={{ left: s.punto.x - dOpcion / 2, top: s.punto.y - dOpcion / 2, width: dOpcion }}
              >
                <div
                  className="flex items-center justify-center rounded-full border-2 border-dashed border-terracota/60 bg-surface/70"
                  style={{ width: dOpcion, height: dOpcion }}
                >
                  {Icono && <Icono size={20} className="text-terracota/80" />}
                </div>
                <span className="mt-0.5 rounded bg-surface/80 px-1 font-sans text-[10px] leading-tight whitespace-nowrap text-text-muted">
                  {etiquetaDe(s.id)}
                </span>
              </div>
            );
          })}
        </>
      )}

      <div
        className="absolute flex items-center justify-center rounded-full border-2 border-dashed border-terracota bg-surface/60 backdrop-blur-sm"
        style={{ left: anchor.x - d / 2, top: anchor.y - d / 2, width: d, height: d }}
        data-testid="ancla-fantasma"
      >
        <IconoSeccion size={24} className="text-text" />
      </div>
    </div>
  );
}

function Circulo({ x, y, r, className }: { x: number; y: number; r: number; className: string }) {
  return <div className={`absolute rounded-full ${className}`} style={{ left: x - r, top: y - r, width: 2 * r, height: 2 * r }} />;
}
