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
        total: Number(row.total)
    };
}

export class CompraRepositorio {

    async listar(): Promise<Compra[]> {
        const { data, error } = await supabase
            .from("compra")
            .select("*")
            .order("id_compra", { ascending: true });

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
}