import { Request, Response } from 'express';
import { VentaServicio } from '../servicios/VentaServicio.js';

const servicio = new VentaServicio();

export class VentaControlador {
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const ventas = await servicio.listar();
      res.status(200).json(ventas);
    } catch (error: any) {
      res.status(500).json({ mensaje: error.message });
    }
  }

  async obtenerPorId(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) { res.status(400).json({ mensaje: 'ID invalido' }); return; }
      const venta = await servicio.obtenerPorId(id);
      res.status(200).json(venta);
    } catch (error: any) {
      res.status(404).json({ mensaje: error.message });
    }
  }

  async listarPorMesa(req: Request<{ idMesa: string }>, res: Response): Promise<void> {
    try {
      const idMesa = Number(req.params.idMesa);
      if (isNaN(idMesa)) { res.status(400).json({ mensaje: 'ID de mesa invalido' }); return; }
      const ventas = await servicio.listarPorMesa(idMesa);
      res.status(200).json(ventas);
    } catch (error: any) {
      res.status(500).json({ mensaje: error.message });
    }
  }

  async crear(req: Request, res: Response): Promise<void> {
    try {
      const nueva = await servicio.crear(req.body);
      res.status(201).json(nueva);
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async actualizar(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) { res.status(400).json({ mensaje: 'ID invalido' }); return; }
      const actualizada = await servicio.actualizar(id, req.body);
      res.status(200).json(actualizada);
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async cerrar(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) { res.status(400).json({ mensaje: 'ID invalido' }); return; }
      await servicio.cerrar(id);
      res.status(200).json({ mensaje: 'Venta cerrada correctamente' });
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async anular(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) { res.status(400).json({ mensaje: 'ID invalido' }); return; }
      await servicio.anular(id);
      res.status(200).json({ mensaje: 'Venta anulada correctamente' });
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }
}
