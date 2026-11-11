import { aNumero } from './mapeo.js';

export interface DetalleFacturaRow {
  id_detalle_factura: number;
  id_factura: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
}

export interface DetalleFactura {
  id: number;
  idFactura: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CrearDetalleFacturaDTO {
  idFactura: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
}

export function mapDetalleFacturaFromRow(row: DetalleFacturaRow): DetalleFactura {
  return {
    id: row.id_detalle_factura,
    idFactura: row.id_factura,
    idProducto: row.id_producto,
    cantidad: row.cantidad,
    precioUnitario: aNumero(row.precio_unitario),
    subtotal: aNumero(row.subtotal),
  };
}
