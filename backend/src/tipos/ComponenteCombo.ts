export interface ComponenteComboRow {
  id_combo: number;
  id_producto_hijo: number;
  cantidad: number;
}

export interface ComponenteCombo {
  idCombo: number;
  idProductoHijo: number;
  cantidad: number;
}

export interface CrearComponenteComboDTO {
  idCombo: number;
  idProductoHijo: number;
  cantidad?: number;
}

export interface ActualizarComponenteComboDTO {
  cantidad?: number;
}

export function mapComponenteComboFromRow(row: ComponenteComboRow): ComponenteCombo {
  return {
    idCombo: row.id_combo,
    idProductoHijo: row.id_producto_hijo,
    cantidad: row.cantidad,
  };
}
