export interface DetalleComandaRow {
  id_detalle_comanda: number;
  id_comanda: number;
  id_producto: number;
  cantidad: number;
  nota: string | null;
}

export interface DetalleComanda {
  id: number;
  idComanda: number;
  idProducto: number;
  cantidad: number;
  nota: string | null;
}

export interface CrearDetalleComandaDTO {
  idComanda: number;
  idProducto: number;
  cantidad: number;
  nota?: string | null;
}

export interface ActualizarDetalleComandaDTO {
  cantidad?: number;
  nota?: string | null;
}

export function mapDetalleComandaFromRow(row: DetalleComandaRow): DetalleComanda {
  return {
    id: row.id_detalle_comanda,
    idComanda: row.id_comanda,
    idProducto: row.id_producto,
    cantidad: row.cantidad,
    nota: row.nota,
  };
}
