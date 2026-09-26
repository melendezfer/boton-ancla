import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria, type GeometriaAncla } from "./helpers/ancla";
import { crearGestos, type Gestos } from "./helpers/gestos";

// T-26: TODAS las acciones de TODAS las pantallas de spec §8, SOLO deslizando
// (D-15, RNF-01, HU-09). Este archivo no puede tocar: la primera prueba lo verifica.

type Rol = "visitante" | "dueno";

async function preparar(page: Page, rol: Rol) {
  await page.addInitScript((r) => {
    try {
      window.localStorage.clear();
      window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ rol: r }));
    } catch {}
  }, rol);
  await sinBienvenida(page);
}

/** Abre la ruta (después de otra, para que "Atrás" tenga adónde volver). */
async function abrir(page: Page, ruta: string, desde = "/mapa"): Promise<{ g: GeometriaAncla; gestos: Gestos }> {
  await page.goto(desde);
  await expect(page.getByTestId("ancla")).toBeVisible();
  await page.goto(ruta);
  const g = await leerGeometria(page);
  return { g, gestos: await crearGestos(page) };
}

/** Desliza desde el centro hasta la opción y suelta. */
async function deslizarA(g: GeometriaAncla, gestos: Gestos, id: string, r = g.radio) {
  await gestos.deslizar(g.centro, haciaOpcion(g, id, r), { pasos: 10, ms: 160 });
}

test("este archivo no usa toques (tap ni click)", () => {
  const codigo = readFileSync(test.info().file, "utf8");
  // lastIndexOf: el texto del marcador también aparece aquí arriba, dentro de esta prueba.
  const pruebas = codigo.slice(codigo.lastIndexOf("// ---- recorrido ----"));
  expect(pruebas.length).toBeGreaterThan(2000); // de verdad está revisando el recorrido
  expect(pruebas).not.toMatch(/\.(tap|click|dblclick)\(/);
});

// ---- recorrido ----

const CASOS: { ruta: string; rol: Rol; id: string; verificar: (page: Page) => Promise<void> }[] = [
  // Mapa
  { ruta: "/mapa", rol: "visitante", id: "buscar", verificar: (p) => expect(p.getByTestId("campo-busqueda")).toBeFocused() },
  { ruta: "/mapa", rol: "visitante", id: "mi-ubicacion", verificar: (p) => expect(p.getByText("Centrado en tu ubicación (simulado)")).toBeVisible() },
  { ruta: "/mapa", rol: "visitante", id: "ofertas-cerca", verificar: (p) => expect(p.getByRole("dialog", { name: "Ofertas cerca" })).toBeVisible() },
  { ruta: "/mapa", rol: "visitante", id: "favoritos", verificar: (p) => expect(p.getByRole("dialog", { name: "Favoritos" })).toBeVisible() },
  // Perfil de negocio (visitante)
  { ruta: "/negocio", rol: "visitante", id: "carta", verificar: (p) => expect(p).toHaveURL(/\/negocio\/carta$/) },
  { ruta: "/negocio", rol: "visitante", id: "como-llegar", verificar: (p) => expect(p.getByText("Abriendo indicaciones (simulado)")).toBeVisible() },
  { ruta: "/negocio", rol: "visitante", id: "favorito", verificar: (p) => expect(p.getByText("Agregado a favoritos")).toBeVisible() },
  { ruta: "/negocio", rol: "visitante", id: "compartir", verificar: (p) => expect(p.getByText("Enlace copiado (simulado)")).toBeVisible() },
  { ruta: "/negocio", rol: "visitante", id: "atras", verificar: (p) => expect(p).toHaveURL(/\/mapa$/) },
  // Perfil de negocio (dueño)
  { ruta: "/negocio", rol: "dueno", id: "agregar-plato", verificar: (p) => expect(p.getByRole("dialog", { name: "Agregar plato (simulado)" })).toBeVisible() },
  { ruta: "/negocio", rol: "dueno", id: "editar", verificar: (p) => expect(p.getByRole("dialog", { name: "Editar negocio (simulado)" })).toBeVisible() },
  { ruta: "/negocio", rol: "dueno", id: "atras", verificar: (p) => expect(p).toHaveURL(/\/mapa$/) },
  // Carta
  { ruta: "/negocio/carta", rol: "visitante", id: "compartir", verificar: (p) => expect(p.getByText("Enlace de la carta copiado (simulado)")).toBeVisible() },
  { ruta: "/negocio/carta", rol: "visitante", id: "favorito", verificar: (p) => expect(p.getByText("Agregado a favoritos")).toBeVisible() },
  { ruta: "/negocio/carta", rol: "visitante", id: "atras", verificar: (p) => expect(p).toHaveURL(/\/mapa$/) },
  // Detalle de producto (dueño)
  { ruta: "/producto/arepa-queso", rol: "dueno", id: "editar", verificar: (p) => expect(p.getByRole("dialog", { name: "Editar producto (simulado)" })).toBeVisible() },
  { ruta: "/producto/arepa-queso", rol: "dueno", id: "atras", verificar: (p) => expect(p).toHaveURL(/\/mapa$/) },
];

for (const c of CASOS) {
  test(`${c.ruta} (${c.rol}) · ${c.id}`, async ({ page }) => {
    await preparar(page, c.rol);
    const { g, gestos } = await abrir(page, c.ruta);
    await deslizarA(g, gestos, c.id);
    await c.verificar(page);
  });
}

test("producto · marcar no disponible y deshacer, solo deslizando (HU-07, C-21)", async ({ page }) => {
  await preparar(page, "dueno");
  const { g, gestos } = await abrir(page, "/producto/arepa-queso");
  await deslizarA(g, gestos, "marcar-no-disponible");
  await expect(page.getByText("No disponible", { exact: true })).toBeVisible();
  const conAviso = await leerGeometria(page);
  await deslizarA(conAviso, gestos, "deshacer");
  await expect(page.getByText("Disponible", { exact: true })).toBeVisible();
});

test("producto · eliminar confirmando más allá del anillo, solo deslizando (HU-08)", async ({ page }) => {
  await preparar(page, "dueno");
  const { g, gestos } = await abrir(page, "/producto/arepa-queso");
  await deslizarA(g, gestos, "eliminar"); // soltar sobre la opción: bloqueado
  await expect(page.getByTestId("aviso")).toHaveText("Desliza más allá para confirmar");
  await deslizarA(g, gestos, "eliminar", g.rExterior + 15); // más allá del anillo: elimina
  await expect(page).toHaveURL(/\/negocio\/carta$/);
  await expect(page.getByText("Arepa de queso")).toHaveCount(0);
});

test("mapa · Zoom quedándose sobre la opción y subiendo el pulgar, solo deslizando (RF-20)", async ({ page }) => {
  await preparar(page, "visitante");
  const { g, gestos } = await abrir(page, "/mapa", "/ajustes");
  const lienzo = page.getByTestId("mapa-lienzo");
  const antes = Number(await lienzo.getAttribute("data-zoom"));
  const sobreZoom = haciaOpcion(g, "zoom");
  await gestos.presionar(g.centro);
  await gestos.mover(sobreZoom);
  await page.waitForTimeout(450); // quedarse sobre Zoom (T_ESPERA_DESLIZADOR)
  await gestos.mover({ x: sobreZoom.x, y: sobreZoom.y - 60 });
  await expect.poll(async () => Number(await lienzo.getAttribute("data-zoom")), { timeout: 10000 }).toBeGreaterThan(antes * 1.1);
  await gestos.soltar({ x: sobreZoom.x, y: sobreZoom.y - 60 });
});

test("toda acción del abanico de §8 está en este recorrido", async () => {
  const cubiertas = new Set([...CASOS.map((c) => `${c.ruta}|${c.rol}|${c.id}`), "/producto/arepa-queso|dueno|marcar-no-disponible", "/producto/arepa-queso|dueno|eliminar", "/mapa|visitante|zoom"]);
  const esperadas = [
    ["/mapa", "visitante", ["buscar", "mi-ubicacion", "ofertas-cerca", "favoritos", "zoom"]],
    ["/negocio", "visitante", ["carta", "como-llegar", "favorito", "compartir", "atras"]],
    ["/negocio", "dueno", ["agregar-plato", "editar", "atras"]],
    ["/negocio/carta", "visitante", ["compartir", "favorito", "atras"]],
    ["/producto/arepa-queso", "dueno", ["editar", "marcar-no-disponible", "eliminar", "atras"]],
  ] as const;
  for (const [ruta, rol, ids] of esperadas) for (const id of ids) expect(cubiertas.has(`${ruta}|${rol}|${id}`), `${ruta} ${rol} ${id}`).toBe(true);
});
