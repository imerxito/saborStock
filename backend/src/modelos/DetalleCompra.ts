export interface DetalleCompra {
    id_compra: number;
    id_ingrediente: number;
    cantidad: number;
    precio_aplicado: number;
}

export interface CrearDetalleCompra {
    id_compra: number;
    id_ingrediente: number;
    cantidad: number;
    precio_aplicado: number;
}

export interface ActualizarDetalleCompra {
    cantidad?: number;
    precio_aplicado?: number;
}

export interface DetalleCompraRow {
    id_compra: number;
    id_ingrediente: number;
    cantidad: number;
    precio_aplicado: number;
}