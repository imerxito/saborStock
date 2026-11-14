import fs from 'fs';
import path from 'path';
import net from 'net';
import { supabase } from '../configuracion/Supabase.js';
import {
  listarImpresorasSistema,
  imprimirTextoEnImpresora,
  generarTicketTextoComanda,
  generarTicketTextoPrueba,
  type ImpresoraSistema,
} from '../utilidades/ImpresionWindows.js';
import {
  ConfiguracionNegocio,
  ActualizarConfiguracionNegocioDTO,
  mapConfiguracionNegocioFromRow,
} from '../tipos/ConfiguracionNegocio.js';
import {
  ConfiguracionFacturacion,
  ActualizarConfiguracionFacturacionDTO,
  mapConfiguracionFacturacionFromRow,
} from '../tipos/ConfiguracionFacturacion.js';
import { Impresora } from '../tipos/Impresora.js';
import { TipoImpresora } from '../tipos/TipoImpresora.js';
import { RutaImpresion } from '../tipos/RutaImpresion.js';

export interface ImpresoraConFiltros extends Impresora {
  categoriasIds: number[];
  seccionesIds: number[];
}

export interface MetodoPagoConfig {
  id: string;
  nombre: string;
  icono: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
  activo: boolean;
  requiereReferencia: boolean;
  cuentaDestino?: string;
}

const DATOS_DIR = path.resolve(process.cwd(), 'datos');
const PAGOS_FILE = path.join(DATOS_DIR, 'configuracion_pagos.json');
const METADATA_IMPRESORAS_FILE = path.join(DATOS_DIR, 'impresoras_metadata.json');

function asegurarDirectorio() {
  if (!fs.existsSync(DATOS_DIR)) {
    fs.mkdirSync(DATOS_DIR, { recursive: true });
  }
}

function leerMetadataImpresoras(): Record<string, { seccionesIds?: number[]; categoriasIds?: number[] }> {
  try {
    asegurarDirectorio();
    if (fs.existsSync(METADATA_IMPRESORAS_FILE)) {
      return JSON.parse(fs.readFileSync(METADATA_IMPRESORAS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error al leer metadata de impresoras:', e);
  }
  return {};
}

function guardarMetadataImpresoras(data: Record<string, { seccionesIds?: number[]; categoriasIds?: number[] }>) {
  try {
    asegurarDirectorio();
    fs.writeFileSync(METADATA_IMPRESORAS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error al guardar metadata de impresoras:', e);
  }
}

export class ConfiguracionRepositorio {
  // ================= NEGOCIO =================
  async obtenerNegocio(): Promise<ConfiguracionNegocio> {
    const { data, error } = await supabase
      .from('configuracion_negocio')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener configuración de negocio: ${error.message}`);
    }

    if (!data) {
      // Crear registro por defecto si no existe
      const { data: nuevo, error: createError } = await supabase
        .from('configuracion_negocio')
        .insert({
          nombre: 'Sabor & Stock Restaurante',
          nit: '900.123.456-7',
          direccion: 'Calle 100 # 15-20, Bogotá',
          telefono: '601 123 4567',
          email: 'contacto@saborystock.com',
          moneda: 'COP',
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error al inicializar configuración de negocio: ${createError.message}`);
      }
      return mapConfiguracionNegocioFromRow(nuevo);
    }

    return mapConfiguracionNegocioFromRow(data);
  }

  async actualizarNegocio(datos: ActualizarConfiguracionNegocioDTO): Promise<ConfiguracionNegocio> {
    const negocioActual = await this.obtenerNegocio();

    const payload: any = {
      actualizado_en: new Date().toISOString(),
    };
    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (datos.nit !== undefined) payload.nit = datos.nit;
    if (datos.direccion !== undefined) payload.direccion = datos.direccion;
    if (datos.telefono !== undefined) payload.telefono = datos.telefono;
    if (datos.email !== undefined) payload.email = datos.email;
    if (datos.moneda !== undefined) payload.moneda = datos.moneda;
    if (datos.logoUrl !== undefined) payload.logo_url = datos.logoUrl;

    const { data, error } = await supabase
      .from('configuracion_negocio')
      .update(payload)
      .eq('id', negocioActual.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar configuración de negocio: ${error.message}`);
    }

    return mapConfiguracionNegocioFromRow(data);
  }

  // ================= FACTURACIÓN =================
  async obtenerFacturacion(): Promise<ConfiguracionFacturacion> {
    const { data, error } = await supabase
      .from('configuracion_facturacion')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener configuración de facturación: ${error.message}`);
    }

    if (!data) {
      const { data: nuevo, error: createError } = await supabase
        .from('configuracion_facturacion')
        .insert({
          habilitada: false,
          entorno: 'pruebas',
          resolucion: '18760000001',
          prefijo: 'FAC',
          rango_inicial: 1,
          rango_final: 5000,
          fecha_inicio: '2024-01-01',
          fecha_fin: '2026-12-31',
          certificado_cargado: false,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error al inicializar configuración de facturación: ${createError.message}`);
      }
      return mapConfiguracionFacturacionFromRow(nuevo);
    }

    return mapConfiguracionFacturacionFromRow(data);
  }

  async actualizarFacturacion(datos: ActualizarConfiguracionFacturacionDTO): Promise<ConfiguracionFacturacion> {
    const facturacionActual = await this.obtenerFacturacion();

    const payload: any = {
      actualizado_en: new Date().toISOString(),
    };
    if (datos.habilitada !== undefined) payload.habilitada = datos.habilitada;
    if (datos.entorno !== undefined) payload.entorno = datos.entorno;
    if (datos.resolucion !== undefined) payload.resolucion = datos.resolucion;
    if (datos.prefijo !== undefined) payload.prefijo = datos.prefijo;
    if (datos.rangoInicial !== undefined) payload.rango_inicial = datos.rangoInicial ? Number(datos.rangoInicial) : null;
    if (datos.rangoFinal !== undefined) payload.rango_final = datos.rangoFinal ? Number(datos.rangoFinal) : null;
    if (datos.fechaInicio !== undefined) payload.fecha_inicio = datos.fechaInicio;
    if (datos.fechaFin !== undefined) payload.fecha_fin = datos.fechaFin;
    if (datos.claveTecnica !== undefined) payload.clave_tecnica = datos.claveTecnica;
    if (datos.softwareId !== undefined) payload.software_id = datos.softwareId;
    if (datos.apiKey !== undefined) payload.api_key = datos.apiKey;
    if (datos.certificadoCargado !== undefined) payload.certificado_cargado = datos.certificadoCargado;

    const { data, error } = await supabase
      .from('configuracion_facturacion')
      .update(payload)
      .eq('id', facturacionActual.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar configuración de facturación: ${error.message}`);
    }

    return mapConfiguracionFacturacionFromRow(data);
  }

  // ================= IMPRESORAS Y RUTAS =================
  async listarImpresoras(): Promise<ImpresoraConFiltros[]> {
    const { data: impData, error: impError } = await supabase
      .from('impresora')
      .select('*')
      .order('id_impresora', { ascending: true });

    if (impError) {
      throw new Error(`Error al listar impresoras: ${impError.message}`);
    }

    const { data: rutasData } = await supabase
      .from('ruta_impresion')
      .select('*');

    const metadata = leerMetadataImpresoras();

    return (impData || []).map((row: any) => {
      const match = String(row.direccion || '').match(/^(.*?)(?:\|SEC:([\d,]*))?$/);
      const cleanDireccion = match ? match[1] : row.direccion;
      const encodedSec = match && match[2] ? match[2].split(',').filter(Boolean).map(Number) : [];

      const idStr = String(row.id_impresora);
      const meta = metadata[idStr] || {};
      const seccionesIds = meta.seccionesIds && meta.seccionesIds.length > 0 ? meta.seccionesIds : encodedSec;

      const catsFromRuta = (rutasData || [])
        .filter((r: any) => r.id_impresora === row.id_impresora)
        .map((r: any) => Number(r.id_categoria));

      const categoriasIds = meta.categoriasIds && meta.categoriasIds.length > 0 ? meta.categoriasIds : catsFromRuta;

      return {
        id: row.id_impresora,
        nombre: row.nombre,
        tipo: row.tipo as TipoImpresora,
        direccion: cleanDireccion,
        activa: Boolean(row.activa),
        autoPrint: Boolean(row.auto_print),
        categoriasIds,
        seccionesIds,
      };
    });
  }

  async crearImpresora(datos: {
    nombre: string;
    tipo?: TipoImpresora;
    direccion: string;
    activa?: boolean;
    autoPrint?: boolean;
    categoriasIds?: number[];
    seccionesIds?: number[];
  }): Promise<ImpresoraConFiltros> {
    const secciones = datos.seccionesIds || [];
    const categorias = datos.categoriasIds || [];

    const direccionCompleta = secciones.length > 0 
      ? `${datos.direccion.trim()}|SEC:${secciones.join(',')}`
      : datos.direccion.trim();

    const { data, error } = await supabase
      .from('impresora')
      .insert({
        nombre: datos.nombre.trim(),
        tipo: datos.tipo || 'Red (IP)',
        direccion: direccionCompleta,
        activa: datos.activa !== undefined ? datos.activa : true,
        auto_print: datos.autoPrint !== undefined ? datos.autoPrint : true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear impresora: ${error.message}`);
    }

    const idImpresora = data.id_impresora;

    // Actualizar rutas para las categorías seleccionadas
    if (categorias.length > 0) {
      for (const idCat of categorias) {
        const { data: rutaExistente } = await supabase
          .from('ruta_impresion')
          .select('id_ruta')
          .eq('id_categoria', idCat)
          .maybeSingle();

        if (rutaExistente) {
          await supabase
            .from('ruta_impresion')
            .update({ id_impresora: idImpresora })
            .eq('id_ruta', rutaExistente.id_ruta);
        } else {
          await supabase
            .from('ruta_impresion')
            .insert({
              id_categoria: idCat,
              id_impresora: idImpresora,
            });
        }
      }
    }

    // Guardar en metadata JSON
    const metadata = leerMetadataImpresoras();
    metadata[String(idImpresora)] = {
      seccionesIds: secciones,
      categoriasIds: categorias,
    };
    guardarMetadataImpresoras(metadata);

    return {
      id: data.id_impresora,
      nombre: data.nombre,
      tipo: data.tipo,
      direccion: datos.direccion.trim(),
      activa: data.activa,
      autoPrint: data.auto_print,
      categoriasIds: categorias,
      seccionesIds: secciones,
    };
  }

  async actualizarImpresora(
    id: number,
    datos: {
      nombre?: string;
      tipo?: TipoImpresora;
      direccion?: string;
      activa?: boolean;
      autoPrint?: boolean;
      categoriasIds?: number[];
      seccionesIds?: number[];
    }
  ): Promise<ImpresoraConFiltros> {
    const metadata = leerMetadataImpresoras();
    const idStr = String(id);
    const metaExistente = metadata[idStr] || {};

    const secciones = datos.seccionesIds !== undefined ? datos.seccionesIds : (metaExistente.seccionesIds || []);
    const categorias = datos.categoriasIds !== undefined ? datos.categoriasIds : (metaExistente.categoriasIds || []);

    const payload: any = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre.trim();
    if (datos.tipo !== undefined) payload.tipo = datos.tipo;
    if (datos.activa !== undefined) payload.activa = datos.activa;
    if (datos.autoPrint !== undefined) payload.auto_print = datos.autoPrint;

    if (datos.direccion !== undefined) {
      payload.direccion = secciones.length > 0
        ? `${datos.direccion.trim()}|SEC:${secciones.join(',')}`
        : datos.direccion.trim();
    } else if (datos.seccionesIds !== undefined) {
      // Necesitamos la dirección base existente
      const { data: impActual } = await supabase
        .from('impresora')
        .select('direccion')
        .eq('id_impresora', id)
        .maybeSingle();

      const raw = impActual?.direccion || '';
      const base = raw.split('|SEC:')[0] || '';
      payload.direccion = secciones.length > 0 ? `${base}|SEC:${secciones.join(',')}` : base;
    }

    const { data, error } = await supabase
      .from('impresora')
      .update(payload)
      .eq('id_impresora', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar impresora: ${error.message}`);
    }

    // Si se enviaron categoriasIds, sincronizar ruta_impresion
    if (datos.categoriasIds !== undefined) {
      // 1. Quitar esta impresora de categorías que ya no estén seleccionadas
      await supabase
        .from('ruta_impresion')
        .update({ id_impresora: null })
        .eq('id_impresora', id);

      // 2. Asignar las nuevas categorías
      for (const idCat of categorias) {
        const { data: rutaExistente } = await supabase
          .from('ruta_impresion')
          .select('id_ruta')
          .eq('id_categoria', idCat)
          .maybeSingle();

        if (rutaExistente) {
          await supabase
            .from('ruta_impresion')
            .update({ id_impresora: id })
            .eq('id_ruta', rutaExistente.id_ruta);
        } else {
          await supabase
            .from('ruta_impresion')
            .insert({
              id_categoria: idCat,
              id_impresora: id,
            });
        }
      }
    }

    metadata[idStr] = {
      seccionesIds: secciones,
      categoriasIds: categorias,
    };
    guardarMetadataImpresoras(metadata);

    const match = String(data.direccion || '').match(/^(.*?)(?:\|SEC:([\d,]*))?$/);
    const cleanDir = match ? match[1] : data.direccion;

    return {
      id: data.id_impresora,
      nombre: data.nombre,
      tipo: data.tipo,
      direccion: cleanDir,
      activa: data.activa,
      autoPrint: data.auto_print,
      categoriasIds: categorias,
      seccionesIds: secciones,
    };
  }

  async eliminarImpresora(id: number): Promise<void> {
    // Desvincular rutas
    await supabase
      .from('ruta_impresion')
      .update({ id_impresora: null })
      .eq('id_impresora', id);

    const { error } = await supabase
      .from('impresora')
      .delete()
      .eq('id_impresora', id);

    if (error) {
      throw new Error(`Error al eliminar impresora: ${error.message}`);
    }

    const metadata = leerMetadataImpresoras();
    delete metadata[String(id)];
    guardarMetadataImpresoras(metadata);
  }

  // ================= RUTAS GENERALES =================
  async listarRutas(): Promise<RutaImpresion[]> {
    const { data, error } = await supabase
      .from('ruta_impresion')
      .select('*')
      .order('id_categoria', { ascending: true });

    if (error) {
      throw new Error(`Error al listar rutas: ${error.message}`);
    }

    return (data || []).map((r: any) => ({
      id: r.id_ruta,
      idCategoria: r.id_categoria,
      idImpresora: r.id_impresora,
    }));
  }

  async asignarRuta(idCategoria: number, idImpresora: number | null): Promise<void> {
    const { data: rutaExistente } = await supabase
      .from('ruta_impresion')
      .select('id_ruta')
      .eq('id_categoria', idCategoria)
      .maybeSingle();

    if (rutaExistente) {
      await supabase
        .from('ruta_impresion')
        .update({ id_impresora: idImpresora })
        .eq('id_ruta', rutaExistente.id_ruta);
    } else {
      await supabase
        .from('ruta_impresion')
        .insert({
          id_categoria: idCategoria,
          id_impresora: idImpresora,
        });
    }
  }

  // ================= MÉTODOS DE PAGO =================
  obtenerPagos(): MetodoPagoConfig[] {
    try {
      asegurarDirectorio();
      if (fs.existsSync(PAGOS_FILE)) {
        return JSON.parse(fs.readFileSync(PAGOS_FILE, 'utf-8'));
      }
    } catch (e) {
      console.warn('Error al leer métodos de pago:', e);
    }

    const defaultPagos: MetodoPagoConfig[] = [
      { id: 'p-1', nombre: 'Efectivo', icono: 'efectivo', activo: true, requiereReferencia: false },
      { id: 'p-2', nombre: 'Tarjeta Débito/Crédito', icono: 'tarjeta', activo: true, requiereReferencia: true, cuentaDestino: 'Datáfono' },
      { id: 'p-3', nombre: 'Transferencia Nequi', icono: 'transferencia', activo: true, requiereReferencia: true, cuentaDestino: '300 123 4567' },
      { id: 'p-4', nombre: 'Transferencia Bancolombia', icono: 'transferencia', activo: true, requiereReferencia: true, cuentaDestino: 'Ahorros 123-456789' },
    ];
    this.guardarPagos(defaultPagos);
    return defaultPagos;
  }

  guardarPagos(pagos: MetodoPagoConfig[]): void {
    asegurarDirectorio();
    fs.writeFileSync(PAGOS_FILE, JSON.stringify(pagos, null, 2), 'utf-8');
  }

  // ================= PRUEBA Y COMANDAS DIRECTAS (IMPRESORAS CONECTADAS Y RED IP) =================
  async listarImpresorasDelSistema(): Promise<ImpresoraSistema[]> {
    return listarImpresorasSistema();
  }

  async probarImpresoraDirecta(id: number): Promise<{ success: boolean; modo: string; mensaje: string }> {
    const impresoras = await this.listarImpresoras();
    const imp = impresoras.find(i => i.id === id);
    if (!imp) {
      throw new Error(`Impresora #${id} no encontrada`);
    }

    const negocio = await this.obtenerNegocio();
    const dir = (imp.direccion || '').trim();
    const esIp = Boolean(dir.match(/^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(?::([0-9]+))?$/));

    // 1. Si no es una IP pura o es USB / Bluetooth / Local, probar primero a través del spooler de Windows
    if (!esIp || imp.tipo === 'USB' || imp.tipo === 'Bluetooth') {
      const textoPrueba = generarTicketTextoPrueba(imp.nombre, negocio);
      const resWin = await imprimirTextoEnImpresora(imp.direccion || imp.nombre, textoPrueba);
      if (resWin.success) {
        return {
          success: true,
          modo: 'impresora_sistema',
          mensaje: `✓ Ticket de prueba impreso físicamente en "${imp.nombre}" (Impresora conectada a Windows).`,
        };
      }
    }

    // 2. Si tiene IP o falla local, intentar conexión de socket TCP directa (puerto 9100)
    const ipPortMatch = dir.match(/^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|localhost|[a-zA-Z0-9.-]+)(?::([0-9]+))?$/);
    if (!ipPortMatch) {
      return {
        success: false,
        modo: 'fallback_navegador',
        mensaje: `La impresora "${imp.nombre}" se enviará a imprimir a través del diálogo de Windows/navegador.`,
      };
    }

    const host = ipPortMatch[1];
    const port = ipPortMatch[2] ? parseInt(ipPortMatch[2], 10) : 9100;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let terminado = false;

      const finalizar = (res: { success: boolean; modo: string; mensaje: string }) => {
        if (terminado) return;
        terminado = true;
        try { socket.destroy(); } catch {}
        resolve(res);
      };

      socket.setTimeout(2500);

      socket.on('connect', () => {
        try {
          const buffer = this.generarEscPosPrueba(imp, negocio);
          socket.write(buffer, () => {
            finalizar({
              success: true,
              modo: 'socket_directo',
              mensaje: `Ticket de prueba enviado exitosamente a la impresora en ${host}:${port}`,
            });
          });
        } catch (err: any) {
          finalizar({
            success: false,
            modo: 'fallback_navegador',
            mensaje: `Error al generar comandos ESC/POS: ${err?.message || 'Error'}`,
          });
        }
      });

      socket.on('timeout', () => {
        finalizar({
          success: false,
          modo: 'fallback_navegador',
          mensaje: `Tiempo de espera agotado al conectar a ${host}:${port}. Se activará impresión por navegador.`,
        });
      });

      socket.on('error', (err) => {
        finalizar({
          success: false,
          modo: 'fallback_navegador',
          mensaje: `No se pudo conectar al socket ${host}:${port} (${err.message}). Se usará impresión por navegador.`,
        });
      });

      try {
        socket.connect(port, host);
      } catch (err: any) {
        finalizar({
          success: false,
          modo: 'fallback_navegador',
          mensaje: `Error al abrir socket: ${err.message}`,
        });
      }
    });
  }

  async imprimirComandaDirecta(
    idImpresora: number,
    datos: {
      mesa: string | number;
      seccion?: string;
      cliente?: string;
      mesero?: string;
      items: { nombre: string; cantidad: number; nota?: string }[];
    }
  ): Promise<{ success: boolean; modo: string; mensaje: string }> {
    const impresoras = await this.listarImpresoras();
    const imp = impresoras.find(i => i.id === idImpresora);
    if (!imp) {
      throw new Error(`Impresora #${idImpresora} no encontrada`);
    }

    const dir = (imp.direccion || '').trim();
    const esIp = Boolean(dir.match(/^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(?::([0-9]+))?$/));

    // 1. Si no es IP o es USB / Bluetooth / Local, imprimir directamente a la impresora de Windows
    if (!esIp || imp.tipo === 'USB' || imp.tipo === 'Bluetooth') {
      const negocio = await this.obtenerNegocio();
      const textoComanda = generarTicketTextoComanda(datos, negocio);
      const resWin = await imprimirTextoEnImpresora(imp.direccion || imp.nombre, textoComanda);
      if (resWin.success) {
        return {
          success: true,
          modo: 'impresora_sistema',
          mensaje: `✓ Comanda impresa físicamente en "${imp.nombre}" (Impresora conectada a Windows).`,
        };
      }
    }

    // 2. Si tiene IP numérica, intentar socket TCP directo al puerto 9100
    const ipPortMatch = dir.match(/^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|localhost|[a-zA-Z0-9.-]+)(?::([0-9]+))?$/);
    if (!ipPortMatch) {
      return {
        success: false,
        modo: 'fallback_navegador',
        mensaje: `La impresora "${imp.nombre}" usa formato térmico en navegador.`,
      };
    }

    const host = ipPortMatch[1];
    const port = ipPortMatch[2] ? parseInt(ipPortMatch[2], 10) : 9100;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let terminado = false;

      const finalizar = (res: { success: boolean; modo: string; mensaje: string }) => {
        if (terminado) return;
        terminado = true;
        try { socket.destroy(); } catch {}
        resolve(res);
      };

      socket.setTimeout(2500);

      socket.on('connect', () => {
        try {
          const buffer = this.generarEscPosComanda(imp, datos);
          socket.write(buffer, () => {
            finalizar({
              success: true,
              modo: 'socket_directo',
              mensaje: `Comanda enviada directamente a la impresora ${imp.nombre} (${host}:${port})`,
            });
          });
        } catch (err: any) {
          finalizar({
            success: false,
            modo: 'fallback_navegador',
            mensaje: `Error al generar comandos ESC/POS: ${err?.message || 'Error'}`,
          });
        }
      });

      socket.on('timeout', () => {
        finalizar({
          success: false,
          modo: 'fallback_navegador',
          mensaje: `Timeout al conectar con ${host}:${port}.`,
        });
      });

      socket.on('error', (err) => {
        finalizar({
          success: false,
          modo: 'fallback_navegador',
          mensaje: `Error al conectar a ${host}:${port}: ${err.message}`,
        });
      });

      try {
        socket.connect(port, host);
      } catch (err: any) {
        finalizar({
          success: false,
          modo: 'fallback_navegador',
          mensaje: `Error al abrir socket: ${err.message}`,
        });
      }
    });
  }

  private generarEscPosPrueba(imp: ImpresoraConFiltros, negocio: ConfiguracionNegocio): Buffer {
    const ESC = '\x1b';
    const GS = '\x1d';
    let s = '';

    // Reset
    s += `${ESC}@`;
    // Centrar
    s += `${ESC}a\x01`;
    // Negrita y Doble Altura/Anchura para Título
    s += `${ESC}E\x01${GS}!\x11`;
    s += `${negocio.nombre || 'SABOR & STOCK'}\n`;
    s += `${GS}!\x00${ESC}E\x00`;

    if (negocio.nit) s += `NIT: ${negocio.nit}\n`;
    if (negocio.direccion) s += `${negocio.direccion}\n`;
    if (negocio.telefono) s += `TEL: ${negocio.telefono}\n`;

    s += '================================================\n';
    s += `${ESC}E\x01PRUEBA DE CONEXION DE IMPRESORA${ESC}E\x00\n`;
    s += '================================================\n';
    s += `${ESC}a\x00`; // Alinear a la izquierda
    s += `Dispositivo:  ${imp.nombre}\n`;
    s += `Tipo:         ${imp.tipo}\n`;
    s += `Direccion/IP: ${imp.direccion}\n`;
    s += `Estado:       ${imp.activa ? 'ACTIVA / EN LINEA' : 'INACTIVA'}\n`;
    s += `Auto-Print:   ${imp.autoPrint ? 'HABILITADO' : 'DESHABILITADO'}\n`;
    s += `Categorias:   ${(imp.categoriasIds || []).length} asignadas\n`;
    s += `Secciones:    ${(imp.seccionesIds || []).length} asignadas\n`;
    s += `Fecha / Hora: ${new Date().toLocaleString()}\n`;
    s += '------------------------------------------------\n';
    s += 'Controlador ESC/POS y corte de papel: OK\n';
    s += '------------------------------------------------\n';
    s += `${ESC}a\x01`;
    s += 'Impresora 100% Funcional\n';
    s += 'SaborStock POS - Sistema de Restaurante\n\n\n\n';
    // Corte parcial
    s += `${GS}V\x42\x00`;

    return Buffer.from(s, 'latin1');
  }

  private generarEscPosComanda(
    imp: ImpresoraConFiltros,
    datos: {
      mesa: string | number;
      seccion?: string;
      cliente?: string;
      mesero?: string;
      items: { nombre: string; cantidad: number; nota?: string }[];
    }
  ): Buffer {
    const ESC = '\x1b';
    const GS = '\x1d';
    let s = '';

    // Reset
    s += `${ESC}@`;
    // Centrar
    s += `${ESC}a\x01`;
    // Título impresora
    s += `${ESC}E\x01${GS}!\x11COMANDA - ${imp.nombre.toUpperCase()}\n${GS}!\x00${ESC}E\x00`;
    s += `MESA: ${datos.mesa} ${datos.seccion ? `(${datos.seccion})` : ''}\n`;
    if (datos.cliente) s += `Cliente: ${datos.cliente}\n`;
    if (datos.mesero) s += `Mesero:  ${datos.mesero}\n`;
    s += `Hora:    ${new Date().toLocaleTimeString()}\n`;
    s += '================================================\n';
    s += `${ESC}a\x00`; // Alinear a la izquierda
    s += `${ESC}E\x01CANT   DESCRIPCION${ESC}E\x00\n`;
    s += '------------------------------------------------\n';

    for (const it of datos.items) {
      s += `${ESC}E\x01[${it.cantidad}x]  ${it.nombre.toUpperCase()}${ESC}E\x00\n`;
      if (it.nota) {
        s += `      * NOTA: ${it.nota}\n`;
      }
    }

    s += '================================================\n';
    s += `${ESC}a\x01`;
    s += 'Favor despachar a la mayor brevedad\n\n\n\n';
    // Corte parcial
    s += `${GS}V\x42\x00`;

    return Buffer.from(s, 'latin1');
  }
}
