import { describe, expect, it } from "vitest";
import { proximoPlazo } from "../../src/machine/deadline";
import type { AnchorEvent, AnchorState } from "../../src/machine/states";
import { transition } from "../../src/machine/transition";
import { productoDueno } from "../fixtures/pantallas-ruteando";
import { P, ev, final, geometria, hacia, mas, recorrer } from "./ayudas";

// T-08: modo toque (D-07, D-13, HU-05, RF-11; filas 20–30; C-06 = regla del botón clásico).
// Producto dueño: Atrás 90° · Marcar no disponible 120° · Editar 150° · Eliminar 180° (irreversible).

const geo = geometria();
const c = geo.centro;
const editar = hacia(geo, 150, 100);
const eliminar = hacia(geo, 180, 100);
const sobre = (id: string) => ({ id });

/** Toque rápido en el ancla: queda abierto en modo toque en t = 100. */
const abrirToque = [ev.down(geo, c, 0), ev.up(c, 100)];

function enToque(extra: AnchorEvent[]): AnchorState {
  return final([...abrirToque, ...extra]);
}

describe("tocar una opción (filas 20–22)", () => {
  it("fila 21: bajar y subir sobre la misma opción ejecuta (HU-05)", () => {
    const s = enToque([ev.down(geo, editar, 900, sobre("editar"), 2), ev.up(editar, 980, 2, sobre("editar"))]);
    expect(s).toEqual({ tipo: "ejecutando", id: "editar", modo: "toque", experto: false, ms: 980, recorridoPx: 0 });
  });

  it("fila 21 (C-06): sin límite de tiempo: mantener y soltar también ejecuta", () => {
    const s = enToque([ev.down(geo, editar, 900, sobre("editar"), 2), ev.tick(9000), ev.up(editar, 12000, 2)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "editar" });
  });

  it("fila 22: una irreversible pide confirmar", () => {
    const s = enToque([ev.down(geo, eliminar, 900, sobre("eliminar"), 2), ev.up(eliminar, 950, 2)]);
    expect(s).toMatchObject({ tipo: "confirmacion_toque", id: "eliminar", modo: "toque", ultimaActividad: 950 });
  });

  it("una opción deshabilitada no hace nada y el menú sigue abierto (C-09)", () => {
    const g = geometria({
      ...productoDueno,
      actions: productoDueno.actions.map((a) => (a.id === "editar" ? { ...a, disabled: true } : a)),
    });
    const e = hacia(g, 150, 100);
    const s = final([ev.down(g, g.centro, 0), ev.up(g.centro, 100), ev.down(g, e, 900, sobre("editar"), 2), ev.up(e, 950, 2)]);
    expect(s).toMatchObject({ tipo: "abierto_toque", presion: undefined });
  });
});

describe("fila 23 (C-06): arrastrar desde una opción no ejecuta", () => {
  it("moverse más de 10 px sobre la opción anula el toque, aunque vuelva", () => {
    const s = enToque([
      ev.down(geo, editar, 900, sobre("editar"), 2),
      ev.move(mas(editar, 11), 920, 2),
      ev.move(editar, 940, 2),
      ev.up(editar, 960, 2),
    ]);
    expect(s).toMatchObject({ tipo: "abierto_toque", presion: undefined, ultimaActividad: 960 });
  });

  it("soltar sobre otra opción no ejecuta ninguna", () => {
    const s = enToque([ev.down(geo, editar, 900, sobre("editar"), 2), ev.up(editar, 950, 2, sobre("eliminar"))]);
    expect(s).toMatchObject({ tipo: "abierto_toque", presion: undefined });
  });

  it("presionar algo que no está en el abanico se ignora", () => {
    const s = enToque([ev.down(geo, editar, 900, sobre("no-existe"), 2)]);
    expect(s).toMatchObject({ tipo: "abierto_toque", ultimaActividad: 900 });
    expect(s.tipo === "abierto_toque" && s.presion).toBeUndefined();
  });
});

describe("el centro en modo toque (filas 24–26)", () => {
  it("fila 26: tocar el centro cierra", () => {
    expect(enToque([ev.down(geo, c, 900, "ancla", 2), ev.up(mas(c, 3), 950, 2)])).toEqual({
      tipo: "cancelado",
      motivo: "toque_centro",
    });
  });

  it("fila 26 (C-06): también si lo mantiene mucho tiempo (no hay descanso con el menú abierto)", () => {
    expect(enToque([ev.down(geo, c, 900, "ancla", 2), ev.tick(5000), ev.up(c, 6000, 2)])).toEqual({
      tipo: "cancelado",
      motivo: "toque_centro",
    });
  });

  it("fila 25: presionar el centro y deslizar pasa a modo gesto (HU-09)", () => {
    const estados = recorrer([...abrirToque, ev.down(geo, c, 900, "ancla", 2), ev.move(hacia(geo, 150, 40), 950, 2)]);
    expect(estados.at(-1)).toMatchObject({ tipo: "abierto_gesto", modoApertura: "toque", presel: "editar", tApertura: 950, t0: 0 });
  });

  it("fila 25: y desde ahí se ejecuta soltando, pero nunca cuenta como experto", () => {
    const s = enToque([ev.down(geo, c, 900, "ancla", 2), ev.move(hacia(geo, 150, 40), 910, 2), ev.up(editar, 920, 2)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "editar", modo: "gesto", experto: false, ms: 920 });
  });

  it("fila 25: y la confirmación deslizando más allá también funciona", () => {
    const s = enToque([ev.down(geo, c, 900, "ancla", 2), ev.move(hacia(geo, 180, 160), 950, 2), ev.up(hacia(geo, 180, 160), 990, 2)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "eliminar" });
  });
});

describe("cerrar el modo toque (filas 27–28)", () => {
  it("fila 27: tocar fuera cierra (RF-11)", () => {
    expect(enToque([ev.down(geo, { x: 10, y: 10 }, 900, "fuera", 2)])).toEqual({ tipo: "cancelado", motivo: "toque_fuera" });
  });

  it("fila 28: 4 s sin actividad cierra (HU-05)", () => {
    expect(enToque([ev.tick(100 + P.T_INACTIVO - 1)]).tipo).toBe("abierto_toque");
    expect(enToque([ev.tick(100 + P.T_INACTIVO)])).toEqual({ tipo: "cancelado", motivo: "inactividad" });
  });

  it("la actividad reinicia la cuenta", () => {
    const eventos = [ev.down(geo, editar, 3000, sobre("editar"), 2), ev.up(mas(editar, 20), 3100, 2)];
    expect(proximoPlazo(enToque(eventos))).toBe(3100 + P.T_INACTIVO);
    expect(enToque([...eventos, ev.tick(3100 + P.T_INACTIVO - 1)]).tipo).toBe("abierto_toque");
  });

  it("con un dedo apoyado no corre el cierre (C-06)", () => {
    const apoyado = enToque([ev.down(geo, editar, 900, sobre("editar"), 2)]);
    expect(proximoPlazo(apoyado)).toBeUndefined();
    expect(transition(apoyado, ev.tick(99999)).tipo).toBe("abierto_toque");
  });

  it("proximoPlazo en modo toque = última actividad + T_INACTIVO", () => {
    expect(proximoPlazo(enToque([]))).toBe(100 + P.T_INACTIVO);
  });

  it("sinCierrePorTiempo (lector de pantalla) nunca vence", () => {
    const s = { ...(enToque([]) as Extract<AnchorState, { tipo: "abierto_toque" }>), sinCierrePorTiempo: true };
    expect(proximoPlazo(s)).toBeUndefined();
    expect(transition(s, ev.tick(1e9)).tipo).toBe("abierto_toque");
  });
});

describe("confirmacion_toque (filas 29–30)", () => {
  const confirmar = [ev.down(geo, eliminar, 900, sobre("eliminar"), 2), ev.up(eliminar, 950, 2)];

  it("fila 29: tocar Confirmar ejecuta", () => {
    expect(enToque([...confirmar, { tipo: "CONFIRMAR", t: 1200 }])).toEqual({
      tipo: "ejecutando",
      id: "eliminar",
      modo: "toque",
      experto: false,
      ms: 1200,
      recorridoPx: 0,
    });
  });

  it("fila 30: tocar fuera cancela", () => {
    expect(enToque([...confirmar, ev.down(geo, { x: 5, y: 5 }, 1200, "fuera", 3)])).toEqual({ tipo: "cancelado", motivo: "toque_fuera" });
  });

  it("fila 30: Escape cancela", () => {
    expect(enToque([...confirmar, { tipo: "TECLA", tecla: "Escape", t: 1200 }])).toEqual({ tipo: "cancelado", motivo: "escape" });
  });

  it("fila 30: 4 s sin actividad cancela; tocar otra cosa cuenta como actividad", () => {
    expect(proximoPlazo(enToque(confirmar))).toBe(950 + P.T_INACTIVO);
    expect(enToque([...confirmar, ev.tick(950 + P.T_INACTIVO)])).toEqual({ tipo: "cancelado", motivo: "inactividad" });
    const tocoAncla = enToque([...confirmar, ev.down(geo, c, 3000, "ancla", 3)]);
    expect(tocoAncla).toMatchObject({ tipo: "confirmacion_toque", ultimaActividad: 3000 });
  });
});
