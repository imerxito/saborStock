import { Request, Response } from "express";
import { ReporteServicio } from "../servicios/ReporteServicio.js";
import { TipoReporte } from "../modelos/Reporte.js";

const reporteServicio = new ReporteServicio();

function textoDeQuery(valor: unknown): string | undefined {
    return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : undefined;
}

export class ReporteControlador {
    async listar(_req: Request, res: Response): Promise<void> {
        try {
            const reportes = await reporteServicio.listar();
            res.status(200).json(reportes);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    // Último reporte guardado: GET /api/reportes/ultimo?tipo=DIARIO
    async ultimo(req: Request, res: Response): Promise<void> {
        try {
            const tipo = textoDeQuery(req.query.tipo) as TipoReporte | undefined;
            const reporte = await reporteServicio.ultimo(tipo);

            if (!reporte) {
                res.status(404).json({ mensaje: "Todavía no hay reportes generados" });
                return;
            }

            res.status(200).json(reporte);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async stockBajo(_req: Request, res: Response): Promise<void> {
        try {
            const bajos = await reporteServicio.stockBajo();
            res.status(200).json(bajos);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    // Datos del día para la pantalla y el PDF: GET /api/reportes/resumen-diario?fecha=2026-11-01
    async resumenDiario(req: Request, res: Response): Promise<void> {
        try {
            const fecha = textoDeQuery(req.query.fecha);
            const filas = await reporteServicio.resumenDia(fecha);
            res.status(200).json(filas);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }

    // Genera (o reutiliza) un reporte con IA: POST /api/reportes/generar
    // body: { "tipo": "DIARIO" | "SEMANAL", "fecha": "2026-11-01" (opcional) }
    async generar(req: Request, res: Response): Promise<void> {
        try {
            const tipo = (req.body?.tipo ?? "DIARIO") as TipoReporte;
            const fecha = textoDeQuery(req.body?.fecha);
            const reporte = await reporteServicio.generar(tipo, fecha);
            res.status(201).json(reporte);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }

    // Dashboard consolidado para la pantalla de Reportes: GET /api/reportes/dashboard?filtro=Hoy|Semana|Mes
    async dashboard(req: Request, res: Response): Promise<void> {
        try {
            const filtroRaw = textoDeQuery(req.query.filtro);
            const filtroValido = filtroRaw === "Semana" || filtroRaw === "Mes" ? filtroRaw : "Hoy";
            const datos = await reporteServicio.obtenerDashboard(filtroValido);
            res.status(200).json(datos);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }
}
