// Rutas a archivos de public/ escritas a mano (por ejemplo en un backgroundImage). Next agrega
// la ruta base solo a <Link>, al router y a sus propios archivos; en GitHub Pages la demo vive
// en /boton-ancla, así que estas rutas la necesitan (ver next.config.ts).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function ruta(p: string): string {
  return `${BASE}${p}`;
}

/** Fondo de foto con respaldo: la foto real si existe y, si no, la ilustración. */
export const FONDO_FOTO = `url(${ruta("/fondos/foto.jpg")}), url(${ruta("/fondos/foto.svg")})`;
