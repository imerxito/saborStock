import { Router } from "express";
import { DetalleFacturaControlador } from "../controladores/DetalleFacturaControlador.js";

const detalleFacturaControlador = new DetalleFacturaControlador();
const router = Router();

router.get("/", (req, res) => detalleFacturaControlador.listar(req, res));
router.get("/:id", (req, res) => detalleFacturaControlador.obtenerPorId(req, res));
router.post("/", (req, res) => detalleFacturaControlador.crear(req, res));
router.put("/:id", (req, res) => detalleFacturaControlador.actualizar(req, res));
router.delete("/:id", (req, res) => detalleFacturaControlador.eliminar(req, res));

export default router;