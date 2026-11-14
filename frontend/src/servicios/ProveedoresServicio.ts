import { fetchJson } from "./api";

export interface ProveedorBackend {
    id_proveedor: number;
    documento: string;
    nombre: string;
    contacto: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    id_categoria_ingrediente: number | null;
    categoria_suministro: string | null;
    activo: boolean;
}

export interface CompraBackend {
    id_compra: number;
    id_proveedor: number;
    fecha: string;
    estado: string;
    total: number;
    factura: string | null;
}

export interface DetalleCompraBackend {
    id_compra: number;
    id_ingrediente: number;
    cantidad: number;
    precio_aplicado: number;
}

export const ProveedoresServicio = {
    async listar(): Promise<ProveedorBackend[]> {
        return await fetchJson<ProveedorBackend[]>("/api/proveedores");
    },

    async crear(datos: {
        documento: string;
        nombre: string;
        contacto?: string | null;
        telefono?: string | null;
        correo?: string | null;
        direccion?: string | null;
        id_categoria_ingrediente?: number | null;
        categoria_suministro?: string | null;
    }): Promise<ProveedorBackend> {
        return await fetchJson<ProveedorBackend>("/api/proveedores", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async actualizar(
        id: number,
        cambios: Partial<{
            documento: string;
            nombre: string;
            contacto: string | null;
            telefono: string | null;
            correo: string | null;
            direccion: string | null;
            id_categoria_ingrediente: number | null;
            categoria_suministro: string | null;
            activo: boolean;
        }>
    ): Promise<ProveedorBackend> {
        return await fetchJson<ProveedorBackend>(`/api/proveedores/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios),
        });
    },

    async listarCompras(): Promise<CompraBackend[]> {
        return await fetchJson<CompraBackend[]>("/api/compras");
    },

    async listarDetallesCompra(): Promise<DetalleCompraBackend[]> {
        return await fetchJson<DetalleCompraBackend[]>("/api/detalles-compra");
    },

    async obtenerSiguienteFactura(): Promise<string> {
        const res = await fetchJson<{ factura: string }>("/api/compras/siguiente-factura");
        return res.factura;
    },

    async eliminarCompra(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/compras/${id}`, {
            method: "DELETE",
        });
    },

    async crearCompra(datos: {
        id_proveedor: number;
        fecha?: string;
        estado?: string;
        total?: number;
        factura?: string | null;
        detalles?: Array<{
            id_ingrediente: number;
            cantidad: number;
            precio_aplicado: number;
        }>;
    }): Promise<CompraBackend> {
        return await fetchJson<CompraBackend>("/api/compras", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },
};
