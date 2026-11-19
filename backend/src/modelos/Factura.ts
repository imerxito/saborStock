import { MetodoPago } from "../tipos/MetodoPago.js";
import { EstadoFactura } from "../tipos/EstadoFactura.js";
import { aFecha, aNumero, aNumeroNull } from "../tipos/mapeo.js";

export interface FacturaDetalleItem {
    id: number;
    idProducto: number;
    nombre: string;
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
    fechaEmision: Date;
    subtotal: number;
    descuento: number;
    propina: number;
    totalPagar: number;
    metodoPago: MetodoPago;
    montoEfectivo: number | null;
    montoTarjeta: number | null;
    montoTransferencia: number | null;
    estado: EstadoFactura;
    detalles?: FacturaDetalleItem[];
    usuarioNombre?: string | null;
    mesaNumero?: number | null;
    seccionNombre?: string | null;
}

export interface CrearFactura {
    idVenta?: number | null;
    idMesa?: number | null;
    idUsuario: number;
    cliente?: string;
    subtotal?: number;
    descuento?: number;
    propina?: number;
    metodoPago?: MetodoPago;
    montoEfectivo?: number | null;
    montoTarjeta?: number | null;
    montoTransferencia?: number | null;
    estado?: EstadoFactura;
}

export interface ActualizarFactura {
    idVenta?: number | null;
    idMesa?: number | null;
    idUsuario?: number;
    cliente?: string;
    subtotal?: number;
    descuento?: number;
    propina?: number;
    totalPagar?: number;
    metodoPago?: MetodoPago;
    montoEfectivo?: number | null;
    montoTarjeta?: number | null;
    montoTransferencia?: number | null;
    estado?: EstadoFactura;
}

export interface FacturaRow {
    id_factura: number;
    id_venta: number | null;
    id_mesa: number | null;
    id_usuario: number;
    cliente: string;
    fecha_emision: string;
    subtotal: number | string;
    descuento: number | string;
    propina: number | string;
    total_pagar: number | string;
    metodo_pago: MetodoPago;
    monto_efectivo: number | string | null;
    monto_tarjeta: number | string | null;
    monto_transferencia: number | string | null;
    estado: EstadoFactura;
    detalle_factura?: any[];
}

export function mapFacturaFromRow(row: FacturaRow): Factura {
    const detalles: FacturaDetalleItem[] = Array.isArray(row.detalle_factura)
        ? row.detalle_factura.map((d: any) => ({
            id: d.id_detalle_factura,
            idProducto: d.id_producto,
            nombre: d.producto?.nombre || `Producto #${d.id_producto}`,
            cantidad: Number(d.cantidad) || 1,
            precioUnitario: Number(d.precio_unitario) || 0,
            subtotal: Number(d.subtotal) || 0,
        }))
        : [];

    return {
        id: row.id_factura,
        idVenta: row.id_venta,
        idMesa: row.id_mesa,
        idUsuario: row.id_usuario,
        cliente: row.cliente,
        fechaEmision: aFecha(row.fecha_emision),
        subtotal: aNumero(row.subtotal),
        descuento: aNumero(row.descuento),
        propina: aNumero(row.propina),
        totalPagar: aNumero(row.total_pagar),
        metodoPago: row.metodo_pago,
        montoEfectivo: aNumeroNull(row.monto_efectivo),
        montoTarjeta: aNumeroNull(row.monto_tarjeta),
        montoTransferencia: aNumeroNull(row.monto_transferencia),
        estado: row.estado,
        detalles,
        usuarioNombre: (row as any).usuario?.nombre || null,
        mesaNumero: (row as any).mesa?.numero ?? (row as any).venta?.mesa?.numero ?? null,
        seccionNombre: (row as any).mesa?.seccion?.nombre ?? (row as any).venta?.mesa?.seccion?.nombre ?? null,
    };
}
