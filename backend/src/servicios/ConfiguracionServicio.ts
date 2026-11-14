import {
  ConfiguracionRepositorio,
  ImpresoraConFiltros,
  MetodoPagoConfig,
} from '../persistencia/ConfiguracionRepositorio.js';
import {
  ConfiguracionNegocio,
  ActualizarConfiguracionNegocioDTO,
} from '../tipos/ConfiguracionNegocio.js';
import {
  ConfiguracionFacturacion,
  ActualizarConfiguracionFacturacionDTO,
} from '../tipos/ConfiguracionFacturacion.js';
import { TipoImpresora } from '../tipos/TipoImpresora.js';
import { RutaImpresion } from '../tipos/RutaImpresion.js';

export class ConfiguracionServicio {
  private repo: ConfiguracionRepositorio;

  constructor() {
    this.repo = new ConfiguracionRepositorio();
  }

  // Negocio
  async obtenerNegocio(): Promise<ConfiguracionNegocio> {
    return this.repo.obtenerNegocio();
  }

  async actualizarNegocio(datos: ActualizarConfiguracionNegocioDTO): Promise<ConfiguracionNegocio> {
    if (datos.nombre !== undefined && !datos.nombre.trim()) {
      throw new Error('El nombre del establecimiento no puede estar vacío');
    }
    return this.repo.actualizarNegocio(datos);
  }

  // Facturacion
  async obtenerFacturacion(): Promise<ConfiguracionFacturacion> {
    return this.repo.obtenerFacturacion();
  }

  async actualizarFacturacion(datos: ActualizarConfiguracionFacturacionDTO): Promise<ConfiguracionFacturacion> {
    return this.repo.actualizarFacturacion(datos);
  }

  // Impresoras
  async listarImpresoras(): Promise<ImpresoraConFiltros[]> {
    return this.repo.listarImpresoras();
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
    if (!datos.nombre || !datos.nombre.trim()) {
      throw new Error('El nombre de la impresora es obligatorio');
    }
    if (!datos.direccion || !datos.direccion.trim()) {
      throw new Error('La dirección IP o puerto COM de la impresora es obligatoria');
    }
    return this.repo.crearImpresora(datos);
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
    if (datos.nombre !== undefined && !datos.nombre.trim()) {
      throw new Error('El nombre de la impresora no puede estar vacío');
    }
    if (datos.direccion !== undefined && !datos.direccion.trim()) {
      throw new Error('La dirección de la impresora no puede estar vacía');
    }
    return this.repo.actualizarImpresora(id, datos);
  }

  async eliminarImpresora(id: number): Promise<void> {
    return this.repo.eliminarImpresora(id);
  }

  // Rutas
  async listarRutas(): Promise<RutaImpresion[]> {
    return this.repo.listarRutas();
  }

  async asignarRuta(idCategoria: number, idImpresora: number | null): Promise<void> {
    return this.repo.asignarRuta(idCategoria, idImpresora);
  }

  // Pagos
  obtenerPagos(): MetodoPagoConfig[] {
    return this.repo.obtenerPagos();
  }

  guardarPagos(pagos: MetodoPagoConfig[]): MetodoPagoConfig[] {
    this.repo.guardarPagos(pagos);
    return pagos;
  }

  async listarImpresorasDelSistema() {
    return this.repo.listarImpresorasDelSistema();
  }

  async probarImpresoraDirecta(id: number): Promise<{ success: boolean; modo: string; mensaje: string }> {
    return this.repo.probarImpresoraDirecta(id);
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
    return this.repo.imprimirComandaDirecta(idImpresora, datos);
  }
}
