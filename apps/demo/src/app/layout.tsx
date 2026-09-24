import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { BarraDemo } from "@/components/barra-demo";
import { AvisoDemo, HojasDemo } from "@/components/hojas";
import { VistaPreviaAncla } from "@/components/vista-previa-ancla";
import { DemoProvider } from "@/lib/demo-store";
import "./globals.css";

// Mismas tipografías que RUTEANDO.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const plusJakartaSans = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Botón-ancla · demo",
  description: "Demo del botón-ancla con pantallas simuladas de RUTEANDO.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin esto, env(safe-area-inset-*) vale 0 en iPhone (L-03, RF-12).
  viewportFit: "cover",
  themeColor: "#5B3DF5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <DemoProvider>
          <BarraDemo />
          {children}
          <HojasDemo />
          <AvisoDemo />
          <VistaPreviaAncla />
        </DemoProvider>
      </body>
    </html>
  );
}
