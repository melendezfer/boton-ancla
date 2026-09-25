"use client";

import { useAnchorScroll } from "@boton-ancla/react";
import Link from "next/link";
import { EspacioBarra } from "@/components/barra-demo";
import { usePantallaPerfil } from "@/components/pantallas-conectadas";
import { NEGOCIO_DEMO } from "@/lib/datos";
import { useDemo } from "@/lib/demo-store";
import { ANCHOR_ICONS, MOBILITY_ICONS, SEMANTIC_ICONS } from "@/lib/icons/semantic-icons";

const Abierto = SEMANTIC_ICONS.openNow;
const Local = MOBILITY_ICONS.fixed;
const Carta = SEMANTIC_ICONS.catalog;
const Favorito = ANCHOR_ICONS.favoriteToggle;

export default function PaginaPerfil() {
  usePantallaPerfil();
  useAnchorScroll("ventana"); // HM-09: el perfil se desplaza con el ancla
  const { prefs, favoritos } = useDemo();
  const esFavorito = favoritos.includes(NEGOCIO_DEMO.id);

  return (
    <main className="pb-48">
      <EspacioBarra />
      <div
        className="h-44 w-full bg-cover bg-center"
        style={{ backgroundImage: "url(/fondos/foto.jpg), url(/fondos/foto.svg)" }}
        role="img"
        aria-label="Foto del negocio"
      />
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-4">
        <p className="self-start rounded-full bg-terracota/10 px-3 py-1 font-sans text-caption font-medium tracking-wide text-terracota uppercase">
          Viendo como {prefs.rol === "dueno" ? "dueño" : "visitante"} · cámbialo en Ajustes
        </p>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-title-1 font-bold text-text">{NEGOCIO_DEMO.nombre}</h1>
            <p className="font-sans text-body text-text-muted">{NEGOCIO_DEMO.categoria}</p>
          </div>
          {esFavorito && <Favorito size={24} weight="fill" className="text-terracota" aria-label="En tus favoritos" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-full bg-verde/10 px-3 py-1 font-sans text-body-sm text-verde">
            <Abierto size={16} /> Abierto ahora
          </span>
          <span className="flex items-center gap-1 rounded-full bg-background px-3 py-1 font-sans text-body-sm text-text-muted">
            <Local size={16} /> Local
          </span>
        </div>
        <Link href="/negocio/carta" className="flex h-btn items-center justify-center gap-2 rounded-input border border-border bg-surface font-sans text-button font-semibold text-text">
          <Carta size={20} /> Ver carta
        </Link>
        <section className="flex flex-col gap-2 font-sans text-body text-text">
          <h2 className="font-heading text-title-2 font-semibold">Sobre nosotros</h2>
          <p>Arepas asadas en leña desde 2009, en la esquina del parque de Ciudad Verde. Atendemos de lunes a sábado desde las 6 de la mañana.</p>
          <p>Este texto largo existe para que la página se pueda desplazar: sirve para probar el modo descanso (dejar el pulgar sobre el ancla mientras se lee) cuando el ancla real exista.</p>
          <p>Arepa de queso, arepa rellena, chocolate caliente y empanadas de pipián. Pregunta por las promociones del día.</p>
          <p>Pagos en efectivo y transferencia. Domicilios en un radio de 800 m.</p>
        </section>
        <section className="flex flex-col gap-3 font-sans text-body text-text">
          <h2 className="font-heading text-title-2 font-semibold">Reseñas</h2>
          {[
            ["Carolina", "Las mejores arepas de queso del barrio. El chocolate, espeso como debe ser."],
            ["Andrés", "Atienden rápido aunque haya fila. La arepa rellena mixta vale cada peso."],
            ["María Fernanda", "Paso todos los días antes del trabajo. Siempre amables."],
            ["Jorge", "Buen precio. A veces se acaban las empanadas temprano."],
            ["Luz Dary", "El caldo de costilla de los domingos es una bendición."],
            ["Camilo", "Pedí a domicilio y llegó caliente. Repetiré."],
          ].map(([quien, texto]) => (
            <blockquote key={quien} className="rounded-card border border-border bg-surface p-3">
              <p>{texto}</p>
              <footer className="mt-1 text-body-sm text-text-muted">— {quien}</footer>
            </blockquote>
          ))}
        </section>
      </div>
    </main>
  );
}
