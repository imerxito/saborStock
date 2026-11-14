import { supabase } from "../configuracion/Supabase.js";

import {
    DetalleCompra,
    CrearDetalleCompra,
    ActualizarDetalleCompra,
    DetalleCompraRow
} from "../modelos/DetalleCompra.js";

function mapearDetalleCompraRow(
    row: DetalleCompraRow
): DetalleCompra {
    return {
        id_compra: row.id_compra,
        id_ingrediente: row.id_ingrediente,
        cantidad: Number(row.cantidad),
        precio_aplicado: Number(row.precio_aplicado)
    };
}

export class DetalleCompraRepositorio {

    async listar(): Promise<DetalleCompra[]> {
        const { data, error } = await supabase
            .from("detalle_compra")
            .select("*")
            .order("id_compra", { ascending: true });

        if (error) {
            throw new Error(
                `Error al listar detalles de compra: ${error.message}`
            );
        }

        return (data as DetalleCompraRow[]).map(
            mapearDetalleCompraRow
        );
    }

    async listarPorCompra(
        idCompra: number
    ): Promise<DetalleCompra[]> {
        const { data, error } = await supabase
            .from("detalle_compra")
            .select("*")
            .eq("id_compra", idCompra)
            .order("id_ingrediente", { ascending: true });

        if (error) {
            throw new Error(
                `Error al listar detalles de la compra: ${error.message}`
            );
        }

        return (data as DetalleCompraRow[]).map(
            mapearDetalleCompraRow
        );
    }

    async obtenerPorId(
        idCompra: number,
        idIngrediente: number
    ): Promise<DetalleCompra | null> {
        const { data, error } = await supabase
            .from("detalle_compra")
            .select("*")
            .eq("id_compra", idCompra)
            .eq("id_ingrediente", idIngrediente)
            .maybeSingle();

        if (error) {
            throw new Error(
                `Error al obtener detalle de compra: ${error.message}`
            );
        }

        if (!data) {
            return null;
        }

        return mapearDetalleCompraRow(
            data as DetalleCompraRow
        );
    }

    async crear(
        datos: CrearDetalleCompra
    ): Promise<DetalleCompra> {
        const { data, error } = await supabase
            .from("detalle_compra")
            .insert(datos)
            .select("*")
            .single();

        if (error) {
            throw new Error(
                `Error al crear detalle de compra: ${error.message}`
            );
        }

        return mapearDetalleCompraRow(
            data as DetalleCompraRow
        );
    }

    async actualizar(
        idCompra: number,
        idIngrediente: number,
        cambios: ActualizarDetalleCompra
    ): Promise<void> {
        const { error } = await supabase
            .from("detalle_compra")
            .update(cambios)
            .eq("id_compra", idCompra)
            .eq("id_ingrediente", idIngrediente);

        if (error) {
            throw new Error(
                `Error al actualizar detalle de compra: ${error.message}`
            );
        }
    }

    async eliminar(
        idCompra: number,
        idIngrediente: number
    ): Promise<void> {
        const { error } = await supabase
            .from("detalle_compra")
            .delete()
            .eq("id_compra", idCompra)
            .eq("id_ingrediente", idIngrediente);

        if (error) {
            throw new Error(
                `Error al eliminar detalle de compra: ${error.message}`
            );
        }
    }

    async eliminarPorCompra(idCompra: number): Promise<void> {
        const { error } = await supabase
            .from("detalle_compra")
            .delete()
            .eq("id_compra", idCompra);

        if (error) {
            throw new Error(
                `Error al eliminar detalles de compra: ${error.message}`
            );
        }
    }
}