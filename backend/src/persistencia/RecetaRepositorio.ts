import { supabase } from "../configuracion/Supabase.js";

import {
    Receta,
    CrearReceta,
    ActualizarReceta,
    RecetaRow
} from "../modelos/Receta.js";

function mapearRecetaRow(row: RecetaRow): Receta {
    return {
        id_producto: row.id_producto,
        id_ingrediente: row.id_ingrediente,
        cantidad: Number(row.cantidad)
    };
}

export class RecetaRepositorio {

    async listar(): Promise<Receta[]> {
        const { data, error } = await supabase
            .from("receta")
            .select("*")
            .order("id_producto", { ascending: true });

        if (error) {
            throw new Error(`Error al listar recetas: ${error.message}`);
        }

        return (data as RecetaRow[]).map(mapearRecetaRow);
    }

    async listarPorProducto(idProducto: number): Promise<Receta[]> {
        const { data, error } = await supabase
            .from("receta")
            .select("*")
            .eq("id_producto", idProducto)
            .order("id_ingrediente", { ascending: true });

        if (error) {
            throw new Error(
                `Error al listar recetas del producto: ${error.message}`
            );
        }

        return (data as RecetaRow[]).map(mapearRecetaRow);
    }

    async obtenerPorId(
        idProducto: number,
        idIngrediente: number
    ): Promise<Receta | null> {
        const { data, error } = await supabase
            .from("receta")
            .select("*")
            .eq("id_producto", idProducto)
            .eq("id_ingrediente", idIngrediente)
            .maybeSingle();

        if (error) {
            throw new Error(`Error al obtener receta: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return mapearRecetaRow(data as RecetaRow);
    }

    async crear(datos: CrearReceta): Promise<Receta> {
        const { data, error } = await supabase
            .from("receta")
            .insert(datos)
            .select("*")
            .single();

        if (error) {
            throw new Error(`Error al crear receta: ${error.message}`);
        }

        return mapearRecetaRow(data as RecetaRow);
    }

    async actualizar(
        idProducto: number,
        idIngrediente: number,
        cambios: ActualizarReceta
    ): Promise<void> {
        const { error } = await supabase
            .from("receta")
            .update(cambios)
            .eq("id_producto", idProducto)
            .eq("id_ingrediente", idIngrediente);

        if (error) {
            throw new Error(
                `Error al actualizar receta: ${error.message}`
            );
        }
    }

    async eliminar(
        idProducto: number,
        idIngrediente: number
    ): Promise<void> {
        const { error } = await supabase
            .from("receta")
            .delete()
            .eq("id_producto", idProducto)
            .eq("id_ingrediente", idIngrediente);

        if (error) {
            throw new Error(`Error al eliminar receta: ${error.message}`);
        }
    }
}