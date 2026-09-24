import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// T-16: gesto completo (HU-01, HU-02, HU-03, HU-06, HU-13, RF-01…RF-07, HM-02).
// Mapa: Buscar 150° · Mi ubicación 120° · Ofertas cerca 180° · Favoritos 90°.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
  });
  await sinBienvenida(page);
});

async function abrirMapa(page: Page) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  return leerGeometria(page);
}

test("HU-01: presionar, deslizar a Buscar y soltar abre la búsqueda con el campo enfocado; vuelve a reposo al instante", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "buscar"), { pasos: 8, ms: 200 });
  // < 200 ms: la comprobación ocurre justo después de soltar.
  expect(await estadoAncla(page)).toBe("reposo");
  await expect(page.getByRole("dialog", { name: "Buscar" })).toBeVisible();
  await expect(page.getByTestId("campo-busqueda")).toBeFocused();
});

test("HU-02: sin levantar el dedo, pasar de Buscar a Favoritos cambia la preselección, la banda y el ícono del centro", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "buscar", 40));
  await gestos.mover(haciaOpcion(g, "buscar"));
  await expect(page.getByTestId("opcion-buscar")).toHaveAttribute("data-activa", "true");
  await expect(page.getByTestId("banda")).toHaveText("Buscar");

  for (const paso of [100, 110, 120, 125]) {
    // Recorre el arco a radio fijo hasta Favoritos (90°), pasando por Mi ubicación.
    const a = ((150 - (paso - 100) * 2.4) * Math.PI) / 180;
    await gestos.mover({ x: g.centro.x + g.radio * Math.cos(a), y: g.centro.y - g.radio * Math.sin(a) });
  }
  await gestos.mover(haciaOpcion(g, "favoritos"));
  await expect(page.getByTestId("opcion-favoritos")).toHaveAttribute("data-activa", "true");
  await expect(page.getByTestId("opcion-buscar")).not.toHaveAttribute("data-activa", "true");
  await expect(page.getByTestId("banda")).toHaveText("Favoritos");

  // D-09: el centro anticipa el ícono de la opción preseleccionada.
  const trazo = (sel: string) => page.locator(sel).locator("path").first().getAttribute("d");
  expect(await trazo('[data-testid="ancla"]')).toBe(await trazo('[data-testid="opcion-favoritos"]'));

  await gestos.soltar(haciaOpcion(g, "favoritos"));
  await expect(page.getByRole("dialog", { name: "Favoritos" })).toBeVisible();
});

test("HU-03: volver a la zona muerta y soltar no ejecuta nada", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "ofertas-cerca", 50));
  await gestos.mover(haciaOpcion(g, "ofertas-cerca"));
  await expect(page.getByTestId("opcion-ofertas-cerca")).toHaveAttribute("data-activa", "true");
  await gestos.mover(haciaOpcion(g, "ofertas-cerca", 40));
  await gestos.mover({ x: g.centro.x + 3, y: g.centro.y + 2 });
  await expect(page.getByTestId("banda")).toHaveText("Mapa"); // zona muerta → sección (HM-02, D-09)
  await gestos.soltar({ x: g.centro.x + 3, y: g.centro.y + 2 });
  expect(await estadoAncla(page)).toBe("reposo");
  await expect(page.getByTestId("hoja-inferior")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("HU-06: modo experto: un deslizamiento relámpago hacia Buscar lo ejecuta", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "buscar", g.radio + 10), { pasos: 2, ms: 0 });
  await expect(page.getByRole("dialog", { name: "Buscar" })).toBeVisible();
});

test("HU-13: deslizar desde el ancla no mueve el mapa", async ({ page }) => {
  const g = await abrirMapa(page);
  const lienzo = page.getByTestId("mapa-lienzo");
  const antes = [await lienzo.getAttribute("data-offset-x"), await lienzo.getAttribute("data-offset-y")];
  const gestos = await crearGestos(page);
  // Hacia afuera del arco (abajo-izquierda): cancela y el mapa no debe moverse.
  await gestos.deslizar(g.centro, { x: g.centro.x - 120, y: g.centro.y + 90 }, { pasos: 10, ms: 150 });
  expect([await lienzo.getAttribute("data-offset-x"), await lienzo.getAttribute("data-offset-y")]).toEqual(antes);
  expect(await estadoAncla(page)).toBe("reposo");
});

test("HU-13: arrastrar el mapa pasando por encima del ancla no la activa", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const desde = { x: g.centro.x - 150, y: g.centro.y };
  await gestos.presionar(desde);
  for (let i = 1; i <= 12; i++) {
    await gestos.mover({ x: desde.x + (i * 190) / 12, y: desde.y + 2 });
    expect(await estadoAncla(page)).toBe("reposo");
  }
  await gestos.soltar({ x: desde.x + 190, y: desde.y + 2 });
  expect(await estadoAncla(page)).toBe("reposo");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("RF-07: al preseleccionar una irreversible aparece el anillo exterior", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ rol: "dueno" }));
  });
  await page.goto("/producto/arepa-queso");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover(haciaOpcion(g, "eliminar", 50));
  await gestos.mover(haciaOpcion(g, "eliminar"));
  await expect(page.getByTestId("anillo-exterior")).toBeVisible();
  await expect(page.getByTestId("banda")).toHaveText("Eliminar · desliza más allá para confirmar");
  await gestos.soltar(haciaOpcion(g, "eliminar", 40));
});
