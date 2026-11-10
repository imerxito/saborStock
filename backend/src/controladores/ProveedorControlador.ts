import {Request, Response} from "express";
import { ProveedorServicio } from "../servicios/ProveedorServicio.js";

const proveedorServicio = new ProveedorServicio({} as any);

export class ProveedorControlador {

    async listar(req: Request, res: Response): Promise<void> {
        try {
            const proveedores = await proveedorServicio.listar();
            res.status(200).json(proveedores);
        } catch (error: any) {
            res.status(500).json({mensaje: error.message});
        }
    }

    async obtenerPorId(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            const proveedor = await proveedorServicio.obtenerPorId(id);

            res.status(200).json(proveedor);
        } catch (error: any) {
            res.status(500).json({mensaje: error.message});
        }
    }
    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevoProveedor = await proveedorServicio.crear(req.body);
            res.status(201).json(nuevoProveedor);
        } catch (error: any) {
            res.status(400).json({mensaje: error.message});
        }
    }

    async actualizar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            const proveedorActualizado = await proveedorServicio.actualizar(id, req.body);
            res.status(200).json(proveedorActualizado);
        } catch (error: any) {
            res.status(400).json({mensaje: error.message});
        }
    }

    async eliminar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            await proveedorServicio.eliminar(id);
            res.status(200).json({mensaje: "Proveedor eliminado correctamente"});
        } catch (error: any) {
            res.status(400).json({mensaje: error.message});
        }
    }

    async desactivar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            await proveedorServicio.desactivar(id);
            res.status(200).json({mensaje: "Proveedor desactivado correctamente"});
        } catch (error: any) {
            res.status(400).json({mensaje: error.message});
        }
    }

    async activar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            await proveedorServicio.activar(id);
            res.status(200).json({mensaje: "Proveedor activado correctamente"});
        } catch (error: any) {
            res.status(400).json({mensaje: error.message});
        }
    }
}