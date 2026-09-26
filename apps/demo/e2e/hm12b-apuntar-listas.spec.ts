import { expect, test, type Locator, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria, type GeometriaAncla } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// HM-12b (RF-23): apuntar y elegir en listas. Todo solo deslizando (D-15), salvo el caso que
// comprueba que tocar una fila con el dedo sigue funcionando.
const PASO = 28; // PASO_APUNTAR
const HACIA_CENTRO = 50; // > UMBRAL_APUNTAR (32)

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

function conPreferencias(page: Page, prefs: Record<string, unknown>) {
  return page.addInitScript((p) => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify(p)), prefs);
}

async function abrirDesdeMapa(page: Page, opcion: string, nombre: string) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, opcion), { pasos: 8, ms: 150 });
  const hoja = page.getByRole("dialog", { name: nombre });
  await expect(hoja).toBeVisible();
  return { gestos, hoja };
}

/** Entra al joystick y, si `apuntar`, lleva el pulgar hacia el centro de la pantalla. Devuelve el punto actual. */
async function entrar(page: Page, gestos: Gestos, g: GeometriaAncla, opciones: { apuntar?: boolean; bajar?: number } = {}): Promise<Punto> {
  await gestos.presionar(g.centro);
  let p = { x: g.centro.x, y: g.centro.y + 20 };
  await gestos.mover(p);
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  if (opciones.bajar) {
    p = { x: p.x, y: p.y + opciones.bajar };
    await gestos.mover(p);
  }
  if (opciones.apuntar) {
    const signo = (await page.locator(".ba-raiz").getAttribute("data-mano")) === "left" ? 1 : -1;
    p = { x: p.x + signo * HACIA_CENTRO, y: p.y };
    await gestos.mover(p);
    await expect(page.getByTestId("franja-foco")).toBeVisible();
  }
  return p;
}

const foco = (donde: Locator) => donde.locator("[data-ba-foco]");
const centroY = async (l: Locator) => {
  const b = (await l.boundingBox())!;
  return b.y + b.height / 2;
};
const filas = (donde: Locator) => donde.locator("[data-fila]");
async function indiceEnFoco(donde: Locator) {
  const id = await foco(donde).getAttribute("data-fila");
  return (await filas(donde).evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.fila))).indexOf(id!);
}

test("Favoritos: hacia el centro aparece la franja; el foco queda centrado en ella y el ancla se enciende", async ({ page }) => {
  const { gestos, hoja } = await abrirDesdeMapa(page, "favoritos", "Favoritos");
  const g = await leerGeometria(page);
  const lista0 = hoja.getByTestId("hoja-contenido");
  let p = await entrar(page, gestos, g, { bajar: 60 }); // a mitad de la lista (no en un extremo)
  await expect.poll(() => lista0.evaluate((el) => el.scrollTop), { timeout: 5000 }).toBeGreaterThan(80);
  await gestos.mover({ x: p.x, y: p.y - 60 }); // quieto
  p = { x: p.x - HACIA_CENTRO, y: p.y - 60 };
  await gestos.mover(p);
  await expect(page.getByTestId("franja-foco")).toBeVisible();
  await expect(foco(hoja)).toHaveCount(1);
  const id = await foco(hoja).getAttribute("data-fila");
  await expect(page.getByTestId("ancla")).toHaveAttribute("data-apuntado", id!);
  // La lista se desliza hasta centrar el elemento en la franja (centro de la parte visible de la lista).
  await expect.poll(async () => Math.abs((await centroY(foco(hoja))) - (await centroY(page.getByTestId("franja-foco")))), { timeout: 5000 }).toBeLessThan(3);
  const lista = hoja.getByTestId("hoja-contenido");
  const b = (await lista.boundingBox())!;
  expect(Math.abs((await centroY(page.getByTestId("franja-foco"))) - (b.y + b.height / 2))).toBeLessThan(3);
});

test("en un extremo de la lista (el principio), la franja va hasta el elemento: el primero también se puede elegir", async ({ page }) => {
  const { gestos, hoja } = await abrirDesdeMapa(page, "favoritos", "Favoritos");
  const g = await leerGeometria(page);
  const p = await entrar(page, gestos, g, { apuntar: true }); // la lista está al principio
  await gestos.mover({ x: p.x, y: p.y - 8 * PASO - 4 }); // muchos pasos hacia arriba: se queda en el primero
  await expect.poll(() => indiceEnFoco(hoja)).toBe(0);
  await expect.poll(async () => Math.abs((await centroY(foco(hoja))) - (await centroY(page.getByTestId("franja-foco")))), { timeout: 5000 }).toBeLessThan(3);
  const primero = await foco(hoja).getAttribute("data-etiqueta");
  await gestos.soltar({ x: p.x, y: p.y - 8 * PASO - 4 });
  await expect(page.getByRole("dialog", { name: primero! })).toBeVisible();
});

test("Favoritos: subir y bajar salta de uno en uno; soltar elige y 'Cerrar' vuelve a la lista en la misma posición", async ({ page }) => {
  const { gestos, hoja } = await abrirDesdeMapa(page, "favoritos", "Favoritos");
  const lista = hoja.getByTestId("hoja-contenido");
  const g = await leerGeometria(page);
  // Primero desplazar un poco (la lista no está al principio), después apuntar.
  let p = await entrar(page, gestos, g, { bajar: 60 });
  await expect.poll(() => lista.evaluate((el) => el.scrollTop), { timeout: 5000 }).toBeGreaterThan(40);
  p = { x: p.x - HACIA_CENTRO, y: p.y };
  await gestos.mover(p);
  await expect(page.getByTestId("franja-foco")).toBeVisible();
  const inicio = await indiceEnFoco(hoja);

  // Dos pasos hacia abajo: dos elementos más allá. Uno hacia arriba: vuelve uno.
  await gestos.mover({ x: p.x, y: p.y + 2 * PASO + 4 });
  await expect.poll(() => indiceEnFoco(hoja)).toBe(inicio + 2);
  await gestos.mover({ x: p.x, y: p.y + PASO + 4 });
  await expect.poll(() => indiceEnFoco(hoja)).toBe(inicio + 1);
  const nombre = await foco(hoja).getAttribute("data-etiqueta");
  await expect.poll(async () => Math.abs((await centroY(foco(hoja))) - (await centroY(page.getByTestId("franja-foco")))), { timeout: 5000 }).toBeLessThan(3);
  const posicion = await lista.evaluate((el) => el.scrollTop);

  await gestos.soltar({ x: p.x, y: p.y + PASO + 4 });
  const encima = page.getByRole("dialog", { name: nombre! });
  await expect(encima).toBeVisible();
  await expect(hoja).toBeHidden(); // la lista sigue debajo, oculta

  // "Cerrar" (solo deslizando) quita la capa del negocio y la lista vuelve donde estaba.
  const enCapa = await leerGeometria(page);
  await gestos.deslizar(enCapa.centro, haciaOpcion(enCapa, "cerrar"), { pasos: 8, ms: 150 });
  await expect(encima).toHaveCount(0);
  await expect(hoja).toBeVisible();
  expect(await lista.evaluate((el) => el.scrollTop)).toBe(posicion);
  await expect(foco(hoja)).toHaveCount(0);
});

test("volver hacia el centro del ancla regresa a desplazar: sin franja ni foco, y soltar no elige", async ({ page }) => {
  const { gestos, hoja } = await abrirDesdeMapa(page, "favoritos", "Favoritos");
  const g = await leerGeometria(page);
  const p = await entrar(page, gestos, g, { apuntar: true });
  await expect(foco(hoja)).toHaveCount(1);
  const vuelta = { x: p.x + HACIA_CENTRO - 5, y: p.y }; // a 5 px del inicio: bajo UMBRAL − HISTERESIS
  await gestos.mover(vuelta);
  await expect(page.getByTestId("franja-foco")).toHaveCount(0);
  await expect(foco(hoja)).toHaveCount(0);
  await expect(page.getByTestId("ancla")).not.toHaveAttribute("data-apuntado", /.*/);
  await gestos.soltar(vuelta);
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await expect(page.getByRole("dialog")).toHaveCount(1); // solo Favoritos
});

test("tocar una fila con el dedo sigue funcionando: abre su negocio encima y la X vuelve a la lista", async ({ page }) => {
  const { hoja } = await abrirDesdeMapa(page, "favoritos", "Favoritos");
  const fila = filas(hoja).nth(2);
  const nombre = await fila.getAttribute("data-etiqueta");
  await fila.getByRole("button").click();
  const encima = page.getByRole("dialog", { name: nombre! });
  await expect(encima).toBeVisible();
  await encima.getByRole("button", { name: "Cerrar" }).click();
  await expect(encima).toHaveCount(0);
  await expect(hoja).toBeVisible();
});

test("Ofertas: elegir una oferta abre su negocio encima de la lista", async ({ page }) => {
  const { gestos, hoja } = await abrirDesdeMapa(page, "ofertas-cerca", "Ofertas cerca");
  const g = await leerGeometria(page);
  const p = await entrar(page, gestos, g, { apuntar: true });
  const oferta = await foco(hoja).getAttribute("data-fila");
  const negocio = await page.evaluate((id) => {
    const fila = document.querySelector(`[data-fila="${id}"]`);
    return fila?.querySelector("p + p")?.textContent?.split(" · ")[0] ?? "";
  }, oferta);
  await gestos.soltar(p);
  await expect(page.getByRole("dialog", { name: negocio })).toBeVisible();
});

test("carta (visitante): apuntar un plato y soltar abre su hoja", async ({ page }) => {
  await page.goto("/negocio/carta");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  const p = await entrar(page, gestos, g, { apuntar: true });
  const main = page.locator("main");
  const nombre = await foco(main).getAttribute("data-etiqueta");
  await gestos.soltar(p);
  await expect(page.getByRole("dialog", { name: nombre! })).toBeVisible();
});

test("carta (dueño): apuntar un plato y soltar abre su detalle", async ({ page }) => {
  await conPreferencias(page, { rol: "dueno" });
  await page.goto("/negocio/carta");
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  const p = await entrar(page, gestos, g, { apuntar: true });
  const id = await foco(page.locator("main")).getAttribute("data-fila");
  await gestos.soltar(p);
  await expect(page).toHaveURL(new RegExp(`/producto/${id}$`));
});

test("mano izquierda: el centro de la pantalla queda a la derecha", async ({ page }) => {
  await conPreferencias(page, { mano: "left" });
  const { gestos, hoja } = await abrirDesdeMapa(page, "favoritos", "Favoritos");
  const g = await leerGeometria(page);
  const p = await entrar(page, gestos, g, { apuntar: true }); // entrar() mueve hacia la derecha con la mano izquierda
  await expect(foco(hoja)).toHaveCount(1);
  await gestos.soltar(p);
});

test("con 'Apuntar y elegir' apagado, ir de costado no cambia nada: sigue desplazando", async ({ page }) => {
  await conPreferencias(page, { apuntar: false });
  const { gestos, hoja } = await abrirDesdeMapa(page, "favoritos", "Favoritos");
  const g = await leerGeometria(page);
  const p = await entrar(page, gestos, g);
  await gestos.mover({ x: p.x - HACIA_CENTRO, y: p.y });
  await page.waitForTimeout(300);
  await expect(page.getByTestId("franja-foco")).toHaveCount(0);
  await expect(foco(hoja)).toHaveCount(0);
  await gestos.soltar({ x: p.x - HACIA_CENTRO, y: p.y });
  await expect(page.getByRole("dialog")).toHaveCount(1);
});
