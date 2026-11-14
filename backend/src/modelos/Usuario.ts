// modelos/Usuario.ts
import { RolUsuario } from "./RolUsuario.js";

export interface Usuario {
    id: string;              
    idUsuario?: number;
    nombre: string;
    correo: string;
    rol: RolUsuario;
    cedula: string;
    telefono: string;
    fechaRegistro: Date;
    activo: boolean;
}

export interface CrearUsuario {
    nombre: string;
    correo: string;
    contrasena: string;
    rol?: RolUsuario;
    cedula: string;
    telefono?: string;
}

export interface ActualizarUsuario {
    nombre?: string;
    rol?: RolUsuario;
    activo?: boolean;
    cedula?: string;
    telefono?: string;
    correo?: string;
}

export interface UsuarioRow {
    id_usuario: number;
    auth_id: string;
    nombre: string;
    cedula: string;
    telefono: string | null;
    correo: string;
    rol: RolUsuario;
    fecha_inicio?: string;
    fecha_registro?: string;
    activo: boolean;
}
