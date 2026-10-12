import {Request, Response} from 'express';
import {UnidadMedidaServicio} from '../servicios/UnidadMedidaServicio.js';

const unidadMedidaServicio = new UnidadMedidaServicio();

export class UnidadMedidaControlador{
    async listar(req:Request,res:Response):Promise<void>{
        try{
            const unidades = await unidadMedidaServicio.listar();
            res.status(200).json(unidades);
        }catch(error:any){
            res.status(500).json({mensaje:error.message})
        }
    }

    async obtenerPorId(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const unidad = await unidadMedidaServicio.obtenerPorId(req.params.id);
            res.status(200).json(unidad);
        }catch(error:any){
            res.status(404).json({mensaje:error.message})
        }
    }

    async crear(req:Request,res:Response):Promise<void>{
        try{
            const nuevaUnidad = await unidadMedidaServicio.crear(req.body);
            res.status(201).json(nuevaUnidad);
        }catch(error:any){
            res.status(400).json({mensaje:error.message})
        }
    }
    
    async actualizar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            const unidadActualizada = await unidadMedidaServicio.actualizar(req.params.id, req.body);
            res.status(200).json(unidadActualizada);
        }catch(error:any){
            res.status(400).json({mensaje:error.message})
        }
    }

    async activar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            await unidadMedidaServicio.activar(req.params.id);
            res.status(200).json({mensaje:"unidad de medida activada correctamente"});
        }catch(error:any){
            res.status(404).json({mensaje:error.message})
        }
    }

    async desactivar(req:Request<{id:string}>,res:Response):Promise<void>{
        try{
            await unidadMedidaServicio.desactivar(req.params.id);
            res.status(200).json({mensaje:"unidad de medida desactivada correctamente"});
        }catch(error:any){
            res.status(404).json({mensaje:error.message})
        }
    }       

}