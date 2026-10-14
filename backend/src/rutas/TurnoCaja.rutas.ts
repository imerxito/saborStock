import { Router } from "express";
import { TurnoCajaControlador } from "../controladores/TurnoCajaControlador.js";

const controlador = new TurnoCajaControlador();
const router = Router();

router.get("/", controlador.listar);
router.get("/caja/:idCaja/abierto", controlador.obtenerAbiertoPorCaja); 
router.get("/:id", controlador.obtenerPorId);
router.post("/", controlador.abrir);
router.patch("/:id/cerrar", controlador.cerrar);

export default router;