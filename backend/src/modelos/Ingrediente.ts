export interface Ingrediente {
    id_ingrediente: number;
    codigo: string;
    nombre: string;
    id_unidad: number;
    stock: number;
    stock_minimo: number;
    precio_referencia: number;
    activo: boolean;
}

export interface CrearIngrediente {
    codigo: string;
    nombre: string;
    id_unidad: number;
    stock?: number;
    stock_minimo?: number;
    precio_referencia?: number;
    activo?: boolean;
}

export interface ActualizarIngrediente {
    codigo?: string;
    nombre?: string;
    id_unidad?: number;
    stock?: number;
    stock_minimo?: number;
    precio_referencia?: number;
    activo?: boolean;
}

export interface IngredienteRow {
    id_ingrediente: number;
    codigo: string;
    nombre: string;
    id_unidad: number;
    stock: number;
    stock_minimo: number;
    precio_referencia: number;
    activo: boolean;
}
