export type MetodoHist = "efectivo" | "tarjeta" | "transferencia";
export type TipoHist = "ingreso" | "egreso";

export interface HistorialCaja {
    id: number;
    idTurnoCaja: number;
    idUsuario: number;
    idFactura: number | null;
    metodoPago: MetodoHist;
    tipoPago: TipoHist;
    monto: number;
    descripcion: string | null;
    fechaMovimiento: string;
}

export interface CrearHistorialCaja {
    idTurnoCaja: number;
    idUsuario: number;
    idFactura?: number | null;
    metodoPago: MetodoHist;
    tipoPago: TipoHist;
    monto: number;
    descripcion?: string | null;
}