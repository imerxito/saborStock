import { fetchJson } from "./api";
import type { CrearFactura, Factura } from "../tipos/Factura";

export const FacturaServicio = {
    async listar(): Promise<Factura[]> {
        return await fetchJson<Factura[]>("/api/facturas");
    },

    async obtenerPorId(id: number): Promise<Factura> {
        return await fetchJson<Factura>(`/api/facturas/${id}`);
    },

    async crear(datos: CrearFactura): Promise<Factura> {
        return await fetchJson<Factura>("/api/facturas", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async actualizar(id: number, cambios: Partial<Factura>): Promise<Factura> {
        return await fetchJson<Factura>(`/api/facturas/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios),
        });
    },

    /**
     * Flujo completo: crea la factura (los triggers de caja y mesa se disparan solos).
     *  - tg_factura_caja → inserta ingresos en historial_caja
     *  - tg_cerrar_venta (vía UPDATE estado en comanda) → venta a Pagada
     *  - tg_liberar_mesa → mesa a Libre
     */
    async cobrar(datos: CrearFactura): Promise<Factura> {
        return this.crear(datos);
    },
};