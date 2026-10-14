import { Router } from "express";
import { MesaControlador } from "../controladores/MesaControlador.js";

const mesaControlador = new MesaControlador();
const router = Router();

router.get("/", (req, res) => mesaControlador.listar(req, res));
router.get("/:id", (req, res) => mesaControlador.obtenerPorId(req, res));
router.post("/", (req, res) => mesaControlador.crear(req, res));
router.put("/:id", (req, res) => mesaControlador.actualizar(req, res));

export default router;
