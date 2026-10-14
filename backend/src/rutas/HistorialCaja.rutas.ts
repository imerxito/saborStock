import { Router } from "express";
import { HistorialCajaControlador } from "../controladores/HistorialCajaControlador.js";

const historialCajaControlador = new HistorialCajaControlador();
const router = Router();

router.get("/", (req, res) => historialCajaControlador.listar(req, res));
router.get("/:id", (req, res) => historialCajaControlador.obtenerPorId(req, res));
router.post("/", (req, res) => historialCajaControlador.crear(req, res));

export default router;