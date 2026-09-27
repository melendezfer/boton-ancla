import { describe, expect, it } from "vitest";
import { BIENVENIDA_INICIAL, leerBienvenida, marcarDemostracion, marcarMano, necesitaPreguntarMano, serializarBienvenida } from "../src/welcome";

// T3-09 (Fase 3, H13, RF3-14): la bienvenida pregunta la mano la primera vez.

describe("preguntar la mano", () => {
  it("la primera vez se pregunta; después de responder, no", () => {
    expect(necesitaPreguntarMano(BIENVENIDA_INICIAL)).toBe(true);
    expect(necesitaPreguntarMano(marcarMano(BIENVENIDA_INICIAL))).toBe(false);
  });

  it("quien ya hizo la bienvenida (antes de la Fase 3) no la vuelve a ver", () => {
    expect(necesitaPreguntarMano(marcarDemostracion(BIENVENIDA_INICIAL))).toBe(false);
  });

  it("se guarda y se lee; lo guardado antes de la Fase 3 sigue sirviendo", () => {
    expect(leerBienvenida(serializarBienvenida(marcarMano(BIENVENIDA_INICIAL))).manoPreguntada).toBe(true);
    expect(leerBienvenida(JSON.stringify({ version: 1, demostracionHecha: false, usos: {} }))).toEqual(BIENVENIDA_INICIAL);
  });
});
