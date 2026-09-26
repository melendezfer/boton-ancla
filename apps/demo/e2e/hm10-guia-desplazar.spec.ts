import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, leerGeometria } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// HM-10: la guía de desplazamiento en dos variantes (spec RF-18). Parámetros por defecto (§6).
const MARGEN_LATERAL = 24;
const D_ACTIVO = 64;
const R_MAX = 72;
const GUIA_CORRIMIENTO = 16;
const GUIA_SEPARACION = 24;
/** Columna del ancla desde su borde: la guía no debe ocupar ancho fuera de ella. */
const COLUMNA = MARGEN_LATERAL + D_ACTIVO;

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

function conPreferencias(page: Page, prefs: Record<string, unknown>) {
  return page.addInitScript((p) => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify(p)), prefs);
}

/** Entra en "desplazando" (origen = centro + 20 px hacia abajo) y deja el pulgar en `dy` desde el origen. */
async function desplazarA(page: Page, gestos: Gestos, centro: Punto, dy: number) {
  await gestos.presionar(centro);
  await gestos.mover({ x: centro.x, y: centro.y + 20 });
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  await gestos.mover({ x: centro.x, y: centro.y + 20 + dy });
  return { x: centro.x, y: centro.y + 20 + dy };
}

const raiz = (page: Page) => page.locator(".ba-raiz");
const llenado = (page: Page) =>
  raiz(page).evaluate((el) => Number(getComputedStyle(el).getPropertyValue("--ba-llenado") || "0"));

test("por defecto (en el ancla): flecha ↓/↑ según la dirección y el anillo se llena con la velocidad", async ({ page }) => {
  await page.goto("/negocio/carta");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);

  let dedo = await desplazarA(page, gestos, g.centro, 70);
  const guia = page.getByTestId("guia-desplazar");
  await expect(guia).toHaveAttribute("data-variante", "ancla");
  await expect(raiz(page)).toHaveAttribute("data-direccion", "abajo");
  await expect.poll(() => llenado(page)).toBeGreaterThan(0.9);
  await expect(page.getByTestId("flecha-abajo")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("flecha-arriba")).toHaveCSS("opacity", "0");

  // Cerca del punto de inicio: quieto, anillo vacío, las dos flechas tenues.
  await gestos.mover({ x: dedo.x, y: g.centro.y + 20 + 3 });
  await expect(raiz(page)).toHaveAttribute("data-direccion", "quieto");
  await expect.poll(() => llenado(page)).toBe(0);

  // Pulgar arriba del inicio, a media distancia: flecha ↑ y el anillo a medias.
  dedo = { x: dedo.x, y: g.centro.y + 20 - 45 };
  await gestos.mover(dedo);
  await expect(raiz(page)).toHaveAttribute("data-direccion", "arriba");
  await expect(page.getByTestId("flecha-arriba")).toHaveCSS("opacity", "1");
  await expect.poll(() => llenado(page)).toBeGreaterThan(0.1);
  expect(await llenado(page)).toBeLessThan(0.9);

  // El anillo no ocupa ancho fuera de la columna del ancla.
  const caja = (await guia.boundingBox())!;
  const ancho = page.viewportSize()!.width;
  expect(caja.x).toBeGreaterThanOrEqual(ancho - COLUMNA - 0.5);
  expect(caja.x + caja.width).toBeLessThanOrEqual(ancho + 0.5);

  // Al soltar vuelve el ícono de la sección y no queda rastro del indicador.
  await gestos.soltar(dedo);
  await expect(guia).toHaveCount(0);
  await expect(page.getByTestId("flecha-arriba")).toHaveCount(0);
  await expect(raiz(page)).not.toHaveAttribute("data-direccion", /.*/);
});

for (const mano of ["right", "left"] as const) {
  test(`arriba (mano ${mano === "right" ? "derecha" : "izquierda"}): la cápsula queda sobre el alcance del pulgar, corrida hacia el centro y dentro de la columna`, async ({
    page,
  }) => {
    await conPreferencias(page, { mano, guiaDesplazar: "arriba" });
    await page.goto("/negocio/carta");
    const g = await leerGeometria(page);
    const gestos = await crearGestos(page);

    const dedo = await desplazarA(page, gestos, g.centro, 60);
    const guia = page.getByTestId("guia-desplazar");
    await expect(guia).toHaveAttribute("data-variante", "arriba");
    await expect(page.getByTestId("flecha-abajo")).toHaveCount(0); // el ancla conserva su ícono

    const caja = (await guia.boundingBox())!;
    const origenY = g.centro.y + 20;
    // Nada bajo el dedo: el borde de abajo, por encima de lo más alto que llega el pulgar.
    const alcance = Math.min(g.centro.y - D_ACTIVO / 2, origenY - R_MAX);
    expect(caja.y + caja.height).toBeLessThanOrEqual(alcance - GUIA_SEPARACION + 0.5);
    // Corrida hacia el centro de la pantalla.
    const centroX = caja.x + caja.width / 2;
    expect(centroX).toBeCloseTo(g.centro.x + (mano === "right" ? -1 : 1) * GUIA_CORRIMIENTO, 0);
    // Dentro de la columna del ancla: no le quita ancho a la lista.
    const ancho = page.viewportSize()!.width;
    if (mano === "right") expect(caja.x).toBeGreaterThanOrEqual(ancho - COLUMNA - 0.5);
    else expect(caja.x + caja.width).toBeLessThanOrEqual(COLUMNA + 0.5);

    // Y sigue desplazando igual.
    await page.waitForTimeout(300);
    await gestos.soltar(dedo);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(guia).toHaveCount(0);
  });
}

test("Ajustes: el selector aparece con algún desplazamiento activado (listas o mapa) y recuerda la variante", async ({ page }) => {
  await page.goto("/ajustes");
  const arriba = page.getByRole("radio", { name: "Arriba" });
  const enAncla = page.getByRole("radio", { name: "En el ancla" });
  await expect(enAncla).toBeChecked(); // por defecto
  await arriba.check({ force: true });
  await expect(arriba).toBeChecked();

  await page.getByTestId("interruptor-desplazar").uncheck();
  await expect(arriba).toBeVisible(); // sigue: el mapa también la usa (HM-11)
  await page.getByTestId("interruptor-mover-mapa").uncheck();
  await expect(arriba).toHaveCount(0);
  await page.getByTestId("interruptor-mover-mapa").check();
  await expect(page.getByRole("radio", { name: "Arriba" })).toBeChecked();

  await page.reload();
  await expect(page.getByRole("radio", { name: "Arriba" })).toBeChecked();
});
