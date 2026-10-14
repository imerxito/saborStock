export interface DetalleFactura {
    id: number;
    idFactura: number;
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface CrearDetalleFactura {
    idFactura: number;
    idProducto: number;
    cantidad: number;
    precioUnitario?: number;
}

export interface ActualizarDetalleFactura {
    idProducto?: number;
    cantidad?: number;
    precioUnitario?: number;
}

export interface DetalleFacturaRow {
    id_detalle_factura: number;
    id_factura: number;
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}