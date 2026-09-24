// Parámetros iniciales, ajustables con las pruebas (spec §6, v0.2).
// Los nombres son los mismos de la spec para poder rastrearlos.
// Las distancias van en px, los tiempos en ms y los ángulos en grados.

export type Params = {
  /** Diámetro del ancla en reposo. */
  D_REPOSO: number;
  /** Diámetro del ancla activa. */
  D_ACTIVO: number;
  /** Diámetro de cada opción (mínimo táctil). */
  D_OPCION: number;
  /** Escala de la opción preseleccionada. */
  ESCALA_PRESEL: number;
  /** Opacidad del fondo del ancla en reposo (0–1); el ícono siempre al 100 %. */
  OPACIDAD_REPOSO: number;
  /** Distancia al borde lateral, además del área segura (L-02). */
  MARGEN_LATERAL: number;
  /** Distancia MÍNIMA al borde inferior, además del área segura (piso del ancla). */
  MARGEN_INFERIOR: number;
  /**
   * Altura del centro del ancla sobre el borde inferior útil, como fracción del
   * alto útil (alto visible menos áreas seguras). 0 = lo más abajo posible.
   * Queda limitada para que el abanico quepa (HM-01).
   */
  ANCLA_ALTURA: number;
  /** Alto de la banda de etiqueta encima del abanico (HM-02). */
  BANDA_ALTO: number;
  /** Espacio entre la opción de más arriba y la banda de etiqueta (HM-02). */
  BANDA_MARGEN: number;
  /** Radio de la zona muerta. */
  R_MUERTA: number;
  /** Radio MÍNIMO del arco; el real se adapta al número de opciones (C-01). */
  R_ARCO: number;
  /** Espacio mínimo entre opciones vecinas a tamaño normal (C-01). */
  SEPARACION_MIN: number;
  /** R_EXTERIOR = radio adaptativo + EXTRA_EXTERIOR. */
  EXTRA_EXTERIOR: number;
  /** Inicio del arco para la mano derecha (90° = arriba). */
  ARCO_DESDE: number;
  /** Fin del arco para la mano derecha (180° = izquierda). La izquierda se refleja. */
  ARCO_HASTA: number;
  /** Tolerancia de los sectores extremos fuera del arco. */
  EXT_EXTREMOS: number;
  /** Grados extra que hay que pasar para cambiar de preselección. */
  HISTERESIS: number;
  /** Movimiento que distingue un toque de un gesto. */
  UMBRAL_MOV: number;
  /** Duración máxima de un toque. */
  T_TOQUE: number;
  /** Tiempo quieto para entrar en descanso. */
  T_DESCANSO: number;
  /** Cierre automático del modo toque. */
  T_INACTIVO: number;
  /** Duración del aviso con deshacer. */
  T_DESHACER: number;
  /** Duración de la animación de apertura y cierre. */
  T_ANIM: number;
  /** Duración de la vibración (solo Android). */
  VIB_MS: number;
  /** Usos en los que cada opción muestra su etiqueta (bienvenida). */
  USOS_ETIQUETA: number;
  /** Máximo de opciones, contando "Atrás". */
  MAX_OPCIONES: number;
  /** Si dos posiciones quedan igual de cerca de la diagonal, cuál gana (C-10). */
  DESEMPATE: Desempate;
};

/** "horizontal" = gana la más cercana al extremo lateral; "vertical" = la más cercana a "arriba". */
export type Desempate = "horizontal" | "vertical";

export const DEFAULT_PARAMS: Readonly<Params> = Object.freeze({
  D_REPOSO: 52,
  D_ACTIVO: 64,
  D_OPCION: 44,
  ESCALA_PRESEL: 1.25,
  OPACIDAD_REPOSO: 0.6,
  MARGEN_LATERAL: 24,
  MARGEN_INFERIOR: 16,
  ANCLA_ALTURA: 0.38,
  BANDA_ALTO: 28,
  BANDA_MARGEN: 8,
  R_MUERTA: 24,
  R_ARCO: 100,
  SEPARACION_MIN: 0,
  EXTRA_EXTERIOR: 48,
  ARCO_DESDE: 90,
  ARCO_HASTA: 180,
  EXT_EXTREMOS: 20,
  HISTERESIS: 8,
  UMBRAL_MOV: 10,
  T_TOQUE: 250,
  T_DESCANSO: 400,
  T_INACTIVO: 4000,
  T_DESHACER: 5000,
  T_ANIM: 140,
  VIB_MS: 10,
  USOS_ETIQUETA: 5,
  MAX_OPCIONES: 5,
  DESEMPATE: "horizontal",
});
