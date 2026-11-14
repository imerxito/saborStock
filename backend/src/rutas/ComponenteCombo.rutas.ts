import { Router } from "express";
import { ComponenteComboControlador } from "../controladores/ComponenteComboControlador.js";

const router = Router();
const controlador = new ComponenteComboControlador();

router.get("/", controlador.listarTodos);
router.get("/combo/:idCombo", controlador.listarPorCombo);
router.post("/", controlador.crear);
router.put("/:id", controlador.actualizar);
router.delete("/combo/:idCombo", controlador.eliminarPorCombo);
router.delete("/:id", controlador.eliminar);

export default router;
