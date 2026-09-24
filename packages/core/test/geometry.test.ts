import { describe, expect, it } from "vitest";
import {
  anguloDesde,
  anguloParaMano,
  distancia,
  normalizarAngulo,
  puntoEnDireccion,
  radioParaCuerda,
  reflejarAngulo,
} from "../src/geometry";

const centro = { x: 100, y: 100 };

describe("geometría básica (design.md §4.1)", () => {
  it("normaliza a [0, 360)", () => {
    expect(normalizarAngulo(0)).toBe(0);
    expect(normalizarAngulo(360)).toBe(0);
    expect(normalizarAngulo(-90)).toBe(270);
    expect(normalizarAngulo(450)).toBe(90);
  });

  it("distancia euclidiana", () => {
    expect(distancia({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it.each([
    ["derecha", { x: 150, y: 100 }, 0],
    ["arriba (y de pantalla menor)", { x: 100, y: 50 }, 90],
    ["izquierda", { x: 50, y: 100 }, 180],
    ["abajo", { x: 100, y: 150 }, 270],
    ["diagonal arriba-izquierda", { x: 50, y: 50 }, 135],
  ])("anguloDesde: %s", (_, p, esperado) => {
    expect(anguloDesde(centro, p)).toBeCloseTo(esperado, 9);
  });

  it("reflejar: izquierda ↔ derecha, arriba y abajo se quedan", () => {
    expect(reflejarAngulo(180)).toBe(0);
    expect(reflejarAngulo(0)).toBe(180);
    expect(reflejarAngulo(90)).toBe(90);
    expect(reflejarAngulo(270)).toBe(270);
    expect(reflejarAngulo(135)).toBe(45);
  });

  it("anguloParaMano: la derecha no cambia; la izquierda refleja y es su propia inversa", () => {
    expect(anguloParaMano(135, "right")).toBe(135);
    expect(anguloParaMano(135, "left")).toBe(45);
    for (const a of [0, 45, 90, 135, 180, 200, 300]) {
      expect(anguloParaMano(anguloParaMano(a, "left"), "left")).toBeCloseTo(a, 9);
    }
  });

  it("puntoEnDireccion es la inversa de anguloDesde + distancia", () => {
    for (const grados of [0, 30, 90, 135, 180, 250]) {
      const p = puntoEnDireccion(centro, 80, grados);
      expect(distancia(centro, p)).toBeCloseTo(80, 9);
      expect(anguloDesde(centro, p)).toBeCloseTo(grados, 9);
    }
  });

  it("radioParaCuerda: 44 px separados 22,5° piden ~112,8 px (C-01)", () => {
    expect(radioParaCuerda(44, 22.5)).toBeCloseTo(112.77, 1);
    expect(radioParaCuerda(44, 60)).toBeCloseTo(44, 9); // triángulo equilátero
  });
});
