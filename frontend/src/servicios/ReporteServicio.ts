import { fetchJson } from "./api";

export interface TurnoCajaReporte {
  id: string;
  cajero: string;
  baseInicial: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasTransferencia: number;
  totalGenerado: number;
  egresosTotales: number;
  cierreEstimado: number;
  diferencia: number;
  fecha: string;
  horaApertura: string;
  horaCierre: string;
  movimientos: { tipo: "Ingreso" | "Egreso"; concepto: string; monto: number }[];
}

export interface RendimientoEmpleadoReporte {
  id: string;
  nombre: string;
  rol: string;
  comandasAtendidas: number;
  totalVendido: number;
  propinas: number;
  ultimoDiaTrabajado: string;
}

export interface GastoRegistroReporte {
  id: string;
  categoria: "Nómina" | "Servicios" | "Compras" | "Otros";
  concepto: string;
  monto: number;
  fecha: string;
  detalle: string;
  responsable: string;
}

export interface ProductoAnalisisReporte {
  id: string;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresos: number;
  precioPromedio: number;
}

export interface InsumoGastoReporte {
  id: string;
  nombre: string;
  categoria: string;
  gastoDia: number;
  gastoSemana: number;
  gastoMes: number;
  stockActual: string;
  estado: "Óptimo" | "Bajo" | "Agotado";
}

export interface DashboardReportesData {
  filtro: "Hoy" | "Semana" | "Mes";
  fechaInicio: string;
  fechaFin: string;
  cajas: TurnoCajaReporte[];
  empleados: RendimientoEmpleadoReporte[];
  gastos: GastoRegistroReporte[];
  productos: ProductoAnalisisReporte[];
  inventarioGastos: InsumoGastoReporte[];
  resumen: {
    totalGeneradoCajas: number;
    totalGastosRegistrados: number;
    balanceNeto: number;
    totalPropinas: number;
    productoTop: ProductoAnalisisReporte | null;
    insumosCriticos: number;
  };
}

export const ReporteServicio = {
  async obtenerDashboard(filtro: "Hoy" | "Semana" | "Mes" = "Hoy"): Promise<DashboardReportesData> {
    return await fetchJson<DashboardReportesData>(`/api/reportes/dashboard?filtro=${filtro}`);
  },

  async generarReporteIA(tipo: "DIARIO" | "SEMANAL" = "DIARIO", fecha?: string) {
    return await fetchJson<{ id: number; contenido: string; tipo: string; fechaCreacion: string }>("/api/reportes/generar", {
      method: "POST",
      body: JSON.stringify({ tipo, fecha }),
    });
  },
};
