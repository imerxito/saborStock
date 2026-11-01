import { GoogleGenAI } from "@google/genai";

import {
    Reporte,
    ResumenDiario,
    StockIngrediente,
    TipoReporte
} from "../modelos/Reporte.js";

import { ReporteRepositorio } from "../persistencia/ReporteRepositorio.js";

const ZONA_HORARIA = "America/Bogota";

// Si ya se generó un reporte igual hace menos de estos minutos, se devuelve ese
// en vez de volver a llamar a la IA (cuida el límite del plan gratuito).
const MINUTOS_REUSO = 5;

function hoyEnColombia(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

function esFechaValida(fecha: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha));
}

function restarDias(fecha: string, dias: number): string {
    const d = new Date(`${fecha}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - dias);
    return d.toISOString().slice(0, 10);
}

// La columna fecha_creacion es "timestamp sin zona" guardado en UTC
function minutosDesde(fechaUtc: string): number {
    const tieneZona = /(Z|[+-]\d{2}:?\d{2})$/.test(fechaUtc);
    const ms = Date.parse(tieneZona ? fechaUtc : `${fechaUtc}Z`);
    return (Date.now() - ms) / 60000;
}

// Junta los días del rango en una sola fila por ingrediente
function agruparPorIngrediente(filas: ResumenDiario[]): ResumenDiario[] {
    const mapa = new Map<number, ResumenDiario>();

    for (const f of filas) {
        const actual = mapa.get(f.id_ingrediente);
        if (!actual) {
            mapa.set(f.id_ingrediente, { ...f });
        } else {
            actual.entradas += f.entradas;
            actual.salidas += f.salidas;
            actual.ajustes += f.ajustes;
            actual.costo_salidas += f.costo_salidas;
        }
    }

    return [...mapa.values()];
}

export class ReporteServicio {
    private reporteRepositorio: ReporteRepositorio;

    constructor() {
        this.reporteRepositorio = new ReporteRepositorio();
    }

    async stockBajo(): Promise<StockIngrediente[]> {
        return await this.reporteRepositorio.stock(true);
    }

    // Datos del día para pantalla y PDF (sin IA)
    async resumenDia(fecha?: string): Promise<ResumenDiario[]> {
        const dia = fecha ?? hoyEnColombia();

        if (!esFechaValida(dia)) {
            throw new Error("La fecha debe tener el formato AAAA-MM-DD");
        }

        return await this.reporteRepositorio.resumenPorRango(dia, dia);
    }

    async ultimo(tipo?: TipoReporte): Promise<Reporte | null> {
        return await this.reporteRepositorio.ultimo(tipo);
    }

    async listar(): Promise<Reporte[]> {
        return await this.reporteRepositorio.listar();
    }

    async generar(tipo: TipoReporte, fecha?: string): Promise<Reporte> {
        if (tipo !== "DIARIO" && tipo !== "SEMANAL") {
            throw new Error("El tipo debe ser DIARIO o SEMANAL");
        }

        const fechaFin = fecha ?? hoyEnColombia();

        if (!esFechaValida(fechaFin)) {
            throw new Error("La fecha debe tener el formato AAAA-MM-DD");
        }

        const fechaInicio = tipo === "DIARIO" ? fechaFin : restarDias(fechaFin, 6);

        const previo = await this.reporteRepositorio.ultimo(tipo);
        if (
            previo &&
            previo.fecha_inicio === fechaInicio &&
            previo.fecha_fin === fechaFin &&
            minutosDesde(previo.fecha_creacion) < MINUTOS_REUSO
        ) {
            return previo;
        }

        const filas = await this.reporteRepositorio.resumenPorRango(
            fechaInicio,
            fechaFin
        );
        const resumen = agruparPorIngrediente(filas);
        const bajos = await this.reporteRepositorio.stock(true);

        if (resumen.length === 0 && bajos.length === 0) {
            throw new Error(
                "No hay movimientos ni alertas de stock en ese periodo para reportar"
            );
        }

        const contenido = await this.redactarConIA(
            tipo,
            fechaInicio,
            fechaFin,
            resumen,
            bajos
        );

        return await this.reporteRepositorio.crear({
            tipo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            contenido
        });
    }

    // La IA solo redacta: los números ya vienen calculados desde SQL
    private async redactarConIA(
        tipo: TipoReporte,
        fechaInicio: string,
        fechaFin: string,
        resumen: ResumenDiario[],
        bajos: StockIngrediente[]
    ): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        const modelo = process.env.GEMINI_MODEL;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY no está definido en las variables de entorno");
        }
        if (!modelo) {
            throw new Error("GEMINI_MODEL no está definido en las variables de entorno");
        }

        const datos = {
            periodo: { tipo, desde: fechaInicio, hasta: fechaFin },
            movimientos_por_ingrediente: resumen.map((r) => ({
                ingrediente: r.ingrediente,
                unidad: r.unidad,
                entradas: r.entradas,
                salidas: r.salidas,
                ajustes: r.ajustes,
                costo_salidas: r.costo_salidas
            })),
            ingredientes_bajo_minimo: bajos.map((s) => ({
                ingrediente: s.nombre,
                unidad: s.unidad,
                stock: s.stock,
                stock_minimo: s.stock_minimo,
                faltante: s.faltante
            }))
        };

        const prompt =
            "Eres analista de inventario de un restaurante en Colombia. " +
            "Con los datos en JSON escribe un reporte breve en español, con tres partes: " +
            "1) resumen del periodo, 2) alertas (stock bajo y consumos llamativos), " +
            "3) recomendaciones de compra. Usa solo los datos dados, no inventes cifras. " +
            "Los costos están en pesos colombianos. Sé concreto y corto.\n\n" +
            JSON.stringify(datos);

        const ai = new GoogleGenAI({ apiKey });
        const respuesta = await ai.models.generateContent({
            model: modelo,
            contents: prompt
        });

        const texto = respuesta.text?.trim();

        if (!texto) {
            throw new Error("La IA no devolvió contenido para el reporte");
        }

        return texto;
    }
}
