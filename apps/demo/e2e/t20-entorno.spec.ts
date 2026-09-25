import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";
import { ponerTeclado, tecladoFalso } from "./helpers/teclado";

// T-20: cancelaciones del entorno y teclado (RF-09, RF-10, RF-13).

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

test("RF-13 (HM-06) + HM-04: con el teclado abierto el ancla sube sobre él y ofrece 'Ocultar teclado'; al bajarlo, sigue ahí", async ({ page }) => {
  // El teclado se simula (Playwright no muestra el de un celular): helpers/teclado.ts.
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "buscar"), { pasos: 8, ms: 150 });
  await expect(page.getByTestId("campo-busqueda")).toBeFocused();

  const alto = page.viewportSize()!.height;
  await ponerTeclado(page, 300);
  const ancla = page.getByTestId("ancla");
  await expect(ancla).toBeVisible(); // ya no se oculta (HM-06)
  await expect.poll(async () => (await ancla.boundingBox())!.y + (await ancla.boundingBox())!.height).toBeLessThanOrEqual(alto - 300);
  const conTeclado = await leerGeometria(page);
  expect(conTeclado.slots.find((s) => s.id === "ocultar-teclado")?.angulo).toBeCloseTo(180, 5); // RF-17
  expect(conTeclado.slots.find((s) => s.id === "cerrar")?.angulo).toBeCloseTo(90, 5);

  // Solo deslizando: "Ocultar teclado" quita el foco del campo (en un celular, baja el teclado).
  await gestos.deslizar(conTeclado.centro, haciaOpcion(conTeclado, "ocultar-teclado"), { pasos: 8, ms: 150 });
  await expect(page.getByTestId("campo-busqueda")).not.toBeFocused();

  // HM-04: al bajar el teclado, el ancla sigue visible y "Ocultar teclado" desaparece.
  await ponerTeclado(page, 0);
  await expect(ancla).toBeVisible();
  await expect.poll(async () => (await leerGeometria(page)).slots.some((s) => s.id === "ocultar-teclado")).toBe(false);
});
