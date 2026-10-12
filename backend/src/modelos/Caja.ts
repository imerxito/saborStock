export interface Caja {
    id: number;
    nombre: string;
    activo: boolean;
}

export interface CrearCaja {
    nombre: string;
}

export interface ActualizarCaja {
    nombre?: string;
    activo?: boolean;
}
