import { describe, expect, it } from "vitest";
import { colocacionLibre, huellaAncla, posicionesValidas, rangoAlturas, xDelLado, type Entorno, type Zona } from "../src/espacio";
import { computeAnchorPosition } from "../src/layout";
import { DEFAULT_PARAMS } from "../src/params";

// T3-02 (Fase 3): huella del ancla y posiciones válidas con zonas (RF3-02, RF3-10, RF3-13, DF3-06).

const P = DEFAULT_PARAMS;
const entorno: Entorno = { viewport: { x: 0, y: 0, width: 412, height: 915 }, safeArea: { top: 0, right: 0, bottom: 0, left: 0 } };
const zona = (x: number, y: number, width: number, height: number, prioridad: Zona["prioridad"] = "preferida"): Zona => ({ rect: { x, y, width, height }, prioridad });

describe("rango de alturas (el mismo piso y techo de la Fase 1)", () => {
  it("sin zonas: un tramo por costado, del techo al piso de computeAnchorPosition", () => {
    const rango = rangoAlturas(entorno, P, "arriba")!;
    const techo = computeAnchorPosition({ ...entorno, hand: "right", params: { ...P, ANCLA_ALTURA: 1 } }).y;
    const piso = computeAnchorPosition({ ...entorno, hand: "right", params: { ...P, ANCLA_ALTURA: 0 } }).y;
    expect(rango.desde).toBeCloseTo(techo, 6);
    expect(rango.hasta).toBeCloseTo(piso, 6);
    const v = posicionesValidas(entorno, [], P);
    for (const lado of ["right", "left"] as const) expect(v[lado]).toEqual([{ desde: rango.desde, hasta: rango.hasta }]);
  });

  it("el costado da la x de la Fase 1", () => {
    expect(xDelLado("right", entorno, P)).toBe(computeAnchorPosition({ ...entorno, hand: "right", params: P }).x);
    expect(xDelLado("left", entorno, P)).toBe(computeAnchorPosition({ ...entorno, hand: "left", params: P }).x);
  });

  it("áreas seguras y teclado (el adaptador achica el alto) achican el rango", () => {
    const conTeclado: Entorno = { viewport: { x: 0, y: 0, width: 412, height: 500 }, safeArea: { top: 24, right: 0, bottom: 0, left: 0 } };
    const r = rangoAlturas(conTeclado, P, "arriba")!;
    expect(r.hasta).toBeLessThanOrEqual(500 - P.MARGEN_INFERIOR - P.D_ACTIVO / 2);
    expect(r.desde).toBeGreaterThan(24);
  });

  it("sin lugar para el abanico hacia arriba: null", () => {
    expect(rangoAlturas({ viewport: { x: 0, y: 0, width: 800, height: 150 }, safeArea: entorno.safeArea }, P, "arriba")).toBeNull();
  });
});

describe("huella (DF3-06)", () => {
  it("con la mano derecha, el abanico, la banda y los avisos quedan a la izquierda y arriba del ancla", () => {
    const p = { x: 356, y: 600 };
    const [ancla, abanico, banda, avisos] = huellaAncla(p, "right", P);
    expect(ancla!.x + ancla!.width).toBeCloseTo(p.x + P.D_ACTIVO / 2, 6);
    expect(abanico!.x).toBeLessThan(p.x - 100);
    expect(abanico!.y + abanico!.height).toBeGreaterThan(p.y); // incluye la opción del costado (180°)
    expect(banda!.y + banda!.height).toBeLessThanOrEqual(abanico!.y);
    expect(avisos!.y + avisos!.height).toBeLessThanOrEqual(banda!.y);
  });

  it("la mano izquierda es el espejo", () => {
    const der = huellaAncla({ x: 356, y: 600 }, "right", P);
    const izq = huellaAncla({ x: 56, y: 600 }, "left", P);
    der.forEach((r, i) => {
      expect(izq[i]!.width).toBeCloseTo(r.width, 6);
      expect(izq[i]!.y).toBeCloseTo(r.y, 6);
      expect(412 - (izq[i]!.x + izq[i]!.width)).toBeCloseTo(r.x, 6);
    });
  });

  it("hacia abajo, todo queda debajo del ancla", () => {
    const [, abanico, banda] = huellaAncla({ x: 356, y: 200 }, "right", P, "abajo");
    expect(abanico!.y).toBeGreaterThan(200 - 40);
    expect(banda!.y).toBeGreaterThan(abanico!.y + abanico!.height - 1);
  });
});

describe("posiciones válidas con zonas (RF3-10, RF3-13)", () => {
  const rango = rangoAlturas(entorno, P, "arriba")!;

  it("una zona en la columna del ancla, abajo, recorta el tramo por abajo (crédito de OpenStreetMap)", () => {
    const credito = zona(412 - 200, 915 - 20, 200, 20, "obligatoria");
    const [t] = posicionesValidas(entorno, [credito], P).right;
    expect(t!.desde).toBeCloseTo(rango.desde, 6);
    expect(t!.hasta).toBeLessThan(rango.hasta);
    // El ancla en el borde del tramo deja MARGEN_ZONA libre con el crédito.
    expect(t!.hasta + P.D_ACTIVO / 2 + P.MARGEN_ZONA).toBeLessThanOrEqual(915 - 20 + 2);
    // Del otro costado no molesta (salvo que el abanico llegue: aquí no llega a 200 px del otro borde).
    expect(posicionesValidas(entorno, [credito], P).left).toEqual([{ desde: rango.desde, hasta: rango.hasta }]);
  });

  it("una zona a media altura parte el tramo en dos", () => {
    const v = posicionesValidas(entorno, [zona(330, 500, 60, 40)], P).right;
    expect(v).toHaveLength(2);
    expect(v[0]!.hasta).toBeLessThan(500);
    expect(v[1]!.desde).toBeGreaterThan(540);
  });

  it("una zona arriba recorta el tramo por arriba (la huella incluye la banda y los avisos)", () => {
    const v = posicionesValidas(entorno, [zona(0, 0, 412, 250)], P).right;
    expect(v[0]!.desde).toBeGreaterThan(rango.desde);
    expect(v[0]!.hasta).toBeCloseTo(rango.hasta, 6);
  });

  it("respeta MARGEN_ZONA", () => {
    const pegada = zona(412 - 60, 700, 60, 20);
    const v = posicionesValidas(entorno, [pegada], P).right;
    for (const t of v) for (const y of [t.desde, t.hasta]) expect(colocacionLibre({ x: xDelLado("right", entorno, P), y }, "right", [pegada], P)).toBe(true);
    const sinMargen = posicionesValidas(entorno, [pegada], { ...P, MARGEN_ZONA: 0 }).right;
    const libre = (vv: typeof v) => vv.reduce((s, t) => s + (t.hasta - t.desde), 0);
    expect(libre(sinMargen)).toBeGreaterThan(libre(v));
  });

  it("con soloObligatorias, las preferidas se ignoran", () => {
    const zonas = [zona(330, 400, 82, 300, "preferida")];
    const libre = (v: { desde: number; hasta: number }[]) => v.reduce((s, t) => s + (t.hasta - t.desde), 0);
    expect(libre(posicionesValidas(entorno, zonas, P).right)).toBeLessThan(rango.hasta - rango.desde - 100);
    expect(posicionesValidas(entorno, zonas, P, { soloObligatorias: true }).right).toEqual([{ desde: rango.desde, hasta: rango.hasta }]);
  });

  it("la mano izquierda es el espejo de la derecha", () => {
    const der = posicionesValidas(entorno, [zona(412 - 70, 600, 70, 40)], P).right;
    const izq = posicionesValidas(entorno, [zona(0, 600, 70, 40)], P).left;
    expect(izq).toEqual(der);
  });
});
