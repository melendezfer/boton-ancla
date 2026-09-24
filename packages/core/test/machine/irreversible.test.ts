import { describe, expect, it } from "vitest";
import { final, ev, geometria, hacia, mas, recorrer } from "./ayudas";
import { productoDueno } from "../fixtures/pantallas-ruteando";

// T-07: acciones irreversibles sin retraso (D-14, RF-07, HU-08; filas 12, 17, 18, 19).
// Eliminar está en 180°; R_EXTERIOR = 148 px.

const geo = geometria();
const c = geo.centro;
const abrir = [ev.down(geo, c, 0), ev.move(hacia(geo, 180, 40), 30)];

describe("irreversibles", () => {
  it("fila 17: soltar sobre Eliminar sin pasar el anillo no elimina (HU-08)", () => {
    expect(final([...abrir, ev.move(hacia(geo, 180, 100), 200), ev.up(hacia(geo, 180, 147), 300)])).toEqual({
      tipo: "bloqueado_sensible",
      id: "eliminar",
    });
  });

  it("fila 12: cruzar el anillo exterior arma la confirmación", () => {
    const s = final([...abrir, ev.move(hacia(geo, 180, 149), 200)]);
    expect(s).toMatchObject({ tipo: "confirmacion_armada", presel: "eliminar" });
  });

  it("fila 19: soltar con la confirmación armada ejecuta (HU-08)", () => {
    const s = final([...abrir, ev.move(hacia(geo, 180, 160), 200), ev.up(hacia(geo, 180, 160), 260)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "eliminar", modo: "gesto", ms: 260 });
  });

  it("fila 18: volver dentro del anillo desarma", () => {
    const estados = recorrer([...abrir, ev.move(hacia(geo, 180, 160), 200), ev.move(hacia(geo, 180, 120), 250)]);
    expect(estados.map((s) => s.tipo)).toEqual(["armado", "abierto_gesto", "confirmacion_armada", "abierto_gesto"]);
    expect(final([...abrir, ev.move(hacia(geo, 180, 160), 200), ev.up(hacia(geo, 180, 120), 250)])).toEqual({
      tipo: "bloqueado_sensible",
      id: "eliminar",
    });
  });

  it("fila 18: cambiar de sector más allá del anillo desarma y preselecciona la otra", () => {
    const s = final([...abrir, ev.move(hacia(geo, 180, 160), 200), ev.move(hacia(geo, 150, 160), 250)]);
    expect(s).toMatchObject({ tipo: "abierto_gesto", presel: "editar" });
  });

  it("volver al centro después de armar cancela (D-10)", () => {
    const s = final([...abrir, ev.move(hacia(geo, 180, 160), 200), ev.up(mas(c, 3), 400)]);
    expect(s).toEqual({ tipo: "cancelado", motivo: "zona_muerta" });
  });

  it("una opción normal más allá del anillo ejecuta como siempre (no necesita confirmación)", () => {
    const estados = recorrer([...abrir, ev.move(hacia(geo, 150, 180), 200), ev.up(hacia(geo, 150, 180), 250)]);
    expect(estados.at(-2)).toMatchObject({ tipo: "abierto_gesto", presel: "editar" });
    expect(estados.at(-1)).toMatchObject({ tipo: "ejecutando", id: "editar" });
  });

  it("una irreversible deshabilitada no se arma y soltar cancela (C-09)", () => {
    const g = geometria({
      ...productoDueno,
      actions: productoDueno.actions.map((a) => (a.id === "eliminar" ? { ...a, disabled: true } : a)),
    });
    const estados = recorrer([ev.down(g, g.centro, 0), ev.move(hacia(g, 180, 160), 100), ev.up(hacia(g, 180, 160), 200)]);
    expect(estados[1]).toMatchObject({ tipo: "abierto_gesto", presel: "eliminar" });
    expect(estados[2]).toEqual({ tipo: "cancelado", motivo: "deshabilitada" });
  });

  it("todo solo deslizando, incluido el deslizamiento rápido sin movimientos intermedios (HU-09, C-05)", () => {
    expect(final([ev.down(geo, c, 0), ev.up(hacia(geo, 180, 170), 40)])).toMatchObject({ tipo: "ejecutando", id: "eliminar" });
  });
});
