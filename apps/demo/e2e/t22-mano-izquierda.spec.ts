import { expect, test } from "@playwright/test";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// T-22: mano izquierda (HU-11, D-12, D-17).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
});

test("HU-11: en Ajustes, 'Izquierda' pasa el ancla abajo a la izquierda al instante y refleja el abanico", async ({ page }) => {
  // Se prueba en la misma pantalla: el beforeEach borra localStorage en cada carga.
  await page.goto("/ajustes");
  const derecha = await leerGeometria(page);
  const vp = page.viewportSize()!;
  expect(derecha.centro.x).toBeGreaterThan(vp.width / 2);

  await page.getByText("Izquierda", { exact: true }).click();
  await expect.poll(async () => (await leerGeometria(page)).centro.x).toBeLessThan(vp.width / 2);
  const izquierda = await leerGeometria(page);

  expect(izquierda.centro.x).toBeCloseTo(vp.width - derecha.centro.x, 0); // espejo exacto
  expect(izquierda.centro.y).toBeCloseTo(derecha.centro.y, 0); // misma altura
  // Cada opción conserva su posición relativa al pulgar: mismo ángulo, reflejado.
  for (const s of derecha.slots) {
    const espejo = izquierda.slots.find((x) => x.id === s.id)!;
    expect((espejo.angulo + s.angulo) % 360).toBeCloseTo(180, 5);
  }
});

test("HU-11: con la mano izquierda, el mismo gesto reflejado ejecuta la misma acción", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ mano: "left" })));
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const destino = haciaOpcion(g, "buscar");
  expect(destino.x).toBeGreaterThan(g.centro.x); // hacia la derecha: el espejo de la diagonal izquierda
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, destino, { pasos: 8, ms: 150 });
  await expect(page.getByRole("dialog", { name: "Buscar" })).toBeVisible();
});

test("HU-11: la opción 'Atrás' sigue arriba con la mano izquierda (D-10)", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ mano: "left" })));
  await page.goto("/negocio");
  const g = await leerGeometria(page);
  expect(g.slots.find((s) => s.id === "atras")!.angulo).toBeCloseTo(90, 5);
});
