import { Router } from "express";
import { ComponenteComboControlador } from "../controladores/ComponenteComboControlador.js";
import { autorizarGerencia } from "../middlewares/auth.middleware.js";

const router = Router();
const controlador = new ComponenteComboControlador();

router.get("/", controlador.listarTodos);
router.get("/combo/:idCombo", controlador.listarPorCombo);
router.post("/", autorizarGerencia, controlador.crear);
router.put("/:id", autorizarGerencia, controlador.actualizar);
router.delete("/combo/:idCombo", autorizarGerencia, controlador.eliminarPorCombo);
router.delete("/:id", autorizarGerencia, controlador.eliminar);

export default router;
