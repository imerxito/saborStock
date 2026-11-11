import { aNumero } from './mapeo.js';

export interface RecetaRow {
  id_producto: number;
  id_ingrediente: number;
  cantidad: number | string;
}

export interface Receta {
  idProducto: number;
  idIngrediente: number;
  cantidad: number;
}

export interface CrearRecetaDTO {
  idProducto: number;
  idIngrediente: number;
  cantidad: number;
}

export interface ActualizarRecetaDTO {
  cantidad: number;
}

export function mapRecetaFromRow(row: RecetaRow): Receta {
  return {
    idProducto: row.id_producto,
    idIngrediente: row.id_ingrediente,
    cantidad: aNumero(row.cantidad),
  };
}
