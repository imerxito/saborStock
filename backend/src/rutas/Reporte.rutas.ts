import { Router } from "express";
import { ReporteControlador } from "../controladores/ReporteControlador.js";

const router = Router();
const reporteControlador = new ReporteControlador();

router.get("/", (req, res) =>
    reporteControlador.listar(req, res)
);

router.get("/ultimo", (req, res) =>
    reporteControlador.ultimo(req, res)
);

router.get("/stock-bajo", (req, res) =>
    reporteControlador.stockBajo(req, res)
);

router.get("/resumen-diario", (req, res) =>
    reporteControlador.resumenDiario(req, res)
);

router.get("/dashboard", (req, res) =>
    reporteControlador.dashboard(req, res)
);

router.post("/generar", (req, res) =>
    reporteControlador.generar(req, res)
);

export default router;
