export interface UnidadMedidaRow {
  id_unidad: number;
  nombre: string;
  abreviatura: string;
  descripcion: string | null;
  activo: boolean;
}

export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CrearUnidadMedidaDTO {
  nombre: string;
  abreviatura: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface ActualizarUnidadMedidaDTO {
  nombre?: string;
  abreviatura?: string;
  descripcion?: string | null;
  activo?: boolean;
}

export function mapUnidadMedidaFromRow(row: UnidadMedidaRow): UnidadMedida {
  return {
    id: row.id_unidad,
    nombre: row.nombre,
    abreviatura: row.abreviatura,
    descripcion: row.descripcion,
    activo: row.activo,
  };
}
