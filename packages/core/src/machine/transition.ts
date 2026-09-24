import { distancia } from "../geometry";
import { resolveSelection } from "../selection";
import type { Point } from "../types";
import { ESTADOS_TRANSITORIOS, REPOSO, type AnchorEvent, type AnchorState, type Geometry } from "./states";

// transition(estado, evento) → estado (spec §3, design.md §3.3).
// Función PURA: no lee el reloj, no toca el DOM, no llama onSelect.
// Los números de "fila" se refieren a la tabla de design.md §3.3.

type Estado<T extends AnchorState["tipo"]> = Extract<AnchorState, { tipo: T }>;
type Evento<T extends AnchorEvent["tipo"]> = Extract<AnchorEvent, { tipo: T }>;

export function transition(estado: AnchorState, evento: AnchorEvent): AnchorState {
  const cancelacion = cancelacionGlobal(estado, evento);
  if (cancelacion) return cancelacion;

  switch (estado.tipo) {
    case "reposo":
      return desdeReposo(estado, evento);
    case "armado":
      return desdeArmado(estado, evento);
    case "descanso":
      return desdeDescanso(estado, evento);
    case "abierto_gesto":
    case "confirmacion_armada":
      return desdeGesto(estado, evento);
    case "abierto_toque":
      return desdeToque(estado, evento);
    case "confirmacion_toque":
      return desdeConfirmacionToque(estado, evento);
    case "abierto_teclado":
      return desdeTeclado(estado, evento);
    case "ejecutando":
    case "cancelado":
    case "bloqueado_sensible":
      // Fila 34: el adaptador ya hizo el efecto.
      return evento.tipo === "COMPLETADO" ? REPOSO : estado;
    default:
      return estado; // fila 37: cualquier otro evento se ignora
  }
}

// ---------------------------------------------------------------------------
// reposo
// ---------------------------------------------------------------------------

function desdeReposo(estado: Estado<"reposo">, evento: AnchorEvent): AnchorState {
  // Fila 2 (C-12): click sin secuencia de puntero (lector de pantalla) → modo toque sin cierre por tiempo.
  if (evento.tipo === "ACTIVAR") {
    return {
      tipo: "abierto_toque",
      geo: evento.geo,
      t0: evento.t,
      tApertura: evento.t,
      ultimaActividad: evento.t,
      sinCierrePorTiempo: true,
    };
  }
  // Fila 3 (C-12): Enter, Espacio o ↑ con el foco en el ancla → navegación con teclado.
  if (evento.tipo === "TECLA" && evento.geo && ["Enter", " ", "ArrowUp"].includes(evento.tecla)) {
    return abrirTeclado(evento.geo, evento.t);
  }
  // Fila 1
  if (evento.tipo === "POINTER_DOWN" && evento.sobre === "ancla" && evento.geo) {
    return {
      tipo: "armado",
      pointerId: evento.pointerId,
      inicio: evento.punto,
      ultimo: evento.punto,
      recorridoPx: 0,
      t0: evento.t,
      geo: evento.geo,
    };
  }
  return estado;
}

// ---------------------------------------------------------------------------
// armado y descanso
// ---------------------------------------------------------------------------

function desdeArmado(estado: Estado<"armado">, evento: AnchorEvent): AnchorState {
  const P = estado.geo.params;

  if (evento.tipo === "TICK") {
    // Fila 8
    return evento.t - estado.t0 >= P.T_DESCANSO ? aDescanso(estado) : estado;
  }

  if (evento.tipo === "POINTER_MOVE" && evento.pointerId === estado.pointerId) {
    // Si el TICK del descanso llegó tarde, primero se entra en descanso (fila 8) y
    // después se aplica el movimiento desde ahí (fila 10).
    if (evento.t - estado.t0 >= P.T_DESCANSO) return transition(aDescanso(estado), evento);
    const movido = avanzar(estado, evento.punto);
    // Fila 4
    if (distancia(estado.inicio, evento.punto) > P.UMBRAL_MOV) return abrirGesto(movido, evento.t, "gesto");
    return { ...estado, ...movido };
  }

  if (evento.tipo === "POINTER_UP" && evento.pointerId === estado.pointerId) {
    const d = distancia(estado.inicio, evento.punto);
    // Fila 7 (C-05): llegó lejos sin ningún pointermove: se mueve y se suelta.
    if (d >= P.UMBRAL_MOV) return soltarGesto(abrirGesto(estado, evento.t, "gesto"), evento);
    // Fila 5
    if (evento.t - estado.t0 < P.T_TOQUE) {
      return {
        tipo: "abierto_toque",
        geo: estado.geo,
        t0: estado.t0,
        tApertura: evento.t,
        ultimaActividad: evento.t,
        sinCierrePorTiempo: false,
      };
    }
    // Fila 6 (y descanso tardío): sin efecto.
    return REPOSO;
  }

  return estado;
}

function aDescanso(estado: Estado<"armado">): Estado<"descanso"> {
  return { ...estado, tipo: "descanso", puntoDescanso: estado.ultimo };
}

function desdeDescanso(estado: Estado<"descanso">, evento: AnchorEvent): AnchorState {
  const P = estado.geo.params;

  if (evento.tipo === "POINTER_UP" && evento.pointerId === estado.pointerId) {
    // Fila 9: soltar desde el descanso no hace nada.
    return REPOSO;
  }

  if (evento.tipo === "POINTER_MOVE" && evento.pointerId === estado.pointerId) {
    const movido = avanzar(estado, evento.punto);
    // Fila 10 (C-07): se mide desde donde empezó el descanso, no desde el primer toque.
    if (distancia(estado.puntoDescanso, evento.punto) > P.UMBRAL_MOV) return abrirGesto(movido, evento.t, "gesto");
    return { ...estado, ...movido };
  }

  return estado;
}

// ---------------------------------------------------------------------------
// abierto_gesto y confirmacion_armada
// ---------------------------------------------------------------------------

type EstadoGesto = Estado<"abierto_gesto"> | Estado<"confirmacion_armada">;

type DatosPuntero = {
  pointerId: number;
  inicio: Point;
  ultimo: Point;
  recorridoPx: number;
  t0: number;
  geo: Geometry;
};

/** Actualiza la última posición y suma el tramo recorrido. */
function avanzar<T extends DatosPuntero>(estado: T, punto: Point): T {
  return { ...estado, ultimo: punto, recorridoPx: estado.recorridoPx + distancia(estado.ultimo, punto) };
}

/** Abre el menú en modo gesto con la preselección del punto actual. */
function abrirGesto(datos: DatosPuntero, t: number, modoApertura: "gesto" | "toque"): EstadoGesto {
  const abierto: Estado<"abierto_gesto"> = {
    tipo: "abierto_gesto",
    pointerId: datos.pointerId,
    inicio: datos.inicio,
    ultimo: datos.ultimo,
    recorridoPx: datos.recorridoPx,
    t0: datos.t0,
    geo: datos.geo,
    tApertura: t,
    modoApertura,
    presel: undefined,
  };
  return moverGesto(abierto, datos.ultimo);
}

/** Recalcula la preselección para `punto` (filas 11, 12 y 18). */
function moverGesto(estado: EstadoGesto, punto: Point): EstadoGesto {
  const { geo } = estado;
  const sel = resolveSelection({
    center: geo.centro,
    pointer: punto,
    slots: geo.slots,
    previous: estado.presel,
    hand: geo.hand,
    params: geo.params,
  });
  const slot = geo.slots.find((s) => s.id === sel.id);
  // Fila 12: irreversible (y habilitada) más allá del anillo exterior → confirmación armada.
  if (slot && slot.kind === "irreversible" && !slot.disabled && sel.beyondOuter) {
    return { ...estado, tipo: "confirmacion_armada", presel: slot.id };
  }
  // Fila 11, o fila 18 al volver dentro del anillo o cambiar de sector.
  return { ...estado, tipo: "abierto_gesto", presel: sel.id };
}

function desdeGesto(estado: EstadoGesto, evento: AnchorEvent): AnchorState {
  if (evento.tipo === "POINTER_MOVE" && evento.pointerId === estado.pointerId) {
    return moverGesto(avanzar(estado, evento.punto), evento.punto);
  }
  if (evento.tipo === "POINTER_UP" && evento.pointerId === estado.pointerId) {
    return soltarGesto(estado, evento);
  }
  return estado;
}

/** Filas 13–17 y 19: qué pasa al soltar. Se evalúa en el punto de soltar, no en el último MOVE. */
function soltarGesto(estado: EstadoGesto, evento: Evento<"POINTER_UP">): AnchorState {
  const final = moverGesto(avanzar(estado, evento.punto), evento.punto);
  const { geo } = final;
  const r = distancia(geo.centro, evento.punto);

  if (r < geo.params.R_MUERTA) return { tipo: "cancelado", motivo: "zona_muerta" }; // fila 13
  const slot = geo.slots.find((s) => s.id === final.presel);
  if (!slot) return { tipo: "cancelado", motivo: "fuera_de_arco" }; // fila 14
  if (slot.disabled) return { tipo: "cancelado", motivo: "deshabilitada" }; // fila 15
  // Fila 17: irreversible sin haber cruzado el anillo. (Si lo cruzó, `final` es confirmacion_armada.)
  if (slot.kind === "irreversible" && final.tipo !== "confirmacion_armada") {
    return { tipo: "bloqueado_sensible", id: slot.id };
  }

  // Fila 16 (normal o reversible) y fila 19 (irreversible confirmada).
  return {
    tipo: "ejecutando",
    id: slot.id,
    modo: "gesto",
    experto: final.modoApertura === "gesto" && evento.t - final.tApertura < geo.params.T_ANIM,
    ms: evento.t - final.t0,
    recorridoPx: final.recorridoPx,
  };
}

// ---------------------------------------------------------------------------
// abierto_toque y confirmacion_toque (C-06: regla del botón clásico)
// ---------------------------------------------------------------------------

function desdeToque(estado: Estado<"abierto_toque">, evento: AnchorEvent): AnchorState {
  const P = estado.geo.params;
  const { presion } = estado;

  if (evento.tipo === "TECLA") {
    // Fila 38 (RNF-05): Escape cierra el menú, se haya abierto como se haya abierto.
    if (evento.tecla === "Escape") return { tipo: "cancelado", motivo: "escape" };
    // Fila 39 (RNF-05): una flecha pasa a navegar con teclado, empezando en la prioridad 1.
    if (evento.tecla.startsWith("Arrow")) return abrirTeclado(estado.geo, estado.t0);
    return estado;
  }

  if (evento.tipo === "TICK") {
    // Fila 28: sin dedo apoyado y sin actividad durante T_INACTIVO. No aplica si lo abrió un lector de pantalla.
    const vencido = !estado.sinCierrePorTiempo && !presion && evento.t - estado.ultimaActividad >= P.T_INACTIVO;
    return vencido ? { tipo: "cancelado", motivo: "inactividad" } : estado;
  }

  if (evento.tipo === "POINTER_DOWN" && !presion) {
    const activo = { ...estado, ultimaActividad: evento.t };
    // Fila 27: tocar fuera cierra (y el adaptador evita que el toque llegue al contenido, RF-11).
    if (evento.sobre === "fuera") return { tipo: "cancelado", motivo: "toque_fuera" };
    // Fila 24: presionar el centro; todavía no se sabe si será toque o deslizamiento.
    if (evento.sobre === "ancla") {
      return { ...activo, presion: { pointerId: evento.pointerId, inicio: evento.punto, sobre: "centro", movido: false } };
    }
    // Fila 20: presionar una opción que existe en el abanico.
    const { id } = evento.sobre;
    if (!estado.geo.slots.some((s) => s.id === id)) return activo;
    return { ...activo, presion: { pointerId: evento.pointerId, inicio: evento.punto, sobre: { id }, movido: false } };
  }

  if (evento.tipo === "POINTER_MOVE" && presion && evento.pointerId === presion.pointerId) {
    const d = distancia(presion.inicio, evento.punto);
    if (presion.sobre === "centro" && d > P.UMBRAL_MOV) {
      // Fila 25: presionar el centro y deslizar pasa a modo gesto (así se usa solo deslizando, HU-09).
      const datos: DatosPuntero = {
        pointerId: presion.pointerId,
        inicio: presion.inicio,
        ultimo: evento.punto,
        recorridoPx: d,
        t0: estado.t0,
        geo: estado.geo,
      };
      return abrirGesto(datos, evento.t, "toque");
    }
    return { ...estado, ultimaActividad: evento.t, presion: { ...presion, movido: presion.movido || d > P.UMBRAL_MOV } };
  }

  if (evento.tipo === "POINTER_UP" && presion && evento.pointerId === presion.pointerId) {
    const sinPresion: Estado<"abierto_toque"> = { ...estado, presion: undefined, ultimaActividad: evento.t };
    const quieto = !presion.movido && distancia(presion.inicio, evento.punto) < P.UMBRAL_MOV;

    if (presion.sobre === "centro") {
      // Fila 26: tocar el centro cierra, a cualquier tiempo.
      return quieto ? { tipo: "cancelado", motivo: "toque_centro" } : sinPresion;
    }

    // Filas 21–23: solo cuenta si baja y sube sobre la MISMA opción sin moverse.
    const { id } = presion.sobre;
    const mismaOpcion = evento.sobre === undefined || (typeof evento.sobre === "object" && evento.sobre.id === id);
    const slot = estado.geo.slots.find((s) => s.id === id);
    if (!quieto || !mismaOpcion || !slot || slot.disabled) return sinPresion;
    if (slot.kind === "irreversible") {
      return {
        tipo: "confirmacion_toque",
        geo: estado.geo,
        id,
        t0: estado.t0,
        ultimaActividad: evento.t,
        sinCierrePorTiempo: estado.sinCierrePorTiempo,
        modo: "toque",
      };
    }
    return { tipo: "ejecutando", id, modo: "toque", experto: false, ms: evento.t - estado.t0, recorridoPx: 0 };
  }

  return estado;
}

function desdeConfirmacionToque(estado: Estado<"confirmacion_toque">, evento: AnchorEvent): AnchorState {
  const P = estado.geo.params;
  switch (evento.tipo) {
    case "CONFIRMAR":
      // Fila 29
      return { tipo: "ejecutando", id: estado.id, modo: estado.modo, experto: false, ms: evento.t - estado.t0, recorridoPx: 0 };
    case "POINTER_DOWN":
      // Fila 30: tocar fuera cancela; otros toques solo cuentan como actividad.
      return evento.sobre === "fuera" ? { tipo: "cancelado", motivo: "toque_fuera" } : { ...estado, ultimaActividad: evento.t };
    case "TICK": {
      const vencido = !estado.sinCierrePorTiempo && evento.t - estado.ultimaActividad >= P.T_INACTIVO;
      return vencido ? { tipo: "cancelado", motivo: "inactividad" } : estado;
    }
    case "TECLA":
      return evento.tecla === "Escape" ? { tipo: "cancelado", motivo: "escape" } : estado;
    default:
      return estado;
  }
}

// ---------------------------------------------------------------------------
// Cancelaciones del entorno (filas 35 y 36; RF-09, RF-10)
// ---------------------------------------------------------------------------

/** Puntero que la interacción está siguiendo en este momento, si hay alguno. */
function punteroActivo(estado: AnchorState): number | undefined {
  switch (estado.tipo) {
    case "armado":
    case "descanso":
    case "abierto_gesto":
    case "confirmacion_armada":
      return estado.pointerId;
    case "abierto_toque":
      return estado.presion?.pointerId;
    default:
      return undefined;
  }
}

function cancelacionGlobal(estado: AnchorState, evento: AnchorEvent): AnchorState | undefined {
  if (estado.tipo === "reposo" || ESTADOS_TRANSITORIOS.includes(estado.tipo)) return undefined;
  const activo = punteroActivo(estado);

  switch (evento.tipo) {
    case "POINTER_DOWN":
      // Fila 35: un segundo dedo mientras hay uno apoyado.
      return activo !== undefined && evento.pointerId !== activo ? { tipo: "cancelado", motivo: "segundo_dedo" } : undefined;
    case "POINTER_CANCEL":
      // Fila 36: el navegador canceló el puntero que seguíamos (por ejemplo, un gesto del sistema).
      return activo !== undefined && evento.pointerId === activo ? { tipo: "cancelado", motivo: "pointercancel" } : undefined;
    case "ORIENTACION":
      return { tipo: "cancelado", motivo: "orientacion" };
    case "CAMBIO_SECCION":
      return { tipo: "cancelado", motivo: "cambio_seccion" };
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// abierto_teclado (filas 3, 31–33 y 40; RNF-05, C-12)
// ---------------------------------------------------------------------------

function abrirTeclado(geo: Geometry, t: number): AnchorState {
  if (geo.slots.length === 0) return REPOSO;
  const foco = Math.max(0, geo.slots.findIndex((s) => s.id === geo.prioridad1));
  return { tipo: "abierto_teclado", geo, foco, t0: t };
}

function desdeTeclado(estado: Estado<"abierto_teclado">, evento: AnchorEvent): AnchorState {
  const { geo } = estado;
  const ultimo = geo.slots.length - 1;

  // Fila 40 (RF-11): tocar fuera también cierra el menú abierto con teclado.
  if (evento.tipo === "POINTER_DOWN" && evento.sobre === "fuera") return { tipo: "cancelado", motivo: "toque_fuera" };
  if (evento.tipo !== "TECLA") return estado;

  // Los slots van de "arriba" (0) al extremo lateral. Las flechas horizontales
  // siguen la dirección en pantalla: el extremo lateral está a la izquierda con
  // la mano derecha y a la derecha con la izquierda.
  const haciaLateral = geo.hand === "right" ? "ArrowLeft" : "ArrowRight";
  const haciaArriba = geo.hand === "right" ? "ArrowRight" : "ArrowLeft";
  const mover = (foco: number): AnchorState => ({ ...estado, foco: Math.min(ultimo, Math.max(0, foco)) });

  switch (evento.tecla) {
    case "ArrowUp":
    case haciaArriba:
      return mover(estado.foco - 1); // fila 31
    case "ArrowDown":
    case haciaLateral:
      return mover(estado.foco + 1);
    case "Home":
      return mover(0);
    case "End":
      return mover(ultimo);
    case "Escape":
      return { tipo: "cancelado", motivo: "escape" }; // fila 33
    case "Enter":
    case " ": {
      // Fila 32
      const slot = geo.slots[estado.foco];
      if (!slot || slot.disabled) return estado;
      if (slot.kind === "irreversible") {
        return {
          tipo: "confirmacion_toque",
          geo,
          id: slot.id,
          t0: estado.t0,
          ultimaActividad: evento.t,
          sinCierrePorTiempo: true,
          modo: "teclado",
        };
      }
      return { tipo: "ejecutando", id: slot.id, modo: "teclado", experto: false, ms: evento.t - estado.t0, recorridoPx: 0 };
    }
    default:
      return estado;
  }
}
