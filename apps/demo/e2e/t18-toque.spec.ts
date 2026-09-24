import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria, type GeometriaAncla } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// T-18: modo toque (D-07, D-13, HU-05, RF-11, L-06). Los toques se hacen con el
// helper de gestos (toques reales en Chromium) para que haya click de verdad.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
  await sinBienvenida(page);
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
});

async function tocar(gestos: Gestos, p: Punto) {
  await gestos.presionar(p);
  await gestos.soltar(p);
}

async function abrirEnToque(page: Page): Promise<{ g: GeometriaAncla; gestos: Gestos }> {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await tocar(gestos, g.centro);
  await expect.poll(() => estadoAncla(page)).toBe("abierto_toque");
  return { g, gestos };
}

test("HU-05: un toque rápido deja el menú abierto", async ({ page }) => {
  await abrirEnToque(page);
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByTestId("ancla")).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("banda")).toHaveText("Mapa"); // sin dedo: la sección (HM-02)
});

test("HU-05: tocar una opción la ejecuta", async ({ page }) => {
  const { g, gestos } = await abrirEnToque(page);
  await tocar(gestos, haciaOpcion(g, "ofertas-cerca"));
  await expect(page.getByRole("dialog", { name: "Ofertas cerca" })).toBeVisible();
  expect(await estadoAncla(page)).toBe("reposo");
});

test("HM-02: al apoyar el dedo sobre una opción, la banda muestra su nombre antes de soltar", async ({ page }) => {
  const { g, gestos } = await abrirEnToque(page);
  await gestos.presionar(haciaOpcion(g, "favoritos"));
  await expect(page.getByTestId("banda")).toHaveText("Favoritos");
  // Arrastrar fuera de la opción anula el toque (C-06): no se ejecuta.
  await gestos.mover(haciaOpcion(g, "favoritos", g.radio + 30));
  await gestos.soltar(haciaOpcion(g, "favoritos", g.radio + 30));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await estadoAncla(page)).toBe("abierto_toque");
});

test("RF-11: tocar fuera cierra el menú y el toque NO llega al contenido (ni el clic fantasma)", async ({ page }) => {
  const { gestos } = await abrirEnToque(page);
  // Justo sobre el pin de Arepas Doña Rosa: si el toque pasara, se abriría su hoja.
  const pin = (await page.getByRole("button", { name: "Arepas Doña Rosa" }).boundingBox())!;
  await tocar(gestos, { x: pin.x + pin.width / 2, y: pin.y + pin.height / 3 });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await page.waitForTimeout(600); // más que el velo extra: ya no queda nada que lo proteja
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("velo")).toHaveCount(0);
});

test("tocar el centro cierra el menú (C-06)", async ({ page }) => {
  const { g, gestos } = await abrirEnToque(page);
  await tocar(gestos, g.centro);
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("HU-05: si pasan 4 s sin actividad, el menú se cierra", async ({ page }) => {
  await abrirEnToque(page);
  await page.waitForTimeout(3000);
  expect(await estadoAncla(page)).toBe("abierto_toque");
  await expect.poll(() => estadoAncla(page), { timeout: 3000 }).toBe("reposo");
});

test("HU-09: desde el modo toque se puede seguir solo deslizando (presionar el centro y deslizar)", async ({ page }) => {
  const { g, gestos } = await abrirEnToque(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "buscar"), { pasos: 8, ms: 150 });
  await expect(page.getByRole("dialog", { name: "Buscar" })).toBeVisible();
});
