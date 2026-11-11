import { EstadoCompra } from './EstadoCompra.js';
import { aFecha, aNumero } from './mapeo.js';

export interface CompraRow {
  id_compra: number;
  id_proveedor: number;
  fecha: string;
  estado: EstadoCompra;
  total: number | string;
  factura: string | null;
}

export interface Compra {
  id: number;
  idProveedor: number;
  fecha: Date;
  estado: EstadoCompra;
  total: number;
  factura: string | null;
}

export interface CrearCompraDTO {
  idProveedor: number;
  factura?: string | null;
}

export interface ActualizarCompraDTO {
  estado?: EstadoCompra;
  factura?: string | null;
}

export function mapCompraFromRow(row: CompraRow): Compra {
  return {
    id: row.id_compra,
    idProveedor: row.id_proveedor,
    fecha: aFecha(row.fecha),
    estado: row.estado,
    total: aNumero(row.total),
    factura: row.factura,
  };
}
