"use client";

import { useAnchorPan } from "@boton-ancla/react";
import { useCallback, useEffect, useRef } from "react";
import { NEGOCIOS, NEGOCIO_DEMO } from "@/lib/datos";
import { useDemo, type Fondo } from "@/lib/demo-store";
import { ANCHOR_ICONS } from "@/lib/icons/semantic-icons";

const MapPin = ANCHOR_ICONS.mapPin;

// Mapa FALSO: un lienzo SVG grande que se arrastra con un dedo. Sin Leaflet ni
// teselas de internet, así las pruebas E2E no dependen de la red (design.md §8).
// Sirve para HU-13 (el ancla no mueve el mapa, salvo el joystick de HM-11, y
// arrastrar el mapa por encima del ancla no debe activarla) y para revisar la legibilidad del ancla
// sobre fondo claro, foto y oscuro.

const LADO = 2000;
const UMBRAL_ARRASTRE = 6;

type Colores = { suelo: string; manzana: string; calle: string; avenida: string; parque: string; rio: string };

const COLORES: Record<Exclude<Fondo, "foto">, Colores> = {
  claro: { suelo: "#f2efe9", manzana: "#e6e1d8", calle: "#ffffff", avenida: "#fbe7b5", parque: "#cdebc0", rio: "#aad3df" },
  oscuro: { suelo: "#1d2026", manzana: "#262a31", calle: "#3a3f48", avenida: "#5a4f35", parque: "#223a2a", rio: "#1f3b4d" },
};

export function MapaFalso() {
  const { prefs, abrirHoja, recentrarMapa } = useDemo();
  const capa = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const arrastre = useRef<{ id: number; x0: number; y0: number; ox: number; oy: number; moviendo: boolean } | null>(null);
  const arrastroHaceNada = useRef(false);

  const aplicar = useCallback((x: number, y: number) => {
    const el = capa.current;
    const cont = el?.parentElement;
    if (!el || !cont) return;
    // El lienzo siempre cubre la pantalla: no se puede arrastrar más allá del borde.
    const nx = Math.min(0, Math.max(cont.clientWidth - LADO, x));
    const ny = Math.min(0, Math.max(cont.clientHeight - LADO, y));
    offset.current = { x: nx, y: ny };
    el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    el.dataset.offsetX = String(Math.round(nx));
    el.dataset.offsetY = String(Math.round(ny));
  }, []);

  const centrar = useCallback(() => {
    const cont = capa.current?.parentElement;
    if (!cont) return;
    aplicar(cont.clientWidth / 2 - NEGOCIO_DEMO.x, cont.clientHeight / 2 - NEGOCIO_DEMO.y);
  }, [aplicar]);

  // HM-11: el joystick del ancla mueve la vista hacia donde apunta el pulgar (el lienzo va al revés).
  // Devuelve false en el borde, para que el ancla vibre.
  useAnchorPan((dx, dy) => {
    const { x, y } = offset.current;
    aplicar(x - dx, y - dy);
    return offset.current.x !== x || offset.current.y !== y;
  });

  // Centrar al montar y cada vez que se pide "Mi ubicación".
  useEffect(() => centrar(), [centrar, recentrarMapa]);

  const alBajar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (arrastre.current) return; // un segundo dedo no inicia otro arrastre
    arrastre.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: offset.current.x, oy: offset.current.y, moviendo: false };
    arrastroHaceNada.current = false;
  };

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId) return;
    const dx = e.clientX - a.x0;
    const dy = e.clientY - a.y0;
    if (!a.moviendo && Math.hypot(dx, dy) > UMBRAL_ARRASTRE) {
      a.moviendo = true;
      // Se captura solo al empezar a arrastrar: así un toque corto sobre un pin sigue siendo un clic.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Con eventos sintéticos (Playwright en WebKit) puede fallar; el arrastre funciona igual.
      }
    }
    if (a.moviendo) aplicar(a.ox + dx, a.oy + dy);
  };

  const alSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId) return;
    arrastroHaceNada.current = a.moviendo;
    arrastre.current = null;
  };

  const esFoto = prefs.fondo === "foto";
  const c = prefs.fondo === "foto" ? COLORES.claro : COLORES[prefs.fondo];

  return (
    <div
      className="fixed inset-0 touch-none overflow-hidden select-none"
      style={{ background: c.suelo }}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      data-testid="mapa-falso"
      data-fondo={prefs.fondo}
    >
      <div ref={capa} className="absolute top-0 left-0 will-change-transform" style={{ width: LADO, height: LADO }} data-testid="mapa-lienzo">
        {esFoto ? (
          <div
            className="absolute inset-0"
            // Si existe public/fondos/foto.jpg (una foto real) se ve esa; si no, la ilustración de respaldo.
            style={{ backgroundImage: "url(/fondos/foto.jpg), url(/fondos/foto.svg)", backgroundSize: "cover", backgroundPosition: "center" }}
          />
        ) : (
          <DibujoMapa c={c} />
        )}

        {NEGOCIOS.map((n) => (
          <button
            key={n.id}
            type="button"
            aria-label={n.nombre}
            onClick={() => {
              if (arrastroHaceNada.current) return; // fue un arrastre, no un toque
              abrirHoja({ tipo: "resumen-negocio", negocioId: n.id });
            }}
            className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
            style={{ left: n.x, top: n.y }}
          >
            <MapPin size={40} weight="fill" className={n.id === NEGOCIO_DEMO.id ? "text-terracota drop-shadow" : "text-text-muted drop-shadow"} />
            <span className="-mt-1 rounded bg-surface/90 px-1.5 font-sans text-caption font-medium whitespace-nowrap text-text shadow-sm">
              {n.nombre}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DibujoMapa({ c }: { c: Colores }) {
  const calles = [];
  for (let i = 100; i < LADO; i += 200) {
    calles.push(<rect key={`h${i}`} x={0} y={i - 9} width={LADO} height={18} fill={c.calle} />);
    calles.push(<rect key={`v${i}`} x={i - 9} y={0} width={18} height={LADO} fill={c.calle} />);
  }
  return (
    <svg width={LADO} height={LADO} className="absolute inset-0" aria-hidden>
      <rect width={LADO} height={LADO} fill={c.manzana} />
      <rect x={1310} y={310} width={380} height={380} rx={24} fill={c.parque} />
      <rect x={120} y={1320} width={560} height={360} rx={24} fill={c.parque} />
      <path d="M -50 520 C 400 420, 700 760, 1100 640 S 1800 520, 2050 700" stroke={c.rio} strokeWidth={70} fill="none" />
      {calles}
      <path d="M 0 1900 L 1900 0" stroke={c.avenida} strokeWidth={34} />
      <path d="M 0 1100 L 2000 1100" stroke={c.avenida} strokeWidth={30} />
    </svg>
  );
}
