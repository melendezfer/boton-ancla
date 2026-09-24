import { describe, expect, it } from "vitest";
import type { AnchorEvent, AnchorState } from "../src/machine/states";
import { transition } from "../src/machine/transition";
import { derivarMetricas, type MetricEvent } from "../src/metrics";
import { ID_DESHACER } from "../src/validate";
import { ev, geometria, hacia, mas } from "./machine/ayudas";

// T-10: métricas derivadas (spec §9, design.md §3.5).

const geo = geometria();
const c = geo.centro;

/** Aplica los eventos desde reposo y junta todas las métricas en orden. */
function metricas(eventos: AnchorEvent[], inicial: AnchorState = { tipo: "reposo" }): MetricEvent[] {
  const todas: MetricEvent[] = [];
  let estado = inicial;
  for (const e of eventos) {
    const next = transition(estado, e);
    todas.push(...derivarMetricas(estado, next, e));
    estado = next;
  }
  return todas;
}

describe("derivarMetricas", () => {
  it("sin cambio de estado no hay métricas", () => {
    const s: AnchorState = { tipo: "reposo" };
    expect(derivarMetricas(s, s, ev.tick(0))).toEqual([]);
  });

  it("recorrido completo de gesto: open, preselect ×2, execute con ms y pathPx", () => {
    expect(
      metricas([
        ev.down(geo, c, 0),
        ev.move(hacia(geo, 150, 30), 40),
        ev.move(hacia(geo, 150, 100), 120),
        ev.move(hacia(geo, 120, 100), 200),
        ev.up(hacia(geo, 120, 100), 260),
      ]),
    ).toEqual([
      { type: "open", mode: "gesto" },
      { type: "preselect", id: "editar" },
      { type: "preselect", id: "marcar-no-disponible" },
      { type: "execute", id: "marcar-no-disponible", ms: 260, pathPx: Math.round(100 + 2 * 100 * Math.sin((15 * Math.PI) / 180)), expert: false, mode: "gesto" },
    ]);
  });

  it("no repite preselect si la opción no cambia", () => {
    const m = metricas([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 30), 40), ev.move(hacia(geo, 150, 60), 60), ev.move(hacia(geo, 150, 90), 80)]);
    expect(m.filter((x) => x.type === "preselect")).toHaveLength(1);
  });

  it("volver a la zona muerta y otra vez a la misma opción la registra de nuevo", () => {
    const m = metricas([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 60), 40), ev.move(hacia(geo, 150, 10), 60), ev.move(hacia(geo, 150, 60), 80)]);
    expect(m.filter((x) => x.type === "preselect")).toEqual([
      { type: "preselect", id: "editar" },
      { type: "preselect", id: "editar" },
    ]);
  });

  it("cancelar volviendo al centro: cancel {zona_muerta}", () => {
    const m = metricas([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 60), 40), ev.up(mas(c, 2), 300)]);
    expect(m.at(-1)).toEqual({ type: "cancel", reason: "zona_muerta" });
  });

  it("modo experto: expert = true en execute (C-04)", () => {
    const m = metricas([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 40), 16), ev.up(hacia(geo, 150, 100), 60)]);
    expect(m.at(-1)).toMatchObject({ type: "execute", expert: true });
    expect(m[0]).toEqual({ type: "open", mode: "gesto" }); // "experto" no existe como modo de open
  });

  it("deslizamiento relámpago sin pointermove (C-05): igual registra open gesto", () => {
    expect(metricas([ev.down(geo, c, 0), ev.up(hacia(geo, 150, 100), 12)])).toEqual([
      { type: "open", mode: "gesto" },
      { type: "execute", id: "editar", ms: 12, pathPx: 100, expert: true, mode: "gesto" },
    ]);
  });

  it("modo toque: open toque y execute con mode toque", () => {
    const e = hacia(geo, 150, 100);
    expect(metricas([ev.down(geo, c, 0), ev.up(c, 100), ev.down(geo, e, 500, { id: "editar" }), ev.up(e, 560)])).toEqual([
      { type: "open", mode: "toque" },
      { type: "execute", id: "editar", ms: 560, pathPx: 0, expert: false, mode: "toque" },
    ]);
  });

  it("lector de pantalla (ACTIVAR) cuenta como open toque", () => {
    expect(metricas([{ tipo: "ACTIVAR", t: 0, geo }])).toEqual([{ type: "open", mode: "toque" }]);
  });

  it("teclado: open teclado, preselect al mover el foco, execute con mode teclado", () => {
    const t = (tecla: "Enter" | "ArrowUp", tiempo: number): AnchorEvent => ({ tipo: "TECLA", tecla, t: tiempo, geo });
    expect(metricas([t("Enter", 0), t("ArrowUp", 50), t("Enter", 90)])).toEqual([
      { type: "open", mode: "teclado" },
      { type: "preselect", id: "editar" },
      { type: "preselect", id: "marcar-no-disponible" },
      { type: "execute", id: "marcar-no-disponible", ms: 90, pathPx: 0, expert: false, mode: "teclado" },
    ]);
  });

  it("descanso: rest_enter", () => {
    expect(metricas([ev.down(geo, c, 0), ev.tick(400), ev.up(c, 900)])).toEqual([{ type: "rest_enter" }]);
  });

  it("desde el descanso, deslizar abre en modo gesto", () => {
    const m = metricas([ev.down(geo, c, 0), ev.tick(400), ev.move(hacia(geo, 150, 60), 600)]);
    expect(m).toEqual([{ type: "rest_enter" }, { type: "open", mode: "gesto" }, { type: "preselect", id: "editar" }]);
  });

  it("irreversible sin cruzar el anillo: sensitive_blocked", () => {
    const m = metricas([ev.down(geo, c, 0), ev.move(hacia(geo, 180, 60), 40), ev.up(hacia(geo, 180, 100), 200)]);
    expect(m.at(-1)).toEqual({ type: "sensitive_blocked", id: "eliminar" });
  });

  it("segundo dedo: cancel {segundo_dedo}", () => {
    const m = metricas([ev.down(geo, c, 0), ev.down(geo, c, 10, "fuera", 2)]);
    expect(m).toEqual([{ type: "cancel", reason: "segundo_dedo" }]);
  });

  it('ejecutar "Deshacer" no genera execute (el adaptador registra undo con el id original)', () => {
    const conAviso = geometria(undefined, "right", true);
    const deshacer = conAviso.slots.find((s) => s.id === ID_DESHACER)!;
    const m = metricas([ev.down(conAviso, conAviso.centro, 0), ev.move(deshacer.punto, 50), ev.up(deshacer.punto, 100)]);
    expect(m.some((x) => x.type === "execute")).toBe(false);
    expect(m).toContainEqual({ type: "preselect", id: ID_DESHACER });
  });
});
