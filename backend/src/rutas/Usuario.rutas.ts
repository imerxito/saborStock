import { Router } from "express";
import { UsuarioControlador } from "../controladores/UsuarioControlador.js";

const router = Router();
const usuarioControlador = new UsuarioControlador();

router.get("/", (req, res) => usuarioControlador.listar(req, res));
router.get("/cedula/:cedula", (req, res) => usuarioControlador.obtenerPorCerdula(req, res));
router.get("/:id", (req, res) => usuarioControlador.obtenerPorId(req, res));
router.post("/", (req, res) => usuarioControlador.crear(req, res));
router.patch("/:id/desactivar", (req, res) => usuarioControlador.desactivar(req, res));
router.patch("/:id/activar", (req, res) => usuarioControlador.activar(req, res));
router.put("/:id", (req, res) => usuarioControlador.actualizar(req, res));

export default router;
