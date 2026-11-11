import { TipoProducto } from './TipoProducto.js';
import { aNumero } from './mapeo.js';

export interface ProductoRow {
  id_producto: number;
  codigo: string;
  nombre: string;
  id_categoria: number;
  precio_venta: number | string;
  descripcion: string | null;
  activo: boolean;
  tipo: TipoProducto;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  idCategoria: number;
  precioVenta: number;
  descripcion: string | null;
  activo: boolean;
  tipo: TipoProducto;
}

export interface CrearProductoDTO {
  codigo: string;
  nombre: string;
  idCategoria: number;
  precioVenta: number;
  descripcion?: string | null;
  activo?: boolean;
  tipo?: TipoProducto;
}

export interface ActualizarProductoDTO {
  codigo?: string;
  nombre?: string;
  idCategoria?: number;
  precioVenta?: number;
  descripcion?: string | null;
  activo?: boolean;
  tipo?: TipoProducto;
}

export function mapProductoFromRow(row: ProductoRow): Producto {
  return {
    id: row.id_producto,
    codigo: row.codigo,
    nombre: row.nombre,
    idCategoria: row.id_categoria,
    precioVenta: aNumero(row.precio_venta),
    descripcion: row.descripcion,
    activo: row.activo,
    tipo: row.tipo,
  };
}
