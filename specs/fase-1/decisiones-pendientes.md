# Decisiones pendientes — Fase 1

Cuando aparezca un punto nuevo que necesite explicación larga, se escribe aquí: problema, ejemplo concreto, opciones y propuesta. Al decidirlo, pasa a `design.md` §0 y a `spec.md`, y se borra de aquí.

---

## 1. La capa de un negocio pide 5 acciones, pero caben 4 (HM-12a × RF-15)

**Problema.** HM-12 pide que al elegir un pin se abra una capa con **Ver perfil, Ver carta, Cómo llegar, Favorito y WhatsApp**. RF-15 permite **como máximo 4 acciones por capa**, porque "Cerrar" ocupa la quinta posición (90°) y el abanico tiene 5 lugares (`MAX_OPCIONES`).

**Qué hice mientras tanto (se puede cambiar).** En el abanico: Ver perfil (1), Cómo llegar (2), Favorito (3) y WhatsApp (4). **"Ver carta" quedó como botón dentro de la hoja**, junto a "Ver perfil", y también se llega desde el perfil.

**Opciones:**
- **A — Dejarlo así.** *Pro:* nada nuevo que aprender; la carta está a un paso (perfil → carta). *Contra:* "Ver carta" no se puede usar solo deslizando desde la capa (sí desde el perfil).
- **B — Cambiar cuál queda fuera** (por ejemplo, WhatsApp como botón y Ver carta en el abanico). *Pro:* prioriza lo que más se usa en RUTEANDO. *Contra:* hay que saber qué se usa más; las métricas de las sesiones lo dirían.
- **C — Subir `MAX_OPCIONES` a 6 solo en las capas.** *Pro:* caben todas. *Contra:* 6 opciones en el arco de 90° quedan más juntas (menos de `SEPARACION_MIN` en celulares chicos, C-01) y el pulgar se equivoca más.

**Propuesta:** **A** por ahora, y revisar con las métricas de las sesiones (T-27) cuál se usa menos.

## 2. Zoom cambió de lugar las opciones del mapa (HM-12a)

**Problema.** Con Zoom, el mapa tiene 5 opciones y el abanico las reparte de nuevo (C-01, C-10). **Buscar sigue en la diagonal (135°)**, pero Mi ubicación pasa de 120° a 157,5°, Ofertas de 180° a 112,5° y Favoritos de 90° a 180°. Zoom queda **arriba (90°)**. Quien ya aprendió las posiciones tiene que volver a aprenderlas.

**A favor de dejarlo así:** en las capas, "Cerrar" también está a 90°; si alguien desliza hacia arriba por costumbre sin capa abierta, cae en Zoom, y soltar rápido ahí **no hace nada** (solo la pista).

**Opciones:** **A** — dejarlo así (propuesta); **B** — darle a Zoom otra prioridad para que otra opción quede arriba (cambia otras posiciones); **C** — sacar Zoom del abanico y activarlo de otra forma (vuelve la pregunta del zoom).
