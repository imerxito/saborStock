export interface Categoria {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
}

export interface CrearCategoria {
    nombre: string;
    descripcion?: string;
}

export interface ActualizarCategoria {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
}