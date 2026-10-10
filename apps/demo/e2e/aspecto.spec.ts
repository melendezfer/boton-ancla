import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, leerGeometria } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// Aspecto en reposo (specs/aspecto): RA-02 semitransparente, RA-03 latido,
// RA-04 encendida tras usarla, RA-05 translúcida → recogida al borde sin perder
// el gesto, RA-06 solo su círculo. El reloj de Playwright adelanta los tiempos.

const T_ENCENDIDA = 3000;
const T_RECOGER = 15000;

test.beforeEach(async ({ page }) => {
  await page.clock.install();
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

const aspecto = (page: Page) => page.getByTestId("ancla").getAttribute("data-aspecto");

test("RA-02: en reposo deja ver lo que hay debajo (fondo al 45 % y poco desenfoque)", async ({ page }) => {
  const estilo = await page.getByTestId("ancla").evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fondo: cs.backgroundColor, blur: cs.backdropFilter || cs.getPropertyValue("-webkit-backdrop-filter") };
  });
  expect(estilo.blur).toContain("blur(2px)");
  // color-mix devuelve "color(srgb … / 0.45)" o "rgba(…, 0.45)" según el navegador.
  const m = /(?:\/|,)\s*([\d.]+)\)$/.exec(estilo.fondo);
  const alfa = Number(m?.[1] ?? "1");
  expect(alfa).toBeLessThan(0.5);
});

test("RA-03: late en reposo; con movimiento reducido, no", async ({ page }) => {
  const animacion = () => page.getByTestId("ancla").evaluate((el) => getComputedStyle(el, "::after").animationName);
  expect(await animacion()).toBe("ba-latido");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await animacion()).toBe("none");
});

test("RA-05: translúcida al montar y, sin usarla, se recoge medio escondida al borde", async ({ page }) => {
  expect(await aspecto(page)).toBe("translucida");
  await page.clock.fastForward(T_RECOGER + 50);
  await expect.poll(() => aspecto(page)).toBe("recogida");
  const vp = page.viewportSize()!;
  await expect
    .poll(async () => {
      const caja = (await page.getByTestId("ancla").boundingBox())!;
      return Math.round(caja.x + caja.width / 2);
    })
    .toBeGreaterThanOrEqual(vp.width - 2);
});

test("RA-05: recogida, el gesto funciona desde la mitad visible y el menú se abre donde siempre", async ({ page }) => {
  const antes = await leerGeometria(page);
  await page.clock.fastForward(T_RECOGER + 50);
  await expect.poll(() => aspecto(page)).toBe("recogida");
  // Espera a que termine de correrse (la animación dura 280 ms en tiempo real).
  const vp = page.viewportSize()!;
  await expect
    .poll(async () => {
      const c = (await page.getByTestId("ancla").boundingBox())!;
      return Math.round(c.x + c.width / 2);
    })
    .toBeGreaterThanOrEqual(vp.width - 2);
  const caja = (await page.getByTestId("ancla").boundingBox())!;
  const gestos = await crearGestos(page);
  // La mitad visible: entre el borde izquierdo del círculo corrido y su centro (el borde de la pantalla).
  await tocar(gestos, { x: caja.x + caja.width / 4 + 2, y: antes.centro.y });
  await expect.poll(() => estadoAncla(page)).toBe("abierto_toque");
  const abierto = await leerGeometria(page);
  expect(abierto.centro).toEqual(antes.centro);
});

test("RA-04: tras usarla queda encendida unos segundos y vuelve a translúcida", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await tocar(gestos, g.centro);
  await expect.poll(() => estadoAncla(page)).toBe("abierto_toque");
  await page.keyboard.press("Escape");
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  expect(await aspecto(page)).toBe("encendida");
  await page.clock.fastForward(T_ENCENDIDA + 50);
  await expect.poll(() => aspecto(page)).toBe("translucida");
});

test("RA-06: un toque en la esquina de la caja, fuera del círculo, no la activa", async ({ page }) => {
  const caja = (await page.getByTestId("ancla").boundingBox())!;
  const gestos = await crearGestos(page);
  await tocar(gestos, { x: caja.x + 2, y: caja.y + 2 });
  await page.clock.fastForward(400);
  expect(await estadoAncla(page)).toBe("reposo");
  await expect(page.getByTestId("ancla")).toHaveAttribute("aria-expanded", "false");
});

test("RA-09: deslizarla hacia el borde la guarda (sin abrir ni ejecutar nada); tocarla la saca", async ({ page }) => {
  const g = await leerGeometria(page);
  const vp = page.viewportSize()!;
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, { x: vp.width - 2, y: g.centro.y }, { pasos: 6, ms: 120 });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await expect.poll(() => aspecto(page)).toBe("recogida");
  await expect(page.getByTestId("ancla")).toHaveAttribute("aria-expanded", "false");
  // Sacarla: tocar la mitad visible abre el menú.
  await expect
    .poll(async () => {
      const c = (await page.getByTestId("ancla").boundingBox())!;
      return Math.round(c.x + c.width / 2);
    })
    .toBeGreaterThanOrEqual(vp.width - 2);
  const caja = (await page.getByTestId("ancla").boundingBox())!;
  await tocar(gestos, { x: caja.x + caja.width / 4 + 2, y: g.centro.y });
  await expect.poll(() => estadoAncla(page)).toBe("abierto_toque");
});

test("RA-09: un deslizamiento hacia adentro no la guarda", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, { x: g.centro.x - 60, y: g.centro.y }, { pasos: 6, ms: 120 });
  await page.keyboard.press("Escape");
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  expect(await aspecto(page)).not.toBe("recogida");
});
