import { expect, test, type Page } from "@playwright/test";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// T-23: bienvenida (HU-12, C-17, HM-02).

const CLAVE = "boton-ancla:v1:bienvenida";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
});

function sembrar(page: Page, estado: object) {
  return page.addInitScript(([clave, valor]) => window.localStorage.setItem(clave, valor), [CLAVE, JSON.stringify(estado)] as const);
}

async function bienvenidaGuardada(page: Page) {
  return JSON.parse((await page.evaluate((c) => window.localStorage.getItem(c), CLAVE)) ?? "null");
}

async function banderaEnZonaMuerta(page: Page) {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "buscar", 15));
  const texto = await page.getByTestId("banda").textContent();
  await gestos.soltar(g.centro);
  return texto;
}

test("HU-12: la primera vez, una opción sale del ancla y vuelve, y no se repite", async ({ page }) => {
  await page.goto("/mapa");
  await expect(page.getByTestId("demostracion")).toBeAttached();
  await expect(page.getByTestId("demostracion")).toHaveCount(0, { timeout: 5000 }); // termina sola
  expect((await bienvenidaGuardada(page)).demostracionHecha).toBe(true);
});

test("HU-12 + HM-02: en los primeros usos, sin preselección la banda dice 'Desliza hacia una opción'", async ({ page }) => {
  await sembrar(page, { version: 1, demostracionHecha: true, usos: {} });
  await page.goto("/mapa");
  expect(await banderaEnZonaMuerta(page)).toBe("Desliza hacia una opción");
});

test("HU-12 + HM-02: con preselección, la banda muestra el nombre de la opción", async ({ page }) => {
  await sembrar(page, { version: 1, demostracionHecha: true, usos: {} });
  await page.goto("/mapa");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "buscar", 50));
  await gestos.mover(haciaOpcion(g, "buscar"));
  await expect(page.getByTestId("banda")).toHaveText("Buscar");
  await gestos.soltar(g.centro);
});

test("C-17: ejecutar una opción cuenta un uso", async ({ page }) => {
  await sembrar(page, { version: 1, demostracionHecha: true, usos: {} });
  await page.goto("/mapa");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "ofertas-cerca"), { pasos: 8, ms: 120 });
  await expect(page.getByRole("dialog", { name: "Ofertas cerca" })).toBeVisible();
  await expect.poll(async () => (await bienvenidaGuardada(page)).usos["ofertas-cerca"]).toBe(1);
});

const usosMapa = (n: number) => ({ buscar: n, "mi-ubicacion": n, "ofertas-cerca": n, favoritos: n, zoom: n });

test("HU-12: si una opción de la pantalla tiene 4 usos, todavía hay pista", async ({ page }) => {
  await sembrar(page, { version: 1, demostracionHecha: true, usos: { ...usosMapa(5), favoritos: 4 } });
  await page.goto("/mapa");
  expect(await banderaEnZonaMuerta(page)).toBe("Desliza hacia una opción");
});

test("HU-12: con 5 usos en todas las opciones de la pantalla, la banda muestra la sección", async ({ page }) => {
  await sembrar(page, { version: 1, demostracionHecha: true, usos: usosMapa(5) });
  await page.goto("/mapa");
  expect(await banderaEnZonaMuerta(page)).toBe("Mapa");
});

test("Ajustes: 'Repetir la bienvenida' vuelve a mostrar la demostración", async ({ page }) => {
  await sembrar(page, { version: 1, demostracionHecha: true, usos: {} });
  await page.goto("/ajustes");
  await expect(page.getByTestId("ancla")).toBeVisible();
  await expect(page.getByTestId("demostracion")).toHaveCount(0);
  await page.getByRole("button", { name: "Repetir la bienvenida" }).click();
  await expect(page.getByTestId("demostracion")).toBeAttached();
});
