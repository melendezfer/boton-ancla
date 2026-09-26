import { describe, expect, it } from "vitest";
import { velocidadDesplazamiento } from "../src/desplazamiento";
import { puntoEnDireccion } from "../src/geometry";
import { crearGeometria, type AnchorEvent, type AnchorState } from "../src/machine/states";
import { transition } from "../src/machine/transition";
import { derivarMetricas, type MetricEvent } from "../src/metrics";
import { DEFAULT_PARAMS } from "../src/params";
import type { Hand } from "../src/types";
import { productoDueno } from "./fixtures/pantallas-ruteando";
import { ev, final, recorrer } from "./machine/ayudas";

// HM-09, RF-18: desplazar con el ancla (filas 41–44 de design.md §3.3).

const P = DEFAULT_PARAMS;
const geo = (desplazable = true, hand: Hand = "right") =>
  crearGeometria({
    screen: productoDueno,
    viewport: { x: 0, y: 0, width: 375, height: 667 },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    hand,
    params: P,
    desplazable,
  });

/** Punto a 20 px del inicio en la dirección `angulo` (grados en pantalla). */
const hacia = (g: ReturnType<typeof geo>, angulo: number, r = 20) => puntoEnDireccion(g.centro, r, angulo);

describe("entrada al modo desplazamiento (filas 41 y 42)", () => {
  it("la primera dirección hacia abajo (270°) entra en 'desplazando', con origen en ese punto", () => {
    const g = geo();
    const s = final([ev.down(g, g.centro, 0), ev.move(hacia(g, 270), 40)]);
    expect(s).toMatchObject({ tipo: "desplazando", origen: hacia(g, 270), tInicio: 40 });
  });

  it.each([210.5, 250, 300, 329.5])("a %s° también (dentro de 210°–330°)", (a) => {
    const g = geo();
    expect(final([ev.down(g, g.centro, 0), ev.move(hacia(g, a), 40)]).tipo).toBe("desplazando");
  });

  it.each([205, 335, 180, 135, 90])("a %s° NO: abre el menú como siempre", (a) => {
    const g = geo();
    expect(final([ev.down(g, g.centro, 0), ev.move(hacia(g, a), 40)]).tipo).toBe("abierto_gesto");
  });

  it("sin nada registrado para desplazar (p. ej. el mapa), hacia abajo sigue siendo el menú (HU-13)", () => {
    const g = geo(false);
    expect(final([ev.down(g, g.centro, 0), ev.move(hacia(g, 270), 40)]).tipo).toBe("abierto_gesto");
  });

  it("con la mano izquierda, el rango se refleja (sigue siendo 'hacia abajo')", () => {
    const g = geo(true, "left");
    expect(final([ev.down(g, g.centro, 0), ev.move(hacia(g, 225), 40)]).tipo).toBe("desplazando");
    expect(final([ev.down(g, g.centro, 0), ev.move(hacia(g, 315), 40)]).tipo).toBe("desplazando");
    expect(final([ev.down(g, g.centro, 0), ev.move(hacia(g, 45), 40)]).tipo).toBe("abierto_gesto");
  });

  it("fila 42: desde el descanso, hacia abajo desplaza (cierra P-01); hacia el arco abre el menú", () => {
    const g = geo();
    const descanso = [ev.down(g, g.centro, 0), ev.tick(400)];
    expect(final([...descanso, ev.move(hacia(g, 270), 900)]).tipo).toBe("desplazando");
    expect(final([...descanso, ev.move(hacia(g, 150), 900)]).tipo).toBe("abierto_gesto");
  });

  it("un movimiento pequeño (≤ 10 px) todavía no decide", () => {
    const g = geo();
    expect(final([ev.down(g, g.centro, 0), ev.move(hacia(g, 270, 9), 40)]).tipo).toBe("armado");
  });
});

describe("dentro y salida (filas 43 y 44)", () => {
  const g = geo();
  const entrar: AnchorEvent[] = [ev.down(g, g.centro, 0), ev.move(hacia(g, 270), 40)];

  it("los movimientos siguientes solo actualizan la posición; el origen no cambia", () => {
    const s = final([...entrar, ev.move(hacia(g, 270, 80), 100), ev.move(hacia(g, 90, 30), 200)]);
    expect(s).toMatchObject({ tipo: "desplazando", origen: hacia(g, 270), ultimo: hacia(g, 90, 30) });
  });

  it("al soltar vuelve a reposo en seco", () => {
    expect(final([...entrar, ev.up(hacia(g, 270, 80), 500)])).toEqual({ tipo: "reposo" });
  });

  it("un segundo dedo cancela (RF-09)", () => {
    expect(final([...entrar, ev.down(g, { x: 5, y: 5 }, 100, "fuera", 2)])).toEqual({ tipo: "cancelado", motivo: "segundo_dedo" });
  });

  it("nunca abre el abanico ni ejecuta nada, aunque el dedo pase por una opción", () => {
    const estados = recorrer([...entrar, ev.move(hacia(g, 150, 100), 100), ev.up(hacia(g, 150, 100), 200)]);
    expect(estados.map((s) => s.tipo)).toEqual(["armado", "desplazando", "desplazando", "reposo"]);
  });
});

describe("velocidadDesplazamiento", () => {
  it("dentro de la zona muerta (±8 px): 0", () => {
    for (const dy of [0, 5, -8, 8]) expect(velocidadDesplazamiento(dy, P)).toBe(0);
  });

  it("hacia abajo positiva, hacia arriba negativa (misma magnitud)", () => {
    expect(velocidadDesplazamiento(40, P)).toBeGreaterThan(0);
    expect(velocidadDesplazamiento(-40, P)).toBeCloseTo(-velocidadDesplazamiento(40, P), 9);
  });

  it("crece con la distancia, lenta cerca del centro (curva)", () => {
    const v = [12, 20, 40, 60].map((dy) => velocidadDesplazamiento(dy, P));
    for (let i = 1; i < v.length; i++) expect(v[i]!).toBeGreaterThan(v[i - 1]!);
    // A mitad de la zona va bastante menos que a mitad de la velocidad (por la curva).
    expect(velocidadDesplazamiento(40, P)).toBeLessThan(P.V_MAX_DESPLAZAR / 2);
  });

  it("en el borde de la zona (72 px) y más allá: la máxima, y se mantiene", () => {
    expect(velocidadDesplazamiento(72, P)).toBeCloseTo(P.V_MAX_DESPLAZAR, 9);
    expect(velocidadDesplazamiento(200, P)).toBeCloseTo(P.V_MAX_DESPLAZAR, 9);
  });

  it("con movimiento reducido, la máxima es menor", () => {
    expect(velocidadDesplazamiento(200, P, true)).toBeCloseTo(P.V_MAX_REDUCIDO, 9);
    expect(velocidadDesplazamiento(40, P, true)).toBeLessThan(velocidadDesplazamiento(40, P));
  });
});

describe("métricas", () => {
  it("scroll_start al entrar y scroll_end {ms} al soltar", () => {
    const g = geo();
    const eventos: AnchorEvent[] = [ev.down(g, g.centro, 0), ev.move(hacia(g, 270), 40), ev.move(hacia(g, 270, 60), 100), ev.up(hacia(g, 270, 60), 940)];
    let estado: AnchorState = { tipo: "reposo" };
    const m: MetricEvent[] = [];
    for (const e of eventos) {
      const next = transition(estado, e);
      m.push(...derivarMetricas(estado, next, e));
      estado = next;
    }
    expect(m).toEqual([{ type: "scroll_start", modo: "vertical" }, { type: "scroll_end", ms: 900 }]);
  });
});
