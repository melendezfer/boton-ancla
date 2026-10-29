import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// Submenú en el lugar (specs/submenu-en-el-lugar, v0.7.0): una acción con `abreSubmenu` (Zoom en el mapa de la
// demo) deja abierto el abanico de su capa sin volver a tocar el ancla; una sin la marca (Buscar), no.

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

/** Elige Zoom deslizando. Con WebKit muy cargado, el pulgar puede parecer quieto y Zoom se vuelve deslizador
 * (HM-17): si la capa no aparece en 2 s, se repite, como en hm12a-apuntar-mapa. */
async function elegirZoom(page: Page, gestos: Awaited<ReturnType<typeof crearGestos>>, g: Awaited<ReturnType<typeof leerGeometria>>) {
  const capa = page.getByRole("dialog", { name: "Zoom" });
  for (let intento = 0; intento < 3; intento++) {
    await gestos.deslizar(g.centro, haciaOpcion(g, "zoom"), { pasos: 8, ms: 150 });
    if (await capa.waitFor({ state: "visible", timeout: 2000 }).then(() => true, () => false)) return;
  }
  await expect(capa).toBeVisible();
}

async function abrirMapa(page: Page) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  return leerGeometria(page);
}

test("SL-02: elegir Zoom abre solo el abanico de Acercar y Alejar; un toque en Acercar lo ejecuta", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const lienzo = page.getByTestId("mapa-lienzo");
  await elegirZoom(page, gestos, g);
  // Sin tocar el ancla: el abanico de la capa está abierto en modo toque, con "Cerrar" a 90°.
  await expect.poll(() => estadoAncla(page)).toBe("abierto_toque");
  const enCapa = await leerGeometria(page);
  expect(enCapa.slots.map((s) => s.id).sort()).toEqual(["acercar", "alejar", "cerrar"]);
  const z0 = Number(await lienzo.getAttribute("data-zoom"));
  const acercar = haciaOpcion(enCapa, "acercar");
  await gestos.presionar(acercar);
  await gestos.soltar(acercar);
  await expect.poll(async () => Number(await lienzo.getAttribute("data-zoom"))).toBeCloseTo(z0 * 1.5, 2);
  // Acercar no es submenú: el ancla vuelve a reposo con la capa abierta.
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await expect(page.getByRole("dialog", { name: "Zoom" })).toBeVisible();
});

test("SL-04: sin actividad, el abanico del submenú se cierra solo y la capa queda", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  await elegirZoom(page, gestos, g);
  await expect.poll(() => estadoAncla(page)).toBe("abierto_toque");
  await expect.poll(() => estadoAncla(page), { timeout: 8000 }).toBe("reposo");
  await expect(page.getByRole("dialog", { name: "Zoom" })).toBeVisible();
});

test("SL-01: Buscar (sin abreSubmenu) abre su hoja y el ancla queda en reposo", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "buscar"), { pasos: 8, ms: 150 });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(600);
  expect(await estadoAncla(page)).toBe("reposo");
});
