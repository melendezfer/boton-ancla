import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS, type Params } from "../src/params";

// La spec es la fuente de verdad: esta prueba lee la tabla de §6 directamente
// de spec.md y la compara con DEFAULT_PARAMS. Si alguien cambia un valor en
// un solo lado, la prueba falla (nunca "en silencio").

const rutaSpec = join(import.meta.dirname, "../../../specs/fase-1/spec.md");

/** Convierte "250 ms", "4 s", "fondo 60% + desenfoque", "1.25" a número (ms, px, 0–1). */
function aNumero(valor: string): number {
  const m = /(\d+(?:[.,]\d+)?)\s*(ms|s|%|px|°)?/.exec(valor);
  if (!m?.[1]) throw new Error(`Sin número en "${valor}"`);
  const n = Number(m[1].replace(",", "."));
  if (m[2] === "s") return n * 1000;
  if (m[2] === "%") return n / 100;
  return n;
}

/** Filas de la tabla §6 con forma | `NOMBRE` | valor | nota |. */
function leerTablaSeccion6(): Map<string, string> {
  const spec = readFileSync(rutaSpec, "utf8");
  const inicio = spec.indexOf("## 6.");
  const fin = spec.indexOf("## 7.");
  const seccion = spec.slice(inicio, fin);
  const filas = new Map<string, string>();
  for (const linea of seccion.split("\n")) {
    const m = /^\|\s*`([A-Z_]+)`\s*\|\s*([^|]+)\|/.exec(linea);
    if (m?.[1] && m[2]) filas.set(m[1], m[2].trim());
  }
  return filas;
}

// Parámetros que en la spec no aparecen con su nombre exacto porque vienen
// de una fila compuesta (ARCO "90° → 180°", R_EXTERIOR "+ 48 px").
const DERIVADOS: Partial<Record<keyof Params, (filas: Map<string, string>) => number>> = {
  ARCO_DESDE: (f) => aNumero(f.get("ARCO")!.split("→")[0]!),
  ARCO_HASTA: (f) => aNumero(f.get("ARCO")!.split("→")[1]!),
  EXTRA_EXTERIOR: (f) => aNumero(f.get("R_EXTERIOR")!.split("+")[1]!),
};

describe("DEFAULT_PARAMS (spec §6)", () => {
  const filas = leerTablaSeccion6();

  it("la tabla de §6 se pudo leer", () => {
    expect(filas.size).toBeGreaterThan(20);
  });

  for (const nombre of Object.keys(DEFAULT_PARAMS) as (keyof Params)[]) {
    it(`${nombre} coincide con la spec`, () => {
      const derivar = DERIVADOS[nombre];
      const valorSpec = derivar ? derivar(filas) : filas.get(nombre);
      expect(valorSpec, `${nombre} no aparece en la tabla de §6`).toBeDefined();
      const actual = DEFAULT_PARAMS[nombre];
      if (typeof actual === "string") {
        // Parámetros de texto (DESEMPATE): la primera palabra de la celda.
        expect(actual).toBe(String(valorSpec).split(/\s/)[0]);
        return;
      }
      const esperado = typeof valorSpec === "number" ? valorSpec : aNumero(valorSpec!);
      expect(actual).toBe(esperado);
    });
  }

  it("cada parámetro de la tabla de §6 existe en el código", () => {
    const compuestos = ["ARCO", "R_EXTERIOR"];
    for (const nombre of filas.keys()) {
      if (compuestos.includes(nombre)) continue;
      expect(Object.keys(DEFAULT_PARAMS), `falta ${nombre} en DEFAULT_PARAMS`).toContain(nombre);
    }
  });

  it("no se puede modificar por accidente", () => {
    expect(Object.isFrozen(DEFAULT_PARAMS)).toBe(true);
  });
});
