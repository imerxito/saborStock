import { fetchJson } from "./api";
import type { Usuario, RolUsuario } from "../tipos/Usuario";

export interface CrearUsuarioPayload {
    nombre: string;
    correo: string;
    cedula: string;
    telefono: string;
    contrasena: string;
    rol: RolUsuario;
    activo?: boolean;
}

export interface ActualizarUsuarioPayload {
    nombre?: string;
    correo?: string;
    cedula?: string;
    telefono?: string;
    contrasena?: string;
    rol?: RolUsuario;
    activo?: boolean;
}

export const UsuarioServicio = {
    async listar(): Promise<Usuario[]> {
        return await fetchJson<Usuario[]>("/api/usuarios");
    },

    async obtenerPorId(id: string): Promise<Usuario> {
        return await fetchJson<Usuario>(`/api/usuarios/${id}`);
    },

    async crear(datos: CrearUsuarioPayload): Promise<Usuario> {
        return await fetchJson<Usuario>("/api/usuarios", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async actualizar(id: string, cambios: ActualizarUsuarioPayload): Promise<Usuario> {
        return await fetchJson<Usuario>(`/api/usuarios/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios),
        });
    },

    async activar(id: string): Promise<Usuario> {
        return await fetchJson<Usuario>(`/api/usuarios/${id}/activar`, {
            method: "PATCH",
        });
    },

    async desactivar(id: string): Promise<Usuario> {
        return await fetchJson<Usuario>(`/api/usuarios/${id}/desactivar`, {
            method: "PATCH",
        });
    },

    async alternarActivo(id: string, nuevoEstado: boolean): Promise<Usuario> {
        if (nuevoEstado) {
            return await this.activar(id);
        } else {
            return await this.desactivar(id);
        }
    },
};
