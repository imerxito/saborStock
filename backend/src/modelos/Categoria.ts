export interface Categoria {
    id: number | string;
    id_categoria?: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
}

export interface CrearCategoriaDTO {
    nombre: string;
    descripcion?: string;
}

export interface ActualizarCategoriaDTO {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
}
