import {Router} from "express";
import {ProveedorControlador} from "../controladores/ProveedorControlador.js";

const router = Router();
const proveedorControlador = new ProveedorControlador();

router.get("/", (req, res) => proveedorControlador.listar(req, res));
router.get("/:id", (req, res) => proveedorControlador.obtenerPorId(req, res));
router.post("/", (req, res) => proveedorControlador.crear(req, res));
router.put("/:id", (req, res) => proveedorControlador.actualizar(req, res));
router.delete("/:id", (req, res) => proveedorControlador.eliminar(req, res));
router.patch("/:id/desactivar", (req, res) => proveedorControlador.desactivar(req, res));
router.patch("/:id/activar", (req, res) => proveedorControlador.activar(req, res));

export default router;