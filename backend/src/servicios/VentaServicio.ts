import { VentaRepositorio } from '../persistencia/VentaRepositorio.js';
import { Venta, CrearVentaDTO, ActualizarVentaDTO } from '../modelos/Venta.js';

export class VentaServicio {
  private repo = new VentaRepositorio();

  async listar(): Promise<Venta[]> {
    return this.repo.listar();
  }

  async obtenerPorId(id: number): Promise<Venta> {
    const venta = await this.repo.obtenerPorId(id);
    if (!venta) throw new Error('Venta no encontrada');
    return venta;
  }

  async listarPorMesa(idMesa: number): Promise<Venta[]> {
    return this.repo.listarPorMesa(idMesa);
  }

  async obtenerVentaAbiertaDeMesa(idMesa: number): Promise<Venta | null> {
    return this.repo.obtenerVentaAbiertaDeMesa(idMesa);
  }

  async crear(dto: CrearVentaDTO): Promise<Venta> {
    return this.repo.crear(dto);
  }

  async actualizar(id: number, dto: ActualizarVentaDTO): Promise<Venta> {
    await this.obtenerPorId(id);
    await this.repo.actualizar(id, dto);
    return this.obtenerPorId(id);
  }

  async cerrar(id: number): Promise<void> {
    const venta = await this.obtenerPorId(id);
    if (venta.estado !== 'Abierta') {
      throw new Error('Solo se pueden cerrar ventas en estado Abierta');
    }
    await this.repo.cerrar(id);
  }

  async anular(id: number): Promise<void> {
    const venta = await this.obtenerPorId(id);
    if (venta.estado === 'Anulada') {
      throw new Error('La venta ya esta anulada');
    }
    await this.repo.anular(id);
  }
}
