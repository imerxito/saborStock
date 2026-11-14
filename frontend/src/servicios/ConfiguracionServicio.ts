import { fetchJson } from './api';

export interface ConfiguracionNegocio {
  id: number;
  nombre: string;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  moneda: string;
  logoUrl: string | null;
}

export interface ConfiguracionFacturacion {
  id: number;
  habilitada: boolean;
  entorno: 'pruebas' | 'produccion';
  resolucion: string | null;
  prefijo: string | null;
  rangoInicial: number | null;
  rangoFinal: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  claveTecnica: string | null;
  softwareId: string | null;
  apiKey: string | null;
  certificadoCargado: boolean;
}

export interface ImpresoraSistema {
  nombre: string;
  puerto: string;
  controlador: string;
  predeterminada: boolean;
}

export interface ImpresoraFrontend {
  id: number;
  nombre: string;
  tipo: 'USB' | 'Red (IP)' | 'Bluetooth';
  direccion: string;
  activa: boolean;
  autoPrint: boolean;
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

export interface RutaImpresionBackend {
  id: number;
  idCategoria: number;
  idImpresora: number | null;
}

export const ConfiguracionServicio = {
  // Negocio
  async obtenerNegocio(): Promise<ConfiguracionNegocio> {
    return await fetchJson<ConfiguracionNegocio>('/api/configuracion/negocio');
  },

  async actualizarNegocio(datos: Partial<ConfiguracionNegocio>): Promise<ConfiguracionNegocio> {
    return await fetchJson<ConfiguracionNegocio>('/api/configuracion/negocio', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  // Facturacion
  async obtenerFacturacion(): Promise<ConfiguracionFacturacion> {
    return await fetchJson<ConfiguracionFacturacion>('/api/configuracion/facturacion');
  },

  async actualizarFacturacion(datos: Partial<ConfiguracionFacturacion>): Promise<ConfiguracionFacturacion> {
    return await fetchJson<ConfiguracionFacturacion>('/api/configuracion/facturacion', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  // Impresoras
  async listarImpresorasSistema(): Promise<ImpresoraSistema[]> {
    return await fetchJson<ImpresoraSistema[]>('/api/configuracion/impresoras-sistema');
  },

  async listarImpresoras(): Promise<ImpresoraFrontend[]> {
    return await fetchJson<ImpresoraFrontend[]>('/api/configuracion/impresoras');
  },

  async crearImpresora(datos: {
    nombre: string;
    tipo?: 'USB' | 'Red (IP)' | 'Bluetooth';
    direccion: string;
    activa?: boolean;
    autoPrint?: boolean;
    categoriasIds?: number[];
    seccionesIds?: number[];
  }): Promise<ImpresoraFrontend> {
    return await fetchJson<ImpresoraFrontend>('/api/configuracion/impresoras', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarImpresora(
    id: number,
    datos: Partial<Omit<ImpresoraFrontend, 'id'>>
  ): Promise<ImpresoraFrontend> {
    return await fetchJson<ImpresoraFrontend>(`/api/configuracion/impresoras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarImpresora(id: number): Promise<{ mensaje: string }> {
    return await fetchJson<{ mensaje: string }>(`/api/configuracion/impresoras/${id}`, {
      method: 'DELETE',
    });
  },

  async probarImpresoraDirecta(id: number): Promise<{ success: boolean; modo: string; mensaje: string }> {
    return await fetchJson<{ success: boolean; modo: string; mensaje: string }>(`/api/configuracion/impresoras/${id}/probar`, {
      method: 'POST',
    });
  },

  async imprimirComandaDirecta(
    id: number,
    datos: {
      mesa: string | number;
      seccion?: string;
      cliente?: string;
      mesero?: string;
      items: { nombre: string; cantidad: number; nota?: string }[];
    }
  ): Promise<{ success: boolean; modo: string; mensaje: string }> {
    return await fetchJson<{ success: boolean; modo: string; mensaje: string }>(`/api/configuracion/impresoras/${id}/imprimir`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  // Rutas
  async listarRutas(): Promise<RutaImpresionBackend[]> {
    return await fetchJson<RutaImpresionBackend[]>('/api/configuracion/rutas');
  },

  async asignarRuta(idCategoria: number, idImpresora: number | null): Promise<void> {
    await fetchJson('/api/configuracion/rutas', {
      method: 'POST',
      body: JSON.stringify({ idCategoria, idImpresora }),
    });
  },

  // Pagos
  async obtenerPagos(): Promise<MetodoPagoConfig[]> {
    return await fetchJson<MetodoPagoConfig[]>('/api/configuracion/pagos');
  },

  async guardarPagos(pagos: MetodoPagoConfig[]): Promise<MetodoPagoConfig[]> {
    return await fetchJson<MetodoPagoConfig[]>('/api/configuracion/pagos', {
      method: 'PUT',
      body: JSON.stringify(pagos),
    });
  },
};
