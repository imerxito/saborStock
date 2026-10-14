export interface Receta {
    id_producto: number;
    id_ingrediente: number;
    cantidad: number;
}

export interface CrearReceta {
    id_producto: number;
    id_ingrediente: number;
    cantidad: number;
}

export interface ActualizarReceta {
    cantidad?: number;
}

export interface RecetaRow {
    id_producto: number;
    id_ingrediente: number;
    cantidad: number;
}