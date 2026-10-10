// Aspecto del ancla en reposo (specs/aspecto, DA-01): funciones puras; el
// adaptador pone los temporizadores.
import type { Params } from "./params";

export type AspectoReposo = "encendida" | "translucida" | "recogida";

/**
 * RA-04/RA-05: recién usada está encendida; pasado T_ENCENDIDA, translúcida; y
 * tras otros T_RECOGER, recogida al borde (si RECOGER). `msDesdeUso` null =
 * todavía no se usó (al montar arranca translúcida, DA-06).
 */
export function aspectoEnReposo(msDesdeUso: number | null, params: Params): AspectoReposo {
  if (msDesdeUso !== null && msDesdeUso < params.T_ENCENDIDA) return "encendida";
  const desdeTranslucida = msDesdeUso === null ? 0 : msDesdeUso - params.T_ENCENDIDA;
  return params.RECOGER && desdeTranslucida >= params.T_RECOGER ? "recogida" : "translucida";
}

/** Cuánto falta (ms) para el próximo cambio de aspecto; null si ya no cambia más. */
export function proximoCambioDeAspecto(msDesdeUso: number | null, params: Params): number | null {
  if (msDesdeUso !== null && msDesdeUso < params.T_ENCENDIDA) return params.T_ENCENDIDA - msDesdeUso;
  if (!params.RECOGER) return null;
  const desdeTranslucida = msDesdeUso === null ? 0 : msDesdeUso - params.T_ENCENDIDA;
  return desdeTranslucida < params.T_RECOGER ? params.T_RECOGER - desdeTranslucida : null;
}

/**
 * DA-02: corrimiento horizontal (px) para que el centro del ancla quede sobre
 * el borde de su lado: medio escondida. Positivo = hacia la derecha.
 */
export function desplazamientoRecogida(centroX: number, anchoVista: number): number {
  return centroX >= anchoVista / 2 ? anchoVista - centroX : -centroX;
}

/** RA-06/DA-04: ¿el punto cae dentro del círculo visible del ancla en reposo? */
export function dentroDelCirculo(punto: { x: number; y: number }, centro: { x: number; y: number }, params: Params, tolerancia = 2): boolean {
  return Math.hypot(punto.x - centro.x, punto.y - centro.y) <= params.D_REPOSO / 2 + tolerancia;
}

/**
 * RA-09 (DA-07, DA-08): ¿el deslizamiento que empezó en el ancla es el de
 * guardarla? Hacia el borde de su lado, al menos D_GUARDAR, más horizontal que
 * vertical y en menos de T_GUARDAR.
 */
export function esGestoGuardar(
  inicio: { x: number; y: number },
  fin: { x: number; y: number },
  ms: number,
  centroX: number,
  anchoVista: number,
  params: Params,
): boolean {
  const haciaElBorde = centroX >= anchoVista / 2 ? 1 : -1;
  const dx = (fin.x - inicio.x) * haciaElBorde;
  const dy = Math.abs(fin.y - inicio.y);
  return ms <= params.T_GUARDAR && dx >= params.D_GUARDAR && dy <= 0.75 * dx;
}
