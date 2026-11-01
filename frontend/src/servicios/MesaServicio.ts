import { fetchJson } from "./api";
import type { MesaBackend, ProductoBackend } from "../tipos/Comanda";

export interface SeccionBackend {
    id: number;
    nombre: string;
    orden: number;
    limiteMesas: number;
    numeroInicio: number;
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
            const data = await fetchJson<SeccionBackend[]>("/api/secciones");
            return [...data]
                .map((s) => ({
                    ...s,
                    orden: Number(s.orden ?? 0),
                    limiteMesas: Number(s.limiteMesas ?? 20) || 20,
                    numeroInicio: Number(s.numeroInicio ?? 0),
                }))
                .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
        } catch (error) {
            console.warn("No se pudieron obtener secciones del backend:", error);
            return [
                { id: 1, nombre: "Salón Principal", orden: 1, limiteMesas: 20, numeroInicio: 1 },
                { id: 2, nombre: "Piscina", orden: 2, limiteMesas: 20, numeroInicio: 21 },
                { id: 3, nombre: "Terraza", orden: 3, limiteMesas: 20, numeroInicio: 41 },
                { id: 4, nombre: "VIP", orden: 4, limiteMesas: 20, numeroInicio: 61 },
            ];
        }
    },

    async crearSeccion(datos: {
        nombre: string;
        orden?: number;
        limiteMesas?: number;
        numeroInicio?: number;
    }): Promise<SeccionBackend> {
        return await fetchJson<SeccionBackend>("/api/secciones", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async actualizarSeccion(
        id: number,
        cambios: { nombre?: string; orden?: number; limiteMesas?: number; numeroInicio?: number }
    ): Promise<SeccionBackend> {
        return await fetchJson<SeccionBackend>(`/api/secciones/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios),
        });
    },

    async eliminarSeccion(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/secciones/${id}`, { method: "DELETE" });
    },

    async crearMesasLote(datos: {
        idSeccion: number;
        cantidad: number;
        numeroInicial?: number;
    }): Promise<MesaBackend[]> {
        return await fetchJson<MesaBackend[]>("/api/mesas/lote", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async moverMesa(id: number, idSeccion: number): Promise<MesaBackend> {
        return await fetchJson<MesaBackend>(`/api/mesas/${id}`, {
            method: "PUT",
            body: JSON.stringify({ idSeccion }),
        });
    },

    async eliminarMesa(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/mesas/${id}`, { method: "DELETE" });
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
