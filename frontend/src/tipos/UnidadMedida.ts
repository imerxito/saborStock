export interface UnidadMedida {
    id: number;
    nombre: string;
    abreviatura: string;
    descripcion: string | null;
    activo: boolean;
}

export interface CrearUnidadMedida {
    nombre: string;
    abreviatura: string;
    descripcion?: string;
}

export interface ActualizarUnidadMedida {
    nombre?: string;
    abreviatura?: string;
    descripcion?: string;
    activo?: boolean;
}