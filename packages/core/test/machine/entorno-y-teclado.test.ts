import { describe, expect, it } from "vitest";
import { proximoPlazo } from "../../src/machine/deadline";
import type { AnchorEvent, AnchorState, Tecla } from "../../src/machine/states";
import { transition } from "../../src/machine/transition";
import { ID_ATRAS } from "../../src/validate";
import { productoDueno } from "../fixtures/pantallas-ruteando";
import { ev, final, geometria, hacia, mas, recorrer } from "./ayudas";

// T-09: cancelaciones del entorno (filas 35–36), lector de pantalla (fila 2) y
// teclado (filas 3, 31–33, 38–40). RF-09, RF-10, RNF-05, C-12.
// Producto dueño, slots por index: 0 Atrás 90° · 1 Marcar no disponible 120° · 2 Editar 150° · 3 Eliminar 180°.
// Prioridad 1 = Editar (index 2).

const geo = geometria();
const c = geo.centro;
const tecla = (t: Tecla, tiempo = 0, conGeo = true): AnchorEvent => ({ tipo: "TECLA", tecla: t, t: tiempo, geo: conGeo ? geo : undefined });

/** Un estado de cada tipo "activo" (ni reposo ni transitorio), con el puntero 1 apoyado cuando aplica. */
const activos: Record<string, AnchorEvent[]> = {
  armado: [ev.down(geo, c, 0)],
  descanso: [ev.down(geo, c, 0), ev.tick(400)],
  abierto_gesto: [ev.down(geo, c, 0), ev.move(hacia(geo, 150, 60), 30)],
  confirmacion_armada: [ev.down(geo, c, 0), ev.move(hacia(geo, 180, 170), 30)],
  "abierto_toque (con dedo en una opción)": [ev.down(geo, c, 0), ev.up(c, 50), ev.down(geo, hacia(geo, 150, 100), 60, { id: "editar" })],
};

describe("cancelaciones del entorno (filas 35 y 36)", () => {
  for (const [nombre, eventos] of Object.entries(activos)) {
    describe(nombre, () => {
      const estado = final(eventos);

      it("un segundo dedo cancela (RF-09)", () => {
        expect(transition(estado, ev.down(geo, { x: 10, y: 10 }, 70, "fuera", 2))).toEqual({ tipo: "cancelado", motivo: "segundo_dedo" });
      });

      it("pointercancel del dedo apoyado cancela (RF-09)", () => {
        expect(transition(estado, { tipo: "POINTER_CANCEL", pointerId: 1 })).toEqual({ tipo: "cancelado", motivo: "pointercancel" });
      });

      it("pointercancel de otro puntero se ignora", () => {
        expect(transition(estado, { tipo: "POINTER_CANCEL", pointerId: 9 })).toBe(estado);
      });

      it("cambio de orientación cancela (RF-09)", () => {
        expect(transition(estado, { tipo: "ORIENTACION" })).toEqual({ tipo: "cancelado", motivo: "orientacion" });
      });

      it("cambio de sección cancela (RF-10)", () => {
        expect(transition(estado, { tipo: "CAMBIO_SECCION" })).toEqual({ tipo: "cancelado", motivo: "cambio_seccion" });
      });
    });
  }

  it("sin dedo apoyado (modo toque, teclado o confirmación) un nuevo toque NO es segundo dedo", () => {
    const toque = final([ev.down(geo, c, 0), ev.up(c, 50)]);
    expect(transition(toque, ev.down(geo, hacia(geo, 150, 100), 60, { id: "editar" }, 7)).tipo).toBe("abierto_toque");
    const teclado = final([tecla("Enter")]);
    expect(transition(teclado, ev.down(geo, c, 60, "ancla", 7)).tipo).toBe("abierto_teclado");
  });

  it("orientación y cambio de sección también cancelan el modo teclado y la confirmación", () => {
    const teclado = final([tecla("Enter")]);
    const confirmacion = final([tecla("Enter"), tecla("End"), tecla("Enter", 10)]);
    expect(confirmacion.tipo).toBe("confirmacion_toque");
    for (const s of [teclado, confirmacion]) {
      expect(transition(s, { tipo: "ORIENTACION" })).toEqual({ tipo: "cancelado", motivo: "orientacion" });
      expect(transition(s, { tipo: "CAMBIO_SECCION" })).toEqual({ tipo: "cancelado", motivo: "cambio_seccion" });
    }
  });

  it("en reposo y en los transitorios no hacen nada", () => {
    const quietos: AnchorState[] = [{ tipo: "reposo" }, { tipo: "cancelado", motivo: "zona_muerta" }];
    for (const s of quietos) {
      for (const e of [{ tipo: "ORIENTACION" }, { tipo: "CAMBIO_SECCION" }, { tipo: "POINTER_CANCEL", pointerId: 1 }] as AnchorEvent[]) {
        expect(transition(s, e)).toBe(s);
      }
    }
  });

  it("después de cancelar por segundo dedo, soltar el primero no revive nada", () => {
    const estados = recorrer([ev.down(geo, c, 0), ev.move(hacia(geo, 150, 60), 30), ev.down(geo, c, 40, "fuera", 2), ev.up(hacia(geo, 150, 100), 50)]);
    expect(estados.at(-1)).toEqual({ tipo: "cancelado", motivo: "segundo_dedo" });
  });
});

describe("lector de pantalla (fila 2, C-12)", () => {
  const activar: AnchorEvent = { tipo: "ACTIVAR", t: 500, geo };

  it("ACTIVAR abre en modo toque sin cierre por tiempo", () => {
    const s = final([activar]);
    expect(s).toMatchObject({ tipo: "abierto_toque", sinCierrePorTiempo: true, t0: 500 });
    expect(proximoPlazo(s)).toBeUndefined();
    expect(transition(s, ev.tick(1e9)).tipo).toBe("abierto_toque");
  });

  it("una irreversible desde ahí tampoco se cierra por tiempo al pedir confirmación", () => {
    const e = hacia(geo, 180, 100);
    const s = final([activar, ev.down(geo, e, 600, { id: "eliminar" }), ev.up(e, 650)]);
    expect(s).toMatchObject({ tipo: "confirmacion_toque", sinCierrePorTiempo: true });
    expect(proximoPlazo(s)).toBeUndefined();
  });
});

describe("teclado (filas 3, 31–33, RNF-05)", () => {
  const foco = (s: AnchorState) => (s.tipo === "abierto_teclado" ? geo.slots[s.foco]!.id : s.tipo);

  it.each(["Enter", " ", "ArrowUp"] as Tecla[])("fila 3: %j abre con el foco en la prioridad 1", (t) => {
    const s = final([tecla(t, 100)]);
    expect(s).toMatchObject({ tipo: "abierto_teclado", t0: 100 });
    expect(foco(s)).toBe("editar");
  });

  it("otras teclas o sin geometría no abren", () => {
    expect(final([tecla("ArrowDown")]).tipo).toBe("reposo");
    expect(final([tecla("Enter", 0, false)]).tipo).toBe("reposo");
  });

  it("no tiene cierre por tiempo (C-12)", () => {
    const s = final([tecla("Enter")]);
    expect(proximoPlazo(s)).toBeUndefined();
    expect(transition(s, ev.tick(1e9))).toBe(s);
  });

  it("fila 31: ↑ va hacia arriba y ↓ hacia el extremo lateral, sin dar la vuelta", () => {
    const recorrido = recorrer([tecla("Enter"), tecla("ArrowUp"), tecla("ArrowUp"), tecla("ArrowUp"), tecla("ArrowDown"), tecla("End"), tecla("ArrowDown"), tecla("Home")]);
    expect(recorrido.map(foco)).toEqual(["editar", "marcar-no-disponible", ID_ATRAS, ID_ATRAS, "marcar-no-disponible", "eliminar", "eliminar", ID_ATRAS]);
  });

  it("fila 31: con la mano derecha ← va hacia el extremo lateral (izquierda) y → hacia arriba", () => {
    expect(recorrer([tecla("Enter"), tecla("ArrowLeft"), tecla("ArrowRight"), tecla("ArrowRight")]).map(foco)).toEqual([
      "editar",
      "eliminar",
      "editar",
      "marcar-no-disponible",
    ]);
  });

  it("fila 31: con la mano izquierda se reflejan: → hacia el extremo lateral (derecha)", () => {
    const izq = geometria(productoDueno, "left");
    const t = (k: Tecla): AnchorEvent => ({ tipo: "TECLA", tecla: k, t: 0, geo: izq });
    const ids = recorrer([t("Enter"), t("ArrowRight"), t("ArrowLeft"), t("ArrowLeft")]).map((s) =>
      s.tipo === "abierto_teclado" ? izq.slots[s.foco]!.id : s.tipo,
    );
    expect(ids).toEqual(["editar", "eliminar", "editar", "marcar-no-disponible"]);
  });

  it("fila 32: Enter ejecuta la opción con foco", () => {
    expect(final([tecla("Enter", 100), tecla("ArrowUp", 200), tecla("Enter", 300)])).toEqual({
      tipo: "ejecutando",
      id: "marcar-no-disponible",
      modo: "teclado",
      experto: false,
      ms: 200,
      recorridoPx: 0,
    });
  });

  it("fila 32: Espacio también ejecuta", () => {
    expect(final([tecla("Enter"), tecla(" ")])).toMatchObject({ tipo: "ejecutando", id: "editar" });
  });

  it("fila 32: una irreversible pide confirmar, sin cierre por tiempo; Confirmar la ejecuta", () => {
    const pide = final([tecla("Enter", 100), tecla("End", 150), tecla("Enter", 200)]);
    expect(pide).toMatchObject({ tipo: "confirmacion_toque", id: "eliminar", modo: "teclado", sinCierrePorTiempo: true });
    expect(transition(pide, { tipo: "CONFIRMAR", t: 400 })).toMatchObject({ tipo: "ejecutando", id: "eliminar", modo: "teclado", ms: 300 });
  });

  it("fila 32: Enter sobre una deshabilitada no hace nada", () => {
    const g = geometria({ ...productoDueno, actions: productoDueno.actions.map((a) => (a.id === "editar" ? { ...a, disabled: true } : a)) });
    const abierto = final([{ tipo: "TECLA", tecla: "Enter", t: 0, geo: g }]);
    expect(transition(abierto, { tipo: "TECLA", tecla: "Enter", t: 10 })).toBe(abierto);
  });

  it("fila 33: Escape cierra", () => {
    expect(final([tecla("Enter"), tecla("Escape")])).toEqual({ tipo: "cancelado", motivo: "escape" });
  });

  it("fila 40: tocar fuera cierra", () => {
    expect(final([tecla("Enter"), ev.down(geo, { x: 1, y: 1 }, 10, "fuera", 3)])).toEqual({ tipo: "cancelado", motivo: "toque_fuera" });
  });

  it("sin opciones no abre", () => {
    const vacia = geometria({ ...productoDueno, back: undefined, actions: [] });
    expect(final([{ tipo: "TECLA", tecla: "Enter", t: 0, geo: vacia }]).tipo).toBe("reposo");
  });
});

describe("teclado dentro del modo toque (filas 38 y 39, RNF-05)", () => {
  const toque = [ev.down(geo, c, 0), ev.up(c, 50)];

  it("fila 38: Escape cierra el menú abierto por toque", () => {
    expect(final([...toque, tecla("Escape", 60)])).toEqual({ tipo: "cancelado", motivo: "escape" });
  });

  it("fila 39: una flecha pasa a navegar con teclado desde la prioridad 1", () => {
    const s = final([...toque, tecla("ArrowDown", 60)]);
    expect(s).toMatchObject({ tipo: "abierto_teclado", t0: 0 });
    expect(s.tipo === "abierto_teclado" && geo.slots[s.foco]!.id).toBe("editar");
  });

  it("otras teclas no hacen nada", () => {
    const s = final(toque);
    expect(transition(s, tecla("Home", 60))).toBe(s);
  });

  it("con un dedo apoyado en el centro, la flecha igual cambia a teclado (el dedo deja de contar)", () => {
    const s = final([...toque, ev.down(geo, mas(c, 1), 60, "ancla", 2), tecla("ArrowUp", 70)]);
    expect(s.tipo).toBe("abierto_teclado");
  });
});
