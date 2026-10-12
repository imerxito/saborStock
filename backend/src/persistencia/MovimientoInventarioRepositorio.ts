import { supabase } from "../configuracion/Supabase.js";

import {
    MovimientoInventario,
    CrearMovimientoInventario,
    MovimientoInventarioRow
} from "../modelos/MovimientoInventario.js";

function mapearMovimientoRow(
    row: MovimientoInventarioRow
): MovimientoInventario {
    return {
        id_movimiento: row.id_movimiento,
        id_ingrediente: row.id_ingrediente,
        tipo: row.tipo,
        cantidad: Number(row.cantidad),
        fecha: row.fecha,
        motivo: row.motivo
    };
}

export class MovimientoInventarioRepositorio {

    async listar(): Promise<MovimientoInventario[]> {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .select("*")
            .order("id_movimiento", { ascending: true });

        if (error) {
            throw new Error(
                `Error al listar movimientos: ${error.message}`
            );
        }

        return (data as MovimientoInventarioRow[]).map(
            mapearMovimientoRow
        );
    }

    async obtenerPorId(
        id: number
    ): Promise<MovimientoInventario | null> {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .select("*")
            .eq("id_movimiento", id)
            .maybeSingle();

        if (error) {
            throw new Error(
                `Error al obtener movimiento: ${error.message}`
            );
        }

        if (!data) {
            return null;
        }

        return mapearMovimientoRow(data as MovimientoInventarioRow);
    }

    async listarPorIngrediente(
        idIngrediente: number
    ): Promise<MovimientoInventario[]> {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .select("*")
            .eq("id_ingrediente", idIngrediente)
            .order("fecha", { ascending: false });

        if (error) {
            throw new Error(
                `Error al listar movimientos del ingrediente: ${error.message}`
            );
        }

        return (data as MovimientoInventarioRow[]).map(
            mapearMovimientoRow
        );
    }

    async crear(
        datos: CrearMovimientoInventario
    ): Promise<MovimientoInventario> {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .insert(datos)
            .select("*")
            .single();

        if (error) {
            throw new Error(
                `Error al crear movimiento: ${error.message}`
            );
        }

        return mapearMovimientoRow(data as MovimientoInventarioRow);
    }

    // Registrar un movimiento y actualizar el stock en Supabase
    async registrarMovimiento(
        datos: CrearMovimientoInventario
    ): Promise<MovimientoInventario & { nuevo_stock: number }> {
        const { data, error } = await supabase.rpc(
            "registrar_movimiento_inventario",
            {
                p_id_ingrediente: datos.id_ingrediente,
                p_tipo: datos.tipo,
                p_cantidad: datos.cantidad,
                p_motivo: datos.motivo.trim()
            }
        );

        if (error) {
            throw new Error(
                `Error al registrar movimiento: ${error.message}`
            );
        }

        if (!data || data.length === 0) {
            throw new Error("No se recibió el movimiento registrado");
        }

        const movimiento = data[0];

        return {
            id_movimiento: movimiento.id_movimiento,
            id_ingrediente: movimiento.id_ingrediente,
            tipo: movimiento.tipo,
            cantidad: Number(movimiento.cantidad),
            fecha: movimiento.fecha,
            motivo: movimiento.motivo,
            nuevo_stock: Number(movimiento.nuevo_stock)
        };
    }
}