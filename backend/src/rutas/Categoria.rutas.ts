import {Router} from "express";
import {CategoriaControlador} from "../controladores/CategoriaControlador.js";

const router= Router();
const categoriaControlador= new CategoriaControlador();

router.get("/",(req,res)=>categoriaControlador.listar(req,res));
router.get("/:id",(req,res)=>categoriaControlador.obtenerPorId(req,res));
router.post("/",(req,res)=>categoriaControlador.crear(req,res));
router.put("/:id",(req,res)=>categoriaControlador.actualizar(req,res));
router.delete("/:id",(req,res)=>categoriaControlador.eliminar(req,res));
router.patch("/:id/activar",(req,res)=>categoriaControlador.activar(req,res));
router.patch("/:id/desactivar",(req,res)=>categoriaControlador.desactivar(req,res));

export default router;