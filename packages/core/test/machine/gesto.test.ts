import { describe, expect, it } from "vitest";
import { proximoPlazo } from "../../src/machine/deadline";
import type { AnchorEvent, AnchorState } from "../../src/machine/states";
import { transition } from "../../src/machine/transition";
import { ID_ATRAS } from "../../src/validate";
import { mapa } from "../fixtures/pantallas-ruteando";
import { P, ev, final, geometria, hacia, mas, recorrer } from "./ayudas";

// T-06: reposo, armado, descanso y gesto (design.md §3.3, filas 1, 4–11, 13–17, 34, 37).

const geo = geometria();
const c = geo.centro;

describe("reposo", () => {
  it("fila 1: pointerdown en el ancla → armado", () => {
    const s = final([ev.down(geo, c, 1000)]);
    expect(s).toMatchObject({ tipo: "armado", pointerId: 1, inicio: c, t0: 1000, recorridoPx: 0 });
  });

  it("ignora pointerdown fuera del ancla o sin geometría", () => {
    expect(final([ev.down(geo, c, 0, "fuera")]).tipo).toBe("reposo");
    const sinGeo: AnchorEvent = { tipo: "POINTER_DOWN", pointerId: 1, punto: c, t: 0, sobre: "ancla" };
    expect(final([sinGeo]).tipo).toBe("reposo");
  });

  it("fila 37: los demás eventos no hacen nada", () => {
    for (const e of [ev.move(c, 0), ev.up(c, 0), ev.tick(99999), { tipo: "COMPLETADO" } as AnchorEvent]) {
      expect(transition({ tipo: "reposo" }, e)).toEqual({ tipo: "reposo" });
    }
  });
});

describe("armado: toque, gesto o descanso (D-07)", () => {
  it("fila 4: moverse más de 10 px antes de 400 ms abre en modo gesto", () => {
    const s = final([ev.down(geo, c, 0), ev.move(mas(c, -10.1), 50)]);
    expect(s).toMatchObject({ tipo: "abierto_gesto", tApertura: 50, modoApertura: "gesto", presel: undefined });
  });

  it("moverse exactamente 10 px todavía no abre", () => {
    expect(final([ev.down(geo, c, 0), ev.move(mas(c, -10), 50)]).tipo).toBe("armado");
  });

  it("los movimientos pequeños acumulan recorrido sin abrir", () => {
    const s = final([ev.down(geo, c, 0), ev.move(mas(c, 3), 10), ev.move(mas(c, 3, 4), 20)]);
    expect(s).toMatchObject({ tipo: "armado", recorridoPx: 7 });
  });

  it("fila 5: soltar sin moverse antes de 250 ms abre en modo toque (HU-05)", () => {
    const s = final([ev.down(geo, c, 0), ev.up(mas(c, 5), 249)]);
    expect(s).toMatchObject({ tipo: "abierto_toque", t0: 0, tApertura: 249, ultimaActividad: 249, sinCierrePorTiempo: false });
  });

  it("fila 6: soltar sin moverse entre 250 y 400 ms no hace nada", () => {
    expect(final([ev.down(geo, c, 0), ev.up(c, 250)]).tipo).toBe("reposo");
    expect(final([ev.down(geo, c, 0), ev.up(c, 399)]).tipo).toBe("reposo");
  });

  it("fila 8: quieto 400 ms entra en descanso (HU-04)", () => {
    expect(final([ev.down(geo, c, 0), ev.tick(399)]).tipo).toBe("armado");
    expect(final([ev.down(geo, c, 0), ev.tick(400)])).toMatchObject({ tipo: "descanso", puntoDescanso: c });
  });

  it("si el TICK llega tarde, un movimiento después de 400 ms se trata como desde el descanso", () => {
    const s = final([ev.down(geo, c, 0), ev.move(mas(c, -5), 450)]);
    expect(s.tipo).toBe("descanso");
  });

  it("ignora eventos de otro puntero", () => {
    expect(final([ev.down(geo, c, 0), ev.move(mas(c, -50), 10, 2)]).tipo).toBe("armado");
    expect(final([ev.down(geo, c, 0), ev.up(c, 10, 2)]).tipo).toBe("armado");
  });

  it("proximoPlazo: armado vence en t0 + T_DESCANSO", () => {
    expect(proximoPlazo(final([ev.down(geo, c, 1000)]))).toBe(1400);
    expect(proximoPlazo({ tipo: "reposo" })).toBeUndefined();
  });
});

describe("descanso (D-11, HU-04)", () => {
  const enDescanso = [ev.down(geo, c, 0), ev.tick(400)];

  it("fila 9: soltar no hace nada", () => {
    expect(final([...enDescanso, ev.up(c, 2000)]).tipo).toBe("reposo");
  });

  it("fila 10: deslizar desde el descanso abre en modo gesto", () => {
    const s = final([...enDescanso, ev.move(hacia(geo, 150, 60), 900)]);
    expect(s).toMatchObject({ tipo: "abierto_gesto", presel: "editar", tApertura: 900 });
  });

  it("C-07: se mide desde donde empezó el descanso, no desde el primer toque", () => {
    // Antes del descanso el pulgar ya se había corrido 8 px.
    const corrido = mas(c, -8);
    const eventos = [ev.down(geo, c, 0), ev.move(corrido, 100), ev.tick(400)];
    // 3 px más desde ahí: 11 px desde el inicio, pero solo 3 desde el descanso.
    expect(final([...eventos, ev.move(mas(c, -11), 500)]).tipo).toBe("descanso");
    // 10,5 px desde el punto de descanso: abre.
    expect(final([...eventos, ev.move(mas(c, -18.5), 500)]).tipo).toBe("abierto_gesto");
  });

  it("no tiene plazo propio", () => {
    expect(proximoPlazo(final(enDescanso))).toBeUndefined();
  });
});

describe("abierto_gesto: preselección (RF-02, RF-03, HU-02)", () => {
  const abrir = [ev.down(geo, c, 0), ev.move(hacia(geo, 150, 30), 40)];

  it("fila 11: la preselección sigue al dedo", () => {
    const estados = recorrer([...abrir, ev.move(hacia(geo, 150, 90), 60), ev.move(hacia(geo, 120, 90), 80)]);
    const presel = estados.map((s) => (s.tipo === "abierto_gesto" ? s.presel : s.tipo));
    expect(presel).toEqual(["armado", "editar", "editar", "marcar-no-disponible"]);
  });

  it("en la zona muerta no hay preselección", () => {
    const s = final([...abrir, ev.move(hacia(geo, 150, 20), 60)]);
    expect(s).toMatchObject({ tipo: "abierto_gesto", presel: undefined });
  });

  it("guarda el recorrido completo desde el primer toque", () => {
    const s = final([...abrir, ev.move(hacia(geo, 150, 90), 60)]);
    expect(s.tipo === "abierto_gesto" && s.recorridoPx).toBeCloseTo(90, 9);
  });
});

describe("abierto_gesto: soltar", () => {
  const abrir = [ev.down(geo, c, 0), ev.move(hacia(geo, 150, 30), 40)];

  it("fila 16: sobre una opción normal ejecuta (HU-01)", () => {
    const s = final([...abrir, ev.move(hacia(geo, 150, 100), 300), ev.up(hacia(geo, 150, 100), 320)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "editar", modo: "gesto", experto: false, ms: 320 });
    expect(s.tipo === "ejecutando" && s.recorridoPx).toBeCloseTo(100, 9);
  });

  it("fila 16: sobre una reversible también ejecuta (el deshacer lo pone el adaptador)", () => {
    const s = final([...abrir, ev.up(hacia(geo, 120, 100), 320)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "marcar-no-disponible" });
  });

  it("se evalúa donde se suelta, no en el último movimiento", () => {
    const s = final([...abrir, ev.move(hacia(geo, 150, 100), 300), ev.up(hacia(geo, 90, 100), 320)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: ID_ATRAS });
  });

  it("fila 13: en la zona muerta cancela (HU-03, D-10)", () => {
    const s = final([...abrir, ev.move(hacia(geo, 150, 100), 300), ev.up(mas(c, 5), 500)]);
    expect(s).toEqual({ tipo: "cancelado", motivo: "zona_muerta" });
  });

  it("fila 14 (C-08): fuera del arco cancela", () => {
    const s = final([...abrir, ev.up(hacia(geo, 270, 100), 500)]);
    expect(s).toEqual({ tipo: "cancelado", motivo: "fuera_de_arco" });
  });

  it("fila 15 (C-09): sobre una opción deshabilitada cancela", () => {
    const conDeshabilitada = geometria({ ...mapa, actions: mapa.actions.map((a) => (a.id === "buscar" ? { ...a, disabled: true } : a)) });
    const cc = conDeshabilitada.centro;
    // Mapa: Buscar está en 150°.
    const s = final([ev.down(conDeshabilitada, cc, 0), ev.move(hacia(conDeshabilitada, 150, 60), 40), ev.up(hacia(conDeshabilitada, 150, 100), 300)]);
    expect(s).toEqual({ tipo: "cancelado", motivo: "deshabilitada" });
  });

  it("fila 17: sobre una irreversible sin pasar el anillo queda bloqueada (HU-08)", () => {
    const s = final([...abrir, ev.up(hacia(geo, 180, 120), 500)]);
    expect(s).toEqual({ tipo: "bloqueado_sensible", id: "eliminar" });
  });
});

describe("modo experto (D-08, HU-06)", () => {
  it("soltar antes de T_ANIM desde que se abrió cuenta como experto", () => {
    const s = final([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 40), 16), ev.up(hacia(geo, 150, 100), 16 + P.T_ANIM - 1)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "editar", experto: true });
  });

  it("soltar justo en T_ANIM ya no es experto", () => {
    const s = final([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 40), 16), ev.up(hacia(geo, 150, 100), 16 + P.T_ANIM)]);
    expect(s).toMatchObject({ tipo: "ejecutando", experto: false });
  });

  it("fila 7 (C-05): llegar lejos sin ningún pointermove ejecuta igual, como experto", () => {
    const s = final([ev.down(geo, c, 0), ev.up(hacia(geo, 150, 99), 12)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "editar", experto: true, ms: 12 });
    expect(s.tipo === "ejecutando" && s.recorridoPx).toBeCloseTo(99, 9);
  });

  it("fila 7 (C-05): exactamente 10 px sin moverse ya cuenta como gesto (y cae en la zona muerta)", () => {
    expect(final([ev.down(geo, c, 0), ev.up(mas(c, -10), 12)])).toEqual({ tipo: "cancelado", motivo: "zona_muerta" });
  });

  it("fila 7 (C-05): también respeta irreversibles y el arco", () => {
    expect(final([ev.down(geo, c, 0), ev.up(hacia(geo, 180, 100), 12)])).toEqual({ tipo: "bloqueado_sensible", id: "eliminar" });
    expect(final([ev.down(geo, c, 0), ev.up(hacia(geo, 300, 100), 12)])).toEqual({ tipo: "cancelado", motivo: "fuera_de_arco" });
  });
});

describe("estados transitorios (fila 34)", () => {
  const transitorios: AnchorState[] = [
    { tipo: "ejecutando", id: "x", modo: "gesto", experto: false, ms: 1, recorridoPx: 1 },
    { tipo: "cancelado", motivo: "zona_muerta" },
    { tipo: "bloqueado_sensible", id: "eliminar" },
  ];

  for (const s of transitorios) {
    it(`${s.tipo} → reposo con COMPLETADO, e ignora lo demás`, () => {
      expect(transition(s, { tipo: "COMPLETADO" })).toEqual({ tipo: "reposo" });
      expect(transition(s, ev.down(geo, c, 0))).toBe(s);
      expect(transition(s, ev.tick(1e9))).toBe(s);
    });
  }
});

describe("mano izquierda", () => {
  it("el mismo gesto reflejado ejecuta la misma acción", () => {
    const izq = geometria(undefined, "left");
    const s = final([ev.down(izq, izq.centro, 0), ev.move(hacia(izq, 150, 40), 30), ev.up(hacia(izq, 150, 100), 300)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "editar" });
  });
});

it("transition no modifica el estado recibido (inmutabilidad)", () => {
  const armado = final([ev.down(geo, c, 0)]);
  const copia = structuredClone(armado);
  transition(armado, ev.move(hacia(geo, 150, 80), 20));
  expect(armado).toEqual(copia);
});
