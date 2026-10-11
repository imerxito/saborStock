import {Request, Response} from "express";
import {SeccionServicio} from "../servicios/SeccionServicio.js";

const servicio = new SeccionServicio();

export class SeccionControlador{
    async listar(req:Request,res:Response):Promise<void>{
        try{
            const secciones = await servicio.listar();
            res.status(200).json(secciones);
        }catch(error:any){
            res.status(500).json({mensaje:error.message})
        }
    }

    async obtenerPorId(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const seccion = await servicio.obtenerPorId(req.params.id);
            res.status(200).json(seccion);
        }catch(error:any){
            res.status(404).json({mensaje:error.message})
        }
    }

    async crear(req:Request,res:Response):Promise<void>{
        try{
            const nuevaSeccion = await servicio.crear(req.body);
            res.status(201).json(nuevaSeccion);
        }catch(error:any){
            res.status(400).json({mensaje:error.message})
        }
    }

    async actualizar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const seccionActualizada = await servicio.actualizar(req.params.id, req.body);
            res.status(200).json(seccionActualizada);
        }catch(error:any){
            res.status(400).json({mensaje:error.message})
        }
    }

    async obtenerPorNombre(req:Request<{nombre:string}>,res:Response):Promise<void>{
        try{
            const seccion = await servicio.buscarPorNombre(req.params.nombre);
            if(!seccion){
                res.status(404).json({mensaje:"Sección no encontrada"});
                return;
            }
            res.status(200).json(seccion);
        }catch(error:any){
            res.status(500).json({mensaje:error.message})
        }
    }

    async eliminar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            await servicio.eliminar(req.params.id);
            res.status(200).json({mensaje:"Sección eliminada correctamente"});
        }catch(error:any){
            res.status(500).json({mensaje:error.message})
        }
    }
}
