import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { leerGeometria } from "./helpers/ancla";

// Fase 3, T3-06 (RF3-06…RF3-09): el ancla abajo en cada orientación, con una posición por orientación.

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

const raiz = (page: Page) => page.locator(".ba-raiz");

/** y del centro para una altura (fracción del alto útil), como el núcleo (sin áreas seguras). */
const yDe = (altura: number, alto: number) => alto - altura * alto;

async function girar(page: Page, ancho: number, alto: number) {
  await page.setViewportSize({ width: ancho, height: alto });
  await expect(raiz(page)).toHaveAttribute("data-orientacion", ancho > alto ? "horizontal" : "vertical");
}

test("vertical → horizontal → vertical: abajo del mismo costado, 30 % en horizontal, y cada una recupera la suya", async ({ page }) => {
  await page.goto("/negocio");
  const vp = page.viewportSize()!;
  await expect(raiz(page)).toHaveAttribute("data-orientacion", "vertical");
  const vertical = await leerGeometria(page);
  expect(vertical.centro.y).toBeCloseTo(yDe(0.44, vp.height), 0);
  expect(vertical.centro.x).toBeGreaterThan(vp.width / 2); // mano derecha

  await girar(page, vp.height, vp.width);
  await expect.poll(async () => Math.round((await leerGeometria(page)).centro.y)).toBe(Math.round(yDe(0.3, vp.width)));
  const horizontal = await leerGeometria(page);
  expect(horizontal.centro.x).toBeGreaterThan(vp.height / 2); // mismo costado
  await expect(raiz(page)).toHaveAttribute("data-abre", "arriba");
  for (const s of horizontal.slots) expect(s.y).toBeGreaterThan(0); // el abanico cabe

  await girar(page, vp.width, vp.height);
  await expect.poll(async () => Math.round((await leerGeometria(page)).centro.y)).toBe(Math.round(vertical.centro.y));
});

test("con la mano izquierda, la primera vez en horizontal copia el costado izquierdo", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ mano: "left" })));
  await page.goto("/negocio");
  const vp = page.viewportSize()!;
  await girar(page, vp.height, vp.width);
  const g = await leerGeometria(page);
  expect(g.centro.x).toBeLessThan(vp.height / 2);
  await expect(raiz(page)).toHaveAttribute("data-mano", "left");
});

test("girar queda en las métricas", async ({ page }) => {
  await page.goto("/mapa");
  await expect(page.getByTestId("ancla")).toBeVisible();
  const vp = page.viewportSize()!;
  await girar(page, vp.height, vp.width);
  await expect
    .poll(async () => {
      const m = JSON.parse((await page.evaluate(() => localStorage.getItem("boton-ancla-demo:v1:metricas"))) ?? "[]") as { evento: { type: string; orientacion?: string } }[];
      return m.filter((x) => x.evento.type === "orientation").map((x) => x.evento.orientacion);
    })
    .toEqual(["horizontal"]);
});
