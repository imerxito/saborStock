export type EstadoMesaHist = "Libre" | "Disponible" | "Ocupada" | "Reservada" | "Pagando";

export interface HistorialMesa {
    id: number;
    idMesa: number;
    idVenta: number | null;
    idUsuario: number;
    estado: EstadoMesaHist;
    monto: number | null;
    motivo: string | null;
    fechaAccion: string;
}

export interface CrearHistorialMesa {
    idMesa: number;
    idVenta?: number | null;
    idUsuario: number;
    estado: EstadoMesaHist;
    monto?: number | null;
    motivo?: string | null;
}