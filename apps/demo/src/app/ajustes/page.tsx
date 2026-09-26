"use client";

import { computeAnchorPosition, DEFAULT_PARAMS } from "@boton-ancla/core";
import { reiniciarBienvenida, useMedidas } from "@boton-ancla/react";
import { EspacioBarra } from "@/components/barra-demo";
import { usePantallaDemo } from "@/components/pantallas-conectadas";
import { useDemo, type Fondo, type Preferencias, type Rol } from "@/lib/demo-store";

const ALTURA_MIN = 0;
const ALTURA_MAX = 0.6;

export default function PaginaAjustes() {
  usePantallaDemo("ajustes");
  const { prefs, setPref } = useDemo();
  const medidas = useMedidas();

  // Distancia real en px entre el borde inferior útil y el centro del ancla (con piso y techo aplicados).
  let px: number | null = null;
  if (medidas) {
    const params = { ...DEFAULT_PARAMS, ANCLA_ALTURA: prefs.anclaAltura };
    const { y } = computeAnchorPosition({ viewport: medidas.viewport, safeArea: medidas.safeArea, hand: prefs.mano, params });
    px = Math.round(medidas.viewport.height - medidas.safeArea.bottom - y);
  }
  const porcentaje = Math.round(prefs.anclaAltura * 100);

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-64">
      <EspacioBarra />

      <section className="flex flex-col gap-2 rounded-card border border-terracota/40 bg-surface p-4">
        <h2 className="font-heading text-title-2 font-semibold text-text">Altura del ancla</h2>
        <p className="font-sans text-body-sm text-text-muted">
          Hallazgo HM-01. Desliza para subir o bajar el ancla y mírala moverse. Se guarda en este dispositivo.
        </p>
        <label htmlFor="altura-ancla" className="flex items-baseline justify-between font-sans text-body text-text">
          <span>
            <strong className="font-semibold">{porcentaje} %</strong> del alto útil
          </span>
          {px !== null && <span className="text-body-sm text-text-muted">≈ {px} px sobre el borde</span>}
        </label>
        <input
          id="altura-ancla"
          type="range"
          min={ALTURA_MIN}
          max={ALTURA_MAX}
          step={0.01}
          value={prefs.anclaAltura}
          onChange={(e) => setPref("anclaAltura", Number(e.target.value))}
          aria-valuetext={`${porcentaje} por ciento del alto útil`}
          className="h-11 w-full cursor-pointer accent-terracota"
          data-testid="slider-altura"
        />
        <div className="flex justify-between font-sans text-caption text-text-muted">
          <span>Abajo del todo</span>
          <span>{Math.round(ALTURA_MAX * 100)} %</span>
        </div>
        <button
          type="button"
          onClick={() => setPref("anclaAltura", DEFAULT_PARAMS.ANCLA_ALTURA)}
          className="self-start font-sans text-body-sm font-semibold text-terracota"
        >
          Volver al valor inicial ({Math.round(DEFAULT_PARAMS.ANCLA_ALTURA * 100)} %)
        </button>
        <p className="font-sans text-caption text-text-muted">
          Si el abanico no cabe arriba, el ancla deja de subir sola (techo). Moverla arrastrándola llega en la Fase 3.
        </p>
      </section>

      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-surface p-4">
        <input
          type="checkbox"
          checked={prefs.desplazar}
          onChange={(e) => setPref("desplazar", e.target.checked)}
          className="mt-1 size-5 accent-terracota"
          data-testid="interruptor-desplazar"
        />
        <span className="flex flex-col">
          <span className="font-sans text-body font-semibold text-text">Desplazar con el ancla (experimental)</span>
          <span className="font-sans text-body-sm text-text-muted">
            Presiona el ancla y desliza hacia abajo: la carta, el perfil o la lista abierta se mueven como con un joystick (HM-09).
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-surface p-4">
        <input
          type="checkbox"
          checked={prefs.moverMapa}
          onChange={(e) => setPref("moverMapa", e.target.checked)}
          className="mt-1 size-5 accent-terracota"
          data-testid="interruptor-mover-mapa"
        />
        <span className="flex flex-col">
          <span className="font-sans text-body font-semibold text-text">Mover el mapa con el ancla (experimental)</span>
          <span className="font-sans text-body-sm text-text-muted">
            En el mapa, presiona el ancla y desliza hacia abajo: después mueve el pulgar hacia donde quieras ir (HM-11).
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-surface p-4">
        <input
          type="checkbox"
          checked={prefs.apuntar}
          onChange={(e) => setPref("apuntar", e.target.checked)}
          className="mt-1 size-5 accent-terracota"
          data-testid="interruptor-apuntar"
        />
        <span className="flex flex-col">
          <span className="font-sans text-body font-semibold text-text">Apuntar y elegir en el mapa (experimental)</span>
          <span className="font-sans text-body-sm text-text-muted">
            Mientras mueves el mapa con el ancla, una mira en el centro marca un negocio; frena y suelta para elegirlo (HM-12a). Necesita
            &quot;Mover el mapa con el ancla&quot;.
          </span>
        </span>
      </label>

      {(prefs.desplazar || prefs.moverMapa) && (
        <Opciones<Preferencias["guiaDesplazar"]>
          titulo="Guía al desplazar"
          detalle="Para comparar (HM-10). En el ancla: flecha ↑/↓ y un anillo que se llena con la velocidad. Arriba: la cápsula con el punto, sobre el ancla."
          valor={prefs.guiaDesplazar}
          opciones={[
            ["ancla", "En el ancla"],
            ["arriba", "Arriba"],
          ]}
          alCambiar={(v) => setPref("guiaDesplazar", v)}
        />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-title-2 font-semibold text-text">Bienvenida</h2>
        <p className="font-sans text-body-sm text-text-muted">
          Vuelve a mostrar la demostración inicial y la pista &quot;Desliza hacia una opción&quot; (HU-12).
        </p>
        <button
          type="button"
          onClick={() => reiniciarBienvenida()}
          className="flex h-btn items-center justify-center rounded-input border border-border bg-surface font-sans text-button font-semibold text-text"
        >
          Repetir la bienvenida
        </button>
      </section>

      <Opciones<Preferencias["mano"]>
        titulo="Mano"
        detalle="Lado del ancla (HU-11)."
        valor={prefs.mano}
        opciones={[
          ["right", "Derecha"],
          ["left", "Izquierda"],
        ]}
        alCambiar={(v) => setPref("mano", v)}
      />

      <Opciones<Rol>
        titulo="Rol"
        detalle="Cambia las acciones del perfil y permite abrir el detalle de producto."
        valor={prefs.rol}
        opciones={[
          ["visitante", "Visitante"],
          ["dueno", "Dueño"],
        ]}
        alCambiar={(v) => setPref("rol", v)}
      />

      <Opciones<Fondo>
        titulo="Fondo del mapa"
        detalle="Para revisar la legibilidad del ancla translúcida (spec §10.3)."
        valor={prefs.fondo}
        opciones={[
          ["claro", "Mapa claro"],
          ["foto", "Foto"],
          ["oscuro", "Oscuro"],
        ]}
        alCambiar={(v) => setPref("fondo", v)}
      />
    </main>
  );
}

function Opciones<T extends string>({
  titulo,
  detalle,
  valor,
  opciones,
  alCambiar,
}: {
  titulo: string;
  detalle: string;
  valor: T;
  opciones: [T, string][];
  alCambiar: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-heading text-title-2 font-semibold text-text">{titulo}</legend>
      <p className="font-sans text-body-sm text-text-muted">{detalle}</p>
      <div className="flex gap-2">
        {opciones.map(([v, etiqueta]) => (
          <label
            key={v}
            className={`flex h-btn flex-1 cursor-pointer items-center justify-center rounded-input border font-sans text-button ${
              v === valor ? "border-terracota bg-terracota/10 font-semibold text-terracota" : "border-border bg-surface text-text"
            }`}
          >
            <input type="radio" name={titulo} value={v} checked={v === valor} onChange={() => alCambiar(v)} className="sr-only" />
            {etiqueta}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
