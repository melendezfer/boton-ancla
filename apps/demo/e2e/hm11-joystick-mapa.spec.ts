import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria, type GeometriaAncla } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// HM-11 (experimental): joystick libre en el mapa (spec RF-19, HU-13 ajustada).
const D_ACTIVO = 64;
const R_MAX = 72;
const GUIA_SEPARACION = 24;

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

function conPreferencias(page: Page, prefs: Record<string, unknown>) {
  return page.addInitScript((p) => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify(p)), prefs);
}

async function abrirMapa(page: Page) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  return leerGeometria(page);
}

async function offset(page: Page) {
  const lienzo = page.getByTestId("mapa-lienzo");
  return { x: Number(await lienzo.getAttribute("data-offset-x")), y: Number(await lienzo.getAttribute("data-offset-y")) };
}

/** Entra al joystick (primer movimiento hacia abajo) y devuelve el punto de inicio. */
async function entrar(page: Page, gestos: Gestos, g: GeometriaAncla): Promise<Punto> {
  await gestos.presionar(g.centro);
  const origen = { x: g.centro.x, y: g.centro.y + 20 };
  await gestos.mover(origen);
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  return origen;
}

const giro = (page: Page) => page.locator(".ba-raiz").evaluate((el) => getComputedStyle(el).getPropertyValue("--ba-giro").trim());

test("mueve el mapa hacia donde apunta el pulgar, con la flecha girada, y se detiene en seco al soltar", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  await expect(page.getByTestId("guia-desplazar")).toHaveAttribute("data-modo", "libre");
  await expect(page.getByTestId("flecha-libre")).toBeVisible();

  // Pulgar a la IZQUIERDA del inicio: la vista va a la izquierda (el lienzo se corre a la derecha).
  let antes = await offset(page);
  await gestos.mover({ x: origen.x - 60, y: origen.y });
  await expect(page.locator(".ba-raiz")).toHaveAttribute("data-direccion", "libre");
  await expect.poll(() => giro(page)).toBe("-90deg");
  await expect.poll(async () => (await offset(page)).x - antes.x, { timeout: 5000 }).toBeGreaterThan(40);
  expect(Math.abs((await offset(page)).y - antes.y)).toBeLessThan(3); // sin deriva vertical

  // Pulgar ARRIBA del inicio: la vista sube (el lienzo baja).
  antes = await offset(page);
  await gestos.mover({ x: origen.x, y: origen.y - 60 });
  await expect.poll(() => giro(page)).toBe("0deg");
  await expect.poll(async () => (await offset(page)).y - antes.y, { timeout: 5000 }).toBeGreaterThan(40);

  // Soltar: parada en seco, sin inercia, y sin abrir nada debajo del dedo.
  await gestos.soltar({ x: origen.x, y: origen.y - 60 });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  const quieto = await offset(page);
  await page.waitForTimeout(300);
  expect(await offset(page)).toEqual(quieto);
  await expect(page.getByTestId("guia-desplazar")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".ba-raiz")).not.toHaveAttribute("data-direccion", /.*/);
});

test("cerca del inicio (zona muerta) el mapa no se mueve", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  await gestos.mover({ x: origen.x + 4, y: origen.y - 4 });
  const antes = await offset(page);
  await page.waitForTimeout(400);
  expect(await offset(page)).toEqual(antes);
  await expect(page.locator(".ba-raiz")).toHaveAttribute("data-direccion", "quieto");
  await gestos.soltar({ x: origen.x + 4, y: origen.y - 4 });
});

test("variante 'arriba': un círculo sobre el alcance del pulgar, con el punto que lo sigue en 2D", async ({ page }) => {
  await conPreferencias(page, { guiaDesplazar: "arriba" });
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  const guia = page.getByTestId("guia-desplazar");
  await expect(guia).toHaveAttribute("data-variante", "arriba");
  await expect(guia).toHaveAttribute("data-modo", "libre");

  const caja = (await guia.boundingBox())!;
  expect(Math.abs(caja.width - caja.height)).toBeLessThan(1); // es un círculo
  const alcance = Math.min(g.centro.y - D_ACTIVO / 2, origen.y - R_MAX);
  expect(caja.y + caja.height).toBeLessThanOrEqual(alcance - GUIA_SEPARACION + 0.5); // nada bajo el dedo

  // El punto sigue al pulgar: a la izquierda y abajo.
  const punto = guia.locator(".ba-guia-punto");
  const centroPunto = async () => {
    const b = (await punto.boundingBox())!;
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const quieto = await centroPunto();
  await gestos.mover({ x: origen.x - 50, y: origen.y + 30 });
  await expect.poll(async () => quieto.x - (await centroPunto()).x).toBeGreaterThan(10);
  expect((await centroPunto()).y).toBeGreaterThan(quieto.y);
  await gestos.soltar({ x: origen.x - 50, y: origen.y + 30 });
  await expect(guia).toHaveCount(0);
});

test("no choca con el dedo: arrastrar el mapa y tocar un pin siguen igual con el joystick activado", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);

  // Arrastrar el mapa con el dedo (lejos del ancla).
  const antes = await offset(page);
  const desde = { x: g.centro.x - 200, y: g.centro.y - 150 };
  await gestos.deslizar(desde, { x: desde.x + 80, y: desde.y + 60 }, { pasos: 8, ms: 120 });
  await expect.poll(async () => (await offset(page)).x - antes.x).toBeGreaterThan(60);
  expect(await estadoAncla(page)).toBe("reposo");

  // Usar el joystick y después tocar un pin: abre su resumen como siempre.
  const origen = await entrar(page, gestos, g);
  await gestos.mover({ x: origen.x - 40, y: origen.y });
  await page.waitForTimeout(200);
  await gestos.soltar({ x: origen.x - 40, y: origen.y });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.waitForTimeout(750); // pasa la ventana en la que el ancla ignora el clic que sigue al soltar
  await page.getByRole("button", { name: "Arepas Doña Rosa" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("HM-03: con el resumen de un pin (capa sin lista) encima del mapa, no hay joystick y el mapa no se mueve", async ({ page }) => {
  await abrirMapa(page);
  await page.getByRole("button", { name: "Arepas Doña Rosa" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  const antes = await offset(page);
  await gestos.presionar(g.centro);
  await gestos.mover({ x: g.centro.x, y: g.centro.y + 30 });
  await gestos.mover({ x: g.centro.x - 40, y: g.centro.y + 60 });
  await page.waitForTimeout(300);
  expect(await estadoAncla(page)).not.toBe("desplazando");
  expect(await offset(page)).toEqual(antes);
  await gestos.soltar({ x: g.centro.x - 40, y: g.centro.y + 60 });
  await expect(page.getByRole("dialog")).toBeVisible(); // la capa sigue abierta
});

// Las opciones del abanico del mapa (spec §8).
for (const id of ["buscar", "mi-ubicacion", "ofertas-cerca", "favoritos"]) {
  test(`modo experto (D-08, C-05): un deslizamiento rápido a '${id}' la ejecuta y nunca pasa por el joystick`, async ({ page }) => {
    const geo = await abrirMapa(page);
    expect(geo.slots.map((s) => s.id)).toContain(id);
    // Registrar cada estado por el que pasa el ancla.
    await page.evaluate(() => {
      const raiz = document.querySelector(".ba-raiz")!;
      const w = window as unknown as { __estados: string[] };
      w.__estados = [];
      new MutationObserver(() => w.__estados.push(raiz.getAttribute("data-estado") ?? "")).observe(raiz, {
        attributes: true,
        attributeFilter: ["data-estado"],
      });
    });
    const gestos = await crearGestos(page);
    for (const [pasos, ms] of [
      [2, 0], // relámpago
      [3, 40], // rápido
    ] as const) {
      await gestos.deslizar(geo.centro, haciaOpcion(geo, id, geo.radio + 10), { pasos, ms });
      await expect.poll(() => estadoAncla(page)).toBe("reposo");
      const estados = await page.evaluate(() => (window as unknown as { __estados: string[] }).__estados);
      expect(estados, `${id} (${pasos} pasos)`).not.toContain("desplazando");
      expect(estados.some((e) => e === "ejecutando" || e === "abierto_gesto"), `${id}: debió ejecutarse`).toBe(true);
      if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });
}

test("la métrica scroll_start dice que fue 'mover el mapa'", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  await gestos.soltar(origen);
  await page.goto("/metricas");
  await expect(page.getByText(/mover el mapa · /).first()).toBeVisible();
});
