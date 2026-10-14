export interface HistorialCaja {
    id: number;
    idTurnoCaja: number;
    idUsuario: number;
    idFactura: number | null;
    metodoPago: string;
    tipoPago: string;
    monto: number;
    descripcion: string | null;
    fechaMovimiento: Date;
}

export interface CrearHistorialCaja {
    idTurnoCaja: number;
    idUsuario: number;
    idFactura?: number | null;
    metodoPago: string;
    tipoPago: string;
    monto: number;
    descripcion?: string | null;
}

export interface HistorialCajaRow {
    id_historial_caja: number;
    id_turno_caja: number;
    id_usuario: number;
    id_factura: number | null;
    metodo_pago: string;
    tipo_pago: string;
    monto: number;
    descripcion: string | null;
    fecha_movimiento: string;
}

export interface FiltrosHistorialCaja {
    idTurnoCaja?: number;
    idFactura?: number;
}