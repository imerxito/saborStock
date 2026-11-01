import { supabase } from "../configuracion/Supabase.js";

import {
    Reporte,
    CrearReporte,
    ReporteRow,
    ResumenDiario,
    ResumenDiarioRow,
    StockIngrediente,
    StockIngredienteRow,
    TipoReporte
} from "../modelos/Reporte.js";

function mapearReporteRow(row: ReporteRow): Reporte {
    return {
        id_reporte: row.id_reporte,
        tipo: row.tipo,
        fecha_inicio: row.fecha_inicio,
        fecha_fin: row.fecha_fin,
        contenido: row.contenido,
        fecha_creacion: row.fecha_creacion
    };
}

function mapearResumenRow(row: ResumenDiarioRow): ResumenDiario {
    return {
        dia: row.dia,
        id_ingrediente: row.id_ingrediente,
        ingrediente: row.ingrediente,
        unidad: row.unidad,
        entradas: Number(row.entradas),
        salidas: Number(row.salidas),
        ajustes: Number(row.ajustes),
        costo_salidas: Number(row.costo_salidas)
    };
}

function mapearStockRow(row: StockIngredienteRow): StockIngrediente {
    return {
        id_ingrediente: row.id_ingrediente,
        codigo: row.codigo,
        nombre: row.nombre,
        unidad: row.unidad,
        stock: Number(row.stock),
        stock_minimo: Number(row.stock_minimo),
        precio_referencia: Number(row.precio_referencia),
        bajo_minimo: row.bajo_minimo,
        faltante: Number(row.faltante)
    };
}

export class ReporteRepositorio {

    // Movimientos agrupados por día e ingrediente (vista v_resumen_diario)
    async resumenPorRango(
        fechaInicio: string,
        fechaFin: string
    ): Promise<ResumenDiario[]> {
        const { data, error } = await supabase
            .from("v_resumen_diario")
            .select("*")
            .gte("dia", fechaInicio)
            .lte("dia", fechaFin)
            .order("dia", { ascending: true })
            .order("ingrediente", { ascending: true });

        if (error) {
            throw new Error(`Error al obtener el resumen: ${error.message}`);
        }

        return (data as ResumenDiarioRow[]).map(mapearResumenRow);
    }

    // Stock actual de los ingredientes activos (vista v_stock_ingrediente)
    async stock(soloBajoMinimo = false): Promise<StockIngrediente[]> {
        let consulta = supabase
            .from("v_stock_ingrediente")
            .select("*")
            .order("nombre", { ascending: true });

        if (soloBajoMinimo) {
            consulta = consulta.eq("bajo_minimo", true);
        }

        const { data, error } = await consulta;

        if (error) {
            throw new Error(`Error al obtener el stock: ${error.message}`);
        }

        return (data as StockIngredienteRow[]).map(mapearStockRow);
    }

    async crear(datos: CrearReporte): Promise<Reporte> {
        const { data, error } = await supabase
            .from("reporte")
            .insert(datos)
            .select("*")
            .single();

        if (error) {
            throw new Error(`Error al guardar el reporte: ${error.message}`);
        }

        return mapearReporteRow(data as ReporteRow);
    }

    async ultimo(tipo?: TipoReporte): Promise<Reporte | null> {
        let consulta = supabase
            .from("reporte")
            .select("*")
            .order("fecha_creacion", { ascending: false })
            .limit(1);

        if (tipo) {
            consulta = consulta.eq("tipo", tipo);
        }

        const { data, error } = await consulta.maybeSingle();

        if (error) {
            throw new Error(`Error al obtener el último reporte: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return mapearReporteRow(data as ReporteRow);
    }

    async listar(limite = 20): Promise<Reporte[]> {
        const { data, error } = await supabase
            .from("reporte")
            .select("*")
            .order("fecha_creacion", { ascending: false })
            .limit(limite);

        if (error) {
            throw new Error(`Error al listar reportes: ${error.message}`);
        }

        return (data as ReporteRow[]).map(mapearReporteRow);
    }
}
