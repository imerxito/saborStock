export interface HistorialMesa {
    id: number;
    idMesa: number;
    idComanda: number | null;
    idUsuario: number;
    estado: string;
    monto: number | null;
    motivo: string | null;
    fechaAccion: Date;
}

export interface CrearHistorialMesa {
    idMesa: number;
    idComanda?: number | null;
    idUsuario: number;
    estado: string;
    monto?: number | null;
    motivo?: string | null;
}

export interface HistorialMesaRow {
    id_historial_mesa: number;
    id_mesa: number;
    id_comanda: number | null;
    id_usuario: number;
    estado: string;
    monto: number | null;
    motivo: string | null;
    fecha_accion: string;
}

export interface FiltrosHistorialMesa {
    idMesa?: number;
    idComanda?: number;
}