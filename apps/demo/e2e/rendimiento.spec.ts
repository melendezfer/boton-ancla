import { expect, test } from "@playwright/test";
import { sinBienvenida } from "./helpers/almacen";
import { haciaOpcion, leerGeometria } from "./helpers/ancla";
import { crearGestos } from "./helpers/gestos";

// T-27, RNF-03: medición INDICATIVA de cuadros durante el gesto, con la CPU frenada.
// No reemplaza medir en un Android de gama baja real (L-08). Solo corre si se pide:
//   npm run e2e:rendimiento -w demo

test.skip(!process.env.MEDIR_RENDIMIENTO, "Medición opcional: MEDIR_RENDIMIENTO=1");

for (const factor of [1, 4, 6]) {
  test(`cuadros durante abrir y recorrer el abanico, CPU ×${factor}`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "El freno de CPU usa el protocolo de DevTools (solo Chromium).");
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {}
    });
    await sinBienvenida(page);
    await page.goto("/mapa");
    await expect(page.getByTestId("mapa-lienzo")).toHaveAttribute("data-offset-x", /-?\d+/);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: factor });

    const g = await leerGeometria(page);
    const gestos = await crearGestos(page);

    // Registrar la marca de tiempo de cada cuadro.
    await page.evaluate(() => {
      const w = window as unknown as { __cuadros: number[]; __medir: boolean };
      w.__cuadros = [];
      w.__medir = true;
      const paso = (t: number) => {
        w.__cuadros.push(t);
        if (w.__medir) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });

    await gestos.presionar(g.centro);
    // Recorre el arco de lado a lado dos veces (~1,2 s): cambia la preselección varias veces.
    for (let i = 0; i <= 60; i++) {
      const a = ((90 + 90 * Math.abs(Math.sin((i / 60) * Math.PI))) * Math.PI) / 180;
      await gestos.mover({ x: g.centro.x + g.radio * Math.cos(a), y: g.centro.y - g.radio * Math.sin(a) });
      await page.waitForTimeout(20);
    }
    await gestos.soltar(haciaOpcion(g, "buscar", 10)); // cerca del centro: cancela

    const cuadros = await page.evaluate(() => {
      const w = window as unknown as { __cuadros: number[]; __medir: boolean };
      w.__medir = false;
      return w.__cuadros;
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

    const intervalos = cuadros.slice(1).map((t, i) => t - cuadros[i]!).sort((a, b) => a - b);
    const p = (q: number) => intervalos[Math.min(intervalos.length - 1, Math.floor(q * intervalos.length))]!;
    const promedio = intervalos.reduce((s, x) => s + x, 0) / intervalos.length;
    const resultado = {
      factor,
      cuadros: intervalos.length,
      fpsPromedio: Math.round(1000 / promedio),
      p50ms: Math.round(p(0.5) * 10) / 10,
      p95ms: Math.round(p(0.95) * 10) / 10,
      maxMs: Math.round(intervalos.at(-1)! * 10) / 10,
      largosPct: Math.round((intervalos.filter((x) => x > 25).length / intervalos.length) * 100),
    };
    console.log(`RENDIMIENTO ${JSON.stringify(resultado)}`);
    test.info().annotations.push({ type: "rendimiento", description: JSON.stringify(resultado) });
    // Umbral amplio: detecta un desastre (menos de 20 cuadros por segundo), no mide 60 fps.
    expect(resultado.p95ms).toBeLessThan(50);
  });
}
