import { Router } from "express";
import { CategoriaControlador } from "../controladores/CategoriaControlador.js";
import { autorizarGerencia } from "../middlewares/auth.middleware.js";

const router = Router();
const categoriaControlador = new CategoriaControlador();

router.get("/", (req, res) => categoriaControlador.listar(req, res));
router.get("/:id", (req: any, res) => categoriaControlador.obtenerPorId(req, res));
router.post("/", autorizarGerencia, (req, res) => categoriaControlador.crear(req, res));
router.put("/:id", autorizarGerencia, (req: any, res) => categoriaControlador.actualizar(req, res));
router.delete("/:id", autorizarGerencia, (req: any, res) => categoriaControlador.eliminar(req, res));
router.patch("/:id/activar", autorizarGerencia, (req: any, res) => categoriaControlador.activar(req, res));
router.patch("/:id/desactivar", autorizarGerencia, (req: any, res) => categoriaControlador.desactivar(req, res));

export default router;