import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria, type GeometriaAncla } from "./helpers/ancla";
import { crearGestos, type Gestos } from "./helpers/gestos";

// HM-15: el centrado (imán de la mira y foco de las listas) tiene espera y duración, se
// ajustan en Ajustes y es instantáneo con movimiento reducido.

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

function conPreferencias(page: Page, prefs: Record<string, unknown>) {
  return page.addInitScript((p) => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify(p)), prefs);
}

/** Mapa con Arepas Doña Rosa corrida ~16 px de la mira (dentro del imán). Devuelve cuánto le falta al pin. */
async function mapaConPinCerca(page: Page) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar({ x: 80, y: 200 }, { x: 92, y: 210 }, { pasos: 6, ms: 80 });
  const falta = async () => {
    const lienzo = page.getByTestId("mapa-lienzo");
    const [x, y, z] = await Promise.all(["data-offset-x", "data-offset-y", "data-zoom"].map((a) => lienzo.getAttribute(a)));
    const m = await page.evaluate(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
    return Math.hypot(Number(x) + 1000 * Number(z) - m.x, Number(y) + 1000 * Number(z) - m.y);
  };
  expect(await falta()).toBeGreaterThan(8);
  return { g, gestos, falta };
}

async function entrarQuieto(page: Page, gestos: Gestos, g: GeometriaAncla) {
  await gestos.presionar(g.centro);
  const origen = { x: g.centro.x, y: g.centro.y + 20 };
  await gestos.mover(origen);
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  return origen;
}

test("Ajustes: dos deslizadores en milisegundos, con los valores de inicio", async ({ page }) => {
  await page.goto("/ajustes");
  await expect(page.getByTestId("valor-espera-centrado")).toHaveText("0 ms");
  await expect(page.getByTestId("valor-duracion-centrado")).toHaveText("100 ms");
  await expect(page.getByTestId("slider-espera-centrado")).toHaveAttribute("max", "500");
  await expect(page.getByTestId("slider-duracion-centrado")).toHaveAttribute("max", "600");
});

test("Ajustes: mover los deslizadores cambia el valor visible y se guarda", async ({ page, browserName }) => {
  // Igual que el deslizador de altura (humo.spec.ts): en WebKit, fill() de un range no dispara onChange de React.
  test.skip(browserName === "webkit", "WebKit: fill() en input range no dispara el cambio en React");
  await page.goto("/ajustes");
  // Si se mueve antes de la hidratación, React no se entera: se repite hasta que responde.
  await expect(async () => {
    await page.getByTestId("slider-espera-centrado").fill("250");
    await page.getByTestId("slider-duracion-centrado").fill("400");
    await expect(page.getByTestId("valor-espera-centrado")).toHaveText("250 ms", { timeout: 500 });
    await expect(page.getByTestId("valor-duracion-centrado")).toHaveText("400 ms", { timeout: 500 });
  }).toPass({ timeout: 10000 });
  await page.reload();
  await expect(page.getByTestId("valor-espera-centrado")).toHaveText("250 ms");
  await expect(page.getByTestId("valor-duracion-centrado")).toHaveText("400 ms");
  await page.getByRole("button", { name: "Volver al valor inicial (100 ms)" }).click();
  await expect(page.getByTestId("valor-duracion-centrado")).toHaveText("100 ms");
});

test("mapa: con los valores de inicio el pin se centra en la mira", async ({ page }) => {
  // La duración exacta la prueban las pruebas del núcleo (hm15-centrado.test.ts), que no dependen
  // de la carga de la máquina; aquí basta con que se centre.
  const { g, gestos, falta } = await mapaConPinCerca(page);
  const origen = await entrarQuieto(page, gestos, g);
  await expect(page.getByTestId("ancla")).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
  await expect.poll(falta, { timeout: 5000 }).toBeLessThan(1.5);
  await gestos.soltar(origen);
});

test("mapa: la espera retrasa el imán (nada se mueve antes) y después centra", async ({ page }) => {
  await conPreferencias(page, { tEsperaCentrado: 500 });
  const { g, gestos, falta } = await mapaConPinCerca(page);
  const antes = await falta();
  const origen = await entrarQuieto(page, gestos, g);
  await expect(page.getByTestId("ancla")).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
  // Todavía esperando: muestras SOLO en los primeros 300 ms desde que se ve el pin apuntado (la
  // espera es de 500). Con tiempo fijo, una máquina cargada podía comprobar cuando ya había empezado.
  const desde = Date.now();
  while (Date.now() - desde < 300) {
    const f = await falta();
    if (Date.now() - desde < 300) expect(Math.abs(f - antes)).toBeLessThan(0.5);
  }
  await expect.poll(falta, { timeout: 5000 }).toBeLessThan(1.5);
  await gestos.soltar(origen);
});

test("listas: una duración larga hace el centrado del foco más lento; con la de inicio es rápido", async ({ page }) => {
  await conPreferencias(page, { tCentrado: 600 });
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "favoritos"), { pasos: 8, ms: 150 });
  const hoja = page.getByRole("dialog", { name: "Favoritos" });
  await expect(hoja).toBeVisible();
  const capa = await leerGeometria(page);
  const origen = await entrarQuieto(page, gestos, capa);
  // A mitad de la lista, para que el foco se pueda centrar (no en un extremo).
  await gestos.mover({ x: origen.x, y: origen.y + 60 });
  await expect.poll(() => hoja.getByTestId("hoja-contenido").evaluate((el) => el.scrollTop), { timeout: 5000 }).toBeGreaterThan(80);
  const p = { x: origen.x - 50, y: origen.y };
  await gestos.mover(p);
  const franja = page.getByTestId("franja-foco");
  await expect(franja).toBeVisible();
  const desfase = async () => {
    const f = (await franja.boundingBox())!;
    const e = (await hoja.locator("[data-ba-foco]").boundingBox())!;
    return Math.abs(f.y + f.height / 2 - (e.y + e.height / 2));
  };
  await gestos.mover({ x: p.x, y: p.y + 3 * 28 + 4 }); // tres filas más abajo: lejos de la franja
  await expect.poll(async () => hoja.locator("[data-ba-foco]").count()).toBe(1);
  await page.waitForTimeout(100);
  expect(await desfase()).toBeGreaterThan(3); // con 600 ms, a los 100 ms todavía no llega
  await expect.poll(desfase, { timeout: 5000 }).toBeLessThan(3);
  await gestos.soltar({ x: p.x, y: p.y + 3 * 28 + 4 });
});

test("movimiento reducido: el centrado es instantáneo aunque la duración sea larga", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await conPreferencias(page, { tCentrado: 600 });
  const { g, gestos, falta } = await mapaConPinCerca(page);
  const origen = await entrarQuieto(page, gestos, g);
  await expect(page.getByTestId("ancla")).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
  // Con 600 ms y salida suave tardaría más de medio segundo; con movimiento reducido, un cuadro.
  await expect.poll(falta, { timeout: 400, intervals: [50] }).toBeLessThan(1.5);
  await gestos.soltar(origen);
});
