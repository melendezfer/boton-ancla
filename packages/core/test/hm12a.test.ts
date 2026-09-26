import { describe, expect, it } from "vitest";
import { agrupar, resolverApuntado, zoomParaSeparar } from "../src/apuntar";
import { distancia, puntoEnDireccion } from "../src/geometry";
import { proximoPlazo } from "../src/machine/deadline";
import { crearGeometria, type AnchorEvent, type AnchorState, type Apuntado } from "../src/machine/states";
import { transition } from "../src/machine/transition";
import { derivarMetricas, type MetricEvent } from "../src/metrics";
import { DEFAULT_PARAMS } from "../src/params";
import type { AnchorScreen } from "../src/types";
import { validateScreen } from "../src/validate";
import { mapa } from "./fixtures/pantallas-ruteando";
import { ev, final, recorrer } from "./machine/ayudas";

// HM-12a: zoom B (RF-20, filas 47–50) y apuntar y elegir en el mapa (RF-21, filas 45–46).

const P = DEFAULT_PARAMS;
const conZoom: AnchorScreen = {
  ...mapa,
  actions: [...mapa.actions, { id: "zoom", label: "Zoom", icon: "zoom", priority: 5, onSelect: () => {}, onSlide: () => {} }],
};
const geo = (opciones: { libre?: boolean } = {}) =>
  crearGeometria({
    screen: conZoom,
    viewport: { x: 0, y: 0, width: 375, height: 667 },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    hand: "right",
    params: P,
    desplazable: true,
    modoDesplazar: opciones.libre === false ? "vertical" : "libre",
  });

function metricasDe(eventos: AnchorEvent[]): MetricEvent[] {
  let estado: AnchorState = { tipo: "reposo" };
  const m: MetricEvent[] = [];
  for (const e of eventos) {
    const next = transition(estado, e);
    m.push(...derivarMetricas(estado, next, e));
    estado = next;
  }
  return m;
}

describe("zoom B: una opción deslizador (RF-20)", () => {
  const g = geo();
  const zoom = g.slots.find((s) => s.id === "zoom")!;
  const sobreZoom = (r = 100) => puntoEnDireccion(g.centro, r, zoom.angulo);
  const llegar = (t = 40): AnchorEvent[] => [ev.down(g, g.centro, 0), ev.move(sobreZoom(60), 20), ev.move(sobreZoom(), t)];

  it("la geometría marca la opción como deslizador", () => {
    expect(zoom.deslizador).toBe(true);
    expect(g.slots.filter((s) => s.deslizador).map((s) => s.id)).toEqual(["zoom"]);
  });

  it("fila 47: quedarse T_ESPERA_DESLIZADOR sobre Zoom pasa a 'ajustando' (con su plazo para el TICK)", () => {
    const abierto = final(llegar());
    expect(abierto).toMatchObject({ tipo: "abierto_gesto", presel: "zoom" });
    const tPresel = abierto.tipo === "abierto_gesto" ? abierto.tPresel! : NaN;
    expect(proximoPlazo(abierto)).toBe(tPresel + P.T_ESPERA_DESLIZADOR);
    expect(transition(abierto, ev.tick(tPresel + P.T_ESPERA_DESLIZADOR - 1)).tipo).toBe("abierto_gesto");
    const s = transition(abierto, ev.tick(tPresel + P.T_ESPERA_DESLIZADOR));
    expect(s).toMatchObject({ tipo: "ajustando", id: "zoom", origen: sobreZoom() });
  });

  it("fila 47: un MOVE que llega tarde primero completa la espera", () => {
    const eventos = [...llegar(), ev.move(sobreZoom(110), 40 + P.T_ESPERA_DESLIZADOR + 50)];
    expect(final(eventos)).toMatchObject({ tipo: "ajustando", id: "zoom", ultimo: sobreZoom(110) });
  });

  it("pasar por otra opción reinicia la espera (tPresel es desde la última llegada)", () => {
    const otra = g.slots.find((s) => s.id !== "zoom")!;
    const eventos = [
      ev.down(g, g.centro, 0),
      ev.move(sobreZoom(), 20),
      ev.move(puntoEnDireccion(g.centro, 100, otra.angulo), 200),
      ev.move(sobreZoom(), 250),
    ];
    const s = final(eventos);
    expect(s).toMatchObject({ tipo: "abierto_gesto", presel: "zoom", tPresel: 250 });
    expect(transition(s, ev.tick(20 + P.T_ESPERA_DESLIZADOR)).tipo).toBe("abierto_gesto");
  });

  it("fila 48: soltar sobre Zoom sin esperar no ejecuta: cancela con la pista (id incluido)", () => {
    expect(final([...llegar(), ev.up(sobreZoom(), 60)])).toEqual({ tipo: "cancelado", motivo: "deslizador_sin_espera", id: "zoom" });
  });

  it("fila 48: tampoco en modo experto ni en el relámpago de C-05", () => {
    expect(final([ev.down(g, g.centro, 0), ev.move(sobreZoom(40), 8), ev.up(sobreZoom(), 30)])).toMatchObject({ motivo: "deslizador_sin_espera" });
    expect(final([ev.down(g, g.centro, 0), ev.up(sobreZoom(), 12)])).toMatchObject({ motivo: "deslizador_sin_espera" });
  });

  it("filas 49–50: en 'ajustando' el pulgar se mueve libre y soltar vuelve a reposo", () => {
    const t = 40 + P.T_ESPERA_DESLIZADOR;
    const estados = recorrer([...llegar(), ev.tick(t), ev.move({ x: sobreZoom().x, y: sobreZoom().y - 60 }, t + 100), ev.up(sobreZoom(), t + 400)]);
    expect(estados.at(-2)).toMatchObject({ tipo: "ajustando", ultimo: { x: sobreZoom().x, y: sobreZoom().y - 60 } });
    expect(estados.at(-1)).toEqual({ tipo: "reposo" });
  });

  it("métricas: slider_start y slider_end {ms}; la pista cuenta como cancel", () => {
    const t = 40 + P.T_ESPERA_DESLIZADOR;
    const m = metricasDe([...llegar(), ev.tick(t), ev.up(sobreZoom(), t + 700)]);
    expect(m).toContainEqual({ type: "slider_start", id: "zoom" });
    expect(m).toContainEqual({ type: "slider_end", id: "zoom", ms: 700 });
    expect(metricasDe([...llegar(), ev.up(sobreZoom(), 60)])).toContainEqual({ type: "cancel", reason: "deslizador_sin_espera" });
  });

  it("un segundo dedo cancela también mientras se ajusta", () => {
    const t = 40 + P.T_ESPERA_DESLIZADOR;
    const s = final([...llegar(), ev.tick(t), ev.down(g, g.centro, t + 10, "ancla", 99)]);
    expect(s).toEqual({ tipo: "cancelado", motivo: "segundo_dedo" });
  });

  it("validación: un deslizador no puede ser irreversible", () => {
    const mala: AnchorScreen = { ...mapa, actions: [{ id: "z", label: "Z", icon: "z", onSelect: () => {}, onSlide: () => {}, kind: "irreversible" }] };
    expect(validateScreen(mala, P).some((e) => e.includes("deslizador"))).toBe(true);
    expect(validateScreen(conZoom, P)).toEqual([]);
  });
});

describe("apuntar y elegir en el mapa (RF-21)", () => {
  const g = geo();
  const abajo = puntoEnDireccion(g.centro, 20, 270);
  const entrar: AnchorEvent[] = [ev.down(g, g.centro, 0), ev.move(abajo, 30)];
  const pin: Apuntado = { tipo: "uno", id: "arepas" };
  const apuntar = (a: Apuntado | null): AnchorEvent => ({ tipo: "APUNTAR", apuntado: a });

  it("fila 45: APUNTAR guarda lo que hay en la mira (y null lo quita)", () => {
    expect(final([...entrar, apuntar(pin)])).toMatchObject({ tipo: "desplazando", apuntado: pin });
    expect(final([...entrar, apuntar(pin), apuntar(null)])).toMatchObject({ tipo: "desplazando", apuntado: null });
  });

  it("fila 46: soltar FRENADO (pulgar en la zona muerta) sobre un objetivo lo elige", () => {
    const s = final([...entrar, apuntar(pin), ev.move({ x: abajo.x + 3, y: abajo.y - 4 }, 200), ev.up({ x: abajo.x + 3, y: abajo.y - 4 }, 900)]);
    expect(s).toEqual({ tipo: "elegido", apuntado: pin, ms: 900 });
  });

  it("soltar en movimiento no elige: solo se detiene", () => {
    const lejos = { x: abajo.x - 50, y: abajo.y };
    expect(final([...entrar, apuntar(pin), ev.move(lejos, 200), ev.up(lejos, 300)])).toEqual({ tipo: "reposo" });
  });

  it("sin nada en la mira, soltar frenado solo se detiene", () => {
    expect(final([...entrar, ev.up(abajo, 300)])).toEqual({ tipo: "reposo" });
  });

  it("en listas (modo vertical) todavía no se elige (eso es HM-12b)", () => {
    const gv = geo({ libre: false });
    const ab = puntoEnDireccion(gv.centro, 20, 270);
    expect(final([ev.down(gv, gv.centro, 0), ev.move(ab, 30), apuntar(pin), ev.up(ab, 300)])).toEqual({ tipo: "reposo" });
  });

  it("'elegido' es transitorio: COMPLETADO vuelve a reposo", () => {
    const s = final([...entrar, apuntar(pin), ev.up(abajo, 300)]);
    expect(transition(s, { tipo: "COMPLETADO" })).toEqual({ tipo: "reposo" });
  });

  it("métricas: aim al apuntar algo nuevo, pick al elegir un pin, group_open al elegir un grupo, y scroll_end", () => {
    const grupo: Apuntado = { tipo: "grupo", ids: ["a", "b"] };
    const m1 = metricasDe([...entrar, apuntar(pin), apuntar(pin), ev.up(abajo, 500)]);
    expect(m1.filter((m) => m.type === "aim")).toEqual([{ type: "aim", tipo: "uno" }]); // el repetido no cuenta
    expect(m1).toContainEqual({ type: "pick", id: "arepas" });
    expect(m1).toContainEqual({ type: "scroll_end", ms: 470 });
    const m2 = metricasDe([...entrar, apuntar(grupo), ev.up(abajo, 500)]);
    expect(m2).toContainEqual({ type: "aim", tipo: "grupo" });
    expect(m2).toContainEqual({ type: "group_open", n: 2 });
  });
});

describe("qué hay en la mira: imán, grupos y zoom para separar", () => {
  const mira = { x: 200, y: 400 };

  it("un pin dentro de IMAN_RADIO queda apuntado, con su posición como destino del imán", () => {
    const r = resolverApuntado(mira, [{ id: "a", x: 220, y: 410 }], P);
    expect(r).toEqual({ apuntado: { tipo: "uno", id: "a" }, destino: { x: 220, y: 410 } });
  });

  it("fuera del imán, nada", () => {
    expect(resolverApuntado(mira, [{ id: "a", x: 200 + P.IMAN_RADIO + 1, y: 400 }], P).apuntado).toBeNull();
  });

  it("nivel 1: con un vecino cerca, el imán se achica a la mitad de la distancia (sin bajar de IMAN_RADIO_MIN)", () => {
    // a y b a 40 px: imán de 20 px cada uno. La mira a 22 px de a ya no lo apunta.
    const pins = [
      { id: "a", x: 222, y: 400 },
      { id: "b", x: 262, y: 400 },
    ];
    expect(resolverApuntado(mira, pins, P).apuntado).toBeNull();
    expect(resolverApuntado({ x: 205, y: 400 }, pins, P).apuntado).toEqual({ tipo: "uno", id: "a" });
    // Con vecinos muy cerca (pero no en grupo) el imán no baja de IMAN_RADIO_MIN.
    const juntos = [
      { id: "a", x: 200, y: 400 },
      { id: "b", x: 200 + P.GRUPO_DISTANCIA, y: 400 },
    ];
    expect(resolverApuntado({ x: 200 - P.IMAN_RADIO_MIN, y: 400 }, juntos, P).apuntado).toEqual({ tipo: "uno", id: "a" });
  });

  it("gana el más cercano a la mira", () => {
    const pins = [
      { id: "lejos", x: 215, y: 400 },
      { id: "cerca", x: 190, y: 400 },
    ];
    expect(resolverApuntado(mira, pins, P).apuntado).toEqual({ tipo: "uno", id: "cerca" });
  });

  it("nivel 2: pines a menos de GRUPO_DISTANCIA (también en cadena) forman un grupo, apuntado en su centro", () => {
    const pins = [
      { id: "b", x: 200, y: 400 },
      { id: "a", x: 215, y: 400 },
      { id: "c", x: 230, y: 400 }, // a 30 de b, pero a 15 de a: misma cadena
      { id: "solo", x: 400, y: 400 },
    ];
    expect(agrupar(pins, P).map((g) => g.map((o) => o.id).sort())).toEqual([["a", "b", "c"], ["solo"]]);
    const r = resolverApuntado(mira, pins, P);
    expect(r.apuntado).toEqual({ tipo: "grupo", ids: ["a", "b", "c"] });
    expect(r.destino).toEqual({ x: 215, y: 400 });
  });

  it("nivel 3: el zoom para separar deja el par más cercano a 1,5 × GRUPO_DISTANCIA", () => {
    const grupo = [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 12, y: 0 },
      { id: "c", x: 0, y: 20 },
    ];
    const k = zoomParaSeparar(grupo, P);
    expect(12 * k).toBeCloseTo(1.5 * P.GRUPO_DISTANCIA, 9);
    // Después del zoom ya no son grupo.
    const acercados = grupo.map((o) => ({ ...o, x: o.x * k, y: o.y * k }));
    expect(agrupar(acercados, P)).toHaveLength(3);
    expect(distancia(acercados[0], acercados[1])).toBeGreaterThanOrEqual(P.GRUPO_DISTANCIA);
  });
});
