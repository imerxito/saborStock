export interface CategoriaRow {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CrearCategoriaDTO {
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface ActualizarCategoriaDTO {
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
}

export function mapCategoriaFromRow(row: CategoriaRow): Categoria {
  return {
    id: row.id_categoria,
    nombre: row.nombre,
    descripcion: row.descripcion,
    activo: row.activo,
  };
}
