import { Router } from "express";
import { IngredienteControlador } from "../controladores/IngredienteControlador.js";

const router = Router();
const ingredienteControlador = new IngredienteControlador();

router.get("/", (req, res) =>
    ingredienteControlador.listar(req, res)
);

router.get("/:id", (req, res) =>
    ingredienteControlador.obtenerPorId(req, res)
);

router.post("/", (req, res) =>
    ingredienteControlador.crear(req, res)
);

router.put("/:id", (req, res) =>
    ingredienteControlador.actualizar(req, res)
);

// Desactiva un ingrediente
router.patch("/:id/desactivar", (req, res) =>
    ingredienteControlador.desactivar(req, res)
);

export default router;