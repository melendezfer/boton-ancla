import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, leerGeometria, type GeometriaAncla } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// HM-16 (RF-24): imán fuerte en el mapa, con interruptor en Ajustes para comparar con el de HM-12a.
// El detalle numérico (radio, freno que crece) lo prueba el núcleo (hm16-iman-fuerte.test.ts).

const VIB_ENGANCHE_MS = 25;

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
  // Registrar las vibraciones (en WebKit navigator.vibrate no existe: se crea).
  await page.addInitScript(() => {
    const w = window as unknown as { __vib: number[] };
    w.__vib = [];
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: (ms: number) => (w.__vib.push(ms), true) });
  });
});

function conPreferencias(page: Page, prefs: Record<string, unknown>) {
  return page.addInitScript((p) => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify(p)), prefs);
}

const vibraciones = (page: Page) => page.evaluate(() => (window as unknown as { __vib: number[] }).__vib);

/** Mapa con Arepas Doña Rosa corrida (dx, dy) de la mira, arrastrando con el dedo lejos del ancla. */
async function mapaConPinCorrido(page: Page, dx: number, dy: number) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  const desde = { x: 120, y: 200 };
  await gestos.deslizar(desde, { x: desde.x + dx, y: desde.y + dy }, { pasos: 8, ms: 100 });
  await page.waitForTimeout(50);
  return { g, gestos };
}

/** Distancia del pin a la mira, calculada en la página. */
const distanciaPin = (page: Page) =>
  page.evaluate(() => {
    const l = document.querySelector<HTMLElement>("[data-testid=mapa-lienzo]")!;
    const z = Number(l.dataset.zoom);
    return Math.hypot(Number(l.dataset.offsetX) + 1000 * z - window.innerWidth / 2, Number(l.dataset.offsetY) + 1000 * z - window.innerHeight / 2);
  });

/** Guarda, cuadro a cuadro y dentro de la página, la menor distancia del pin a la mira. */
const empezarAMedir = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __min: number; __medir: boolean };
    w.__min = Infinity;
    w.__medir = true;
    const l = document.querySelector<HTMLElement>("[data-testid=mapa-lienzo]")!;
    const cuadro = () => {
      const z = Number(l.dataset.zoom);
      const d = Math.hypot(Number(l.dataset.offsetX) + 1000 * z - window.innerWidth / 2, Number(l.dataset.offsetY) + 1000 * z - window.innerHeight / 2);
      w.__min = Math.min(w.__min, d);
      if (w.__medir) requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  });
const terminarDeMedir = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __min: number; __medir: boolean };
    w.__medir = false;
    return w.__min;
  });

async function entrar(page: Page, gestos: Gestos, g: GeometriaAncla): Promise<Punto> {
  await gestos.presionar(g.centro);
  const origen = { x: g.centro.x, y: g.centro.y + 20 };
  await gestos.mover(origen);
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  return origen;
}

/**
 * El pin queda 60 px a la izquierda y 25 px abajo de la mira; el pulgar empuja a la izquierda
 * (la vista va a la izquierda, el pin viene hacia la mira) y NO se detiene: pasa a 25 px de la mira.
 */
async function pasarCercaEnMovimiento(page: Page) {
  const { g, gestos } = await mapaConPinCorrido(page, -60, 25);
  expect(await distanciaPin(page)).toBeGreaterThan(60);
  const origen = await entrar(page, gestos, g);
  await expect(page.getByTestId("ancla")).not.toHaveAttribute("data-apuntado", /.*/);
  await empezarAMedir(page);
  const empuje = { x: origen.x - 30, y: origen.y };
  await gestos.mover({ x: origen.x - 15, y: origen.y });
  await gestos.mover(empuje);
  // Hasta que el pin pase de largo (queda a la derecha de la mira, lejos).
  await expect.poll(() => page.evaluate(() => {
    const l = document.querySelector<HTMLElement>("[data-testid=mapa-lienzo]")!;
    return Number(l.dataset.offsetX) + 1000 * Number(l.dataset.zoom) - window.innerWidth / 2;
  }), { timeout: 15000 }).toBeGreaterThan(50);
  const minimo = await terminarDeMedir(page);
  await gestos.mover(origen); // zona muerta: soltar no elige nada lejos
  await gestos.soltar(origen);
  return minimo;
}

test("Ajustes: el interruptor 'Imán fuerte' está activado por defecto y se guarda", async ({ page }) => {
  await page.goto("/ajustes");
  const interruptor = page.getByTestId("interruptor-iman-fuerte");
  await expect(interruptor).toBeChecked();
  await interruptor.click();
  await expect(interruptor).not.toBeChecked();
  await page.reload();
  await expect(page.getByTestId("interruptor-iman-fuerte")).not.toBeChecked();
});

test("con 'Apuntar y elegir' apagado, el interruptor del imán no se muestra", async ({ page }) => {
  await conPreferencias(page, { apuntar: false });
  await page.goto("/ajustes");
  await expect(page.getByTestId("interruptor-apuntar")).not.toBeChecked();
  await expect(page.getByTestId("interruptor-iman-fuerte")).toHaveCount(0);
});

test("radio mayor: un pin a ~36 px de la mira se apunta con el imán fuerte y no con el normal", async ({ page }) => {
  for (const [fuerte, apunta] of [
    [true, true],
    [false, false],
  ] as const) {
    await conPreferencias(page, { imanFuerte: fuerte });
    const { g, gestos } = await mapaConPinCorrido(page, 30, 20);
    const d = await distanciaPin(page);
    expect(d).toBeGreaterThan(30);
    expect(d).toBeLessThan(42);
    const origen = await entrar(page, gestos, g);
    await expect(page.getByTestId("mira")).toHaveAttribute("data-iman", fuerte ? "fuerte" : "normal");
    if (apunta) {
      await expect(page.getByTestId("ancla")).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
      await expect.poll(() => distanciaPin(page), { timeout: 5000 }).toBeLessThan(1.5);
    } else {
      await page.waitForTimeout(300);
      await expect(page.getByTestId("ancla")).not.toHaveAttribute("data-apuntado", /.*/);
    }
    await gestos.soltar(origen);
    await expect.poll(() => estadoAncla(page)).not.toBe("desplazando");
  }
});

test("enganche inmediato: con el pulgar EN MOVIMIENTO, el pin salta a la mira al entrar al radio y vibra", async ({ page }) => {
  const minimo = await pasarCercaEnMovimiento(page);
  expect(minimo).toBeLessThan(6); // pasó por la mira: se enganchó aunque el pulgar no se detuvo
  await expect(page.getByTestId("mira")).toHaveCount(0);
  expect(await vibraciones(page)).toContain(VIB_ENGANCHE_MS);
});

test("imán normal (para comparar): con el pulgar en movimiento el pin pasa de largo, sin engancharse", async ({ page }) => {
  await conPreferencias(page, { imanFuerte: false });
  const minimo = await pasarCercaEnMovimiento(page);
  expect(minimo).toBeGreaterThan(15); // pasó a ~25 px: el imán normal solo actúa con el pulgar quieto
  expect(await vibraciones(page)).not.toContain(VIB_ENGANCHE_MS);
});

test("el enganche es una vez por pin: moverse después lo saca, y no vuelve a engancharlo solo", async ({ page }) => {
  const { g, gestos } = await mapaConPinCorrido(page, 30, 20);
  const origen = await entrar(page, gestos, g);
  const mira = page.getByTestId("mira");
  await expect(mira).toHaveAttribute("data-enganches", "1");
  await expect.poll(() => distanciaPin(page), { timeout: 5000 }).toBeLessThan(1.5);
  // Empujar el pulgar: el pin se aleja (frenado) hasta salir del radio.
  await gestos.mover({ x: origen.x - 40, y: origen.y });
  await expect.poll(() => distanciaPin(page), { timeout: 15000 }).toBeGreaterThan(20);
  expect(await mira.getAttribute("data-enganches")).toBe("1");
  await gestos.mover(origen);
  await gestos.soltar(origen);
});
