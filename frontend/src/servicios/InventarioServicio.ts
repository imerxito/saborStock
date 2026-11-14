import { fetchJson } from "./api";

export interface InsumoBackend {
    id_ingrediente: number;
    codigo: string;
    nombre: string;
    id_unidad: number;
    id_categoria_ingrediente: number | null;
    stock: number;
    stock_minimo: number;
    stock_maximo: number;
    precio_referencia: number;
    caducidad: string | null;
    activo: boolean;
}

export interface CategoriaIngredienteBackend {
    id: number;
    nombre: string;
    activo: boolean;
}

export interface UnidadMedidaBackend {
    id: string;
    nombre: string;
    abreviatura: string;
    descripcion?: string | null;
    activo: boolean;
}

export const InventarioServicio = {
    async listarInsumos(): Promise<InsumoBackend[]> {
        return await fetchJson<InsumoBackend[]>("/api/ingredientes");
    },

    async crearInsumo(datos: {
        codigo: string;
        nombre: string;
        id_unidad: number;
        id_categoria_ingrediente?: number | null;
        stock?: number;
        stock_minimo?: number;
        stock_maximo?: number;
        precio_referencia?: number;
        caducidad?: string | null;
    }): Promise<InsumoBackend> {
        return await fetchJson<InsumoBackend>("/api/ingredientes", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async actualizarInsumo(
        id: number,
        cambios: Partial<{
            codigo: string;
            nombre: string;
            id_unidad: number;
            id_categoria_ingrediente: number | null;
            stock: number;
            stock_minimo: number;
            stock_maximo: number;
            precio_referencia: number;
            caducidad: string | null;
        }>
    ): Promise<InsumoBackend> {
        return await fetchJson<InsumoBackend>(`/api/ingredientes/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios),
        });
    },

    async desactivarInsumo(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/ingredientes/${id}/desactivar`, {
            method: "PATCH",
        });
    },

    async listarCategorias(): Promise<CategoriaIngredienteBackend[]> {
        return await fetchJson<CategoriaIngredienteBackend[]>("/api/categorias-ingrediente");
    },

    async crearCategoria(nombre: string): Promise<CategoriaIngredienteBackend> {
        return await fetchJson<CategoriaIngredienteBackend>("/api/categorias-ingrediente", {
            method: "POST",
            body: JSON.stringify({ nombre }),
        });
    },

    async listarUnidades(): Promise<UnidadMedidaBackend[]> {
        return await fetchJson<UnidadMedidaBackend[]>("/api/unidades-medida");
    },

    async crearUnidad(datos: {
        nombre: string;
        abreviatura: string;
        descripcion?: string;
    }): Promise<UnidadMedidaBackend> {
        return await fetchJson<UnidadMedidaBackend>("/api/unidades-medida", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async registrarMovimiento(datos: {
        id_ingrediente: number;
        tipo: "ENTRADA" | "SALIDA";
        cantidad: number;
        motivo: string;
    }): Promise<unknown> {
        return await fetchJson<unknown>("/api/movimientoInventario", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },
};
