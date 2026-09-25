import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos, type Gestos } from "./helpers/gestos";
import { ponerTeclado, tecladoFalso } from "./helpers/teclado";

// HM-08: cada capa declara sus acciones; con la capa abierta: Cerrar (90°) + las de la capa.
// Todo solo deslizando (D-15).

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

async function abrirCapa(page: Page, id: string): Promise<Gestos> {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, id), { pasos: 8, ms: 150 });
  return gestos;
}

async function ejecutar(page: Page, gestos: Gestos, id: string) {
  const g = await leerGeometria(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, id), { pasos: 8, ms: 150 });
}

const angulos = async (page: Page) => Object.fromEntries((await leerGeometria(page)).slots.map((s) => [s.id, Math.round(s.angulo)]));

test("Buscar sin teclado: Cerrar · Escribir · Borrar texto; 'Escribir' vuelve a enfocar el campo", async ({ page }) => {
  const gestos = await abrirCapa(page, "buscar");
  await page.getByTestId("campo-busqueda").blur(); // teclado bajado
  await expect.poll(() => angulos(page)).toEqual({ cerrar: 90, escribir: 135, "borrar-texto": 180 });
  await expect(page.getByRole("button", { name: "Menú, Buscar" })).toBeVisible();
  await ejecutar(page, gestos, "escribir");
  await expect(page.getByTestId("campo-busqueda")).toBeFocused();
});

test("Buscar con teclado: Cerrar (90°) · Borrar texto · Ocultar teclado (180°); 'Borrar texto' vacía el campo", async ({ page }) => {
  const gestos = await abrirCapa(page, "buscar");
  await page.getByTestId("campo-busqueda").fill("Arepa");
  await ponerTeclado(page, 300);
  await expect.poll(() => angulos(page)).toEqual({ cerrar: 90, "borrar-texto": 135, "ocultar-teclado": 180 });
  await ejecutar(page, gestos, "borrar-texto");
  await expect(page.getByTestId("campo-busqueda")).toHaveValue("");
  await expect(page.getByTestId("campo-busqueda")).toBeFocused(); // se puede seguir escribiendo
});

test("Ofertas cerca: el centro muestra la capa; ordenar por distancia y filtrar por categoría", async ({ page }) => {
  const gestos = await abrirCapa(page, "ofertas-cerca");
  await expect(page.getByRole("dialog", { name: "Ofertas cerca" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Menú, Ofertas cerca" })).toBeVisible();
  expect(await angulos(page)).toEqual({ cerrar: 90, "ordenar-distancia": 135, "filtrar-categoria": 180 });

  const metros = async () =>
    (await page.getByTestId("lista-ofertas").locator("li").allTextContents()).map((t) => Number(/(\d+) m/.exec(t)![1]));
  expect(await metros()).not.toEqual([...(await metros())].sort((a, b) => a - b)); // al principio, sin ordenar
  await ejecutar(page, gestos, "ordenar-distancia");
  await expect.poll(async () => { const m = await metros(); return m.join(",") === [...m].sort((a, b) => a - b).join(","); }).toBe(true);

  await ejecutar(page, gestos, "filtrar-categoria");
  await expect(page.getByTestId("estado-ofertas")).toContainText("Comida");
  await expect.poll(async () => (await page.getByTestId("lista-ofertas").locator("li").allTextContents()).every((t) => t.includes("Comida"))).toBe(true);
});

test("Favoritos: ordenar invierte la lista y 'Ver en el mapa' cierra la capa", async ({ page }) => {
  const gestos = await abrirCapa(page, "favoritos");
  const nombres = () => page.getByTestId("lista-favoritos").locator("li").allTextContents();
  const antes = await nombres();
  expect(antes.length).toBeGreaterThan(1);
  await ejecutar(page, gestos, "ordenar");
  await expect.poll(nombres).toEqual([...antes].reverse());

  await ejecutar(page, gestos, "ver-en-mapa");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Favoritos en el mapa (simulado)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Menú, sección Mapa" })).toBeVisible();
});

test("una capa sin acciones (resumen de un negocio) solo ofrece 'Cerrar'", async ({ page }) => {
  await page.getByRole("button", { name: "Jugos El Parque" }).tap();
  await expect(page.getByRole("dialog", { name: "Jugos El Parque" })).toBeVisible();
  expect(await angulos(page)).toEqual({ cerrar: 90 });
  await expect(page.getByRole("button", { name: "Menú, Jugos El Parque" })).toBeVisible();
});
