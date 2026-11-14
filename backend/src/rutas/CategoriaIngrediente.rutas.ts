import { Router } from "express";
import { CategoriaIngredienteControlador } from "../controladores/CategoriaIngredienteControlador.js";

const router = Router();
const controlador = new CategoriaIngredienteControlador();

router.get("/", controlador.listar);
router.get("/:id", controlador.obtenerPorId);
router.post("/", controlador.crear);
router.put("/:id", controlador.actualizar);
router.patch("/:id/activar", controlador.activar);
router.patch("/:id/desactivar", controlador.desactivar);

export default router;
