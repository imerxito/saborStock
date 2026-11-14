export interface Ingrediente {
    id: number;
    codigo: string;
    nombre: string;
    idUnidad: number;
    idCategoriaIngrediente: number | null;
    stock: number;
    stockMinimo: number;
    stockMaximo: number;
    precioReferencia: number;
    caducidad: string | null;
    activo: boolean;
}

export interface CrearIngrediente {
    codigo: string;
    nombre: string;
    idUnidad: number;
    idCategoriaIngrediente?: number | null;
    stock?: number;
    stockMinimo?: number;
    stockMaximo?: number;
    precioReferencia?: number;
    caducidad?: string | null;
}

export interface ActualizarIngrediente {
    codigo?: string;
    nombre?: string;
    idUnidad?: number;
    idCategoriaIngrediente?: number | null;
    stock?: number;
    stockMinimo?: number;
    stockMaximo?: number;
    precioReferencia?: number;
    caducidad?: string | null;
}