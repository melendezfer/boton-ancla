import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS, aspectoEnReposo, dentroDelCirculo, desplazamientoRecogida, proximoCambioDeAspecto } from "../src";

// specs/aspecto: encendida → translúcida → recogida (RA-04, RA-05, RA-08) y el círculo (RA-06).
const p = DEFAULT_PARAMS;

describe("aspectoEnReposo", () => {
  it("al montar (sin uso) arranca translúcida (DA-06) y no recogida", () => {
    expect(aspectoEnReposo(null, p)).toBe("translucida");
  });

  it("recién usada, encendida durante T_ENCENDIDA", () => {
    expect(aspectoEnReposo(0, p)).toBe("encendida");
    expect(aspectoEnReposo(p.T_ENCENDIDA - 1, p)).toBe("encendida");
    expect(aspectoEnReposo(p.T_ENCENDIDA, p)).toBe("translucida");
  });

  it("tras otros T_RECOGER, recogida; con RECOGER false, nunca", () => {
    expect(aspectoEnReposo(p.T_ENCENDIDA + p.T_RECOGER - 1, p)).toBe("translucida");
    expect(aspectoEnReposo(p.T_ENCENDIDA + p.T_RECOGER, p)).toBe("recogida");
    expect(aspectoEnReposo(10 * p.T_RECOGER, { ...p, RECOGER: false })).toBe("translucida");
  });
});

describe("proximoCambioDeAspecto", () => {
  it("dice cuánto falta para el siguiente paso", () => {
    expect(proximoCambioDeAspecto(1000, p)).toBe(p.T_ENCENDIDA - 1000);
    expect(proximoCambioDeAspecto(p.T_ENCENDIDA, p)).toBe(p.T_RECOGER);
    expect(proximoCambioDeAspecto(null, p)).toBe(p.T_RECOGER);
    expect(proximoCambioDeAspecto(p.T_ENCENDIDA + p.T_RECOGER, p)).toBeNull();
    expect(proximoCambioDeAspecto(p.T_ENCENDIDA, { ...p, RECOGER: false })).toBeNull();
  });
});

describe("desplazamientoRecogida", () => {
  it("lleva el centro al borde de su lado (medio escondida)", () => {
    expect(desplazamientoRecogida(340, 390)).toBe(50);
    expect(desplazamientoRecogida(50, 390)).toBe(-50);
  });
});

describe("dentroDelCirculo", () => {
  const c = { x: 100, y: 100 };
  it("adentro sí; en la esquina de la caja del botón, no (RA-06)", () => {
    expect(dentroDelCirculo({ x: 100, y: 100 }, c, p)).toBe(true);
    expect(dentroDelCirculo({ x: 100 + p.D_REPOSO / 2, y: 100 }, c, p)).toBe(true);
    const esquina = { x: 100 + p.D_REPOSO / 2 - 1, y: 100 + p.D_REPOSO / 2 - 1 };
    expect(dentroDelCirculo(esquina, c, p)).toBe(false);
  });
});
