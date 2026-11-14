export interface Receta {
    idProducto: number;
    idIngrediente: number;
    cantidad: number;
}

export interface CrearReceta {
    idProducto: number;
    idIngrediente: number;
    cantidad: number;
}

export interface ActualizarReceta {
    cantidad?: number;
}