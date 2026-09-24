import { expect, test, type Locator, type Page } from "@playwright/test";
import { crearGestos } from "./helpers/gestos";

// T-14: pruebas de humo de la infraestructura E2E y de lo construido en T-12/T-13.
// Corren en los dos proyectos (pixel-7 con toques reales; iphone-14 con eventos sintéticos).

async function centro(l: Locator) {
  const c = await l.boundingBox();
  if (!c) throw new Error("El elemento no está visible");
  return { x: c.x + c.width / 2, y: c.y + c.height / 2 };
}

async function offsetMapa(page: Page) {
  const lienzo = page.getByTestId("mapa-lienzo");
  return { x: Number(await lienzo.getAttribute("data-offset-x")), y: Number(await lienzo.getAttribute("data-offset-y")) };
}

/** Limpia las preferencias guardadas para que cada prueba empiece igual. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem("boton-ancla-demo:v1:prefs");
    } catch {}
  });
});

test("el diagnóstico carga y React hidrata (T-12)", async ({ page }) => {
  await page.goto("/diagnostico");
  await expect(page.getByText("React cargó en este dispositivo")).toBeVisible();
  await expect(page.getByText("sí (", { exact: false })).toBeVisible(); // puntero táctil emulado
});

test("/ redirige al mapa", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/mapa$/);
});

test("arrastrar el mapa con un dedo mueve el lienzo (helper de gestos)", async ({ page }) => {
  await page.goto("/mapa");
  const mapa = page.getByTestId("mapa-falso");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const antes = await offsetMapa(page);
  const gestos = await crearGestos(page);
  const vp = page.viewportSize()!;
  // Arrastre desde un punto sin pines, lejos del ancla.
  const desde = { x: vp.width * 0.3, y: vp.height * 0.3 };
  await gestos.deslizar(desde, { x: desde.x - 120, y: desde.y - 80 }, { pasos: 12, ms: 120 });
  const despues = await offsetMapa(page);
  expect(despues.x - antes.x).toBeCloseTo(-120, -1); // tolerancia de ±5 px
  expect(despues.y - antes.y).toBeCloseTo(-80, -1);
  await expect(mapa).toBeVisible();
});

test("tocar un pin abre la hoja del negocio, por debajo del ancla (RF-14)", async ({ page }) => {
  await page.goto("/mapa");
  // El pin ya se ve en el HTML del servidor, pero su onClick existe recién cuando React hidrata.
  // data-offset-x lo pone un efecto del mapa: si está, la página ya está hidratada.
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  await page.getByRole("button", { name: "Arepas Doña Rosa" }).tap();
  const hoja = page.getByRole("dialog", { name: "Arepas Doña Rosa" });
  await expect(hoja).toBeVisible();
  const zHoja = await page.getByTestId("hoja-inferior").evaluate((el) => Number(getComputedStyle(el).zIndex));
  const zAncla = await page.getByTestId("vista-previa-ancla").evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(zHoja).toBe(1000);
  expect(zAncla).toBeGreaterThan(zHoja);
  await hoja.getByRole("link", { name: "Ver perfil" }).tap();
  await expect(page).toHaveURL(/\/negocio$/);
});

test("HM-01: el ancla queda al 38 % del alto sobre el borde inferior", async ({ page }) => {
  await page.goto("/mapa");
  const ancla = page.getByTestId("ancla-fantasma");
  await expect(ancla).toBeVisible();
  const { y } = await centro(ancla);
  const alto = page.viewportSize()!.height;
  expect(alto - y).toBeCloseTo(0.38 * alto, 0); // ±0,5 px
});

test("HM-01: deslizar el control de Ajustes sube el ancla (solo deslizando)", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Un <input type=range> nativo no reacciona a PointerEvent sintéticos (L-07).");
  await page.goto("/ajustes");
  const ancla = page.getByTestId("ancla-fantasma");
  await expect(ancla).toBeVisible();
  const antes = (await centro(ancla)).y;

  const slider = page.getByTestId("slider-altura");
  await slider.scrollIntoViewIfNeeded();
  const caja = (await slider.boundingBox())!;
  // El pulgar del control está en 0,38 / 0,60 ≈ 63 % del ancho.
  const desde = { x: caja.x + caja.width * 0.633, y: caja.y + caja.height / 2 };
  const gestos = await crearGestos(page);
  await gestos.deslizar(desde, { x: caja.x + caja.width * 0.9, y: desde.y }, { pasos: 15, ms: 200 });

  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(0.45);
  await expect.poll(async () => (await centro(ancla)).y).toBeLessThan(antes - 30);
});

for (const [ruta, seccion] of [
  ["/mapa", "Mapa"],
  ["/negocio", "Perfil de negocio"],
  ["/negocio/carta", "Carta"],
  ["/producto/arepa-queso", "Detalle de producto"],
  ["/ajustes", "Ajustes"],
  ["/metricas", "Métricas"],
  ["/diagnostico", "Diagnóstico"],
] as const) {
  test(`${ruta} muestra la sección "${seccion}" y el ancla fantasma`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page.getByRole("banner").getByText(seccion, { exact: true })).toBeVisible();
    await expect(page.getByTestId("ancla-fantasma")).toBeVisible();
  });
}
