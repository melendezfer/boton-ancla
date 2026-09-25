import { expect, test } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";
import { ponerTeclado, tecladoFalso } from "./helpers/teclado";

// HM-05: con el teclado abierto, la hoja de búsqueda queda SOBRE el teclado y se ve lo que se escribe.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
  await sinBienvenida(page);
  await tecladoFalso(page);
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
});

for (const teclado of [260, 320]) {
  test(`con un teclado de ${teclado} px, el campo y la hoja quedan enteros por encima`, async ({ page }) => {
    const g = await leerGeometria(page);
    const gestos = await crearGestos(page);
    await gestos.deslizar(g.centro, haciaOpcion(g, "buscar"), { pasos: 8, ms: 150 });
    await expect(page.getByTestId("campo-busqueda")).toBeFocused();
    await ponerTeclado(page, teclado);

    const alto = page.viewportSize()!.height;
    const bordeTeclado = alto - teclado;
    await expect.poll(async () => (await page.getByTestId("campo-busqueda").boundingBox())!.y + (await page.getByTestId("campo-busqueda").boundingBox())!.height).toBeLessThanOrEqual(bordeTeclado);
    const hoja = (await page.getByRole("dialog", { name: "Buscar" }).boundingBox())!;
    expect(hoja.y).toBeGreaterThanOrEqual(0);
    expect(hoja.y + hoja.height).toBeLessThanOrEqual(bordeTeclado);

    await page.getByTestId("campo-busqueda").fill("Arepa");
    await expect(page.getByTestId("campo-busqueda")).toHaveValue("Arepa");
    await expect(page.getByTestId("campo-busqueda")).toBeInViewport();
  });
}

test("al bajar el teclado, la hoja vuelve al borde de abajo", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "buscar"), { pasos: 8, ms: 150 });
  await ponerTeclado(page, 300);
  await ponerTeclado(page, 0);
  const alto = page.viewportSize()!.height;
  await expect.poll(async () => {
    const h = (await page.getByRole("dialog", { name: "Buscar" }).boundingBox())!;
    return alto - (h.y + h.height);
  }).toBeLessThan(40); // solo el margen de abajo
});
