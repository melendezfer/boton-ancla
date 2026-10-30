import { expect, test } from "@playwright/test";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// PJ-01 a PJ-04 (v0.8.0, specs/pista-junto-al-ancla): la pista de bienvenida va junto al ancla, pequeña, y se va sola.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
      window.localStorage.setItem("boton-ancla:v1:bienvenida", JSON.stringify({ version: 1, demostracionHecha: true, usos: {} }));
    } catch {}
  });
});

test("PJ-01 y PJ-02: la pista va justo debajo del ancla, pequeña, sin tapar ninguna opción", async ({ page }) => {
  await page.goto("/mapa");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "buscar", 15));
  const pista = page.locator('[data-testid="banda"][data-tipo="pista"]');
  await expect(pista).toHaveText("Desliza hacia una opción");
  const c = (await pista.boundingBox())!;
  // Debajo del ancla y cerca: su borde de arriba a menos de 50 px del centro del ancla.
  expect(c.y).toBeGreaterThan(g.centro.y);
  expect(c.y - g.centro.y).toBeLessThan(50);
  expect(c.height).toBeLessThanOrEqual(24.5);
  expect(await pista.evaluate((el) => getComputedStyle(el).fontSize)).toBe("12px");
  // No se encima con ninguna opción.
  for (const s of g.slots) {
    const o = (await page.getByTestId(`opcion-${s.id}`).boundingBox())!;
    const encima = !(o.x + o.width <= c.x || c.x + c.width <= o.x || o.y + o.height <= c.y || c.y + c.height <= o.y);
    expect(encima, `la pista tapa "${s.id}"`).toBe(false);
  }
  await gestos.soltar(g.centro);
});

test("PJ-03: la pista se desvanece sola (~1,8 s); el nombre de una opción, no", async ({ page }) => {
  await page.goto("/mapa");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "buscar", 15));
  const pista = page.locator('[data-testid="banda"][data-tipo="pista"]');
  await expect(pista).toBeVisible();
  await expect(pista).toBeHidden({ timeout: 4000 });
  // PJ-04: con preselección, la banda de la opción sale encima del abanico y se queda.
  await gestos.mover(haciaOpcion(g, "buscar", 50));
  await gestos.mover(haciaOpcion(g, "buscar"));
  const banda = page.locator('[data-testid="banda"][data-tipo="opcion"]');
  await expect(banda).toHaveText("Buscar");
  await page.waitForTimeout(2500);
  await expect(banda).toBeVisible();
  await gestos.soltar(g.centro);
});

test("la pregunta '¿Con qué mano?' no se desvanece", async ({ browser }) => {
  // Sin el beforeEach de arriba: almacenamiento limpio, como la primera vez.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/mapa");
  const pregunta = page.getByText("¿Con qué mano? Desliza hacia ese lado");
  await expect(pregunta).toBeVisible();
  await page.waitForTimeout(2500);
  await expect(pregunta).toBeVisible();
  await ctx.close();
});
