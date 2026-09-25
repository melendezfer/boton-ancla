import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// HM-09 (experimental): desplazar con el ancla como joystick (spec RF-18).

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

const ventana = (page: Page) => page.evaluate(() => window.scrollY);
const lista = (page: Page) => page.getByTestId("hoja-contenido").evaluate((el) => el.scrollTop);

/** Presiona el ancla y baja el pulgar: entra en "desplazando" y lo mantiene `ms`. */
async function empujar(page: Page, gestos: Gestos, centro: Punto, dy: number, ms: number) {
  await gestos.presionar(centro);
  await gestos.mover({ x: centro.x, y: centro.y + 20 * Math.sign(dy) });
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  await expect(page.getByTestId("guia-desplazar")).toBeVisible();
  await gestos.mover({ x: centro.x, y: centro.y + dy });
  await page.waitForTimeout(ms);
}

test("en la carta, bajar el pulgar desplaza la página; al soltar se detiene en seco", async ({ page }) => {
  await page.goto("/negocio/carta");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  expect(await ventana(page)).toBe(0);

  await empujar(page, gestos, g.centro, 70, 600);
  const alSoltar = await ventana(page);
  expect(alSoltar).toBeGreaterThan(50);
  await gestos.soltar({ x: g.centro.x, y: g.centro.y + 70 });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await expect(page.getByTestId("guia-desplazar")).toHaveCount(0);

  // Parada en seco: después de soltar, nada de inercia.
  const quieta = await ventana(page);
  expect(quieta).toBeGreaterThanOrEqual(alSoltar);
  await page.waitForTimeout(300);
  expect(await ventana(page)).toBe(quieta);

  // Subir el pulgar lleva hacia arriba (la entrada es hacia abajo; luego el dedo es libre).
  await gestos.presionar(g.centro);
  await gestos.mover({ x: g.centro.x, y: g.centro.y + 20 });
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  await gestos.mover({ x: g.centro.x, y: g.centro.y - 50 });
  await page.waitForTimeout(500);
  await gestos.soltar({ x: g.centro.x, y: g.centro.y - 50 });
  expect(await ventana(page)).toBeLessThan(quieta);
});

test("cerca del centro (zona muerta) no se mueve nada", async ({ page }) => {
  await page.goto("/negocio/carta");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover({ x: g.centro.x, y: g.centro.y + 20 });
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  await gestos.mover({ x: g.centro.x, y: g.centro.y + 5 });
  const antes = await ventana(page);
  await page.waitForTimeout(400);
  expect(await ventana(page)).toBe(antes);
  await gestos.soltar({ x: g.centro.x, y: g.centro.y + 5 });
});

for (const [opcion, nombre] of [
  ["favoritos", "Favoritos"],
  ["ofertas-cerca", "Ofertas cerca"],
] as const) {
  test(`con la capa ${nombre} abierta, se desplaza su lista y no la página`, async ({ page }) => {
    await page.goto("/mapa");
    await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
    const g = await leerGeometria(page);
    const gestos = await crearGestos(page);
    await gestos.deslizar(g.centro, haciaOpcion(g, opcion), { pasos: 8, ms: 150 });
    await expect(page.getByRole("dialog", { name: nombre })).toBeVisible();
    expect(await lista(page)).toBe(0);

    const capa = await leerGeometria(page);
    await empujar(page, gestos, capa.centro, 70, 500);
    await gestos.soltar({ x: capa.centro.x, y: capa.centro.y + 70 });
    expect(await lista(page)).toBeGreaterThan(30);
    await expect(page.getByRole("dialog", { name: nombre })).toBeVisible(); // no se abrió ninguna opción
  });
}

test("en el mapa no se desplaza: bajar el pulgar abre el abanico como siempre", async ({ page }) => {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover({ x: g.centro.x, y: g.centro.y + 30 });
  await page.waitForTimeout(100);
  expect(await estadoAncla(page)).not.toBe("desplazando");
  await expect(page.getByTestId("guia-desplazar")).toHaveCount(0);
  await gestos.soltar({ x: g.centro.x, y: g.centro.y + 30 });
});

test("con el interruptor de Ajustes apagado, bajar el pulgar no desplaza", async ({ page }) => {
  await page.goto("/ajustes");
  const interruptor = page.getByTestId("interruptor-desplazar");
  await expect(interruptor).toBeChecked(); // activado por defecto en la demo
  await interruptor.uncheck();

  await page.goto("/negocio/carta");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover({ x: g.centro.x, y: g.centro.y + 30 });
  await page.waitForTimeout(300);
  expect(await estadoAncla(page)).not.toBe("desplazando");
  await gestos.soltar({ x: g.centro.x, y: g.centro.y + 30 });
  expect(await ventana(page)).toBe(0);
});
