import { supabase } from '../configuracion/Supabase.js';
import {
  Venta,
  VentaRow,
  CrearVentaDTO,
  ActualizarVentaDTO,
  mapVentaFromRow,
} from '../modelos/Venta.js';

const TABLA = 'venta';

export class VentaRepositorio {
  async listar(): Promise<Venta[]> {
    const { data, error } = await supabase
      .from(TABLA)
      .select('*')
      .order('fecha_apertura', { ascending: false });
    if (error) throw new Error(`Error al listar ventas: ${error.message}`);
    return (data as VentaRow[]).map(mapVentaFromRow);
  }

  async obtenerPorId(id: number): Promise<Venta | null> {
    const { data, error } = await supabase
      .from(TABLA)
      .select('*')
      .eq('id_venta', id)
      .maybeSingle();
    if (error) throw new Error(`Error al obtener venta: ${error.message}`);
    return data ? mapVentaFromRow(data as VentaRow) : null;
  }

  async listarPorMesa(idMesa: number): Promise<Venta[]> {
    const { data, error } = await supabase
      .from(TABLA)
      .select('*')
      .eq('id_mesa', idMesa)
      .order('fecha_apertura', { ascending: false });
    if (error) throw new Error(`Error al listar ventas por mesa: ${error.message}`);
    return (data as VentaRow[]).map(mapVentaFromRow);
  }

  async obtenerVentaAbiertaDeMesa(idMesa: number): Promise<Venta | null> {
    const { data, error } = await supabase
      .from(TABLA)
      .select('*')
      .eq('id_mesa', idMesa)
      .eq('estado', 'Abierta')
      .maybeSingle();
    if (error) throw new Error(`Error al obtener venta abierta: ${error.message}`);
    return data ? mapVentaFromRow(data as VentaRow) : null;
  }

  async crear(params: CrearVentaDTO): Promise<Venta> {
    const { data, error } = await supabase
      .from(TABLA)
      .insert({
        id_mesa: params.idMesa ?? null,
        cliente: params.cliente ?? 'Consumidor Final',
        personas: params.personas ?? 1,
        id_usuario: params.idUsuario ?? null,
        estado: 'Abierta',
        observacion: params.observacion ?? null,
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23503') throw new Error('La mesa o el usuario indicado no existe');
      throw new Error(`Error al crear venta: ${error.message}`);
    }
    return mapVentaFromRow(data as VentaRow);
  }

  async actualizar(id: number, cambios: ActualizarVentaDTO): Promise<void> {
    const campos: Record<string, unknown> = {};
    if (cambios.cliente !== undefined) campos.cliente = cambios.cliente;
    if (cambios.personas !== undefined) campos.personas = cambios.personas;
    if (cambios.estado !== undefined) campos.estado = cambios.estado;
    if (cambios.fechaCierre !== undefined) campos.fecha_cierre = cambios.fechaCierre;
    if (cambios.observacion !== undefined) campos.observacion = cambios.observacion;

    if (Object.keys(campos).length === 0) return;

    const { error } = await supabase
      .from(TABLA)
      .update(campos)
      .eq('id_venta', id);
    if (error) throw new Error(`Error al actualizar venta: ${error.message}`);
  }

  async cerrar(id: number): Promise<void> {
    const { error } = await supabase
      .from(TABLA)
      .update({ estado: 'Pagada', fecha_cierre: new Date().toISOString() })
      .eq('id_venta', id);
    if (error) throw new Error(`Error al cerrar venta: ${error.message}`);
  }

  async anular(id: number): Promise<void> {
    const { error } = await supabase
      .from(TABLA)
      .update({ estado: 'Anulada', fecha_cierre: new Date().toISOString() })
      .eq('id_venta', id);
    if (error) throw new Error(`Error al anular venta: ${error.message}`);
  }
}
