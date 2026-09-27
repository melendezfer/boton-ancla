import { describe, expect, it } from "vitest";
import { colocacionPara, orientacionDe, prefsDesdeMano } from "../src/espacio";
import { DEFAULT_PARAMS } from "../src/params";

// T3-01 (Fase 3): colocación por orientación y compatibilidad con la Fase 1.

const P = DEFAULT_PARAMS;

describe("colocación por orientación (RF3-06, RF3-08)", () => {
  it("parámetros nuevos de la Fase 3", () => {
    expect(P.MARGEN_ZONA).toBe(8);
    expect(P.ANCLA_ALTURA_H).toBe(0.3);
  });

  it("compatibilidad: { hand } de la Fase 1 = la vertical de ese costado a la altura de inicio", () => {
    expect(prefsDesdeMano("left", P)).toEqual({ vertical: { lado: "left", altura: 0.44 } });
  });

  it("cada orientación usa la suya", () => {
    const prefs = { vertical: { lado: "right" as const, altura: 0.5 }, horizontal: { lado: "left" as const, altura: 0.2 } };
    expect(colocacionPara(prefs, "vertical", P)).toEqual({ lado: "right", altura: 0.5 });
    expect(colocacionPara(prefs, "horizontal", P)).toEqual({ lado: "left", altura: 0.2 });
  });

  it("la primera vez en horizontal copia el costado de la vertical, a ANCLA_ALTURA_H", () => {
    expect(colocacionPara({ vertical: { lado: "left", altura: 0.6 } }, "horizontal", P)).toEqual({ lado: "left", altura: 0.3 });
  });

  it("orientación: horizontal si es más ancha que alta", () => {
    expect(orientacionDe(412, 915)).toBe("vertical");
    expect(orientacionDe(915, 412)).toBe("horizontal");
    expect(orientacionDe(500, 500)).toBe("vertical");
  });
});
