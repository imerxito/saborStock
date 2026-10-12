import { Router } from "express";
import { ProductoControlador } from "../controladores/ProductoControlador.js";

const router = Router();
const productoControlador = new ProductoControlador();

router.get("/", (req, res) => productoControlador.listar(req, res));

router.get("/:id", (req, res) => productoControlador.obtenerPorId(req, res));

router.post("/", (req, res) => productoControlador.crear(req, res));

router.put("/:id", (req, res) => productoControlador.actualizar(req, res));

router.patch("/:id/desactivar", (req, res) =>
    productoControlador.desactivar(req, res)
);

export default router;