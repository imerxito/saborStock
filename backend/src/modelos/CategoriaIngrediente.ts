export interface CategoriaIngrediente {
    id_categoria_ingrediente: number;
    nombre: string;
    activo: boolean;
}

export interface CategoriaIngredienteDto {
    id: number;
    nombre: string;
    activo: boolean;
}

export interface CrearCategoriaIngrediente {
    nombre: string;
    activo?: boolean;
}

export interface ActualizarCategoriaIngrediente {
    nombre?: string;
    activo?: boolean;
}

export interface CrearCategoriaIngredienteDTO {
    nombre: string;
}

export interface ActualizarCategoriaIngredienteDTO {
    nombre?: string;
}

export interface CategoriaIngredienteRow {
    id_categoria_ingrediente: number;
    nombre: string;
    activo: boolean;
}
