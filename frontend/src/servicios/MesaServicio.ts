import { fetchJson } from "./api";
import type { MesaBackend, ProductoBackend } from "../tipos/Comanda";
import type { HistorialMesa } from "../tipos/HistorialMesa";

export interface SeccionBackend {
    id: number;
    nombre: string;
    orden: number;
    limiteMesas: number;
    numeroInicio: number;
}

export const MesaServicio = {
    async listarMesas(): Promise<MesaBackend[]> {
        return await fetchJson<MesaBackend[]>("/api/mesas");
    },

    async actualizarMesa(
        id: number,
        cambios: { estado?: string; numero?: number; idSeccion?: number; idUsuario?: number | null }
    ): Promise<void> {
        await fetchJson<unknown>(`/api/mesas/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios),
        });
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
        const data = await fetchJson<SeccionBackend[]>("/api/secciones");
        return [...data]
            .map((s) => ({
                ...s,
                orden: Number(s.orden ?? 0),
                limiteMesas: Number(s.limiteMesas ?? 20) || 20,
                numeroInicio: Number(s.numeroInicio ?? 0),
            }))
            .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
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
        return await fetchJson<ProductoBackend[]>("/api/productos");
    },

    async obtenerHistorial(filtros?: { idMesa?: number; idComanda?: number }): Promise<HistorialMesa[]> {
        const params = new URLSearchParams();
        if (filtros?.idMesa) params.append("idMesa", String(filtros.idMesa));
        if (filtros?.idComanda) params.append("idComanda", String(filtros.idComanda));
        const qs = params.toString() ? `?${params.toString()}` : "";
        return await fetchJson<HistorialMesa[]>(`/api/historial-mesas${qs}`);
    },
};
