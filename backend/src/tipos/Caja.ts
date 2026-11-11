export interface CajaRow {
  id_caja: number;
  nombre: string | null;
  activo: boolean;
}

export interface Caja {
  id: number;
  nombre: string | null;
  activo: boolean;
}

export interface CrearCajaDTO {
  nombre?: string | null;
  activo?: boolean;
}

export interface ActualizarCajaDTO {
  nombre?: string | null;
  activo?: boolean;
}

export function mapCajaFromRow(row: CajaRow): Caja {
  return {
    id: row.id_caja,
    nombre: row.nombre,
    activo: row.activo,
  };
}
