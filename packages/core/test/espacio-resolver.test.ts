import { describe, expect, it } from "vitest";
import { imanColocacion, posicionesValidas, rangoAlturas, resolverColocacion, xDelLado, yDeAltura, type Entorno, type Zona } from "../src/espacio";
import { DEFAULT_PARAMS } from "../src/params";

// T3-03 (Fase 3): imán al soltar y dónde va el ancla guardada (RF3-03, RF3-05, RF3-12, RF3-13, RF3-15).

const P = DEFAULT_PARAMS;
const entorno: Entorno = { viewport: { x: 0, y: 0, width: 412, height: 915 }, safeArea: { top: 0, right: 0, bottom: 0, left: 0 } };
const zona = (x: number, y: number, width: number, height: number, prioridad: Zona["prioridad"] = "preferida"): Zona => ({ rect: { x, y, width, height }, prioridad });
const rango = rangoAlturas(entorno, P, "arriba")!;

describe("imán al soltar (RF3-03, DF3-02, DF3-03)", () => {
  const validas = posicionesValidas(entorno, [], P);

  it("elige el costado más cercano: soltar a la izquierda cambia la mano", () => {
    expect(imanColocacion({ x: 60, y: 500 }, entorno, validas)?.lado).toBe("left");
    expect(imanColocacion({ x: 300, y: 500 }, entorno, validas)?.lado).toBe("right");
  });

  it("la altura queda donde se soltó si es válida, o en la válida más cercana", () => {
    const c = imanColocacion({ x: 300, y: 500 }, entorno, validas)!;
    expect(yDeAltura(c.altura, entorno)).toBeCloseTo(500, 6);
    const muyAbajo = imanColocacion({ x: 300, y: 910 }, entorno, validas)!;
    expect(yDeAltura(muyAbajo.altura, entorno)).toBeCloseTo(rango.hasta, 6);
    const muyArriba = imanColocacion({ x: 300, y: 5 }, entorno, validas)!;
    expect(yDeAltura(muyArriba.altura, entorno)).toBeCloseTo(rango.desde, 6);
  });

  it("si el costado más cercano no tiene lugar, el otro; si ninguno, null", () => {
    const soloIzquierda = { right: [], left: validas.left };
    expect(imanColocacion({ x: 300, y: 500 }, entorno, soloIzquierda)?.lado).toBe("left");
    expect(imanColocacion({ x: 300, y: 500 }, entorno, { right: [], left: [] })).toBeNull();
  });
});

describe("resolver la colocación guardada (design.md §4.4)", () => {
  const guardada = { lado: "right" as const, altura: 0.1 }; // bien abajo
  const credito = zona(412 - 200, 915 - 60, 200, 60, "obligatoria");

  it("1) la guardada, si es válida", () => {
    const r = resolverColocacion({ lado: "right", altura: 0.44 }, entorno, [], P);
    expect(r).toMatchObject({ lado: "right", abreHacia: "arriba", ajustada: false, conflicto: null });
    expect(r.punto).toEqual({ x: xDelLado("right", entorno, P), y: yDeAltura(0.44, entorno) });
  });

  it("2) si tapa una zona: la altura válida más cercana del mismo costado, sin borrar la guardada", () => {
    const r = resolverColocacion(guardada, entorno, [credito], P);
    expect(r).toMatchObject({ lado: "right", ajustada: true, conflicto: null });
    expect(r.punto.y).toBeLessThan(yDeAltura(0.1, entorno));
    // Si la zona desaparece, vuelve a la guardada.
    expect(resolverColocacion(guardada, entorno, [], P).ajustada).toBe(false);
  });

  it("3) si solo cabe tapando una preferida: la tapa (conflicto 'preferidas'), nunca una obligatoria", () => {
    const todaLaColumna = zona(412 - 120, 0, 120, 915, "preferida");
    const r = resolverColocacion(guardada, entorno, [todaLaColumna, credito], P);
    expect(r.conflicto).toBe("preferidas");
    expect(r.punto.y + P.D_ACTIVO / 2 + P.MARGEN_ZONA).toBeLessThanOrEqual(915 - 60 + 2); // el crédito sigue libre
  });

  it("nunca cambia de costado por su cuenta (la mano la decide la persona, H13)", () => {
    const columnaObligatoria = zona(412 - 120, 0, 120, 915, "obligatoria");
    expect(resolverColocacion(guardada, entorno, [columnaObligatoria], P).lado).toBe("right");
  });

  it("4) horizontal con teclado: si no cabe hacia arriba, hacia abajo (RF3-15)", () => {
    // Poco alto; y una zona abajo que impide bajar el ancla lo suficiente.
    const bajo: Entorno = { viewport: { x: 0, y: 0, width: 915, height: 260 }, safeArea: entorno.safeArea };
    const r = resolverColocacion({ lado: "right", altura: 0.9 }, bajo, [zona(0, 200, 915, 60, "obligatoria")], P);
    expect(r.abreHacia).toBe("abajo");
  });

  it("5) sin lugar en ninguna dirección: dentro de la pantalla, hacia donde hay más espacio, y lo avisa", () => {
    const diminuto: Entorno = { viewport: { x: 0, y: 0, width: 800, height: 150 }, safeArea: entorno.safeArea };
    const r = resolverColocacion({ lado: "left", altura: 0.3 }, diminuto, [], P);
    expect(r.conflicto).toBe("sin_lugar");
    expect(r.punto.y).toBeGreaterThanOrEqual(P.D_ACTIVO / 2);
    expect(r.punto.y).toBeLessThanOrEqual(150 - P.MARGEN_INFERIOR - P.D_ACTIVO / 2);
    expect(r.lado).toBe("left");
  });
});
