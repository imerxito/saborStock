import {Router} from "express";
import {CajaControlador} from "../controladores/CajaControlador.js";

const controlador = new CajaControlador();
const router = Router();

router.get("/", controlador.listar);
router.get("/:id", controlador.obtenerPorId);
router.post("/", controlador.crear);
router.put("/:id", controlador.actualizar);
router.delete("/:id", controlador.eliminar);

export default router;