import {Request, Response} from "express";
import {CategoriaServicio} from "../servicios/CategoriaServicio.js";

const servicio = new CategoriaServicio();

export class CategoriaControlador{
    async listar(req:Request,res:Response):Promise<void>{
        try{
            const categorias = await servicio.listar();
            res.status(200).json(categorias);
        }catch(error:any){
            res.status(500).json({mensaje:error.message})
        }
    }

    async obtenerPorId(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const categoria = await servicio.obtenerPorId(req.params.id);
            res.status(200).json(categoria);
        }catch(error:any){
            res.status(404).json({mensaje:error.message})
        }
    }

    async crear(req:Request,res:Response):Promise<void>{
        try{
            const nuevaCategoria = await servicio.crear(req.body);
            res.status(201).json(nuevaCategoria);
        }catch(error:any){
            res.status(400).json({mensaje:error.message})
        }
    }

    async actualizar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const categoriaActualizada = await servicio.actualizar(req.params.id, req.body);
            res.status(200).json(categoriaActualizada);
        }catch(error:any){
            res.status(400).json({mensaje:error.message})
        }
    }

    async eliminar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            await servicio.eliminar(req.params.id);
            res.status(200).json({mensaje:"categoria eliminada correctamente"});
        }catch(error:any){
            res.status(404).json({mensaje:error.message})
        }
    }
    
    async activar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            await servicio.activar(req.params.id);
            res.status(200).json({mensaje:"categoria activada correctamente"});
        }catch(error:any){
            res.status(404).json({mensaje:error.message})
        
        }
    }

    async desactivar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            await servicio.desactivar(req.params.id);
            res.status(200).json({mensaje:"categoria desactivada correctamente"});
        }catch(error:any){
            res.status(404).json({mensaje:error.message})
        }
    }
}