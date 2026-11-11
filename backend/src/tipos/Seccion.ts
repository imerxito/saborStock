export interface SeccionRow {
  id_seccion: number;
  nombre: string;
  orden: number;
  limite_mesas: number;
}

export interface Seccion {
  id: number;
  nombre: string;
  orden: number;
  limiteMesas: number;
}

export interface CrearSeccionDTO {
  nombre: string;
  orden?: number;
  limiteMesas?: number;
}

export interface ActualizarSeccionDTO {
  nombre?: string;
  orden?: number;
  limiteMesas?: number;
}

export function mapSeccionFromRow(row: SeccionRow): Seccion {
  return {
    id: row.id_seccion,
    nombre: row.nombre,
    orden: row.orden,
    limiteMesas: row.limite_mesas,
  };
}
