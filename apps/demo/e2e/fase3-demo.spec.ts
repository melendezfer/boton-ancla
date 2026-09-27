import { expect, test, type Locator, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos, type Punto } from "./helpers/gestos";

// Fase 3, T3-10 (spec §8, DF3-01, DF3-09): las zonas reales de RUTEANDO en el mapa, "Mover ancla"
// en Ajustes y la colocación guardada por orientación.
const MARGEN_ZONA = 8;
const T_ESPERA = 300;

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

type Caja = { x: number; y: number; width: number; height: number };
const caja = async (l: Locator): Promise<Caja> => (await l.boundingBox())!;
const seTocan = (a: Caja, b: Caja, m = 0) => a.x < b.x + b.width + m && b.x - m < a.x + a.width && a.y < b.y + b.height + m && b.y - m < a.y + a.height;
const centroDe = async (page: Page): Promise<Punto> => {
  const b = await caja(page.getByTestId("ancla"));
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

async function abrirMapa(page: Page) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  await expect(page.getByTestId("credito-osm")).toBeVisible();
}

/** Con el abanico abierto (dedo apoyado), nada de lo que dibuja el ancla toca el crédito. */
async function creditoLibreConAbanico(page: Page) {
  const credito = await caja(page.getByTestId("credito-osm"));
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "buscar", 40));
  await expect.poll(() => estadoAncla(page)).toBe("abierto_gesto");
  const cajas = [await caja(page.getByTestId("ancla"))];
  for (const item of await page.getByRole("menuitem").all()) cajas.push(await caja(item));
  cajas.push(await caja(page.getByTestId("banda")));
  for (const c of cajas) expect(seTocan(c, credito, MARGEN_ZONA - 1), JSON.stringify(c)).toBe(false);
  await gestos.mover(g.centro); // zona muerta: soltar no ejecuta nada
  await gestos.soltar(g.centro);
}

for (const mano of ["right", "left"] as const) {
  test(`mano ${mano === "right" ? "derecha" : "izquierda"}: el crédito de OpenStreetMap nunca queda tapado, en vertical y en horizontal`, async ({ page }) => {
    await page.addInitScript((m) => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ mano: m })), mano);
    await abrirMapa(page);
    await creditoLibreConAbanico(page);
    const vp = page.viewportSize()!;
    await page.setViewportSize({ width: vp.height, height: vp.width });
    await expect(page.locator(".ba-raiz")).toHaveAttribute("data-orientacion", "horizontal");
    await creditoLibreConAbanico(page);
  });
}

test("mover el ancla abajo en Ajustes: en el mapa se corre sobre el crédito, y en Ajustes vuelve a su lugar (la guardada no se borra)", async ({ page }) => {
  const vp = page.viewportSize()!;
  await page.goto("/ajustes");
  const g = await leerGeometria(page);
  // Solo deslizando: "Mover ancla" del abanico, quedarse quieto, llevarla abajo del todo y soltar.
  const sobre = haciaOpcion(g, "mover-ancla");
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(sobre);
  await page.waitForTimeout(T_ESPERA + 150);
  await expect.poll(() => estadoAncla(page)).toBe("editando");
  const abajo = { x: vp.width - 40, y: vp.height - 4 };
  for (let i = 1; i <= 10; i++) await gestos.mover({ x: sobre.x + ((abajo.x - sobre.x) * i) / 10, y: sobre.y + ((abajo.y - sobre.y) * i) / 10 });
  await gestos.soltar(abajo);
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  const enAjustes = await leerGeometria(page);
  expect(enAjustes.centro.y).toBeCloseTo(vp.height - 16 - 32, 0); // el piso: en Ajustes no hay zonas

  await abrirMapa(page);
  const credito = await caja(page.getByTestId("credito-osm"));
  await expect.poll(async () => seTocan(await caja(page.getByTestId("ancla")), credito, MARGEN_ZONA - 1)).toBe(false);
  expect((await leerGeometria(page)).centro.y).toBeLessThan(enAjustes.centro.y); // se corrió hacia arriba

  await page.goto("/ajustes");
  await expect.poll(async () => Math.round((await leerGeometria(page)).centro.y)).toBe(Math.round(enAjustes.centro.y));
  // Y se guarda al recargar.
  await page.reload();
  await expect.poll(async () => Math.round((await leerGeometria(page)).centro.y)).toBe(Math.round(enAjustes.centro.y));
});

test("el botón 'Mover el ancla' de Ajustes: al otro costado cambia la mano, y se guarda", async ({ page }) => {
  await page.goto("/ajustes");
  await expect(page.getByTestId("ancla")).toBeVisible();
  await page.getByTestId("boton-mover-ancla").click();
  await expect.poll(() => estadoAncla(page)).toBe("editando");
  const c = await centroDe(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(c);
  for (let i = 1; i <= 8; i++) await gestos.mover({ x: c.x + ((70 - c.x) * i) / 8, y: c.y });
  await gestos.soltar({ x: 70, y: c.y });
  await expect(page.locator(".ba-raiz")).toHaveAttribute("data-mano", "left");
  await expect(page.getByRole("radio", { name: "Izquierda" })).toBeChecked(); // el selector de mano lo refleja
  await page.reload();
  await expect(page.locator(".ba-raiz")).toHaveAttribute("data-mano", "left");
});

test("lo guardado antes de la Fase 3 (mano y altura) sigue sirviendo", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ mano: "left", anclaAltura: 0.3 })));
  await page.goto("/negocio");
  const vp = page.viewportSize()!;
  const g = await leerGeometria(page);
  expect(g.centro.x).toBeLessThan(vp.width / 2);
  expect(g.centro.y).toBeCloseTo(vp.height - 0.3 * vp.height, 0);
});

test("en horizontal, la altura de Ajustes cambia solo la horizontal", async ({ page, browserName }) => {
  // Como el deslizador de altura de humo.spec.ts: en WebKit, fill() de un range no dispara onChange.
  test.skip(browserName === "webkit", "WebKit: fill() en input range no dispara el cambio en React");
  await page.goto("/ajustes");
  await expect(page.getByTestId("ancla")).toBeVisible();
  const vertical = await leerGeometria(page);
  const vp = page.viewportSize()!;
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await expect(page.getByTestId("orientacion-altura")).toContainText("horizontal");
  await expect(async () => {
    await page.getByTestId("slider-altura").fill("0.1");
    await expect(page.getByTestId("slider-altura")).toHaveValue("0.1", { timeout: 500 });
  }).toPass({ timeout: 10000 });
  await expect.poll(async () => Math.round((await leerGeometria(page)).centro.y)).toBe(Math.round(vp.width - 16 - 32)); // piso
  await page.setViewportSize(vp);
  await expect.poll(async () => Math.round((await leerGeometria(page)).centro.y)).toBe(Math.round(vertical.centro.y));
});
