import { Request, Response } from "express";
import { NominaServicio } from "../servicios/NominaServicio.js";

export class NominaControlador {
  constructor(private servicio = new NominaServicio()) {}

  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.servicio.listar();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Error al listar pagos de nómina" });
    }
  };

  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        res.status(400).json({ error: "ID inválido" });
        return;
      }
      const data = await this.servicio.obtenerPorId(id);
      if (!data) {
        res.status(404).json({ error: "Pago de nómina no encontrado" });
        return;
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Error al obtener pago de nómina" });
    }
  };

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idUsuario, idTurnoCaja, montoBase, bono, metodoPago, fecha, registrarEgresoCaja, idUsuarioOperador } = req.body;
      if (!idUsuario) {
        res.status(400).json({ error: "El empleado (idUsuario) es obligatorio" });
        return;
      }
      const baseNum = Number(montoBase);
      const bonoNum = Number(bono || 0);
      if (isNaN(baseNum) || baseNum < 0) {
        res.status(400).json({ error: "El monto base debe ser un número válido mayor o igual a 0" });
        return;
      }
      if (baseNum + bonoNum <= 0) {
        res.status(400).json({ error: "El monto total a pagar debe ser mayor a 0" });
        return;
      }

      const nuevoPago = await this.servicio.crear({
        idUsuario: Number(idUsuario),
        idTurnoCaja: idTurnoCaja ? Number(idTurnoCaja) : null,
        montoBase: baseNum,
        bono: bonoNum,
        metodoPago: metodoPago || "Efectivo",
        fecha: fecha || new Date().toISOString(),
        registrarEgresoCaja: registrarEgresoCaja !== false,
        idUsuarioOperador: idUsuarioOperador ? Number(idUsuarioOperador) : undefined,
      });

      res.status(201).json(nuevoPago);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Error al registrar pago de nómina" });
    }
  };

  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        res.status(400).json({ error: "ID inválido" });
        return;
      }
      await this.servicio.eliminar(id);
      res.json({ success: true, message: "Pago de nómina eliminado correctamente" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Error al eliminar pago de nómina" });
    }
  };
}
