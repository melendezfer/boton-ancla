import { redirect } from "next/navigation";

// La demo empieza en el mapa, como RUTEANDO.
export default function Inicio() {
  redirect("/mapa");
}
