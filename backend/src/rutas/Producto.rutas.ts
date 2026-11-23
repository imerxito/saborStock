import { Router } from "express";
import { ProductoControlador } from "../controladores/ProductoControlador.js";
import { autorizarGerencia, autorizarEdicionProducto } from "../middlewares/auth.middleware.js";

const router = Router();
const productoControlador = new ProductoControlador();

router.get("/", (req, res) => productoControlador.listar(req, res));
router.get("/:id", (req: any, res) => productoControlador.obtenerPorId(req, res));
router.post("/", autorizarGerencia, (req, res) => productoControlador.crear(req, res));
router.put("/:id", autorizarEdicionProducto, (req: any, res) => productoControlador.actualizar(req, res));
router.delete("/:id", autorizarGerencia, (req: any, res) => productoControlador.eliminar(req, res));
router.patch("/:id/desactivar", (req: any, res) =>
    productoControlador.desactivar(req, res)
);

export default router;
