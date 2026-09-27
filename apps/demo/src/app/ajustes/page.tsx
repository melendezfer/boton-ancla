"use client";

import { computeAnchorPosition, DEFAULT_PARAMS } from "@boton-ancla/core";
import { reiniciarBienvenida, useAnchorMove, useMedidas } from "@boton-ancla/react";
import { EspacioBarra } from "@/components/barra-demo";
import { usePantallaAjustes } from "@/components/pantallas-conectadas";
import { useOrientacionVentana } from "@/lib/orientacion";
import { DURACION_CENTRADO_MAX, ESPERA_CENTRADO_MAX, useDemo, type Fondo, type Preferencias, type Rol } from "@/lib/demo-store";

const ALTURA_MIN = 0;
const ALTURA_MAX = 0.6;

export default function PaginaAjustes() {
  usePantallaAjustes();
  const { prefs, setPref } = useDemo();
  const { mover, editando } = useAnchorMove();
  const medidas = useMedidas();
  // Fase 3 (DF3-09): el control de altura ajusta la orientación en la que está el celular.
  const orientacion = useOrientacionVentana();
  const enHorizontal = orientacion === "horizontal";
  const inicio = enHorizontal ? DEFAULT_PARAMS.ANCLA_ALTURA_H : DEFAULT_PARAMS.ANCLA_ALTURA;
  const altura = enHorizontal ? (prefs.horizontal?.altura ?? DEFAULT_PARAMS.ANCLA_ALTURA_H) : prefs.anclaAltura;
  const lado = enHorizontal ? (prefs.horizontal?.lado ?? prefs.mano) : prefs.mano;
  const fijarAltura = (a: number) =>
    enHorizontal ? setPref("horizontal", { lado, altura: a }) : setPref("anclaAltura", a);

  // Distancia real en px entre el borde inferior útil y el centro del ancla (con piso y techo aplicados).
  let px: number | null = null;
  if (medidas) {
    const params = { ...DEFAULT_PARAMS, ANCLA_ALTURA: altura };
    const { y } = computeAnchorPosition({ viewport: medidas.viewport, safeArea: medidas.safeArea, hand: lado, params });
    px = Math.round(medidas.viewport.height - medidas.safeArea.bottom - y);
  }
  const porcentaje = Math.round(altura * 100);

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-64">
      <EspacioBarra />

      <section className="flex flex-col gap-2 rounded-card border border-terracota/40 bg-surface p-4">
        <h2 className="font-heading text-title-2 font-semibold text-text">Dónde está el ancla</h2>
        <button
          type="button"
          onClick={mover}
          data-testid="boton-mover-ancla"
          className="flex h-btn items-center justify-center rounded-input bg-terracota font-sans text-button font-semibold text-white"
        >
          {editando ? "Toca el ancla y arrástrala" : "Mover el ancla"}
        </button>
        <p className="font-sans text-body-sm text-text-muted">
          Arrástrala a cualquier altura de los dos costados; al soltarla en el otro costado, cambias de mano. También desde el
          abanico: desliza a &quot;Mover ancla&quot; y quédate quieto un momento. Se guarda en este dispositivo, una posición para
          vertical y otra para horizontal.
        </p>
        <p className="font-sans text-body-sm text-text-muted" data-testid="orientacion-altura">
          Altura en <strong>{enHorizontal ? "horizontal" : "vertical"}</strong> (HM-01; se mantiene para comparar con el arrastre).
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
          value={altura}
          onChange={(e) => fijarAltura(Number(e.target.value))}
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
          onClick={() => fijarAltura(inicio)}
          className="self-start font-sans text-body-sm font-semibold text-terracota"
        >
          Volver al valor inicial ({Math.round(inicio * 100)} %)
        </button>
        <p className="font-sans text-caption text-text-muted">
          Si el abanico no cabe arriba, el ancla deja de subir sola (techo). Tampoco tapa las zonas reservadas (en el mapa, el
          crédito de OpenStreetMap).
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

      <section className="flex flex-col gap-3 rounded-card border border-terracota/40 bg-surface p-4">
        <h2 className="font-heading text-title-2 font-semibold text-text">Centrado al apuntar</h2>
        <p className="font-sans text-body-sm text-text-muted">
          Hallazgo HM-15. Cuánto espera y cuánto tarda el pin en ir a la mira, o la fila en ir a la franja. Con &quot;reducir
          movimiento&quot; del teléfono, el centrado es instantáneo.
        </p>
        <Milisegundos
          id="espera-centrado"
          titulo="Espera antes de centrar"
          valor={prefs.tEsperaCentrado}
          max={ESPERA_CENTRADO_MAX}
          inicial={DEFAULT_PARAMS.T_ESPERA_CENTRADO}
          alCambiar={(v) => setPref("tEsperaCentrado", v)}
        />
        <Milisegundos
          id="duracion-centrado"
          titulo="Duración del centrado"
          valor={prefs.tCentrado}
          max={DURACION_CENTRADO_MAX}
          inicial={DEFAULT_PARAMS.T_CENTRADO}
          alCambiar={(v) => setPref("tCentrado", v)}
        />
      </section>

      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-surface p-4">
        <input
          type="checkbox"
          checked={prefs.apuntar}
          onChange={(e) => setPref("apuntar", e.target.checked)}
          className="mt-1 size-5 accent-terracota"
          data-testid="interruptor-apuntar"
        />
        <span className="flex flex-col">
          <span className="font-sans text-body font-semibold text-text">Apuntar y elegir: mapa y listas (experimental)</span>
          <span className="font-sans text-body-sm text-text-muted">
            En el mapa, una mira en el centro marca un negocio: frena y suelta para elegirlo (HM-12a). En una lista, mientras desplazas,
            lleva el pulgar hacia el centro de la pantalla: una franja marca una fila; sube o baja de una en una y suelta para elegirla
            (HM-12b).
          </span>
        </span>
      </label>

      {prefs.apuntar && (
        <label className="flex cursor-pointer items-start gap-3 rounded-card border border-terracota/40 bg-surface p-4">
          <input
            type="checkbox"
            checked={prefs.imanFuerte}
            onChange={(e) => setPref("imanFuerte", e.target.checked)}
            className="mt-1 size-5 accent-terracota"
            data-testid="interruptor-iman-fuerte"
          />
          <span className="flex flex-col">
            <span className="font-sans text-body font-semibold text-text">Imán fuerte en el mapa</span>
            <span className="font-sans text-body-sm text-text-muted">
              Hallazgo HM-16. Atrapa los pines desde más lejos, frena más cerca del pin y lo engancha a la mira apenas entra, aunque sigas
              moviendo el pulgar (con una vibración corta en Android). Apágalo para comparar con el imán de antes.
            </span>
          </span>
        </label>
      )}

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
        alCambiar={(v) => {
          // H13: la mano es el costado; cambia en las dos orientaciones.
          setPref("mano", v);
          if (prefs.horizontal) setPref("horizontal", { ...prefs.horizontal, lado: v });
        }}
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

/** HM-15: deslizador en milisegundos, con el valor visible y "volver al inicial". */
function Milisegundos({
  id,
  titulo,
  valor,
  max,
  inicial,
  alCambiar,
}: {
  id: string;
  titulo: string;
  valor: number;
  max: number;
  inicial: number;
  alCambiar: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-baseline justify-between font-sans text-body text-text">
        <span>{titulo}</span>
        <strong className="font-semibold tabular-nums" data-testid={`valor-${id}`}>
          {valor} ms
        </strong>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={10}
        value={valor}
        onChange={(e) => alCambiar(Number(e.target.value))}
        aria-valuetext={`${valor} milisegundos`}
        className="h-11 w-full cursor-pointer accent-terracota"
        data-testid={`slider-${id}`}
      />
      <button type="button" onClick={() => alCambiar(inicial)} className="self-start font-sans text-body-sm font-semibold text-terracota">
        Volver al valor inicial ({inicial} ms)
      </button>
    </div>
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
