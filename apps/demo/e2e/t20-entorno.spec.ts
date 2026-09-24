import { expect, test, type Page } from "@playwright/test";
import { estadoAncla, haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// T-20: cancelaciones del entorno y teclado (RF-09, RF-10, RF-13).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
});

async function abrirConDedo(page: Page) {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "buscar", 40));
  await gestos.mover(haciaOpcion(g, "buscar"));
  await expect(page.getByTestId("opcion-buscar")).toHaveAttribute("data-activa", "true");
  return { g, gestos };
}

test("RF-09: un segundo dedo cancela y soltar después no ejecuta nada", async ({ page }) => {
  const { g, gestos } = await abrirConDedo(page);
  await gestos.presionar({ x: 60, y: 200 }, 2);
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await gestos.soltar({ x: 60, y: 200 }, 2);
  await gestos.soltar(haciaOpcion(g, "buscar"));
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("RF-09: un cambio de orientación cancela", async ({ page }) => {
  const { g, gestos } = await abrirConDedo(page);
  await page.evaluate(() => {
    if (screen.orientation) screen.orientation.dispatchEvent(new Event("change"));
    else window.dispatchEvent(new Event("orientationchange"));
  });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await gestos.soltar(haciaOpcion(g, "buscar"));
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("RF-10: si la app cambia de sección con el menú abierto, se cancela y el centro muestra la nueva sección", async ({ page }) => {
  const { g, gestos } = await abrirConDedo(page);
  await page.evaluate(() => (document.querySelector('a[href="/ajustes"]') as HTMLAnchorElement).click());
  await expect(page).toHaveURL(/\/ajustes$/);
  await expect(page.getByRole("button", { name: "Menú, sección Ajustes" })).toBeVisible();
  expect(await estadoAncla(page)).toBe("reposo");
  await gestos.soltar(haciaOpcion(g, "buscar"));
  await expect(page).toHaveURL(/\/ajustes$/); // soltar después no hace nada
});

test("RF-13: con el campo de búsqueda enfocado (teclado abierto) el ancla se oculta, y vuelve al cerrarlo", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "buscar"), { pasos: 8, ms: 150 });
  await expect(page.getByTestId("campo-busqueda")).toBeFocused();
  await expect(page.getByTestId("ancla")).toBeHidden();
  await page.getByRole("dialog", { name: "Buscar" }).getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByTestId("ancla")).toBeVisible();
});
