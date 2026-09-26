import { expect, test, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, haciaOpcion, leerGeometria, type GeometriaAncla } from "./helpers/ancla";
import { crearGestos, type Gestos, type Punto } from "./helpers/gestos";

// HM-12a: zoom B (RF-20) y apuntar y elegir en el mapa (RF-21). Todo solo deslizando (D-15),
// salvo el arrastre del mapa con el dedo que se usa para preparar la escena.

const GRUPO = { ids: ["drogueria-la-esquinita", "tienda-la-esquinita"], x: (1560 + 1574) / 2, y: (1020 + 1028) / 2 };

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

async function abrirMapa(page: Page) {
  await page.goto("/mapa");
  await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
  return leerGeometria(page);
}

async function mapa(page: Page) {
  const lienzo = page.getByTestId("mapa-lienzo");
  return {
    x: Number(await lienzo.getAttribute("data-offset-x")),
    y: Number(await lienzo.getAttribute("data-offset-y")),
    zoom: Number(await lienzo.getAttribute("data-zoom")),
  };
}

/** La mira por defecto: el centro de la parte visible. */
const mira = (page: Page) => page.evaluate(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));

/** Arrastra el mapa con el dedo (lejos del ancla) hasta que el punto del mapa (wx, wy) quede en la mira. */
async function llevarALaMira(page: Page, gestos: Gestos, wx: number, wy: number) {
  const m = await mira(page);
  for (let i = 0; i < 8; i++) {
    const { x, y, zoom } = await mapa(page);
    const dx = m.x - (x + wx * zoom);
    const dy = m.y - (y + wy * zoom);
    if (Math.hypot(dx, dy) < 1) return;
    const paso = { x: Math.max(-150, Math.min(150, dx)), y: Math.max(-150, Math.min(150, dy)) };
    const desde = { x: m.x - paso.x / 2 - 60, y: m.y - paso.y / 2 - 120 };
    // El umbral de arrastre (6 px) se descuenta solo: el mapa sigue al dedo desde donde bajó.
    await gestos.deslizar(desde, { x: desde.x + paso.x, y: desde.y + paso.y }, { pasos: 10, ms: 120 });
    await page.waitForTimeout(50);
  }
  throw new Error("no se pudo llevar el punto a la mira");
}

/** Entra al joystick (primer movimiento hacia abajo) y devuelve el punto de inicio. */
async function entrar(page: Page, gestos: Gestos, g: GeometriaAncla): Promise<Punto> {
  await gestos.presionar(g.centro);
  const origen = { x: g.centro.x, y: g.centro.y + 20 };
  await gestos.mover(origen);
  await expect.poll(() => estadoAncla(page)).toBe("desplazando");
  return origen;
}

const ancla = (page: Page) => page.getByTestId("ancla");

// ---------------------------------------------------------------------------
// Zoom B (RF-20)
// ---------------------------------------------------------------------------

test("Zoom: soltar rápido sobre la opción no cambia nada y la banda explica qué hacer", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const antes = (await mapa(page)).zoom;
  for (const [pasos, ms] of [
    [3, 30], // rápido (modo experto)
    [2, 0], // relámpago (C-05)
  ] as const) {
    // Con la máquina de pruebas muy cargada, el gesto puede tardar más que T_ESPERA_DESLIZADOR
    // y entonces (con razón) cuenta como "quedarse": se repite hasta que salga rápido de verdad.
    await expect(async () => {
      await gestos.deslizar(g.centro, haciaOpcion(g, "zoom"), { pasos, ms });
      const banda = page.getByTestId("banda");
      await expect(banda).toHaveAttribute("data-tipo", "pista-deslizador", { timeout: 1000 });
      await expect(banda).toHaveText("Mantén sobre Zoom para acercar o alejar");
    }).toPass({ timeout: 15000 });
    expect((await mapa(page)).zoom).toBe(antes);
    expect(await estadoAncla(page)).toBe("reposo");
  }
});

test("Zoom: quedarse sobre la opción la vuelve deslizador; pulgar arriba acerca y abajo aleja", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const sobreZoom = haciaOpcion(g, "zoom");
  await gestos.presionar(g.centro);
  await gestos.mover({ x: (g.centro.x + sobreZoom.x) / 2, y: (g.centro.y + sobreZoom.y) / 2 });
  await gestos.mover(sobreZoom);
  await expect.poll(() => estadoAncla(page)).toBe("ajustando");
  await expect(page.getByTestId("guia-desplazar")).toBeVisible();
  await expect(page.getByRole("menu")).toHaveCount(0); // el abanico se va

  const z0 = (await mapa(page)).zoom;
  await gestos.mover({ x: sobreZoom.x, y: sobreZoom.y - 60 });
  // (El WebKit de prueba con carga dibuja pocos cuadros por segundo: se le da tiempo.)
  await expect.poll(async () => (await mapa(page)).zoom, { timeout: 10000 }).toBeGreaterThan(z0 * 1.1);
  const alto = (await mapa(page)).zoom;
  await gestos.mover({ x: sobreZoom.x, y: sobreZoom.y + 60 });
  await expect.poll(async () => (await mapa(page)).zoom, { timeout: 10000 }).toBeLessThan(alto * 0.95);
  await gestos.soltar({ x: sobreZoom.x, y: sobreZoom.y + 60 });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  const quieto = (await mapa(page)).zoom;
  await page.waitForTimeout(200);
  expect((await mapa(page)).zoom).toBe(quieto); // se queda en ese zoom

  // HU-12, C-17: ajustar cuenta como un uso de "zoom" para la bienvenida.
  const usos = await page.evaluate(() => JSON.parse(window.localStorage.getItem("boton-ancla:v1:bienvenida") ?? "{}").usos?.zoom);
  expect(usos).toBe(100);
});

// ---------------------------------------------------------------------------
// Apuntar y elegir (RF-21)
// ---------------------------------------------------------------------------

test("con un pin en la mira, el ancla se enciende con su ícono y la mira muestra su nombre", async ({ page }) => {
  const g = await abrirMapa(page); // centrado en Arepas Doña Rosa
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  const laMira = page.getByTestId("mira");
  await expect(laMira).toBeVisible();
  await expect(laMira).toHaveAttribute("data-apuntado", "uno");
  await expect(page.getByTestId("mira-etiqueta")).toHaveText("Arepas Doña Rosa");
  await expect(ancla(page)).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
  await expect(ancla(page)).toHaveClass(/ba-ancla--apuntando/);
  const m = await mira(page);
  const caja = (await laMira.boundingBox())!;
  expect(Math.abs(caja.x + caja.width / 2 - m.x)).toBeLessThan(1.5); // en el centro de la vista

  // Al alejarse, la mira se apaga.
  await gestos.mover({ x: origen.x - 70, y: origen.y });
  await expect(laMira).not.toHaveAttribute("data-apuntado", /.*/, { timeout: 5000 });
  await expect(ancla(page)).not.toHaveAttribute("data-apuntado", /.*/);
  await gestos.soltar({ x: origen.x - 70, y: origen.y });
  await expect(laMira).toHaveCount(0);
});

test("soltar FRENADO sobre un pin lo elige: abre su capa con sus acciones; 'Cerrar' la quita", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  await expect(ancla(page)).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
  await gestos.soltar(origen);
  const capa = page.getByRole("dialog", { name: "Arepas Doña Rosa" });
  await expect(capa).toBeVisible();
  await expect(capa.getByRole("link", { name: "Ver carta" })).toBeVisible();

  const enCapa = await leerGeometria(page);
  expect(enCapa.slots.map((s) => s.id).sort()).toEqual(["cerrar", "como-llegar", "favorito", "ver-perfil", "whatsapp"]);
  await gestos.deslizar(enCapa.centro, haciaOpcion(enCapa, "cerrar"), { pasos: 8, ms: 150 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("soltar en movimiento no elige: solo detiene el mapa", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  await expect(ancla(page)).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
  await gestos.mover({ x: origen.x + 40, y: origen.y - 30 });
  await page.waitForTimeout(100);
  await gestos.soltar({ x: origen.x + 40, y: origen.y - 30 });
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("imán: con un pin cerca de la mira y el pulgar quieto, el pin se centra en la mira", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  // Correr el mapa 16 px: el pin queda dentro del imán (28 px) pero no en el centro.
  const desde = { x: 80, y: 200 };
  await gestos.deslizar(desde, { x: desde.x + 12, y: desde.y + 10 }, { pasos: 6, ms: 80 });
  const m = await mira(page);
  const pin = async () => {
    const { x, y, zoom } = await mapa(page);
    return { x: x + 1000 * zoom, y: y + 1000 * zoom };
  };
  const antes = await pin();
  expect(Math.hypot(antes.x - m.x, antes.y - m.y)).toBeGreaterThan(8);

  const origen = await entrar(page, gestos, g);
  await expect(ancla(page)).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
  await expect.poll(async () => {
    const p = await pin();
    return Math.hypot(p.x - m.x, p.y - m.y);
  }, { timeout: 5000 }).toBeLessThan(1.5);
  await gestos.soltar(origen);
});

test("grupo: dos pines que no se separan se apuntan juntos; soltar abre la lista para elegir", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  await llevarALaMira(page, gestos, GRUPO.x, GRUPO.y);
  const origen = await entrar(page, gestos, g);
  await expect(ancla(page)).toHaveAttribute("data-apuntado", "grupo");
  await expect(page.getByTestId("conteo-grupo")).toHaveText("2");
  await expect(page.getByTestId("mira-etiqueta")).toHaveText("2 negocios");
  await gestos.soltar(origen); // antes del zoom automático (0,5 s)

  const capa = page.getByRole("dialog", { name: "2 negocios aquí" });
  await expect(capa).toBeVisible();
  await expect(capa.getByText("Droguería La Esquinita")).toBeVisible();
  await expect(capa.getByText("Tienda La Esquinita")).toBeVisible();
  // Tocar una fila con el dedo sigue funcionando: abre su resumen.
  await capa.getByText("Tienda La Esquinita").click();
  await expect(page.getByRole("dialog", { name: "Tienda La Esquinita" })).toBeVisible();
});

test("zoom automático: con la mira QUIETA ~0,5 s sobre un grupo, el mapa se acerca hasta separarlos", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  await llevarALaMira(page, gestos, GRUPO.x, GRUPO.y);
  const z0 = (await mapa(page)).zoom;
  const origen = await entrar(page, gestos, g);
  await expect(ancla(page)).toHaveAttribute("data-apuntado", "grupo");
  await expect.poll(async () => (await mapa(page)).zoom, { timeout: 5000 }).toBeGreaterThan(z0 * 1.5);
  // Ya separados: la mira apunta a uno solo (o a ninguno), no al grupo.
  await expect(page.getByTestId("conteo-grupo")).toHaveCount(0);
  await gestos.soltar(origen);
});

test("con 'Apuntar y elegir' apagado no hay mira y soltar frenado no elige", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("boton-ancla-demo:v1:prefs", JSON.stringify({ apuntar: false })));
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  await page.waitForTimeout(200);
  await expect(page.getByTestId("mira")).toHaveCount(0);
  await expect(ancla(page)).not.toHaveAttribute("data-apuntado", /.*/);
  await gestos.soltar(origen);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("métricas: apuntar y elegir quedan registrados", async ({ page }) => {
  const g = await abrirMapa(page);
  const gestos = await crearGestos(page);
  const origen = await entrar(page, gestos, g);
  await expect(ancla(page)).toHaveAttribute("data-apuntado", "arepas-dona-rosa");
  await gestos.soltar(origen);
  await expect(page.getByRole("dialog", { name: "Arepas Doña Rosa" })).toBeVisible();
  await page.goto("/metricas");
  const lista = page.getByTestId("lista-metricas");
  await expect(lista).toContainText("un negocio en la mira");
  await expect(lista).toContainText("elegido arepas-dona-rosa");
});
