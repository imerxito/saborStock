import { Router } from "express";
import { UsuarioControlador } from "../controladores/UsuarioControlador.js";

const router= Router();
const usuarioControlador= new UsuarioControlador();

router.get("/",(req,res)=>usuarioControlador.listar(req,res));
router.get("/:id",(req,res)=>usuarioControlador.obtenerPorId(req,res));
router.get("/:cedula",(req,res)=>usuarioControlador.obtenerPorCerdula(req,res));
router.post("/",(req,res)=>usuarioControlador.crear(req,res));
router.patch("/id/desactivar",usuarioControlador.desactivar);
router.patch("/id/activar",usuarioControlador.activar);
router.put("/:id",(req,res)=>usuarioControlador.actualizar(req,res));

export default router;