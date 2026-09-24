import { expect, test } from "@playwright/test";
import { estadoAncla, haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// T-17: descanso del pulgar (D-11, D-12, HU-04). T_DESCANSO = 400 ms.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
});

test("HU-04: el pulgar quieto 400 ms muestra el anillo de descanso y ninguna opción", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await expect.poll(() => estadoAncla(page), { timeout: 2000 }).toBe("descanso");
  await expect(page.getByTestId("ancla")).toHaveClass(/ba-ancla--descanso/);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.getByTestId("banda")).toHaveCount(0);
  // Sigue en descanso mientras el pulgar no se mueva (leer un rato).
  await page.waitForTimeout(800);
  expect(await estadoAncla(page)).toBe("descanso");
  await gestos.soltar(g.centro);
});

test("HU-04: soltar desde el descanso no ejecuta nada", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await expect.poll(() => estadoAncla(page), { timeout: 2000 }).toBe("descanso");
  await gestos.soltar(g.centro);
  expect(await estadoAncla(page)).toBe("reposo");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("HU-04: deslizar desde el descanso abre en modo gesto y se puede ejecutar", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await expect.poll(() => estadoAncla(page), { timeout: 2000 }).toBe("descanso");
  await gestos.mover(haciaOpcion(g, "ofertas-cerca", 40));
  expect(await estadoAncla(page)).toBe("abierto_gesto");
  await gestos.mover(haciaOpcion(g, "ofertas-cerca"));
  await gestos.soltar(haciaOpcion(g, "ofertas-cerca"));
  await expect(page.getByRole("dialog", { name: "Ofertas cerca" })).toBeVisible();
});

test("C-07: un temblor pequeño del pulgar en descanso no abre el menú", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await expect.poll(() => estadoAncla(page), { timeout: 2000 }).toBe("descanso");
  for (const [dx, dy] of [[3, 1], [-2, 4], [5, -3], [0, 0]]) await gestos.mover({ x: g.centro.x + dx, y: g.centro.y + dy });
  expect(await estadoAncla(page)).toBe("descanso");
  await gestos.soltar(g.centro);
});
