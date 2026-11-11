import { RolUsuario } from './RolUsuario.js';
import { aFecha } from './mapeo.js';

export interface UsuarioRow {
  id_usuario: number;
  auth_id: string | null;
  nombre: string;
  cedula: string;
  telefono: string | null;
  correo: string;
  rol: RolUsuario;
  fecha_registro: string;
  activo: boolean;
}

export interface Usuario {
  id: number;
  authId: string | null;
  nombre: string;
  cedula: string;
  telefono: string | null;
  correo: string;
  rol: RolUsuario;
  fechaRegistro: Date;
  activo: boolean;
}

export interface CrearUsuarioDTO {
  authId?: string | null;
  nombre: string;
  cedula: string;
  telefono?: string | null;
  correo: string;
  rol?: RolUsuario;
  activo?: boolean;
}

export interface ActualizarUsuarioDTO {
  authId?: string | null;
  nombre?: string;
  cedula?: string;
  telefono?: string | null;
  correo?: string;
  rol?: RolUsuario;
  activo?: boolean;
}

export function mapUsuarioFromRow(row: UsuarioRow): Usuario {
  return {
    id: row.id_usuario,
    authId: row.auth_id,
    nombre: row.nombre,
    cedula: row.cedula,
    telefono: row.telefono,
    correo: row.correo,
    rol: row.rol,
    fechaRegistro: aFecha(row.fecha_registro),
    activo: row.activo,
  };
}
