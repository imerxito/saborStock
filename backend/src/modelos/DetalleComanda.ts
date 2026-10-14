export interface DetalleComanda {
    id: number;
    idComanda: number;
    idProducto: number;
    cantidad: number;
    nota: string | null;
}

export interface CrearDetalleComanda {
    idComanda: number;
    idProducto: number;
    cantidad: number;
    nota?: string | null;
}

export interface ActualizarDetalleComanda {
    idProducto?: number;
    cantidad?: number;
    nota?: string | null;
}

export interface DetalleComandaRow {
    id_detalle_comanda: number;
    id_comanda: number;
    id_producto: number;
    cantidad: number;
    nota: string | null;
}