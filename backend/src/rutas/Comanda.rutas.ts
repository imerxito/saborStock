import { Router } from "express";
import { ComandaControlador } from "../controladores/ComandaControlador.js";

const comandaControlador = new ComandaControlador();
const router = Router();

router.get("/", (req, res) => comandaControlador.listar(req, res));
router.get("/:id", (req, res) => comandaControlador.obtenerPorId(req, res));
router.post("/", (req, res) => comandaControlador.crear(req, res));
router.put("/:id", (req, res) => comandaControlador.actualizar(req, res));

export default router;