import { puntoEnDireccion } from "../../src/geometry";
import { crearGeometria, type AnchorEvent, type AnchorState, type Geometry } from "../../src/machine/states";
import { transition } from "../../src/machine/transition";
import { DEFAULT_PARAMS } from "../../src/params";
import type { AnchorScreen, Hand, Point } from "../../src/types";
import { productoDueno } from "../fixtures/pantallas-ruteando";

// Ayudas para escribir las pruebas de la máquina como pequeñas historias.
// Pantalla por defecto: Producto dueño (3 + Atrás), mano derecha, 375×667:
//   Atrás 90° · Marcar no disponible 120° · Editar 150° · Eliminar 180° (irreversible)
//   radio 100 px, R_EXTERIOR 148 px, centro (319, 619).

export const P = DEFAULT_PARAMS;

export function geometria(screen: AnchorScreen = productoDueno, hand: Hand = "right", deshacer = false): Geometry {
  return crearGeometria({
    screen,
    viewport: { x: 0, y: 0, width: 375, height: 667 },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    hand,
    params: P,
    deshacer,
  });
}

/** Punto a `r` px del centro en `anguloBase` (espacio de mano derecha). */
export function hacia(geo: Geometry, anguloBase: number, r: number): Point {
  const angulo = geo.hand === "right" ? anguloBase : 180 - anguloBase;
  return puntoEnDireccion(geo.centro, r, angulo);
}

/** Desplaza un punto (para movimientos pequeños alrededor del centro). */
export function mas(p: Point, dx: number, dy = 0): Point {
  return { x: p.x + dx, y: p.y + dy };
}

export const ID = 1;

export const ev = {
  down: (geo: Geometry, punto: Point, t: number, sobre: "ancla" | { id: string } | "fuera" = "ancla", pointerId = ID): AnchorEvent => ({
    tipo: "POINTER_DOWN",
    pointerId,
    punto,
    t,
    sobre,
    geo,
  }),
  move: (punto: Point, t: number, pointerId = ID): AnchorEvent => ({ tipo: "POINTER_MOVE", pointerId, punto, t }),
  up: (punto: Point, t: number, pointerId = ID, sobre?: "ancla" | { id: string } | "fuera"): AnchorEvent => ({
    tipo: "POINTER_UP",
    pointerId,
    punto,
    t,
    sobre,
  }),
  tick: (t: number): AnchorEvent => ({ tipo: "TICK", t }),
};

/** Aplica una lista de eventos desde reposo y devuelve todos los estados intermedios. */
export function recorrer(eventos: AnchorEvent[], inicial: AnchorState = { tipo: "reposo" }): AnchorState[] {
  const estados: AnchorState[] = [];
  let actual = inicial;
  for (const e of eventos) {
    actual = transition(actual, e);
    estados.push(actual);
  }
  return estados;
}

/** Solo el estado final. */
export function final(eventos: AnchorEvent[], inicial?: AnchorState): AnchorState {
  return recorrer(eventos, inicial).at(-1)!;
}
