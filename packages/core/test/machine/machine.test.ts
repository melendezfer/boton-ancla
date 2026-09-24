import { describe, expect, it, vi } from "vitest";
import { createAnchorMachine } from "../../src/machine/machine";
import { DEFAULT_PARAMS } from "../../src/params";
import { ev, geometria, hacia } from "./ayudas";

const geo = geometria();
const c = geo.centro;

describe("createAnchorMachine (spec §7)", () => {
  it("empieza en reposo y usa los parámetros por defecto", () => {
    const m = createAnchorMachine();
    expect(m.getState()).toEqual({ tipo: "reposo" });
    expect(m.params).toEqual(DEFAULT_PARAMS);
  });

  it("mezcla los parámetros que se le pasan", () => {
    const m = createAnchorMachine({ R_ARCO: 120, DESEMPATE: "vertical" });
    expect(m.params.R_ARCO).toBe(120);
    expect(m.params.DESEMPATE).toBe("vertical");
    expect(m.params.T_TOQUE).toBe(DEFAULT_PARAMS.T_TOQUE);
    expect(Object.isFrozen(m.params)).toBe(true);
  });

  it("send aplica la transición y devuelve el estado nuevo", () => {
    const m = createAnchorMachine();
    expect(m.send(ev.down(geo, c, 0)).tipo).toBe("armado");
    expect(m.getState().tipo).toBe("armado");
  });

  it("avisa a los suscriptores con (nuevo, anterior, evento) solo si el estado cambia", () => {
    const m = createAnchorMachine();
    const oyente = vi.fn();
    m.subscribe(oyente);
    const down = ev.down(geo, c, 0);
    m.send(down);
    m.send(ev.tick(10)); // armado sin vencer: mismo estado, no avisa
    expect(oyente).toHaveBeenCalledTimes(1);
    expect(oyente).toHaveBeenCalledWith(expect.objectContaining({ tipo: "armado" }), { tipo: "reposo" }, down);
  });

  it("darse de baja deja de avisar, incluso desde dentro de un aviso", () => {
    const m = createAnchorMachine();
    const segundo = vi.fn();
    const baja: { fn?: () => void } = {};
    baja.fn = m.subscribe(() => baja.fn?.());
    m.subscribe(segundo);
    m.send(ev.down(geo, c, 0));
    m.send(ev.move(hacia(geo, 150, 60), 20));
    expect(segundo).toHaveBeenCalledTimes(2);
  });

  it("nextDeadline sigue al estado actual", () => {
    const m = createAnchorMachine();
    expect(m.nextDeadline()).toBeUndefined();
    m.send(ev.down(geo, c, 1000));
    expect(m.nextDeadline()).toBe(1400);
  });

  it("un recorrido completo vuelve a reposo con COMPLETADO", () => {
    const m = createAnchorMachine();
    m.send(ev.down(geo, c, 0));
    m.send(ev.move(hacia(geo, 150, 60), 30));
    expect(m.send(ev.up(hacia(geo, 150, 100), 200)).tipo).toBe("ejecutando");
    expect(m.send({ tipo: "COMPLETADO" })).toEqual({ tipo: "reposo" });
  });
});
