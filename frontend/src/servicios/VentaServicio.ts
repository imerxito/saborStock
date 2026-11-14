import { fetchJson } from "./api";
import type { ActualizarVenta, CrearVenta, Venta } from "../tipos/Venta";

export const VentaServicio = {
    async listar(): Promise<Venta[]> {
        return await fetchJson<Venta[]>("/api/ventas");
    },

    async obtenerPorId(id: number): Promise<Venta> {
        return await fetchJson<Venta>(`/api/ventas/${id}`);
    },

    async listarPorMesa(idMesa: number): Promise<Venta[]> {
        return await fetchJson<Venta[]>(`/api/ventas/mesa/${idMesa}`);
    },

    async crear(datos: CrearVenta): Promise<Venta> {
        return await fetchJson<Venta>("/api/ventas", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async actualizar(id: number, cambios: ActualizarVenta): Promise<Venta> {
        return await fetchJson<Venta>(`/api/ventas/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios),
        });
    },

    async cerrar(id: number): Promise<void> {
        await fetchJson<{ mensaje: string }>(`/api/ventas/${id}/cerrar`, {
            method: "PATCH",
        });
    },

    async anular(id: number): Promise<void> {
        await fetchJson<{ mensaje: string }>(`/api/ventas/${id}/anular`, {
            method: "PATCH",
        });
    },
};