export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "mixto";
export type EstadoFactura = "Pagada" | "Pendiente" | "Anulada";

export interface DetalleFactura {
    id: number;
    idFactura: number;
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface Factura {
    id: number;
    idVenta: number | null;
    idMesa: number | null;
    idUsuario: number;
    cliente: string;
    fechaEmision: string;
    subtotal: number;
    descuento: number;
    propina: number;
    totalPagar: number;
    metodoPago: MetodoPago;
    montoEfectivo: number;
    montoTarjeta: number;
    montoTransferencia: number;
    estado: EstadoFactura;
    detalles?: DetalleFactura[];
}

export interface CrearDetalleFactura {
    idFactura?: number;
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
}

export interface CrearFactura {
    idVenta?: number | null;
    idMesa?: number | null;
    idUsuario: number;
    cliente?: string;
    descuento?: number;
    propina?: number;
    metodoPago: MetodoPago;
    montoEfectivo?: number;
    montoTarjeta?: number;
    montoTransferencia?: number;
    detalles: Array<{ idProducto: number; cantidad: number; precioUnitario: number }>;
}