import { supabase } from "../configuracion/Supabase.js";
import {
    Compra,
    CrearCompra,
    ActualizarCompra,
    CompraRow
} from "../modelos/Compra.js";

function mapearCompraRow(row: CompraRow): Compra {
    return {
        id_compra: row.id_compra,
        id_proveedor: row.id_proveedor,
        fecha: row.fecha,
        estado: row.estado,
        total: Number(row.total),
        factura: row.factura ?? null
    };
}

export class CompraRepositorio {

    async listar(limite?: number): Promise<Compra[]> {
        let query = supabase
            .from("compra")
            .select("*")
            .order("id_compra", { ascending: limite ? false : true });

        if (limite) {
            query = query.limit(limite);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Error al listar compras: ${error.message}`);
        }

        return (data as CompraRow[]).map(mapearCompraRow);
    }

    async obtenerPorId(id: number): Promise<Compra | null> {
        const { data, error } = await supabase
            .from("compra")
            .select("*")
            .eq("id_compra", id)
            .maybeSingle();

        if (error) {
            throw new Error(`Error al obtener compra: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return mapearCompraRow(data as CompraRow);
    }

    async crear(datos: CrearCompra): Promise<Compra> {
        const { data, error } = await supabase
            .from("compra")
            .insert(datos)
            .select("*")
            .single();

        if (error) {
            throw new Error(`Error al crear compra: ${error.message}`);
        }

        return mapearCompraRow(data as CompraRow);
    }

    async actualizar(
        id: number,
        cambios: ActualizarCompra
    ): Promise<void> {
        const { error } = await supabase
            .from("compra")
            .update(cambios)
            .eq("id_compra", id);

        if (error) {
            throw new Error(`Error al actualizar compra: ${error.message}`);
        }
    }

    async eliminar(id: number): Promise<void> {
        const { error } = await supabase
            .from("compra")
            .delete()
            .eq("id_compra", id);

        if (error) {
            throw new Error(`Error al eliminar compra: ${error.message}`);
        }
    }
}