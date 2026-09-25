import { describe, expect, it } from "vitest";
import { construirExportacion, describirDispositivo, nombreArchivo, type RegistroMetrica } from "./exportar";

// T-25: exportación de métricas (spec §9, C-20).

const r = (t: number, evento: RegistroMetrica["evento"], pantalla = "mapa", opciones = 4): RegistroMetrica => ({ t, pantalla, opciones, evento });

const REGISTROS: RegistroMetrica[] = [
  r(1000, { type: "open", mode: "gesto" }),
  r(1100, { type: "cancel", reason: "zona_muerta" }),
  r(2000, { type: "open", mode: "gesto" }),
  r(2100, { type: "preselect", id: "buscar" }),
  r(2300, { type: "execute", id: "buscar", ms: 300.4, pathPx: 112, expert: false, mode: "gesto" }),
  r(3000, { type: "sensitive_blocked", id: "eliminar" }, "producto", 4),
  r(3100, { type: "cancel", reason: "fuera_de_arco" }, "producto", 4),
  r(3500, { type: "execute", id: "eliminar", ms: 420, pathPx: 170, expert: false, mode: "gesto" }, "producto", 4),
  r(4000, { type: "undo", id: "marcar-no-disponible" }, "producto", 4),
  r(4100, { type: "rest_enter" }),
];

const SESION = { dispositivo: "Android 15 · Chrome 140", mano: "right" as const, anclaAltura: 0.44, observaciones: "Probado caminando" };

describe("construirExportacion", () => {
  const x = construirExportacion(REGISTROS, SESION, Date.UTC(2026, 8, 25, 10, 0));

  it("trae los campos de spec §9: versión, dispositivo, mano, posición y observaciones", () => {
    expect(x.version).toContain("fase-1");
    expect(x.dispositivo).toBe("Android 15 · Chrome 140");
    expect(x.mano).toBe("derecha");
    expect(x.posicion).toEqual({ anclaAltura: 0.44, lado: "derecha" });
    expect(x.observaciones).toBe("Probado caminando");
    expect(x.exportado).toBe("2026-09-25T10:00:00.000Z");
  });

  it("una fila por acción ejecutada, con número de opciones, tiempo y errores", () => {
    expect(x.acciones).toEqual([
      { fecha: new Date(2300).toISOString(), pantalla: "mapa", accion: "buscar", modo: "gesto", experto: false, tiempoMs: 300, recorridoPx: 112, numeroOpciones: 4, errores: 1 },
      { fecha: new Date(3500).toISOString(), pantalla: "producto", accion: "eliminar", modo: "gesto", experto: false, tiempoMs: 420, recorridoPx: 170, numeroOpciones: 4, errores: 2 },
    ]);
  });

  it("errores = cancelaciones y bloqueos desde la ejecución anterior", () => {
    expect(x.acciones.map((a) => a.errores)).toEqual([1, 2]);
  });

  it("resumen por tipo de evento", () => {
    expect(x.resumen).toEqual({ ejecuciones: 2, cancelaciones: 2, bloqueos: 1, deshacer: 1, descansos: 1 });
  });

  it("incluye todos los eventos crudos", () => {
    expect(x.eventos).toHaveLength(REGISTROS.length);
  });

  it("mano izquierda", () => {
    const i = construirExportacion([], { ...SESION, mano: "left" });
    expect(i.mano).toBe("izquierda");
    expect(i.posicion.lado).toBe("izquierda");
    expect(i.acciones).toEqual([]);
  });
});

describe("describirDispositivo", () => {
  it.each([
    ["Mozilla/5.0 (Linux; Android 15; NX789J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36", "Android 15 · Chrome 140"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1", "iPhone · iOS 18.2 · Safari 18.2"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "Escritorio · Chrome 140"],
    ["algo raro", "Desconocido"],
  ])("%s", (ua, esperado) => {
    expect(describirDispositivo(ua)).toBe(esperado);
  });
});

it("nombre de archivo con fecha y hora", () => {
  expect(nombreArchivo(new Date(2026, 8, 25, 9, 5))).toBe("metricas-boton-ancla-20260925-0905.json");
});
