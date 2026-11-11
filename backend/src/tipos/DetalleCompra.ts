import { aNumero } from './mapeo.js';

export interface DetalleCompraRow {
  id_compra: number;
  id_ingrediente: number;
  cantidad: number | string;
  precio_aplicado: number | string;
}

export interface DetalleCompra {
  idCompra: number;
  idIngrediente: number;
  cantidad: number;
  precioAplicado: number;
}

export interface CrearDetalleCompraDTO {
  idCompra: number;
  idIngrediente: number;
  cantidad: number;
  precioAplicado: number;
}

export function mapDetalleCompraFromRow(row: DetalleCompraRow): DetalleCompra {
  return {
    idCompra: row.id_compra,
    idIngrediente: row.id_ingrediente,
    cantidad: aNumero(row.cantidad),
    precioAplicado: aNumero(row.precio_aplicado),
  };
}
