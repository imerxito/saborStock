import { supabase } from "../configuracion/Supabase.js";
import {
    Producto,
    CrearProducto,
    ActualizarProducto,
    ProductoRow,
    TipoProducto
} from "../modelos/Producto.js";

function inferirTipo(codigo?: string | null): "cocina" | "directo" | "paquete" {
    const c = (codigo || "").toUpperCase();
    if (c.includes("-DIR") || c.includes("DIR-")) return "directo";
    if (c.includes("-PAK") || c.includes("-COM") || c.includes("PAK-")) return "paquete";
    return "cocina";
}

function tipoProducto(valor?: TipoProducto | string | null): TipoProducto {
    if (valor === "directo" || valor === "paquete" || valor === "cocina") return valor;
    return inferirTipo(undefined);
}

function mapearProductoRow(row: ProductoRow & { categoria?: { nombre?: string } | null }): Producto {
    return {
        id_producto: row.id_producto,
        codigo: row.codigo,
        nombre: row.nombre,
        id_categoria: row.id_categoria,
        precio_venta: Number(row.precio_venta),
        descripcion: row.descripcion ?? "",
        activo: row.activo,
        tipo: row.tipo ? tipoProducto(row.tipo) : inferirTipo(row.codigo),
        categoriaNombre: row.categoria?.nombre,
    };
}

export class ProductoRepositorio {

    async listar(): Promise<Producto[]> {
        const { data, error } = await supabase
            .from("producto")
            .select("*, categoria:id_categoria(nombre)")
            .order("id_producto", { ascending: true });

        if (error) {
            throw new Error(`Error al listar productos: ${error.message}`);
        }

        return (data as ProductoRow[]).map(mapearProductoRow);
    }

    async obtenerPorId(id: number): Promise<Producto | null> {
        const { data, error } = await supabase
            .from("producto")
            .select("*, categoria:id_categoria(nombre)")
            .eq("id_producto", id)
            .maybeSingle();

        if (error) {
            throw new Error(`Error al obtener producto: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return mapearProductoRow(data as ProductoRow);
    }

    async crear(datos: CrearProducto): Promise<Producto> {
        const { data, error } = await supabase
            .from("producto")
            .insert(datos)
            .select("*")
            .single();

        if (error) {
            throw new Error(`Error al crear producto: ${error.message}`);
        }

        return mapearProductoRow(data as ProductoRow);
    }

    async actualizar(id: number, cambios: ActualizarProducto): Promise<Producto | null> {
        const { data, error } = await supabase
            .from("producto")
            .update(cambios)
            .eq("id_producto", id)
            .select("*")
            .maybeSingle();

        if (error) throw new Error(`Error al actualizar producto: ${error.message}`);
        return data ? mapearProductoRow(data as ProductoRow) : null;
    }

    // Marca un producto como inactivo sin borrar su existencia
    async desactivar(id: number): Promise<void> {
        const { error } = await supabase
            .from("producto")
            .update({ activo: false })
            .eq("id_producto", id);

        if (error) {
            throw new Error(`Error al desactivar producto: ${error.message}`);
        }
    }

    async eliminar(id: number): Promise<void> {
        // Limpiar recetas y componentes asociados antes de borrar el producto
        await supabase
            .from("receta")
            .delete()
            .eq("id_producto", id);

        await supabase
            .from("componente_combo")
            .delete()
            .or(`id_combo.eq.${id},id_producto_hijo.eq.${id}`);

        const { error } = await supabase
            .from("producto")
            .delete()
            .eq("id_producto", id);

        if (error) {
            throw new Error(`Error al eliminar producto: ${error.message}`);
        }
    }
}
