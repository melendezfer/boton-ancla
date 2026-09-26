// Puente entre el abanico del mapa (Zoom, HM-12a) y el mapa falso, que guarda su zoom en
// refs para no redibujar React en cada cuadro. El mapa se registra al montarse.

type ControlMapa = {
  /** Multiplica el zoom por `factor` alrededor de `centro` (en pantalla; por defecto, el centro). */
  acercar: (factor: number, centro?: { x: number; y: number }) => void;
};

let actual: ControlMapa | null = null;

export function registrarMapa(control: ControlMapa | null) {
  actual = control;
}

export function acercarMapa(factor: number, centro?: { x: number; y: number }) {
  actual?.acercar(factor, centro);
}

/** RF-20: `paso` del deslizador (px de la curva, + = pulgar arriba) → factor de zoom. */
export function factorDePaso(paso: number): number {
  return Math.exp(paso / 800);
}
