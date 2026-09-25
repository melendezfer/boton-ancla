import type { MetricEvent } from "@boton-ancla/core";

// Exportación de métricas (spec §9, RNF-08, C-20). Todo se guarda solo en el
// dispositivo; la exportación es un archivo que descarga la persona.
// Como el Documento 8 no está en el repo, los campos son los de spec §9.

export const VERSION_DEMO = "boton-ancla fase-1 · spec v0.7";

/** Un evento del ancla con el contexto de la demo en ese momento. */
export type RegistroMetrica = {
  /** Fecha y hora (ms desde 1970). */
  t: number;
  /** Id de la pantalla (sección) donde ocurrió. */
  pantalla: string;
  /** Opciones del abanico en esa pantalla, contando "Atrás". */
  opciones: number;
  evento: MetricEvent;
};

export type DatosSesion = {
  dispositivo: string;
  mano: "right" | "left";
  /** ANCLA_ALTURA (0–1). */
  anclaAltura: number;
  observaciones: string;
};

export type FilaAccion = {
  fecha: string;
  pantalla: string;
  accion: string;
  modo: string;
  experto: boolean;
  tiempoMs: number;
  recorridoPx: number;
  numeroOpciones: number;
  /** Cancelaciones y bloqueos de irreversibles desde la ejecución anterior. */
  errores: number;
};

export type Exportacion = {
  version: string;
  exportado: string;
  dispositivo: string;
  mano: "derecha" | "izquierda";
  posicion: { anclaAltura: number; lado: "derecha" | "izquierda" };
  observaciones: string;
  resumen: { ejecuciones: number; cancelaciones: number; bloqueos: number; deshacer: number; descansos: number };
  /** Una fila por acción ejecutada, con los campos de spec §9. */
  acciones: FilaAccion[];
  /** Todos los eventos crudos, por si hace falta reinterpretarlos. */
  eventos: RegistroMetrica[];
};

export function construirExportacion(registros: RegistroMetrica[], sesion: DatosSesion, ahora = Date.now()): Exportacion {
  const lado = sesion.mano === "left" ? "izquierda" : "derecha";
  const acciones: FilaAccion[] = [];
  let errores = 0;
  for (const r of registros) {
    const e = r.evento;
    if (e.type === "cancel" || e.type === "sensitive_blocked") errores++;
    if (e.type === "execute") {
      acciones.push({
        fecha: new Date(r.t).toISOString(),
        pantalla: r.pantalla,
        accion: e.id,
        modo: e.mode,
        experto: e.expert,
        tiempoMs: Math.round(e.ms),
        recorridoPx: e.pathPx,
        numeroOpciones: r.opciones,
        errores,
      });
      errores = 0;
    }
  }
  const cuenta = (tipo: MetricEvent["type"]) => registros.filter((r) => r.evento.type === tipo).length;
  return {
    version: VERSION_DEMO,
    exportado: new Date(ahora).toISOString(),
    dispositivo: sesion.dispositivo,
    mano: lado,
    posicion: { anclaAltura: sesion.anclaAltura, lado },
    observaciones: sesion.observaciones,
    resumen: {
      ejecuciones: cuenta("execute"),
      cancelaciones: cuenta("cancel"),
      bloqueos: cuenta("sensitive_blocked"),
      deshacer: cuenta("undo"),
      descansos: cuenta("rest_enter"),
    },
    acciones,
    eventos: registros,
  };
}

/** Descripción corta del dispositivo a partir del agente de usuario (editable en la pantalla). */
export function describirDispositivo(ua: string): string {
  const android = /Android ([\d.]+)/.exec(ua);
  const chrome = /Chrome\/(\d+)/.exec(ua);
  const ios = /OS (\d+)_(\d+)/.exec(ua);
  const safari = /Version\/([\d.]+).*Safari/.exec(ua);
  if (android) return `Android ${android[1]}${chrome ? ` · Chrome ${chrome[1]}` : ""}`;
  if (/iPhone|iPad/.test(ua) && ios) return `${/iPad/.test(ua) ? "iPad" : "iPhone"} · iOS ${ios[1]}.${ios[2]}${safari ? ` · Safari ${safari[1]}` : ""}`;
  if (chrome) return `Escritorio · Chrome ${chrome[1]}`;
  return "Desconocido";
}

export function nombreArchivo(ahora = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `metricas-boton-ancla-${ahora.getFullYear()}${p(ahora.getMonth() + 1)}${p(ahora.getDate())}-${p(ahora.getHours())}${p(ahora.getMinutes())}.json`;
}
