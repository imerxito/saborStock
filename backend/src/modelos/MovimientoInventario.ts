export interface MovimientoInventario {
    id_movimiento: number;
    id_ingrediente: number;
    tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
    cantidad: number;
    fecha: string;
    motivo: string;
}

export interface CrearMovimientoInventario {
    id_ingrediente: number;
    tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
    cantidad: number;
    motivo: string;
    fecha?: string;
}

export interface MovimientoInventarioRow {
    id_movimiento: number;
    id_ingrediente: number;
    tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
    cantidad: number;
    fecha: string;
    motivo: string;
}