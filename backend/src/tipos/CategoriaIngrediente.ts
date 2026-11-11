export interface CategoriaIngredienteRow {
  id_categoria_ingrediente: number;
  nombre: string;
  activo: boolean;
}

export interface CategoriaIngrediente {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CrearCategoriaIngredienteDTO {
  nombre: string;
  activo?: boolean;
}

export interface ActualizarCategoriaIngredienteDTO {
  nombre?: string;
  activo?: boolean;
}

export function mapCategoriaIngredienteFromRow(row: CategoriaIngredienteRow): CategoriaIngrediente {
  return {
    id: row.id_categoria_ingrediente,
    nombre: row.nombre,
    activo: row.activo,
  };
}
