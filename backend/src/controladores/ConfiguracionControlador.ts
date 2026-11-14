import { Request, Response } from 'express';
import { ConfiguracionServicio } from '../servicios/ConfiguracionServicio.js';

const servicio = new ConfiguracionServicio();

export class ConfiguracionControlador {
  // Negocio
  async obtenerNegocio(_req: Request, res: Response): Promise<void> {
    try {
      const data = await servicio.obtenerNegocio();
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ mensaje: error.message });
    }
  }

  async actualizarNegocio(req: Request, res: Response): Promise<void> {
    try {
      const data = await servicio.actualizarNegocio(req.body);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  // Facturacion
  async obtenerFacturacion(_req: Request, res: Response): Promise<void> {
    try {
      const data = await servicio.obtenerFacturacion();
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ mensaje: error.message });
    }
  }

  async actualizarFacturacion(req: Request, res: Response): Promise<void> {
    try {
      const data = await servicio.actualizarFacturacion(req.body);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  // Impresoras
  async listarImpresoras(_req: Request, res: Response): Promise<void> {
    try {
      const data = await servicio.listarImpresoras();
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ mensaje: error.message });
    }
  }

  async crearImpresora(req: Request, res: Response): Promise<void> {
    try {
      const data = await servicio.crearImpresora(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async actualizarImpresora(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await servicio.actualizarImpresora(id, req.body);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async eliminarImpresora(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await servicio.eliminarImpresora(id);
      res.status(200).json({ mensaje: 'Impresora eliminada exitosamente' });
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  // Rutas
  async listarRutas(_req: Request, res: Response): Promise<void> {
    try {
      const data = await servicio.listarRutas();
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ mensaje: error.message });
    }
  }

  async asignarRuta(req: Request, res: Response): Promise<void> {
    try {
      const { idCategoria, idImpresora } = req.body;
      await servicio.asignarRuta(Number(idCategoria), idImpresora ? Number(idImpresora) : null);
      res.status(200).json({ mensaje: 'Ruta actualizada exitosamente' });
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  // Pagos
  obtenerPagos(_req: Request, res: Response): void {
    try {
      const data = servicio.obtenerPagos();
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ mensaje: error.message });
    }
  }

  guardarPagos(req: Request, res: Response): void {
    try {
      const data = servicio.guardarPagos(req.body);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async listarImpresorasSistema(_req: Request, res: Response): Promise<void> {
    try {
      const data = await servicio.listarImpresorasDelSistema();
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ mensaje: error.message });
    }
  }

  async probarImpresora(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await servicio.probarImpresoraDirecta(id);
      res.status(200).json(resultado);
    } catch (error: any) {
      res.status(400).json({ success: false, modo: 'fallback_navegador', mensaje: error.message });
    }
  }

  async imprimirComanda(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await servicio.imprimirComandaDirecta(id, req.body);
      res.status(200).json(resultado);
    } catch (error: any) {
      res.status(400).json({ success: false, modo: 'fallback_navegador', mensaje: error.message });
    }
  }
}
