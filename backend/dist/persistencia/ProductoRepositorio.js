import { supabase } from "../configuracion/Supabase.js";
function mapearProductoRow(row) {
    return {
        id_producto: row.id_producto,
        codigo: row.codigo,
        nombre: row.nombre,
        id_categoria: row.id_categoria,
        precio_venta: row.precio_venta,
        descripcion: row.descripcion,
        activo: row.activo
    };
}
export class ProductoRepositorio {
    async listar() {
        const { data, error } = await supabase
            .from("producto")
            .select("*")
            .order("id_producto", { ascending: true });
        if (error) {
            throw new Error(`Error al listar productos: ${error.message}`);
        }
        return data.map(mapearProductoRow);
    }
    async obtenerPorId(id) {
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
        return mapearProductoRow(data);
    }
    async crear(datos) {
        const { data, error } = await supabase
            .from("producto")
            .insert(datos)
            .select("*")
            .single();
        if (error) {
            throw new Error(`Error al crear producto: ${error.message}`);
        }
        return mapearProductoRow(data);
    }
    async actualizar(id, cambios) {
        const { error } = await supabase
            .from("producto")
            .update(cambios)
            .eq("id_producto", id);
        if (error) {
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }
    }
    // Marca un producto como inactivo sin borrar su existencia
    async desactivar(id) {
        const { error } = await supabase
            .from("producto")
            .update({ activo: false })
            .eq("id_producto", id);
        if (error) {
            throw new Error(`Error al desactivar producto: ${error.message}`);
        }
    }
}
