import { Router } from "express";
import { MovimientoInventarioControlador } from "../controladores/MovimientoInventarioControlador.js";
const router = Router();
const movimientoControlador = new MovimientoInventarioControlador();
router.get("/", (req, res) => movimientoControlador.listar(req, res));
router.get("/ingrediente/:idIngrediente", (req, res) => movimientoControlador.listarPorIngrediente(req, res));
router.get("/:id", (req, res) => movimientoControlador.obtenerPorId(req, res));
router.post("/", (req, res) => movimientoControlador.crear(req, res));
export default router;
