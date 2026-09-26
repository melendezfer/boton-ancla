"use client";

import { useEffect, useMemo, useState } from "react";
import { EspacioBarra } from "@/components/barra-demo";
import { usePantallaDemo } from "@/components/pantallas-conectadas";
import { useDemo } from "@/lib/demo-store";
import { construirExportacion, describirDispositivo, nombreArchivo, type RegistroMetrica } from "@/lib/exportar";

// T-25: métricas locales (spec §9, RNF-08). Nada sale a la red: se guardan en este
// dispositivo y se exportan como archivo. Por HTTP en la red local no hay portapapeles
// (L-10): por eso descarga + texto seleccionable.

const MOSTRAR = 50;

export default function PaginaMetricas() {
  usePantallaDemo("metricas");
  const { metricas, borrarMetricas, prefs } = useDemo();
  const [dispositivo, setDispositivo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // navigator solo existe en el navegador.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valor inicial que depende del navegador
    setDispositivo((d) => d || describirDispositivo(navigator.userAgent));
  }, []);

  const exportacion = useMemo(
    () => construirExportacion(metricas, { dispositivo, mano: prefs.mano, anclaAltura: prefs.anclaAltura, observaciones }),
    [metricas, dispositivo, prefs.mano, prefs.anclaAltura, observaciones],
  );
  const json = useMemo(() => JSON.stringify(exportacion, null, 2), [exportacion]);

  const descargar = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const r = exportacion.resumen;
  const ultimos = metricas.slice(-MOSTRAR).reverse();

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pb-64">
      <EspacioBarra />
      <header className="pt-2">
        <h1 className="font-heading text-title-1 font-bold text-text">Métricas</h1>
        <p className="font-sans text-body-sm text-text-muted">Se guardan solo en este dispositivo (RNF-08). Nada se envía por internet.</p>
      </header>

      <section className="grid grid-cols-3 gap-2" aria-label="Resumen">
        <Cifra etiqueta="Ejecuciones" valor={r.ejecuciones} />
        <Cifra etiqueta="Cancelaciones" valor={r.cancelaciones} />
        <Cifra etiqueta="Bloqueos" valor={r.bloqueos} />
        <Cifra etiqueta="Deshacer" valor={r.deshacer} />
        <Cifra etiqueta="Descansos" valor={r.descansos} />
        <Cifra etiqueta="Eventos" valor={metricas.length} />
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="font-heading text-title-2 font-semibold text-text">Exportar (Documento 8)</h2>
        <label className="flex flex-col gap-1 font-sans text-body-sm text-text-muted">
          Dispositivo
          <input
            value={dispositivo}
            onChange={(e) => setDispositivo(e.target.value)}
            className="h-btn rounded-input border border-border bg-background px-3 font-sans text-body text-text"
          />
        </label>
        <p className="font-sans text-body-sm text-text-muted">
          Mano: <strong className="text-text">{exportacion.mano}</strong> · Altura del ancla:{" "}
          <strong className="text-text">{Math.round(prefs.anclaAltura * 100)} %</strong> (se cambian en Ajustes)
        </p>
        <label className="flex flex-col gap-1 font-sans text-body-sm text-text-muted">
          Observaciones (qué se sintió lento, confuso o incómodo)
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            className="rounded-input border border-border bg-background p-3 font-sans text-body text-text"
          />
        </label>
        <button
          type="button"
          onClick={descargar}
          className="flex h-btn items-center justify-center rounded-input bg-terracota font-sans text-button font-semibold text-white"
        >
          Descargar JSON
        </button>
        <details>
          <summary className="cursor-pointer font-sans text-body-sm text-text-muted">Ver el JSON (para copiarlo a mano)</summary>
          <textarea readOnly value={json} rows={10} data-testid="json-metricas" className="mt-2 w-full rounded-input border border-border bg-background p-2 font-mono text-caption text-text" />
        </details>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("¿Borrar todos los registros de este dispositivo?")) borrarMetricas();
          }}
          className="self-start font-sans text-body-sm font-semibold text-rojo"
        >
          Borrar registros
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-title-2 font-semibold text-text">Últimos eventos</h2>
        {ultimos.length === 0 ? (
          <p className="font-sans text-body text-text-muted">Todavía no hay eventos. Usa el ancla en cualquier pantalla y vuelve.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface" data-testid="lista-metricas">
            {ultimos.map((m, i) => (
              <li key={`${m.t}-${i}`} className="flex items-baseline gap-2 px-3 py-2 font-sans text-body-sm">
                <span className="w-16 shrink-0 text-text-muted tabular-nums">{new Date(m.t).toLocaleTimeString("es-CO")}</span>
                <span className="font-semibold text-text">{m.evento.type}</span>
                <span className="min-w-0 truncate text-text-muted">{detalle(m)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function detalle(m: RegistroMetrica): string {
  const e = m.evento;
  switch (e.type) {
    case "open":
      return `${e.mode} · ${m.pantalla}`;
    case "preselect":
    case "sensitive_blocked":
    case "undo":
      return e.id;
    case "execute":
      return `${e.id} · ${Math.round(e.ms)} ms · ${e.pathPx} px${e.expert ? " · experto" : ""}`;
    case "cancel":
      return e.reason;
    case "rest_enter":
      return m.pantalla;
    case "layer_close":
      return `capa cerrada con ${e.via === "sistema" ? "el botón atrás" : "Escape"}`;
    case "scroll_start":
      return `${e.modo === "libre" ? "mover el mapa" : "desplazar"} · ${m.pantalla}`;
    case "scroll_end":
      return `${Math.round(e.ms)} ms`;
    case "slider_start":
      return `ajustar ${e.id} · ${m.pantalla}`;
    case "slider_end":
      return `${e.id} · ${Math.round(e.ms)} ms`;
    case "aim":
      return e.tipo === "uno" ? "un negocio en la mira" : "un grupo en la mira";
    case "pick":
      return `elegido ${e.id}`;
    case "group_open":
      return `grupo de ${e.n}`;
    case "auto_zoom":
      return `zoom automático · grupo de ${e.n}`;
  }
}

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-border bg-surface px-2 py-3">
      <span className="font-heading text-title-1 font-bold text-text tabular-nums">{valor}</span>
      <span className="font-sans text-caption text-text-muted">{etiqueta}</span>
    </div>
  );
}
