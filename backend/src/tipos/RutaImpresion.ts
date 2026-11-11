export interface RutaImpresionRow {
  id_ruta: number;
  id_categoria: number;
  id_impresora: number | null;
}

export interface RutaImpresion {
  id: number;
  idCategoria: number;
  idImpresora: number | null;
}

export interface CrearRutaImpresionDTO {
  idCategoria: number;
  idImpresora?: number | null;
}

export interface ActualizarRutaImpresionDTO {
  idImpresora?: number | null;
}

export function mapRutaImpresionFromRow(row: RutaImpresionRow): RutaImpresion {
  return {
    id: row.id_ruta,
    idCategoria: row.id_categoria,
    idImpresora: row.id_impresora,
  };
}
