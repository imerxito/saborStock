import {RolUsuario} from "./RolUsuario.js";

//Vista de usuario
export interface Usuario {
    id:string;
    nombre:string;
    correo:string;
    rol:RolUsuario;
    cedula:string;
    telefono:string;
    fechaRegistro:Date;
    activo:boolean;  
}

//crear usuario en la base de datos
export interface CrearUsuario{
    nombre:string;
    correo:string;
    rol:RolUsuario;
    cedula:string;
    telefono?:string;
    fechaRegistro:Date; 
}


export interface ActualizarUsuario{
    nombre?:string;
    rol?:RolUsuario;
    activo?:boolean;
}

export interface UsuarioRow{
    id:string;
    nombre:string;
    correo:string;
    cedula:string;
    telefono:string;
    rol:RolUsuario;
    activo:boolean;
    fechaRegistro:Date;
}