export type TipoMovimiento = "ENTRADA" | "SALIDA" | "AJUSTE";

export interface MovimientoInventario {
    id: number;
    idIngrediente: number;
    tipo: TipoMovimiento;
    cantidad: number;
    fecha: string;
    motivo: string;
}

export interface CrearMovimiento {
    idIngrediente: number;
    tipo: TipoMovimiento;
    cantidad: number;
    motivo: string;
}