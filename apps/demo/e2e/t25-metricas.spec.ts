import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// T-25: registro local y exportación de métricas (spec §9, RNF-08, C-04, C-20, L-10).

test.beforeEach(async ({ page }) => {
  // Se limpia UNA sola vez por prueba: hay que navegar a /metricas sin perder lo guardado.
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem("prueba-limpia")) {
        window.localStorage.clear();
        window.sessionStorage.setItem("prueba-limpia", "1");
      }
    } catch {}
  });
  await sinBienvenida(page);
});

async function usarElAncla(page: Page) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  // 1) Abrir y cancelar volviendo al centro.
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "ofertas-cerca", 50));
  await gestos.mover({ x: g.centro.x + 2, y: g.centro.y });
  await gestos.soltar({ x: g.centro.x + 2, y: g.centro.y });
  // 2) Ejecutar "Mi ubicación".
  await gestos.deslizar(g.centro, haciaOpcion(g, "mi-ubicacion"), { pasos: 8, ms: 150 });
  await expect(page.getByText("Centrado en tu ubicación (simulado)")).toBeVisible();
}

test("la pantalla de Métricas lista los eventos y el resumen", async ({ page }) => {
  await usarElAncla(page);
  await page.goto("/metricas");
  const lista = page.getByTestId("lista-metricas");
  await expect(lista).toContainText("execute");
  await expect(lista).toContainText("mi-ubicacion");
  await expect(lista).toContainText("zona_muerta");
  await expect(page.getByLabel("Resumen")).toContainText("1Ejecuciones");
  await expect(page.getByLabel("Resumen")).toContainText("1Cancelaciones");
});

test("exportar descarga un JSON con los campos de spec §9", async ({ page }) => {
  await usarElAncla(page);
  await page.goto("/metricas");
  // Esperar la hidratación: si se escribe antes, React deja el campo con su estado inicial (vacío).
  // "Dispositivo" lo autocompleta un efecto que solo corre en el navegador ya hidratado.
  await expect(page.getByLabel("Dispositivo")).toHaveValue(/.+/);
  await page.getByLabel("Observaciones (qué se sintió lento, confuso o incómodo)").fill("Prueba automática");
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Descargar JSON" }).click()]);
  expect(descarga.suggestedFilename()).toMatch(/^metricas-boton-ancla-\d{8}-\d{4}\.json$/);
  const datos = JSON.parse(await readFile((await descarga.path())!, "utf8"));

  expect(datos.version).toContain("fase-1");
  expect(typeof datos.dispositivo).toBe("string");
  expect(datos.mano).toBe("derecha");
  expect(datos.posicion).toEqual({ anclaAltura: 0.44, lado: "derecha" });
  expect(datos.observaciones).toBe("Prueba automática");
  expect(datos.acciones).toHaveLength(1);
  expect(datos.acciones[0]).toMatchObject({ pantalla: "mapa", accion: "mi-ubicacion", modo: "gesto", numeroOpciones: 5, errores: 1 }); // HM-12a: Zoom es la 5.ª del mapa
  expect(datos.acciones[0].tiempoMs).toBeGreaterThan(0);
  // C-04: "experto" va en la ejecución, no como modo de apertura.
  const modosOpen = datos.eventos.filter((e: { evento: { type: string } }) => e.evento.type === "open").map((e: { evento: { mode: string } }) => e.evento.mode);
  expect(modosOpen.every((m: string) => ["gesto", "toque", "teclado"].includes(m))).toBe(true);
});

test("RNF-08: usar el ancla no hace pedidos de red fuera de la demo", async ({ page }) => {
  const externos: string[] = [];
  page.on("request", (req) => {
    const host = new URL(req.url()).hostname;
    if (!["localhost", "127.0.0.1"].includes(host) && !req.url().startsWith("data:") && !req.url().startsWith("blob:")) externos.push(req.url());
  });
  await usarElAncla(page);
  await page.goto("/metricas");
  await expect(page.getByTestId("lista-metricas")).toBeVisible();
  expect(externos).toEqual([]);
});

test("se mantienen al recargar y se pueden borrar", async ({ page }) => {
  await usarElAncla(page);
  await page.goto("/metricas");
  await expect(page.getByTestId("lista-metricas")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("lista-metricas")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Borrar registros" }).click();
  await expect(page.getByText("Todavía no hay eventos.", { exact: false })).toBeVisible();
});
