import { fetchJson } from "./api";

export interface ProductoDTO {
    id_producto: number;
    codigo: string;
    nombre: string;
    id_categoria: number;
    precio_venta: number;
    descripcion: string;
    activo: boolean;
    tipo?: 'cocina' | 'directo' | 'paquete';
}

export interface CategoriaDTO {
    id: number | string;
    id_categoria: number;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
}

export interface IngredienteDTO {
    id_ingrediente: number;
    codigo: string;
    nombre: string;
    id_unidad: number;
    id_categoria_ingrediente: number;
    stock: number;
    stock_minimo: number;
    precio_referencia: number;
    activo: boolean;
}

export interface RecetaDTO {
    id_producto: number;
    id_ingrediente: number;
    cantidad: number;
}

export interface ComponenteComboDTO {
    id: number;
    idCombo: number;
    idProductoHijo: number;
    cantidad: number;
}

export interface CategoriaIngredienteDTO {
    id: number;
    nombre: string;
    activo: boolean;
}

export const ProductoServicio = {
    // === PRODUCTOS ===
    async listar(): Promise<ProductoDTO[]> {
        return await fetchJson<ProductoDTO[]>("/api/productos");
    },

    async obtenerPorId(id: number): Promise<ProductoDTO> {
        return await fetchJson<ProductoDTO>(`/api/productos/${id}`);
    },

    async crear(datos: {
        codigo: string;
        nombre: string;
        id_categoria: number;
        precio_venta: number;
        descripcion?: string;
        activo?: boolean;
        tipo?: string;
    }): Promise<ProductoDTO> {
        return await fetchJson<ProductoDTO>("/api/productos", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async actualizar(
        id: number,
        cambios: {
            codigo?: string;
            nombre?: string;
            id_categoria?: number;
            precio_venta?: number;
            descripcion?: string;
            activo?: boolean;
            tipo?: string;
        }
    ): Promise<ProductoDTO> {
        return await fetchJson<ProductoDTO>(`/api/productos/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios),
        });
    },

    async desactivar(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/productos/${id}/desactivar`, {
            method: "PATCH",
        });
    },

    async eliminar(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/productos/${id}`, {
            method: "DELETE",
        });
    },

    // === CATEGORÍAS ===
    async listarCategorias(): Promise<CategoriaDTO[]> {
        const raw = await fetchJson<any[]>("/api/categorias");
        return (raw || []).map((c) => ({
            id: c.id_categoria ?? c.id,
            id_categoria: Number(c.id_categoria ?? c.id),
            nombre: c.nombre,
            descripcion: c.descripcion,
            activo: c.activo ?? true,
        }));
    },

    async crearCategoria(nombre: string, descripcion?: string): Promise<CategoriaDTO> {
        const c = await fetchJson<any>("/api/categorias", {
            method: "POST",
            body: JSON.stringify({ nombre, descripcion }),
        });
        return {
            id: c.id_categoria ?? c.id,
            id_categoria: Number(c.id_categoria ?? c.id),
            nombre: c.nombre,
            descripcion: c.descripcion,
            activo: c.activo ?? true,
        };
    },

    async actualizarCategoria(id: number, nombre: string, descripcion?: string): Promise<CategoriaDTO> {
        const c = await fetchJson<any>(`/api/categorias/${id}`, {
            method: "PUT",
            body: JSON.stringify({ nombre, descripcion }),
        });
        return {
            id: c.id_categoria ?? c.id,
            id_categoria: Number(c.id_categoria ?? c.id),
            nombre: c.nombre,
            descripcion: c.descripcion,
            activo: c.activo ?? true,
        };
    },

    async eliminarCategoria(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/categorias/${id}`, {
            method: "DELETE",
        });
    },

    // === INSUMOS / INGREDIENTES ===
    async listarInsumos(): Promise<IngredienteDTO[]> {
        return await fetchJson<IngredienteDTO[]>("/api/ingredientes");
    },

    // === RECETAS ===
    async listarRecetas(): Promise<RecetaDTO[]> {
        return await fetchJson<RecetaDTO[]>("/api/recetas");
    },

    async guardarReceta(idProducto: number, idIngrediente: number, cantidad: number): Promise<void> {
        try {
            await fetchJson<unknown>("/api/recetas", {
                method: "POST",
                body: JSON.stringify({
                    id_producto: idProducto,
                    id_ingrediente: idIngrediente,
                    cantidad,
                }),
            });
        } catch {
            // Si ya existe, intentar PUT
            await fetchJson<unknown>(`/api/recetas/${idProducto}/${idIngrediente}`, {
                method: "PUT",
                body: JSON.stringify({ cantidad }),
            });
        }
    },

    async eliminarReceta(idProducto: number, idIngrediente: number): Promise<void> {
        await fetchJson<unknown>(`/api/recetas/${idProducto}/${idIngrediente}`, {
            method: "DELETE",
        });
    },

    async listarCategoriasIngrediente(): Promise<CategoriaIngredienteDTO[]> {
        return await fetchJson<CategoriaIngredienteDTO[]>("/api/categorias-ingrediente");
    },

    // === COMPONENTES DE COMBO / PAQUETE ===
    async listarComponentesCombo(): Promise<ComponenteComboDTO[]> {
        return await fetchJson<ComponenteComboDTO[]>("/api/componentes-combo");
    },

    async crearComponenteCombo(idCombo: number, idProductoHijo: number, cantidad: number): Promise<ComponenteComboDTO> {
        return await fetchJson<ComponenteComboDTO>("/api/componentes-combo", {
            method: "POST",
            body: JSON.stringify({ idCombo, idProductoHijo, cantidad }),
        });
    },

    async eliminarComponentesCombo(idCombo: number): Promise<void> {
        await fetchJson<unknown>(`/api/componentes-combo/combo/${idCombo}`, {
            method: "DELETE",
        });
    },
};
