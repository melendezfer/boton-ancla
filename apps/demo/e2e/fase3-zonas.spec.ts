import { expect, test, type Locator, type Page } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { estadoAncla, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// Fase 3, T3-07 (RF3-10…RF3-13, H11, DF3-06): zonas reservadas, en la página de prueba de la Fase 3.
const MARGEN_ZONA = 8;

test.beforeEach(async ({ page }) => {
  await sinBienvenida(page);
});

type Caja = { x: number; y: number; width: number; height: number };
const caja = async (l: Locator): Promise<Caja> => (await l.boundingBox())!;
const seTocan = (a: Caja, b: Caja, m = 0) => a.x < b.x + b.width + m && b.x - m < a.x + a.width && a.y < b.y + b.height + m && b.y - m < a.y + a.height;

async function abrir(page: Page, zonas: string) {
  await page.goto(`/prueba-fase3?zonas=${zonas}`);
  await expect(page.getByTestId("zona-0")).toBeVisible();
  await expect(page.getByTestId("ancla")).toBeVisible();
}

/** Todo lo que dibuja el ancla con el abanico abierto (y el dedo apoyado). */
async function loQueDibuja(page: Page): Promise<Caja[]> {
  const cajas = [await caja(page.getByTestId("ancla"))];
  for (const item of await page.getByRole("menuitem").all()) cajas.push(await caja(item));
  const banda = page.getByTestId("banda");
  if (await banda.count()) cajas.push(await caja(banda));
  return cajas;
}

test("una zona obligatoria a la altura del ancla: el ancla se corre y, abierta, nada toca la zona (con margen)", async ({ page }) => {
  const vp = page.viewportSize()!;
  const yAncla = vp.height - 0.44 * vp.height; // altura de inicio
  await abrir(page, `obligatoria:-110,${Math.round(yAncla - 40)},110,80`);
  const zona = await caja(page.getByTestId("zona-0"));
  const g = await leerGeometria(page);
  expect(Math.abs(g.centro.y - yAncla)).toBeGreaterThan(40); // se corrió

  const gestos = await crearGestos(page);
  await gestos.presionar(g.centro);
  await gestos.mover({ x: g.centro.x - 30, y: g.centro.y - 30 }); // abre el abanico, con el dedo apoyado
  await expect.poll(() => estadoAncla(page)).toBe("abierto_gesto");
  for (const c of await loQueDibuja(page)) expect(seTocan(c, zona, MARGEN_ZONA - 1), JSON.stringify(c)).toBe(false);
  // Volver al centro antes de soltar (zona muerta): así no se ejecuta ninguna opción.
  await gestos.mover(g.centro);
  await gestos.soltar(g.centro);
});

test("si la zona crece durante una interacción, el ancla no se mueve hasta volver a reposo; al quitarla, vuelve a su lugar", async ({ page }) => {
  const vp = page.viewportSize()!;
  await abrir(page, `obligatoria:-110,-240,110,40`);
  const antes = await leerGeometria(page);
  const boton = page.getByTestId("ancla");

  const gestos = await crearGestos(page);
  await gestos.presionar(antes.centro);
  await gestos.mover({ x: antes.centro.x - 30, y: antes.centro.y - 30 });
  await expect.poll(() => estadoAncla(page)).toBe("abierto_gesto");
  await page.waitForTimeout(250); // termina la animación de "activa"
  const cajaAntes = await caja(boton);
  // La zona crece hasta tapar la altura del ancla (como una hoja que se abre).
  await page.getByTestId("zona-0").evaluate((el, alto) => {
    // Tapa la altura de inicio, pero deja lugar arriba (en pantallas bajas, 0,3–0,8 no deja ninguno).
    (el as HTMLElement).style.top = `${alto * 0.45}px`;
    (el as HTMLElement).style.height = `${alto * 0.3}px`;
  }, vp.height);
  await page.waitForTimeout(200);
  expect(await caja(boton)).toEqual(cajaAntes); // quieto bajo el dedo
  await gestos.mover(antes.centro); // zona muerta: soltar no ejecuta nada
  await gestos.soltar(antes.centro);
  await expect.poll(() => estadoAncla(page)).toBe("reposo");
  await expect.poll(async () => seTocan(await caja(boton), await caja(page.getByTestId("zona-0")), MARGEN_ZONA - 1)).toBe(false);

  await page.getByTestId("quitar-zonas").click();
  await expect.poll(async () => Math.round((await leerGeometria(page)).centro.y)).toBe(Math.round(antes.centro.y));
});

test("si solo cabe tapando una preferida, la tapa (nunca la obligatoria) y queda en las métricas", async ({ page }) => {
  const vp = page.viewportSize()!;
  // Toda la columna del ancla es preferida; el crédito de abajo, obligatorio.
  await abrir(page, `preferida:-100,0,100,${vp.height};obligatoria:-212,-60,200,60`);
  const credito = await caja(page.getByTestId("zona-1"));
  const g = await leerGeometria(page);
  expect(g.centro.x).toBeGreaterThan(vp.width / 2); // no cambia de costado solo
  expect(seTocan(await caja(page.getByTestId("ancla")), credito, MARGEN_ZONA - 1)).toBe(false);
  await expect
    .poll(async () => {
      const m = JSON.parse((await page.evaluate(() => localStorage.getItem("boton-ancla-demo:v1:metricas"))) ?? "[]") as { evento: { type: string; conflicto?: string } }[];
      return m.filter((x) => x.evento.type === "zone_conflict").map((x) => x.evento.conflicto);
    })
    .toContain("preferidas");
});
