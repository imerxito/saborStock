export interface Categoria {
    id:string;
    nombre:string;
    descripcion?:string;
    activo:boolean;
}

export interface CrearCategoriaDTO {
    nombre:string;
    descripcion?:string;
}

export interface ActualizarCategoriaDTO {
    nombre?:string;
    descripcion?:string;
    activo?:boolean;
}