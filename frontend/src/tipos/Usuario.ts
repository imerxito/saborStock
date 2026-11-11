// tipos/Usuario.tsx

export type RolUsuario = 'Dueno' | 'Administrador' | 'Cocinero' | 'Caja' | 'Mesero';

export interface Usuario {
    id: string;
    nombre: string;
    correo: string;
    cedula: string;
    telefono: string;
    rol: RolUsuario;
    fechaRegistro: string;
    activo: boolean;
}

export interface DatosRegistrados {
    nombre: string;
    correo: string;      // 👈 Corregido (antes String)
    contrasena: string;
    cedula: string;
    telefono?: string;
    rol?: RolUsuario;
}

export interface DatosLogin {
    correo: string;
    contrasena: string;
}

export interface RespuestaAuth {
    usuario: Usuario;
    token: string;
}