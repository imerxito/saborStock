import { Router } from "express";
import { FacturaControlador } from "../controladores/FacturaControlador.js";

const facturaControlador = new FacturaControlador();
const router = Router();

router.get("/", (req, res) => facturaControlador.listar(req, res));
router.get("/:id", (req, res) => facturaControlador.obtenerPorId(req, res));
router.post("/", (req, res) => facturaControlador.crear(req, res));
router.put("/:id", (req, res) => facturaControlador.actualizar(req, res));

export default router;