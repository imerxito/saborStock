import { Router } from "express";
import { DetalleComandaControlador } from "../controladores/DetalleComandaControlador.js";

const detalleComandaControlador = new DetalleComandaControlador();
const router = Router();

router.get("/", (req, res) => detalleComandaControlador.listar(req, res));
router.get("/:id", (req, res) => detalleComandaControlador.obtenerPorId(req, res));
router.post("/", (req, res) => detalleComandaControlador.crear(req, res));
router.put("/:id", (req, res) => detalleComandaControlador.actualizar(req, res));
router.delete("/:id", (req, res) => detalleComandaControlador.eliminar(req, res));

export default router;