import { fetchJson } from "./api";
import type { MesaBackend, ProductoBackend } from "../tipos/Comanda";

export interface SeccionBackend {
    id: number;
    nombre: string;
}

export const MesaServicio = {
    async listarMesas(): Promise<MesaBackend[]> {
        try {
            return await fetchJson<MesaBackend[]>("/api/mesas");
        } catch (error) {
            console.warn("No se pudo obtener mesas del backend, usando datos por defecto:", error);
            return [
                { id: 1, numero: 1, estado: "Libre", idSeccion: 1, idUsuario: null, seccionNombre: "Salón Principal" },
                { id: 2, numero: 2, estado: "Libre", idSeccion: 1, idUsuario: null, seccionNombre: "Salón Principal" },
                { id: 3, numero: 3, estado: "Libre", idSeccion: 1, idUsuario: null, seccionNombre: "Salón Principal" },
                { id: 4, numero: 4, estado: "Libre", idSeccion: 2, idUsuario: null, seccionNombre: "Piscina" },
                { id: 5, numero: 5, estado: "Libre", idSeccion: 2, idUsuario: null, seccionNombre: "Piscina" },
                { id: 6, numero: 6, estado: "Libre", idSeccion: 3, idUsuario: null, seccionNombre: "Terraza" },
                { id: 7, numero: 7, estado: "Libre", idSeccion: 3, idUsuario: null, seccionNombre: "Terraza" },
                { id: 8, numero: 8, estado: "Libre", idSeccion: 4, idUsuario: null, seccionNombre: "VIP" },
            ];
        }
    },

    async actualizarMesa(
        id: number,
        cambios: { estado?: string; numero?: number; idSeccion?: number; idUsuario?: number | null }
    ): Promise<void> {
        try {
            await fetchJson<unknown>(`/api/mesas/${id}`, {
                method: "PUT",
                body: JSON.stringify(cambios),
            });
        } catch (error) {
            console.warn(`Error al actualizar mesa #${id} en el backend:`, error);
        }
    },

    async crearMesa(datos: {
        numero: number;
        idSeccion: number;
        estado?: string;
        idUsuario?: number | null;
    }): Promise<MesaBackend> {
        return await fetchJson<MesaBackend>("/api/mesas", {
            method: "POST",
            body: JSON.stringify({
                ...datos,
                idUsuario: datos.idUsuario ?? null,
            }),
        });
    },

    async obtenerSecciones(): Promise<SeccionBackend[]> {
        try {
            return await fetchJson<SeccionBackend[]>("/api/secciones");
        } catch (error) {
            console.warn("No se pudieron obtener secciones del backend:", error);
            return [
                { id: 1, nombre: "Salón Principal" },
                { id: 2, nombre: "Piscina" },
                { id: 3, nombre: "Terraza" },
                { id: 4, nombre: "VIP" },
            ];
        }
    },

    async obtenerProductos(): Promise<ProductoBackend[]> {
        try {
            return await fetchJson<ProductoBackend[]>("/api/productos");
        } catch (error) {
            console.warn("No se pudieron obtener productos del backend:", error);
            return [];
        }
    },
};
