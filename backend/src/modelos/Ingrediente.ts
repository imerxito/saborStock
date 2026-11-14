export interface Ingrediente {
    id_ingrediente: number;
    codigo: string;
    nombre: string;
    id_unidad: number;
    id_categoria_ingrediente: number | null;
    stock: number;
    stock_minimo: number;
    stock_maximo: number;
    precio_referencia: number;
    caducidad: string | null;
    activo: boolean;
}

export interface CrearIngrediente {
    codigo: string;
    nombre: string;
    id_unidad: number;
    id_categoria_ingrediente?: number | null;
    stock?: number;
    stock_minimo?: number;
    stock_maximo?: number;
    precio_referencia?: number;
    caducidad?: string | null;
    activo?: boolean;
}

export interface ActualizarIngrediente {
    codigo?: string;
    nombre?: string;
    id_unidad?: number;
    id_categoria_ingrediente?: number | null;
    stock?: number;
    stock_minimo?: number;
    stock_maximo?: number;
    precio_referencia?: number;
    caducidad?: string | null;
    activo?: boolean;
}

export interface IngredienteRow {
    id_ingrediente: number;
    codigo: string;
    nombre: string;
    id_unidad: number;
    id_categoria_ingrediente?: number | null;
    stock: number;
    stock_minimo: number;
    stock_maximo?: number;
    precio_referencia: number;
    caducidad?: string | null;
    activo: boolean;
}
