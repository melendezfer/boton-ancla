import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// HM-18: zoom directo sobre el mapa de la demo, como Google Maps. Es del MAPA, no del ancla.
const PASO_ZOOM = 1.5;

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

async function abrirMapa(page: Page) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  return leerGeometria(page);
}

async function mapa(page: Page) {
  const l = page.getByTestId("mapa-lienzo");
  return { x: Number(await l.getAttribute("data-offset-x")), y: Number(await l.getAttribute("data-offset-y")), zoom: Number(await l.getAttribute("data-zoom")) };
}

/** Un punto del mapa lejos del ancla, de la barra y de los pines. */
const LIBRE: Punto = { x: 90, y: 330 };

async function tocar(gestos: Gestos, p: Punto) {
  await gestos.presionar(p);
  await gestos.soltar(p);
}

async function metricas(page: Page) {
  const r = JSON.parse((await page.evaluate(() => localStorage.getItem("boton-ancla-demo:v1:metricas"))) ?? "[]") as { evento: { type: string; forma?: string } }[];
  return r.filter((m) => m.evento.type === "map_zoom").map((m) => m.evento.forma);
}

test("doble toque acerca un nivel alrededor del punto tocado", async ({ page }) => {
  await abrirMapa(page);
  const gestos = await crearGestos(page);
  const antes = await mapa(page);
  const segundo = { x: LIBRE.x + 3, y: LIBRE.y + 2 };
  await tocar(gestos, LIBRE);
  await tocar(gestos, segundo);
  await expect.poll(async () => (await mapa(page)).zoom).toBeCloseTo(antes.zoom * PASO_ZOOM, 2);
  // El punto del mapa bajo el segundo toque se queda bajo el dedo (el desplazamiento se guarda redondeado).
  const despues = await mapa(page);
  const mundo = { x: (segundo.x - antes.x) / antes.zoom, y: (segundo.y - antes.y) / antes.zoom };
  expect(Math.abs(despues.x + mundo.x * despues.zoom - segundo.x)).toBeLessThan(2);
  expect(Math.abs(despues.y + mundo.y * despues.zoom - segundo.y)).toBeLessThan(2);
  await expect.poll(() => metricas(page)).toEqual(["doble_toque"]);
});

test("doble toque, dejar el dedo y deslizar: arriba acerca, abajo aleja; soltar lo deja ahí", async ({ page }) => {
  await abrirMapa(page);
  const gestos = await crearGestos(page);
  const z0 = (await mapa(page)).zoom;
  await tocar(gestos, LIBRE);
  await gestos.presionar(LIBRE);
  for (let i = 1; i <= 6; i++) await gestos.mover({ x: LIBRE.x, y: LIBRE.y - i * 15 }); // 90 px hacia arriba
  const arriba = (await mapa(page)).zoom;
  expect(arriba).toBeGreaterThan(z0 * 1.5);
  for (let i = 1; i <= 12; i++) await gestos.mover({ x: LIBRE.x, y: LIBRE.y - 90 + i * 15 }); // hasta 90 px hacia abajo
  const abajo = (await mapa(page)).zoom;
  expect(abajo).toBeLessThan(z0);
  await gestos.soltar({ x: LIBRE.x, y: LIBRE.y + 90 });
  await page.waitForTimeout(200);
  expect((await mapa(page)).zoom).toBe(abajo);
  await expect.poll(() => metricas(page)).toEqual(["doble_toque_arrastre"]);
});

test("pellizco con dos dedos: separar acerca, juntar aleja", async ({ page }) => {
  await abrirMapa(page);
  const gestos = await crearGestos(page);
  const z0 = (await mapa(page)).zoom;
  const c = { x: 170, y: 360 };
  await gestos.presionar({ x: c.x - 30, y: c.y }, 1);
  await gestos.presionar({ x: c.x + 30, y: c.y }, 2);
  for (let i = 1; i <= 5; i++) {
    await gestos.mover({ x: c.x - 30 - i * 6, y: c.y }, 1);
    await gestos.mover({ x: c.x + 30 + i * 6, y: c.y }, 2);
  }
  await gestos.soltar({ x: c.x - 60, y: c.y }, 1);
  await gestos.soltar({ x: c.x + 60, y: c.y }, 2);
  const separado = (await mapa(page)).zoom;
  expect(separado).toBeCloseTo(z0 * 2, 1); // la distancia entre dedos se duplicó
  await expect.poll(() => metricas(page)).toEqual(["pellizco"]);
  await expect(page.getByRole("dialog")).toHaveCount(0); // no se abrió ningún pin
});

test("no rompe lo de siempre: arrastrar mueve sin zoom y tocar un pin abre su hoja", async ({ page }) => {
  await abrirMapa(page);
  const gestos = await crearGestos(page);
  const antes = await mapa(page);
  await gestos.deslizar(LIBRE, { x: LIBRE.x + 60, y: LIBRE.y + 40 }, { pasos: 8, ms: 120 });
  const despues = await mapa(page);
  expect(despues.zoom).toBe(antes.zoom);
  expect(despues.x - antes.x).toBeCloseTo(60, 0);
  // Dos arrastres seguidos no son un doble toque.
  await gestos.deslizar(LIBRE, { x: LIBRE.x + 30, y: LIBRE.y }, { pasos: 6, ms: 60 });
  await gestos.deslizar(LIBRE, { x: LIBRE.x + 30, y: LIBRE.y }, { pasos: 6, ms: 60 });
  expect((await mapa(page)).zoom).toBe(antes.zoom);

  await page.getByRole("button", { name: "Arepas Doña Rosa" }).click();
  await expect(page.getByRole("dialog", { name: "Arepas Doña Rosa" })).toBeVisible();
  expect((await mapa(page)).zoom).toBe(antes.zoom);
  expect(await metricas(page)).toEqual([]);
});

test("el Zoom del abanico se mantiene y también se cuenta (capa)", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const capa = page.getByRole("dialog", { name: "Zoom" });
  // Con la máquina cargada, WebKit puede tardar más de 300 ms entre movimientos y el gesto se
  // vuelve deslizador (con razón): si la capa no aparece en 2 s, se repite (como en hm12a).
  for (let intento = 0; intento < 3; intento++) {
    await gestos.deslizar(g.centro, haciaOpcion(g, "zoom"), { pasos: 8, ms: 150 });
    if (await capa.waitFor({ state: "visible", timeout: 2000 }).then(() => true, () => false)) break;
  }
  await expect(capa).toBeVisible();
  const enCapa = await leerGeometria(page);
  await gestos.deslizar(enCapa.centro, haciaOpcion(enCapa, "acercar"), { pasos: 8, ms: 150 });
  await expect.poll(async () => (await metricas(page)).filter((f) => f === "capa")).toEqual(["capa"]);
});

test("Métricas: el resumen cuenta cada forma de zoom", async ({ page }) => {
  await abrirMapa(page);
  const gestos = await crearGestos(page);
  await tocar(gestos, LIBRE);
  await tocar(gestos, LIBRE);
  await expect.poll(() => metricas(page)).toEqual(["doble_toque"]);
  await page.goto("/metricas");
  const resumen = page.getByTestId("resumen-zoom");
  await expect(resumen).toContainText("1Doble toque");
  await expect(resumen).toContainText("0Pellizco");
});
