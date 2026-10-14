import { Router } from "express";
import { RecetaControlador } from "../controladores/RecetaControlador.js";

const router = Router();
const recetaControlador = new RecetaControlador();

router.get("/", (req, res) =>
    recetaControlador.listar(req, res)
);

router.get("/producto/:idProducto", (req, res) =>
    recetaControlador.listarPorProducto(req, res)
);

router.get("/:idProducto/:idIngrediente", (req, res) =>
    recetaControlador.obtenerPorId(req, res)
);

router.post("/", (req, res) =>
    recetaControlador.crear(req, res)
);

router.put("/:idProducto/:idIngrediente", (req, res) =>
    recetaControlador.actualizar(req, res)
);

router.delete("/:idProducto/:idIngrediente", (req, res) =>
    recetaControlador.eliminar(req, res)
);

export default router;