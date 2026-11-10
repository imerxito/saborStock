import { supabase } from "../configuracion/Supabase.js";
import {
    Producto,
    CrearProducto,
    ActualizarProducto,
    ProductoRow
} from "../modelos/Producto.js";

function mapearProductoRow(row: ProductoRow): Producto {
    return {
        id_producto: row.id_producto,
        codigo: row.codigo,
        nombre: row.nombre,
        id_categoria: row.id_categoria,
        precio_venta: row.precio_venta,
        descripcion: row.descripcion ?? null,
        activo: row.activo
    };
}

export class ProductoRepositorio {

    async listar(): Promise<Producto[]> {
        const { data, error } = await supabase
            .from("producto")
            .select("*")
            .order("id_producto", { ascending: true });

        if (error) {
            throw new Error(`Error al listar productos: ${error.message}`);
        }

        return (data as ProductoRow[]).map(mapearProductoRow);
    }

    async obtenerPorId(id: number): Promise<Producto | null> {
        const { data, error } = await supabase
            .from("producto")
            .select("*")
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
}