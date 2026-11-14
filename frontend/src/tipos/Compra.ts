export type EstadoCompra = "REGISTRADA" | "RECIBIDA" | "ANULADA";

export interface DetalleCompra {
    idCompra: number;
    idIngrediente: number;
    cantidad: number;
    precioAplicado: number;
}

export interface Compra {
    id: number;
    idProveedor: number;
    fecha: string;
    estado: EstadoCompra;
    total: number;
    factura: string | null;
    detalles?: DetalleCompra[];
}

export interface CrearCompra {
    idProveedor: number;
    factura?: string | null;
    estado?: EstadoCompra;
    detalles: Array<{ idIngrediente: number; cantidad: number; precioAplicado: number }>;
}

export interface ActualizarCompra {
    idProveedor?: number;
    estado?: EstadoCompra;
    factura?: string | null;
}