import { supabase } from "../configuracion/Supabase.js";

import {
    Reporte,
    CrearReporte,
    ReporteRow,
    ResumenDiario,
    StockIngrediente,
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

export class ReporteRepositorio {

    // Movimientos agrupados por día e ingrediente
    async resumenPorRango(
        fechaInicio: string,
        fechaFin: string
    ): Promise<ResumenDiario[]> {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .select("*, ingrediente:id_ingrediente(nombre, precio_referencia, id_unidad, unidad_medida:id_unidad(abreviatura))")
            .gte("fecha", `${fechaInicio}T00:00:00`)
            .lte("fecha", `${fechaFin}T23:59:59`)
            .order("fecha", { ascending: true });

        if (error) {
            console.warn("Aviso al consultar movimiento_inventario:", error.message);
            return [];
        }

        const mapa = new Map<string, ResumenDiario>();
        for (const m of data || []) {
            const dia = (m.fecha || "").slice(0, 10) || fechaInicio;
            const idIng = Number(m.id_ingrediente);
            const clave = `${dia}_${idIng}`;
            const nombreIng = m.ingrediente?.nombre || `Insumo #${idIng}`;
            const unidad = m.ingrediente?.unidad_medida?.abreviatura || "ud";
            const precioRef = Number(m.ingrediente?.precio_referencia || 0);
            const cant = Number(m.cantidad || 0);
            const tipo = String(m.tipo || "").toUpperCase();

            let item = mapa.get(clave);
            if (!item) {
                item = {
                    dia,
                    id_ingrediente: idIng,
                    ingrediente: nombreIng,
                    unidad,
                    entradas: 0,
                    salidas: 0,
                    ajustes: 0,
                    costo_salidas: 0,
                };
                mapa.set(clave, item);
            }

            if (tipo === "ENTRADA" || tipo === "INGRESO") {
                item.entradas += cant;
            } else if (tipo === "SALIDA" || tipo === "EGRESO") {
                item.salidas += cant;
                item.costo_salidas += cant * precioRef;
            } else {
                item.ajustes += cant;
            }
        }

        return [...mapa.values()];
    }

    // Stock actual de los ingredientes activos
    async stock(soloBajoMinimo = false): Promise<StockIngrediente[]> {
        const { data, error } = await supabase
            .from("ingrediente")
            .select("*, unidad_medida:id_unidad(abreviatura, nombre)")
            .eq("activo", true)
            .order("nombre", { ascending: true });

        if (error) {
            console.warn("Aviso al consultar ingrediente:", error.message);
            return [];
        }

        const lista: StockIngrediente[] = (data || []).map((row: any) => {
            const stock = Number(row.stock || 0);
            const stockMin = Number(row.stock_minimo || 0);
            const bajo = stock <= stockMin;
            return {
                id_ingrediente: row.id_ingrediente,
                codigo: row.codigo || `ING-${row.id_ingrediente}`,
                nombre: row.nombre,
                unidad: row.unidad_medida?.abreviatura || "ud",
                stock,
                stock_minimo: stockMin,
                precio_referencia: Number(row.precio_referencia || 0),
                bajo_minimo: bajo,
                faltante: bajo ? Math.max(0, stockMin - stock) : 0,
            };
        });

        if (soloBajoMinimo) {
            return lista.filter(i => i.bajo_minimo);
        }

        return lista;
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
