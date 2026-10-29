import { describe, expect, it } from "vitest";
import { derivarMetricas } from "../../src/metrics";
import { proximoPlazo } from "../../src/machine/deadline";
import { REPOSO, type AnchorEvent } from "../../src/machine/states";
import { transition } from "../../src/machine/transition";
import { ev, final, geometria, hacia } from "./ayudas";

// Submenú en el lugar (specs/submenu-en-el-lugar, SL-02, SL-04, SL-06, SL-07): la capa que abrió una acción
// con `abreSubmenu` llega como ABRIR_SUBMENU y su abanico queda abierto en modo toque.
const geo = geometria();
const c = geo.centro;
const abrir: AnchorEvent = { tipo: "ABRIR_SUBMENU", t: 1000, geo };

describe("submenú en el lugar", () => {
  it("desde reposo abre en modo toque, con el cierre por inactividad de siempre (SL-04)", () => {
    const s = final([abrir]);
    expect(s).toMatchObject({ tipo: "abierto_toque", sinCierrePorTiempo: false, t0: 1000 });
    expect(proximoPlazo(s)).toBe(1000 + geo.params.T_INACTIVO);
    expect(transition(s, ev.tick(1000 + geo.params.T_INACTIVO + 1)).tipo).not.toBe("abierto_toque");
  });

  it("un toque sobre una opción de la capa la ejecuta, sin volver a tocar el ancla (SL-02)", () => {
    const e = hacia(geo, 150, 100);
    const s = final([abrir, ev.down(geo, e, 1100, { id: "editar" }), ev.up(e, 1150)]);
    expect(s).toMatchObject({ tipo: "ejecutando", id: "editar", modo: "toque" });
  });

  it("tocar el centro lo cierra, como cualquier modo toque", () => {
    const s = final([abrir, ev.down(geo, c, 1100, "ancla"), ev.up(c, 1150)]);
    expect(["cancelado", "reposo"]).toContain(s.tipo);
  });

  it("si el ancla ya no está en reposo, no fuerza nada (SL-05)", () => {
    const armado = transition(REPOSO, ev.down(geo, c, 0));
    expect(armado.tipo).toBe("armado");
    expect(transition(armado, abrir)).toBe(armado);
  });

  it("la apertura se mide como open en modo toque con via submenu (SL-06)", () => {
    const s = transition(REPOSO, abrir);
    expect(derivarMetricas(REPOSO, s, abrir)).toContainEqual({ type: "open", mode: "toque", via: "submenu" });
  });
});
