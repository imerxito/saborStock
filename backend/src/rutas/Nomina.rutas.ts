import { Router } from "express";
import { NominaControlador } from "../controladores/NominaControlador.js";

const router = Router();
const controlador = new NominaControlador();

router.get("/", controlador.listar);
router.get("/:id", controlador.obtenerPorId);
router.post("/", controlador.crear);
router.delete("/:id", controlador.eliminar);

export default router;
