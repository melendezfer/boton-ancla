import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria, type GeometriaAncla } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// Fase 3, T3-08 (RF3-01…RF3-05, RF3-16, DF3-01…DF3-03): mover el ancla arrastrándola, en la
// página de prueba de la Fase 3. Solo deslizando, salvo el botón "Mover el ancla".
const T_ESPERA = 300; // T_ESPERA_DESLIZADOR

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
  await page.goto("/prueba-fase3");
  await expect(page.getByTestId("ancla")).toBeVisible();
});

const centroDe = async (page: Page) => {
  const b = (await page.getByTestId("ancla").boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

/** Solo deslizando: llegar a "Mover ancla" y quedarse quieto hasta entrar al modo edición. */
async function entrarAEditar(page: Page, gestos: Gestos, g: GeometriaAncla): Promise<Punto> {
  const sobre = haciaOpcion(g, "mover-ancla");
  await gestos.presionar(g.centro);
  await gestos.mover({ x: (g.centro.x + sobre.x) / 2, y: (g.centro.y + sobre.y) / 2 });
  await gestos.mover(sobre);
  await page.waitForTimeout(T_ESPERA + 150);
  await expect.poll(() => estadoAncla(page)).toBe("editando");
  return sobre;
}

async function arrastrar(gestos: Gestos, desde: Punto, hasta: Punto, pasos = 10) {
  for (let i = 1; i <= pasos; i++) await gestos.mover({ x: desde.x + ((hasta.x - desde.x) * i) / pasos, y: desde.y + ((hasta.y - desde.y) * i) / pasos });
}

/** El ancla terminó de llegar a su lugar (el imán anima T_CENTRADO). */
async function esperarQuieta(page: Page) {
  const g = await leerGeometria(page);
  await expect.poll(async () => Math.hypot((await centroDe(page)).x - g.centro.x, (await centroDe(page)).y - g.centro.y)).toBeLessThan(1);
  return g;
}

const metricas = async (page: Page) =>
  (JSON.parse((await page.evaluate(() => localStorage.getItem("boton-ancla-demo:v1:metricas"))) ?? "[]") as { evento: { type: string; lado?: string } }[]).map((m) => m.evento);

test("solo deslizando: entrar, ver dónde puede quedar, cruzar al otro costado y soltar cambia la mano", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  const sobre = await entrarAEditar(page, gestos, g);
  await expect(page.getByTestId("tramo-valido-right").first()).toBeVisible();
  await expect(page.getByTestId("tramo-valido-left").first()).toBeVisible();
  await expect(page.getByTestId("linea-inicio-right")).toBeVisible();
  await expect(page.getByTestId("silueta")).toBeVisible();
  await expect(page.getByTestId("velo")).toBeVisible(); // el contenido no recibe toques

  const destino = { x: 70, y: 330 };
  await arrastrar(gestos, sobre, destino);
  await expect.poll(async () => Math.hypot((await centroDe(page)).x - destino.x, (await centroDe(page)).y - destino.y)).toBeLessThan(3); // sigue al dedo
  await expect(page.getByTestId("silueta")).toHaveAttribute("data-lado", "left");
  await gestos.soltar(destino);
  await expect.poll(() => estadoAncla(page)).toBe("reposo");

  const despues = await leerGeometria(page);
  expect(despues.centro.x).toBeLessThan(page.viewportSize()!.width / 2); // imán al costado izquierdo
  expect(despues.centro.y).toBeCloseTo(destino.y, 0); // a la altura donde se soltó
  await expect(page.locator(".ba-raiz")).toHaveAttribute("data-mano", "left");
  await expect.poll(async () => Math.round((await centroDe(page)).x)).toBe(Math.round(despues.centro.x)); // terminó la animación del imán
  // El abanico se abre hacia el centro (espejo).
  for (const s of despues.slots) expect(s.x).toBeGreaterThanOrEqual(despues.centro.x - 1);
  const m = await metricas(page);
  expect(m.some((e) => e.type === "anchor_move" && e.lado === "left")).toBe(true);
  expect(m.some((e) => e.type === "hand_change" && e.lado === "left")).toBe(true);
});

test("imán: soltar muy arriba o muy abajo lleva a la posición válida más cercana", async ({ page }) => {
  const vp = page.viewportSize()!;
  const gestos = await crearGestos(page);
  let g = await leerGeometria(page);
  let sobre = await entrarAEditar(page, gestos, g);
  await arrastrar(gestos, sobre, { x: vp.width - 40, y: 30 });
  await gestos.soltar({ x: vp.width - 40, y: 30 });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  const arriba = await esperarQuieta(page);
  expect(arriba.centro.y).toBeGreaterThan(100); // no se sale: el abanico tiene que caber arriba
  for (const s of arriba.slots) expect(s.y).toBeGreaterThan(0);

  g = arriba;
  sobre = await entrarAEditar(page, gestos, g);
  await arrastrar(gestos, sobre, { x: vp.width - 40, y: vp.height - 5 });
  await gestos.soltar({ x: vp.width - 40, y: vp.height - 5 });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  const abajo = await leerGeometria(page);
  expect(abajo.centro.y).toBeLessThanOrEqual(vp.height - 16 - 32 + 0.5); // el piso (márgenes)
  expect(abajo.centro.x).toBeGreaterThan(vp.width / 2);
});

test("arrepentirse: un segundo dedo cancela y el ancla vuelve a donde estaba", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  const sobre = await entrarAEditar(page, gestos, g);
  await arrastrar(gestos, sobre, { x: 80, y: 250 });
  await gestos.presionar({ x: 200, y: 600 }, 2);
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await gestos.soltar({ x: 200, y: 600 }, 2);
  await gestos.soltar({ x: 80, y: 250 });
  await expect.poll(async () => Math.round((await centroDe(page)).x)).toBe(Math.round(g.centro.x));
  expect(Math.round((await centroDe(page)).y)).toBe(Math.round(g.centro.y));
  expect((await metricas(page)).some((e) => e.type === "anchor_move_cancel")).toBe(true);
});

test("al cruzar la altura de inicio hay un 'clic' (RF3-16)", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  const sobre = await entrarAEditar(page, gestos, g);
  const linea = (await page.getByTestId("linea-inicio-right").boundingBox())!;
  const yLinea = linea.y + linea.height / 2;
  await arrastrar(gestos, sobre, { x: sobre.x, y: yLinea + 60 }, 6);
  await arrastrar(gestos, { x: sobre.x, y: yLinea + 60 }, { x: sobre.x, y: yLinea - 60 }, 6);
  await expect(page.locator(".ba-raiz")).toHaveAttribute("data-clic-inicio", /[1-9]/);
  await gestos.soltar({ x: sobre.x, y: yLinea - 60 });
});

test("el botón 'Mover el ancla' (DF3-01): el ancla late y el próximo toque la engancha", async ({ page }) => {
  await page.getByTestId("boton-mover-ancla").click();
  await expect.poll(() => estadoAncla(page)).toBe("editando");
  await expect(page.getByTestId("ancla")).toHaveClass(/ba-ancla--editando/);
  await expect(page.getByTestId("boton-mover-ancla")).toHaveText("Toca el ancla y arrástrala");
  const c = await centroDe(page);
  const gestos = await crearGestos(page);
  await gestos.presionar(c);
  await arrastrar(gestos, c, { x: 70, y: c.y });
  await gestos.soltar({ x: 70, y: c.y });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await expect(page.locator(".ba-raiz")).toHaveAttribute("data-mano", "left");
});

test("soltar sobre 'Mover ancla' sin esperar hace lo mismo que el botón (HM-17)", async ({ page }) => {
  const g = await leerGeometria(page);
  const gestos = await crearGestos(page);
  await gestos.deslizar(g.centro, haciaOpcion(g, "mover-ancla"), { pasos: 4, ms: 60 });
  await expect.poll(() => estadoAncla(page)).toBe("editando");
  await expect(page.getByTestId("ancla")).toHaveClass(/ba-ancla--editando/);
});
