"use client";

import type { Insets } from "@boton-ancla/core";
import { HourglassMedium } from "@phosphor-icons/react/dist/ssr";
import { SEMANTIC_ICONS } from "@/lib/icons/semantic-icons";

const CheckCircle = SEMANTIC_ICONS.success;
import { useEffect, useRef, useState } from "react";

// Diagnóstico del entorno donde va a vivir el ancla (T-12). La posición del
// ancla la muestra la vista previa global (components/vista-previa-ancla.tsx).

type Medidas = {
  ancho: number;
  alto: number;
  altoVisible: number;
  area: Insets;
  punteroGrueso: boolean;
  toquesMaximos: number;
  vibracion: boolean;
  contextoSeguro: boolean;
  movimientoReducido: boolean;
  vertical: boolean;
};

function leerArea(sonda: HTMLElement): Insets {
  const cs = getComputedStyle(sonda);
  return {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
}

function medir(sonda: HTMLElement): Medidas {
  const area = leerArea(sonda);
  return {
    ancho: window.innerWidth,
    alto: window.innerHeight,
    altoVisible: Math.round(window.visualViewport?.height ?? window.innerHeight),
    area,
    punteroGrueso: window.matchMedia("(pointer: coarse)").matches,
    toquesMaximos: navigator.maxTouchPoints,
    vibracion: "vibrate" in navigator,
    contextoSeguro: window.isSecureContext,
    movimientoReducido: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    vertical: window.matchMedia("(orientation: portrait)").matches,
  };
}

export function Diagnostico() {
  const sonda = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<Medidas | null>(null);

  useEffect(() => {
    const el = sonda.current;
    if (!el) return;
    const actualizar = () => setM(medir(el));
    actualizar();
    window.addEventListener("resize", actualizar);
    window.visualViewport?.addEventListener("resize", actualizar);
    return () => {
      window.removeEventListener("resize", actualizar);
      window.visualViewport?.removeEventListener("resize", actualizar);
    };
  }, []);

  return (
    <>
      {/* Sonda invisible: el navegador resuelve env() y nosotros leemos el resultado (L-03). */}
      <div
        ref={sonda}
        aria-hidden
        className="pointer-events-none invisible fixed top-0 left-0"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
        }}
      />

      <section
        className={`flex items-start gap-3 rounded-card border p-4 ${m ? "border-verde/40 bg-verde/10" : "border-ambar/40 bg-ambar/10"}`}
        aria-live="polite"
      >
        {m ? (
          <CheckCircle size={24} weight="fill" className="shrink-0 text-verde" />
        ) : (
          <HourglassMedium size={24} weight="fill" className="shrink-0 text-ambar" />
        )}
        <div className="flex flex-col gap-1">
          <p className="font-heading text-title-2 font-semibold">{m ? "React cargó en este dispositivo" : "Esperando a React…"}</p>
          <p className="font-sans text-body-sm text-text-muted">
            {m
              ? "El JavaScript de la página está funcionando."
              : "Si este aviso no cambia en unos segundos, la página no terminó de cargar (ver L-09 en design.md)."}
          </p>
        </div>
      </section>

      {m && (
        <section className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
          <Fila nombre="Pantalla (ancho × alto)" valor={`${m.ancho} × ${m.alto} px`} />
          <Fila nombre="Alto visible (visualViewport)" valor={`${m.altoVisible} px`} nota="Baja cuando se abre el teclado" />
          <Fila
            nombre="Área segura (arriba · derecha · abajo · izquierda)"
            valor={`${m.area.top} · ${m.area.right} · ${m.area.bottom} · ${m.area.left} px`}
            nota="En iPhone con barra de inicio, abajo suele ser mayor que 0"
          />
          <Fila nombre="Puntero táctil" valor={m.punteroGrueso ? `sí (${m.toquesMaximos} toques)` : "no (mouse)"} nota="Celular: sí · PC: no" />
          <Fila nombre="Vibración disponible" valor={m.vibracion ? "sí" : "no"} nota="Android: sí · iPhone: no (D-02)" />
          <Fila nombre="Contexto seguro (HTTPS)" valor={m.contextoSeguro ? "sí" : "no"} nota="Por la IP de la red local: no (L-10)" />
          <Fila nombre="Movimiento reducido" valor={m.movimientoReducido ? "activado" : "no"} />
          <Fila nombre="Orientación" valor={m.vertical ? "vertical" : "horizontal"} nota="Fase 1 solo se prueba en vertical" />
        </section>
      )}

    </>
  );
}

function Fila({ nombre, valor, nota }: { nombre: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-body-sm text-text-muted">{nombre}</span>
        <span className="shrink-0 font-sans text-body font-semibold text-text">{valor}</span>
      </div>
      {nota && <span className="font-sans text-caption text-text-muted">{nota}</span>}
    </div>
  );
}
