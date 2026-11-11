import { aNumero } from './mapeo.js';

export interface IngredienteRow {
  id_ingrediente: number;
  codigo: string;
  nombre: string;
  id_unidad: number;
  id_categoria_ingrediente: number | null;
  stock: number | string;
  stock_minimo: number | string;
  stock_maximo: number | string;
  precio_referencia: number | string;
  caducidad: string | null;
  activo: boolean;
}

export interface Ingrediente {
  id: number;
  codigo: string;
  nombre: string;
  idUnidad: number;
  idCategoriaIngrediente: number | null;
  stock: number;
  stockMinimo: number;
  stockMaximo: number;
  precioReferencia: number;
  caducidad: string | null;
  activo: boolean;
}

export interface CrearIngredienteDTO {
  codigo: string;
  nombre: string;
  idUnidad: number;
  idCategoriaIngrediente?: number | null;
  stock?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  precioReferencia?: number;
  caducidad?: string | null;
  activo?: boolean;
}

export interface ActualizarIngredienteDTO {
  codigo?: string;
  nombre?: string;
  idUnidad?: number;
  idCategoriaIngrediente?: number | null;
  stock?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  precioReferencia?: number;
  caducidad?: string | null;
  activo?: boolean;
}

export function mapIngredienteFromRow(row: IngredienteRow): Ingrediente {
  return {
    id: row.id_ingrediente,
    codigo: row.codigo,
    nombre: row.nombre,
    idUnidad: row.id_unidad,
    idCategoriaIngrediente: row.id_categoria_ingrediente,
    stock: aNumero(row.stock),
    stockMinimo: aNumero(row.stock_minimo),
    stockMaximo: aNumero(row.stock_maximo),
    precioReferencia: aNumero(row.precio_referencia),
    caducidad: row.caducidad,
    activo: row.activo,
  };
}
