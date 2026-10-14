export interface Factura {
    id: number;
    idMesa: number;
    idUsuario: number;
    fechaEmision: Date;
    subtotal: number;
    propina: number;
    totalPagar: number;
}

export interface CrearFactura {
    idMesa: number;
    idUsuario: number;
    subtotal?: number;
    propina?: number;
}

export interface ActualizarFactura {
    idMesa?: number;
    idUsuario?: number;
    subtotal?: number;
    propina?: number;
}

export interface FacturaRow {
    id_factura: number;
    id_mesa: number;
    id_usuario: number;
    fecha_emision: string;
    subtotal: number;
    propina: number;
    total_pagar: number;
}