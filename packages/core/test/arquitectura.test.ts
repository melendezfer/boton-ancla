import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// RNF-07 y D-18: el núcleo es TypeScript puro, sin React ni DOM, y se prueba en Node.
// El compilador ya lo impide (tsconfig.json sin "DOM"); esta prueba lo deja
// explícito para que nadie lo "arregle" agregando "DOM" al tsconfig.

const raiz = join(import.meta.dirname, "..");
const carpetaSrc = join(raiz, "src");

function archivosTs(carpeta: string): string[] {
  return readdirSync(carpeta, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => join(e.parentPath, e.name));
}

// Quita comentarios para no marcar como error un texto que solo menciona "window".
function sinComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("arquitectura del núcleo (RNF-07)", () => {
  it("tsconfig.json no incluye la librería DOM ni tipos globales", () => {
    const texto = sinComentarios(readFileSync(join(raiz, "tsconfig.json"), "utf8"));
    const config = JSON.parse(texto) as { compilerOptions: { lib: string[]; types: string[] } };
    expect(config.compilerOptions.lib.map((l) => l.toLowerCase())).not.toContain("dom");
    expect(config.compilerOptions.types).toEqual([]);
  });

  it("ningún archivo de src/ importa React", () => {
    for (const archivo of archivosTs(carpetaSrc)) {
      const codigo = sinComentarios(readFileSync(archivo, "utf8"));
      expect(codigo, archivo).not.toMatch(/from\s+["']react(-dom)?(\/[^"']*)?["']/);
    }
  });

  it("ningún archivo de src/ usa globales del navegador o de Node", () => {
    const prohibidos = /\b(window|document|navigator|localStorage|sessionStorage|process)\b/;
    for (const archivo of archivosTs(carpetaSrc)) {
      const codigo = sinComentarios(readFileSync(archivo, "utf8"));
      expect(codigo, archivo).not.toMatch(prohibidos);
    }
  });
});
