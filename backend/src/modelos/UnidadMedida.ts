export interface UnidadMedida {
    id:string;
    nombre:string;
    abreviatura:string;
    descripcion?:string;
    activo:boolean;
}

export interface CrearUnidadMedidaDTO {
    nombre:string;
    abreviatura:string;
    descripcion?:string;
}

export interface ActualizarUnidadMedidaDTO {
    nombre?:string;
    abreviatura?:string;
    descripcion?:string;
    activo?:boolean;
}