export type EstadoVenta = "Abierta" | "Pagada" | "Anulada";

export interface Venta {
    id: number;
    idMesa: number | null;
    cliente: string;
    personas: number;
    idUsuario: number | null;
    estado: EstadoVenta;
    fechaApertura: string;
    fechaCierre: string | null;
    observacion: string | null;
}

export interface CrearVenta {
    idMesa?: number | null;
    cliente?: string;
    personas?: number;
    idUsuario?: number | null;
    observacion?: string | null;
}

export interface ActualizarVenta {
    cliente?: string;
    personas?: number;
    estado?: EstadoVenta;
    fechaCierre?: string | null;
    observacion?: string | null;
}