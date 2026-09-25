import { Request,Response } from "express";
import { UsuarioServicio } from "../servicios/UsuarioServicio.js";

const usuarioServicio = new UsuarioServicio();

export class UsuarioControlador{
    async listar(req:Request,res:Response):Promise<void>{
        try{
            const usuarios = await usuarioServicio.listar();
            res.status(200).json(usuarios)
        }catch(error:any){
            res.status(500).json({mensaje: error.message})
        }
    }

    async obtenerPorId(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const usuario = await usuarioServicio.obtenerPorId(req.params.id);
            res.status(200).json(usuario)
        }catch(error:any){
            res.status(404).json({mensaje: error.message});
        }
    }

    async obtenerPorCerdula(req:Request<{cedula:string}>,res:Response):Promise<void>{
       try{
            const usuario = await usuarioServicio.obtenerPorCedula(req.params.cedula);
            res.status(200).json(usuario)
        }catch(error:any){
            res.status(404).json({mensaje: error.message});
        } 
    }

    async crear(req:Request,res:Response):Promise<void>{
        try{
            const nuevoUsuario= await usuarioServicio.crear(req.body);
            res.status(201).json(nuevoUsuario);
        }catch(error:any){
            res.status(400).json({mensaje:error.message})
        }
    }

    async actualizar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const usuarioActualizado = await usuarioServicio.actualizar(req.params.id, req.body);
            res.status(200).json(usuarioActualizado);
        }catch(error:any){
            res.status(400).json({mensaje: error.message});
        }
        
    }

    async desactivar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const usuario = await usuarioServicio.desactivar(req.params.id);
            res.status(200).json(usuario); 
        }catch(error:any){
            res.status(400).json({mensaje: error.message})
        }
    }

    async activar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const usuario = await usuarioServicio.activar(req.params.id);
            res.status(200).json(usuario); 
        }catch(error:any){
            res.status(400).json({mensaje: error.message})
        }
    }
}
