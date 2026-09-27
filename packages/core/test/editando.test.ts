import { describe, expect, it } from "vitest";
import { puntoEnDireccion } from "../src/geometry";
import { proximoPlazo } from "../src/machine/deadline";
import { crearGeometria, type AnchorEvent, type AnchorState } from "../src/machine/states";
import { transition } from "../src/machine/transition";
import { derivarMetricas, type MetricEvent } from "../src/metrics";
import { DEFAULT_PARAMS } from "../src/params";
import type { AnchorScreen } from "../src/types";
import { validateScreen } from "../src/validate";
import { ev, final, recorrer } from "./machine/ayudas";

// T3-05 (Fase 3): modo edición del ancla (filas 54–58; RF3-01…RF3-04, D-12).

const P = DEFAULT_PARAMS;
const nada = () => {};
const ajustes: AnchorScreen = {
  id: "ajustes",
  sectionIcon: "GearSix",
  sectionLabel: "Ajustes",
  back: { onSelect: nada },
  actions: [{ id: "mover-ancla", label: "Mover ancla", icon: "mover", onSelect: nada, moveAnchor: true, priority: 1 }],
};
const g = crearGeometria({
  screen: ajustes,
  viewport: { x: 0, y: 0, width: 375, height: 667 },
  safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  hand: "right",
  params: P,
  desplazable: true,
});
const mover = g.slots.find((s) => s.id === "mover-ancla")!;
const sobre = (r = 100) => puntoEnDireccion(g.centro, r, mover.angulo);
const llegar = (t = 40): AnchorEvent[] => [ev.down(g, g.centro, 0), ev.move(sobre(60), 20), ev.move(sobre(), t)];
const editar = (t = 40 + P.T_ESPERA_DESLIZADOR) => final([...llegar(), ev.tick(t)]);

function metricasDe(eventos: AnchorEvent[], inicial: AnchorState = { tipo: "reposo" }): MetricEvent[] {
  let estado = inicial;
  const m: MetricEvent[] = [];
  for (const e of eventos) {
    const next = transition(estado, e);
    m.push(...derivarMetricas(estado, next, e));
    estado = next;
  }
  return m;
}

describe("entrar al modo edición (RF3-01, fila 54)", () => {
  it("quedarse quieto sobre 'Mover ancla' T_ESPERA_DESLIZADOR entra a editando, con el dedo enganchado", () => {
    const s = editar();
    expect(s).toMatchObject({ tipo: "editando", pointerId: 1, ultimo: sobre() });
  });

  it("la espera tiene su plazo (TICK), como el deslizador", () => {
    const abierto = final(llegar());
    expect(proximoPlazo(abierto)).toBe(40 + P.T_ESPERA_DESLIZADOR);
  });

  it("soltar sin esperar ejecuta la opción (HM-17): la app entra al modo edición con su botón", () => {
    expect(final([...llegar(), ev.up(sobre(), 80)])).toMatchObject({ tipo: "ejecutando", id: "mover-ancla" });
  });

  it("D-12: quieto sobre el ANCLA es descanso, nunca edición", () => {
    const estados = recorrer([ev.down(g, g.centro, 0), ev.tick(P.T_DESCANSO), ev.tick(P.T_DESCANSO + 5000)]);
    expect(estados.some((e) => e.tipo === "editando")).toBe(false);
    expect(estados.at(-1)?.tipo).toBe("descanso");
  });

  it("el joystick (hacia abajo), el modo experto y el relámpago no entran", () => {
    expect(final([ev.down(g, g.centro, 0), ev.move(puntoEnDireccion(g.centro, 20, 270), 30), ev.tick(2000)]).tipo).toBe("desplazando");
    expect(recorrer([ev.down(g, g.centro, 0), ev.move(sobre(40), 8), ev.up(sobre(), 30)]).some((e) => e.tipo === "editando")).toBe(false);
    expect(recorrer([ev.down(g, g.centro, 0), ev.up(sobre(), 12)]).some((e) => e.tipo === "editando")).toBe(false);
  });

  it("validación: 'Mover ancla' debe ser normal y sin onSlide", () => {
    const mala: AnchorScreen = { ...ajustes, actions: [{ ...ajustes.actions[0]!, kind: "irreversible" }] };
    expect(validateScreen(mala, P).some((e) => e.includes("moveAnchor"))).toBe(true);
    expect(validateScreen(ajustes, P)).toEqual([]);
  });
});

describe("arrastrar y soltar (filas 56–57)", () => {
  it("el ancla sigue al pulgar y soltar da 'soltado' (el adaptador aplica el imán)", () => {
    const t = 40 + P.T_ESPERA_DESLIZADOR;
    const estados = recorrer([...llegar(), ev.tick(t), ev.move({ x: 60, y: 300 }, t + 100), ev.up({ x: 60, y: 300 }, t + 300)]);
    expect(estados.at(-2)).toMatchObject({ tipo: "editando", ultimo: { x: 60, y: 300 } });
    expect(estados.at(-1)).toEqual({ tipo: "soltado", punto: { x: 60, y: 300 }, ms: 300 });
    expect(transition(estados.at(-1)!, { tipo: "COMPLETADO" })).toEqual({ tipo: "reposo" });
  });
});

describe("arrepentirse (RF3-04, fila 58)", () => {
  it.each<[string, AnchorEvent]>([
    ["segundo dedo", ev.down(g, g.centro, 700, "ancla", 99)],
    ["orientación", { tipo: "ORIENTACION" }],
    ["cambio de sección", { tipo: "CAMBIO_SECCION" }],
    ["Escape", { tipo: "TECLA", tecla: "Escape", t: 700 }],
  ])("%s cancela y se registra anchor_move_cancel", (_, e) => {
    const s = transition(editar(), e);
    expect(s.tipo).toBe("cancelado");
    expect(metricasDe([e], editar()).some((m) => m.type === "anchor_move_cancel")).toBe(true);
  });
});

describe("EDITAR sin dedo (fila 55, DF3-01: el botón de Ajustes)", () => {
  const e: AnchorEvent = { tipo: "EDITAR", t: 0, geo: g };

  it("desde reposo entra a editando sin dedo; el próximo toque sobre el ancla la toma", () => {
    const s = transition({ tipo: "reposo" }, e);
    expect(s).toMatchObject({ tipo: "editando" });
    expect(s.tipo === "editando" && s.pointerId).toBeUndefined();
    const tomado = transition(s, ev.down(g, g.centro, 200));
    expect(tomado).toMatchObject({ tipo: "editando", pointerId: 1, inicio: g.centro });
  });

  it("tocar fuera del ancla o esperar T_INACTIVO cancela", () => {
    const s = transition({ tipo: "reposo" }, e);
    expect(transition(s, ev.down(g, { x: 10, y: 10 }, 100, "fuera")).tipo).toBe("cancelado");
    expect(proximoPlazo(s)).toBe(P.T_INACTIVO);
    expect(transition(s, ev.tick(P.T_INACTIVO))).toEqual({ tipo: "cancelado", motivo: "inactividad" });
  });
});
