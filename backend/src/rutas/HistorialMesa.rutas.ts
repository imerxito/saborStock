import { Router } from "express";
import { HistorialMesaControlador } from "../controladores/HistorialMesaControlador.js";

const historialMesaControlador = new HistorialMesaControlador();
const router = Router();

router.get("/", (req, res) => historialMesaControlador.listar(req, res));
router.get("/:id", (req, res) => historialMesaControlador.obtenerPorId(req, res));
router.post("/", (req, res) => historialMesaControlador.crear(req, res));

export default router;