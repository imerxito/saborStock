import { NominaRepositorio, PagoNominaCompleto, CrearPagoNominaInput } from "../persistencia/NominaRepositorio.js";
import { HistorialCajaRepositorio } from "../persistencia/HistorialCajaRepositorio.js";

export class NominaServicio {
  constructor(
    private repo = new NominaRepositorio(),
    private historialCajaRepo = new HistorialCajaRepositorio()
  ) {}

  async listar(): Promise<PagoNominaCompleto[]> {
    return await this.repo.listar();
  }

  async obtenerPorId(id: number): Promise<PagoNominaCompleto | null> {
    return await this.repo.obtenerPorId(id);
  }

  async crear(datos: CrearPagoNominaInput & { registrarEgresoCaja?: boolean; idUsuarioOperador?: number }): Promise<PagoNominaCompleto> {
    const pago = await this.repo.crear(datos);

    // Si se especificó turno de caja y se requiere registrar egreso
    if (datos.registrarEgresoCaja && datos.idTurnoCaja && pago.montoTotal > 0) {
      try {
        await this.historialCajaRepo.crearHistorialCaja({
          idTurnoCaja: datos.idTurnoCaja,
          idUsuario: datos.idUsuarioOperador || datos.idUsuario,
          monto: pago.montoTotal,
          metodoPago: datos.metodoPago || "Efectivo",
          tipoPago: "egreso",
          descripcion: `Pago Nómina a ${pago.empleado} (${pago.cargo})`,
        });
      } catch (err) {
        console.warn("No se pudo registrar el egreso en historial_caja:", err);
      }
    }

    return pago;
  }

  async eliminar(id: number): Promise<void> {
    await this.repo.eliminar(id);
  }
}
