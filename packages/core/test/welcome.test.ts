import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "../src/params";
import {
  BIENVENIDA_INICIAL,
  leerBienvenida,
  marcarDemostracion,
  mostrarEtiqueta,
  necesitaDemostracion,
  registrarUso,
  serializarBienvenida,
  type EstadoBienvenida,
} from "../src/welcome";

// T-11: bienvenida de los primeros usos (HU-12, C-17: uso = ejecución).

const P = DEFAULT_PARAMS;

function usar(id: string, veces: number, estado: EstadoBienvenida = BIENVENIDA_INICIAL): EstadoBienvenida {
  let e = estado;
  for (let i = 0; i < veces; i++) e = registrarUso(e, id);
  return e;
}

describe("demostración inicial", () => {
  it("solo la primera vez", () => {
    expect(necesitaDemostracion(BIENVENIDA_INICIAL)).toBe(true);
    expect(necesitaDemostracion(marcarDemostracion(BIENVENIDA_INICIAL))).toBe(false);
  });
});

describe("etiquetas durante los primeros 5 usos", () => {
  it("se ve en los usos 1 a 5 y no en el 6", () => {
    const visibles = [0, 1, 2, 3, 4, 5].map((previos) => mostrarEtiqueta(usar("buscar", previos), "buscar", P));
    // Con 0 usos previos se está haciendo el uso 1; con 5 previos, el uso 6.
    expect(visibles).toEqual([true, true, true, true, true, false]);
  });

  it("los conteos son por opción", () => {
    const e = usar("buscar", 5);
    expect(mostrarEtiqueta(e, "buscar", P)).toBe(false);
    expect(mostrarEtiqueta(e, "favoritos", P)).toBe(true);
  });

  it("respeta USOS_ETIQUETA de los parámetros", () => {
    expect(mostrarEtiqueta(usar("buscar", 2), "buscar", { ...P, USOS_ETIQUETA: 2 })).toBe(false);
  });

  it("registrarUso no modifica el estado anterior", () => {
    const antes = usar("buscar", 1);
    registrarUso(antes, "buscar");
    expect(antes.usos.buscar).toBe(1);
    expect(BIENVENIDA_INICIAL.usos).toEqual({});
  });
});

describe("guardar y leer", () => {
  it("ida y vuelta conserva todo", () => {
    const e = marcarDemostracion(usar("editar", 3, usar("buscar", 1)));
    expect(leerBienvenida(serializarBienvenida(e))).toEqual(e);
  });

  it.each([
    ["nada guardado", null],
    ["texto vacío", ""],
    ["JSON roto", "{no es json"],
    ["otro tipo", "42"],
    ["otra versión", JSON.stringify({ version: 2, demostracionHecha: true, usos: {} })],
  ])("%s → estado inicial", (_, texto) => {
    expect(leerBienvenida(texto)).toEqual(BIENVENIDA_INICIAL);
  });

  it("descarta conteos inválidos y conserva los buenos", () => {
    const texto = JSON.stringify({ version: 1, demostracionHecha: "sí", usos: { a: 2, b: -1, c: 1.5, d: "3", e: 0 } });
    expect(leerBienvenida(texto)).toEqual({ version: 1, demostracionHecha: false, usos: { a: 2, e: 0 } });
  });
});
