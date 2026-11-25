import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Calendar, TrendingDown, Users, 
  Package, X, PieChart, BarChart3, 
  Wallet, Utensils, RotateCw, Sparkles, Copy, Check,
  Download, FileSpreadsheet, FileText, Printer, ChevronDown
} from "lucide-react";
import { ReporteServicio } from "../../servicios/ReporteServicio";
import { ConfiguracionServicio, type ConfiguracionNegocio } from "../../servicios/ConfiguracionServicio";
import FormatoContenidoIA from "../../componentes/FormatoContenidoIA";
import InformeEjecutivoImpresion from "../../componentes/InformeEjecutivoImpresion";
import { exportarReporteCSV } from "../../utilidades/exportarReportesCSV";

// ============================================================
// 1. TIPOS DE DATOS Y INTERFACES
// ============================================================
interface TurnoCaja {
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

interface RendimientoEmpleado {
  id: string;
  nombre: string;
  rol: string;
  comandasAtendidas: number;
  totalVendido: number;
  propinas: number;
  ultimoDiaTrabajado: string;
}

interface GastoRegistro {
  id: string;
  categoria: "Nómina" | "Servicios" | "Compras" | "Otros";
  concepto: string;
  monto: number;
  fecha: string;
  detalle: string;
  responsable: string;
}

interface ProductoAnalisis {
  id: string;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresos: number;
  precioPromedio: number;
}

interface InsumoGasto {
  id: string;
  nombre: string;
  categoria: string;
  gastoDia: number;
  gastoSemana: number;
  gastoMes: number;
  stockActual: string;
  estado: "Óptimo" | "Bajo" | "Agotado";
}

const formatearMoneda = (val: number) => val.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

// ============================================================
// 2. COMPONENTES UI Y GRÁFICAS
// ============================================================

const Card = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-[#1C2541] border border-[#3A506B] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-lg transition-all ${onClick ? 'cursor-pointer hover:border-[#5BC0DE] active:scale-[0.99]' : ''} ${className}`}>
    {children}
  </div>
);

const FixedModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 pointer-events-auto">
      <div className="bg-[#1C2541] border border-[#5BC0DE]/40 w-full max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden h-[85dvh] sm:h-auto sm:max-h-[90dvh] animate-in slide-in-from-bottom sm:zoom-in duration-300">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[#3A506B] bg-[#0B132B] shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-[#F4D6B0] truncate pr-2">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-[#1C2541] text-[#5BC0DE] hover:text-white transition-colors border border-[#3A506B] shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B] pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
};

const BarChartWithLabels = ({ items }: { items: { label: string; value: number }[] }) => {
  const maxVal = Math.max(...items.map(i => i.value), 0);
  if (!items || items.length === 0 || maxVal === 0) {
    return (
      <div className="flex items-center justify-center h-40 sm:h-52 text-[11px] text-[#5BC0DE]/60 italic">
        Sin movimientos registrados en este período
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-1.5 sm:gap-3 h-40 sm:h-52 pt-6 sm:pt-8 px-1 sm:px-2">
      {items.map((item, idx) => {
        const heightPct = Math.max((item.value / maxVal) * 100, 10);
        return (
          <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end relative">
            <span className="absolute -top-5 sm:-top-6 text-[8px] sm:text-[9px] font-bold text-[#F4D6B0] whitespace-nowrap">
              {item.value >= 1000 ? `$${(item.value / 1000).toFixed(0)}k` : item.value}
            </span>
            <div className="w-4 sm:w-7 bg-[#3A506B]/40 rounded-t-lg relative flex items-end overflow-hidden h-full border border-[#3A506B]">
              <div 
                className="w-full bg-gradient-to-t from-[#D97706] to-[#F4D6B0] rounded-t-lg transition-all duration-500 shadow-[0_0_10px_rgba(217,119,6,0.3)]" 
                style={{ height: `${heightPct}%` }} 
              />
            </div>
            <span className="text-[8px] sm:text-[10px] text-[#5BC0DE] mt-1.5 sm:mt-2.5 truncate w-full text-center font-semibold">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const SlimDonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[11px] text-[#5BC0DE]/60 italic">
        Sin movimientos registrados en este período
      </div>
    );
  }

  let accumulated = 0;
  const radius = 40; 
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-6 py-2">
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {data.map((d, i) => {
            const pct = d.value / total;
            const dash = pct * circumference;
            const offset = circumference - (accumulated * circumference);
            accumulated += pct;
            return (
              <circle 
                key={i} cx="50" cy="50" r={radius} 
                fill="transparent" stroke={d.color} strokeWidth="10" 
                strokeDasharray={`${dash} ${circumference - dash}`} 
                strokeDashoffset={offset} 
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[8px] sm:text-[9px] text-[#5BC0DE] uppercase font-bold tracking-wider">Total</span>
          <span className="text-[10px] sm:text-xs font-bold text-[#F4D6B0]">{formatearMoneda(total)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2 text-[10px] sm:text-xs w-full max-w-[200px]">
        {data.filter(d => d.value > 0).map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[#5BC0DE] truncate">{d.label}</span>
            </div>
            <span className="text-[#F4D6B0] font-semibold ml-2 shrink-0">{formatearMoneda(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// 3. COMPONENTE PRINCIPAL
// ============================================================
type Seccion = "Resumen" | "Caja" | "Productos" | "Empleados" | "Gastos" | "Inventario";

export default function AnalisisReportes() {
  const [activeTab, setActiveTab] = useState<Seccion>("Resumen");
  const [fechaFiltro, setFechaFiltro] = useState<"Hoy" | "Semana" | "Mes">("Hoy");

  // Estado dinámico desde Backend
  const [dataCajas, setDataCajas] = useState<TurnoCaja[]>([]);
  const [dataEmpleados, setDataEmpleados] = useState<RendimientoEmpleado[]>([]);
  const [dataGastos, setDataGastos] = useState<GastoRegistro[]>([]);
  const [dataProductos, setDataProductos] = useState<ProductoAnalisis[]>([]);
  const [dataInsumos, setDataInsumos] = useState<InsumoGasto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Modales
  const [modalCaja, setModalCaja] = useState<TurnoCaja | null>(null);
  const [modalGasto, setModalGasto] = useState<GastoRegistro | null>(null);
  const [modalEmpleado, setModalEmpleado] = useState<RendimientoEmpleado | null>(null);
  const [modalProducto, setModalProducto] = useState<ProductoAnalisis | null>(null);

  // Reporte IA
  const [modalIA, setModalIA] = useState<boolean>(false);
  const [generandoIA, setGenerandoIA] = useState<boolean>(false);
  const [reporteIATexto, setReporteIATexto] = useState<string>("");
  const [copiado, setCopiado] = useState<boolean>(false);

  // Modal de Exportación / Informe Ejecutivo Imprimible
  const [modalInformeImpresion, setModalInformeImpresion] = useState<boolean>(false);
  const [menuExportarAbierto, setMenuExportarAbierto] = useState<boolean>(false);
  const [negocioConfig, setNegocioConfig] = useState<ConfiguracionNegocio | null>(null);

  useEffect(() => {
    ConfiguracionServicio.obtenerNegocio().then(setNegocioConfig).catch(() => {});
  }, []);

  const cargarDatos = useCallback(async (filtro: "Hoy" | "Semana" | "Mes") => {
    setCargando(true);
    try {
      const res = await ReporteServicio.obtenerDashboard(filtro);
      if (res) {
        setDataCajas(Array.isArray(res.cajas) ? res.cajas : []);
        setDataEmpleados(Array.isArray(res.empleados) ? res.empleados : []);
        setDataGastos(Array.isArray(res.gastos) ? res.gastos : []);
        setDataProductos(Array.isArray(res.productos) ? res.productos : []);
        setDataInsumos(Array.isArray(res.inventarioGastos) ? res.inventarioGastos : []);
      }
    } catch (err: any) {
      console.warn("Error cargando dashboard:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos(fechaFiltro);
  }, [fechaFiltro, cargarDatos]);

  // Generar Reporte con Inteligencia Artificial
  const generarInformeIA = async () => {
    setGenerandoIA(true);
    setModalIA(true);
    try {
      const tipo = fechaFiltro === "Hoy" ? "DIARIO" : "SEMANAL";
      const res = await ReporteServicio.generarReporteIA(tipo);
      setReporteIATexto(res.contenido);
    } catch (err: any) {
      setReporteIATexto(`No se pudo generar el reporte: ${err?.message || "Error de conexión"}`);
    } finally {
      setGenerandoIA(false);
    }
  };

  const copiarInforme = () => {
    if (reporteIATexto) {
      void navigator.clipboard.writeText(reporteIATexto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleExportarExcel = () => {
    exportarReporteCSV({
      periodo: fechaFiltro === "Hoy" ? "Hoy" : fechaFiltro === "Semana" ? "Esta Semana" : "Este Mes",
      negocioNombre: negocioConfig?.nombre || "Sabor & Stock",
      totales: {
        ingresos: totalGeneradoCajas,
        gastos: totalGastosRegistrados,
        balanceNeto,
        propinas: totalPropinas,
      },
      cajas: dataCajas.map(c => ({
        cajero: c.cajero,
        fecha: c.fecha,
        horaApertura: c.horaApertura,
        horaCierre: c.horaCierre,
        baseInicial: c.baseInicial,
        ventasEfectivo: c.ventasEfectivo,
        ventasTarjeta: c.ventasTarjeta,
        ventasTransferencia: c.ventasTransferencia,
        totalGenerado: c.totalGenerado,
        egresosTotales: c.egresosTotales,
        diferencia: c.diferencia,
      })),
      productos: dataProductos.map(p => ({
        nombre: p.nombre,
        categoria: p.categoria,
        unidadesVendidas: p.unidadesVendidas,
        precioPromedio: p.precioPromedio,
        ingresos: p.ingresos,
      })),
      gastos: dataGastos.map(g => ({
        fecha: g.fecha,
        categoria: g.categoria,
        concepto: g.concepto,
        responsable: g.responsable,
        monto: g.monto,
      })),
      empleados: dataEmpleados.map(e => ({
        nombre: e.nombre,
        rol: e.rol,
        comandasAtendidas: e.comandasAtendidas,
        totalVendido: e.totalVendido,
        propinas: e.propinas,
      })),
      inventario: dataInsumos.map(i => ({
        nombre: i.nombre,
        categoria: i.categoria,
        stockActual: i.stockActual,
        estado: i.estado,
        gastoMes: i.gastoMes,
      })),
      analisisIA: reporteIATexto || undefined,
    });
    setMenuExportarAbierto(false);
  };

  // Cálculos dinámicos
  const totalGeneradoCajas = useMemo(() => dataCajas.reduce((acc, c) => acc + c.totalGenerado, 0), [dataCajas]);
  const totalGastosRegistrados = useMemo(() => dataGastos.reduce((acc, g) => acc + g.monto, 0), [dataGastos]);
  const totalPropinas = useMemo(() => dataEmpleados.reduce((acc, e) => acc + e.propinas, 0), [dataEmpleados]);

  // Cálculos para inventario y balance neto
  const insumosCriticos = useMemo(
    () => dataInsumos.filter(i => i.estado !== "Óptimo"),
    [dataInsumos]
  );
  const agotados = useMemo(
    () => dataInsumos.filter(i => i.estado === "Agotado").length,
    [dataInsumos]
  );
  const bajos = useMemo(
    () => dataInsumos.filter(i => i.estado === "Bajo").length,
    [dataInsumos]
  );
  const balanceNeto = useMemo(
    () => totalGeneradoCajas - totalGastosRegistrados,
    [totalGeneradoCajas, totalGastosRegistrados]
  );

  const productoTop = useMemo(() => {
    const conVenta = dataProductos.filter(p => p.unidadesVendidas > 0);
    return conVenta.length > 0 ? conVenta[0] : null;
  }, [dataProductos]);

  // Gráficas con datos reales
  const gastosPorCategoriaData = useMemo(() => [
    { label: "Compras", value: dataGastos.filter(g => g.categoria === "Compras").reduce((a,b) => a+b.monto, 0), color: "#5BC0DE" },
    { label: "Nómina", value: dataGastos.filter(g => g.categoria === "Nómina").reduce((a,b) => a+b.monto, 0), color: "#F4D6B0" },
    { label: "Servicios", value: dataGastos.filter(g => g.categoria === "Servicios").reduce((a,b) => a+b.monto, 0), color: "#E57373" },
    { label: "Otros", value: dataGastos.filter(g => g.categoria === "Otros").reduce((a,b) => a+b.monto, 0), color: "#FBBF24" },
  ], [dataGastos]);

  const cajaMetodosPagoData = useMemo(() => [
    { label: "Efectivo", value: dataCajas.reduce((a,b)=>a+b.ventasEfectivo,0), color: "#D97706" },
    { label: "Tarjeta", value: dataCajas.reduce((a,b)=>a+b.ventasTarjeta,0), color: "#5BC0DE" },
    { label: "Transferencia", value: dataCajas.reduce((a,b)=>a+b.ventasTransferencia,0), color: "#F4D6B0" },
  ], [dataCajas]);

  const TABS = [
    { id: "Resumen", label: "Resumen", icon: PieChart },
    { id: "Caja", label: "Caja", icon: Wallet },
    { id: "Productos", label: "Productos", icon: Utensils },
    { id: "Empleados", label: "Rendimiento", icon: Users },
    { id: "Gastos", label: "Gastos", icon: TrendingDown },
    { id: "Inventario", label: "Inventario", icon: Package },
  ];

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#0B132B] text-[#F4D6B0] font-sans overflow-hidden selection:bg-[#5BC0DE]/40">
      
      {/* HEADER NAVEGABLE FIJO */}
      <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <header className="bg-[#1C2541]/95 backdrop-blur-md border-b border-[#3A506B] px-3 sm:px-4 md:px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-2 sm:mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#5BC0DE]/10 flex items-center justify-center border border-[#5BC0DE]/30 shrink-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#5BC0DE]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-bold tracking-tight text-[#F4D6B0]">Reportes y Análisis</h2>
                  <p className="hidden sm:block text-[11px] text-[#5BC0DE] uppercase tracking-wider font-semibold">Auditoría del Negocio en Tiempo Real</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1 bg-[#3A506B]/30 p-0.5 sm:p-1 rounded-xl border border-[#3A506B] flex-1 sm:flex-none overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <Calendar className="w-3.5 h-3.5 text-[#5BC0DE] ml-1.5 sm:ml-2 mr-1 shrink-0" />
                  {(["Hoy", "Semana", "Mes"] as const).map(f => (
                    <button 
                      key={f} 
                      onClick={() => setFechaFiltro(f)}
                      className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap ${fechaFiltro === f ? "bg-[#5BC0DE] text-[#0B132B] shadow-md" : "text-[#F4D6B0] hover:text-white"}`}
                    >
                      {f === "Hoy" ? "Hoy" : f === "Semana" ? "Esta Semana" : "Este Mes"}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void cargarDatos(fechaFiltro)}
                    title="Recargar datos"
                    className="p-1.5 rounded-lg text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B]/50 transition-colors ml-0.5"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={generarInformeIA}
                  className="bg-gradient-to-r from-[#D97706] to-[#FBBF24] hover:brightness-110 text-[#0B132B] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 active:scale-95"
                  title="Generar análisis inteligente con IA"
                >
                  <Sparkles size={14} className="text-[#0B132B]" />
                  <span>Reporte IA</span>
                </button>

                {/* BOTÓN Y MENÚ DE EXPORTACIÓN */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuExportarAbierto(prev => !prev)}
                    className="bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 active:scale-95"
                    title="Exportar información de reportes"
                  >
                    <Download size={14} />
                    <span>Exportar</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${menuExportarAbierto ? 'rotate-180' : ''}`} />
                  </button>

                  {menuExportarAbierto && (
                    <div className="absolute right-0 mt-1.5 w-60 bg-[#1C2541] border border-[#3A506B] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuExportarAbierto(false);
                          setModalInformeImpresion(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-xs font-semibold text-[#F4D6B0] hover:bg-[#3A506B]/50 hover:text-[#5BC0DE] transition-colors"
                      >
                        <FileText size={16} className="text-[#5BC0DE] shrink-0" />
                        <div>
                          <p className="font-bold">Informe PDF / Imprimir</p>
                          <p className="text-[10px] text-[#5BC0DE]/70 font-normal">Formato ejecutivo con membrete</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportarExcel}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-xs font-semibold text-[#F4D6B0] hover:bg-[#3A506B]/50 hover:text-[#5BC0DE] transition-colors border-t border-[#3A506B]/40 mt-1 pt-1.5"
                      >
                        <FileSpreadsheet size={16} className="text-[#4ADE80] shrink-0" />
                        <div>
                          <p className="font-bold">Exportar a Excel (.CSV)</p>
                          <p className="text-[10px] text-[#5BC0DE]/70 font-normal">Todas las tablas consolidadas</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Seccion)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-semibold whitespace-nowrap shrink-0 border transition-all ${activeTab === tab.id ? "border-[#5BC0DE] text-[#0B132B] bg-[#5BC0DE]" : "border-transparent text-[#F4D6B0] hover:text-white hover:bg-[#3A506B]/50"}`}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>

      {/* CONTENIDO PRINCIPAL CON SCROLL */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-7xl mx-auto p-2.5 sm:p-4 md:p-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        
        {/* ================= RESUMEN ================= */}
        {activeTab === "Resumen" && (
          <div className="space-y-3 sm:space-y-6 animate-in fade-in duration-300">

            {/* ==== KPIs PRINCIPALES (6 tarjetas) ==== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">

              {/* 1. Ingresos */}
              <Card onClick={() => setActiveTab("Caja")} className="border-l-4 border-l-[#5BC0DE]">
                <span className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE] uppercase block mb-1">Ingresos Generados</span>
                <p className="text-xl sm:text-2xl font-bold text-[#F4D6B0]">{formatearMoneda(totalGeneradoCajas)}</p>
                <p className="text-[9px] sm:text-[10px] text-[#5BC0DE] mt-2 font-medium">Ver detalles de caja →</p>
              </Card>

              {/* 2. Gastos */}
              <Card onClick={() => setActiveTab("Gastos")} className="border-l-4 border-l-[#E57373]">
                <span className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE] uppercase block mb-1">Gastos Totales</span>
                <p className="text-xl sm:text-2xl font-bold text-[#F4D6B0]">{formatearMoneda(totalGastosRegistrados)}</p>
                <p className="text-[9px] sm:text-[10px] text-[#5BC0DE] mt-2 font-medium">Ver egresos operativos →</p>
              </Card>

              {/* 3. Balance Neto */}
              <Card onClick={() => setActiveTab("Caja")} className="border-l-4 border-l-[#4ADE80]">
                <span className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE] uppercase block mb-1">Balance Neto</span>
                <p className={`text-xl sm:text-2xl font-bold ${balanceNeto >= 0 ? "text-[#4ADE80]" : "text-[#E57373]"}`}>
                  {formatearMoneda(balanceNeto)}
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#5BC0DE] mt-2 font-medium">Ingresos − Gastos →</p>
              </Card>

              {/* 4. Propinas */}
              <Card onClick={() => setActiveTab("Empleados")} className="border-l-4 border-l-[#D97706]">
                <span className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE] uppercase block mb-1">Propinas Generadas</span>
                <p className="text-xl sm:text-2xl font-bold text-[#F4D6B0]">{formatearMoneda(totalPropinas)}</p>
                <p className="text-[9px] sm:text-[10px] text-[#5BC0DE] mt-2 font-medium">Ver rendimiento equipo →</p>
              </Card>

              {/* 5. Producto Top */}
              <Card onClick={() => setActiveTab("Productos")} className="border-l-4 border-l-[#FBBF24]">
                <span className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE] uppercase block mb-1">Producto Top</span>
                <p className="text-sm sm:text-lg font-bold text-[#F4D6B0] truncate">{productoTop?.nombre || 'Sin ventas en el período'}</p>
                <p className="text-[9px] sm:text-[10px] text-[#5BC0DE] mt-2 font-medium">
                  {productoTop ? `${productoTop.unidadesVendidas} unidades vendidas →` : 'Sin datos →'}
                </p>
              </Card>

              {/* 6. Insumos Críticos */}
              <Card onClick={() => setActiveTab("Inventario")} className="border-l-4 border-l-[#F97316]">
                <span className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE] uppercase block mb-1">Insumos Críticos</span>
                <p className="text-xl sm:text-2xl font-bold text-[#F4D6B0]">
                  {insumosCriticos.length}{" "}
                  <span className="text-sm font-semibold text-[#F97316]">
                    {insumosCriticos.length === 1 ? "alerta" : "alertas"}
                  </span>
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#5BC0DE] mt-2 font-medium">
                  {insumosCriticos.length === 0
                    ? "Todo en nivel óptimo →"
                    : `${[
                        agotados > 0 && `${agotados} agotado${agotados > 1 ? "s" : ""}`,
                        bajos > 0 && `${bajos} bajo${bajos > 1 ? "s" : ""}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")} →`}
                </p>
              </Card>
            </div>

            {/* ==== GRÁFICAS ==== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Ingresos por Producto</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-3">Principales fuentes de venta registradas</p>
                <BarChartWithLabels items={dataProductos.filter(p => p.ingresos > 0).slice(0, 5).map(p => ({ label: p.nombre.split(" ")[0], value: p.ingresos }))} />
              </Card>

              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Estructura de Gastos</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-3">Distribución porcentual de egresos</p>
                <SlimDonutChart data={gastosPorCategoriaData} />
              </Card>
            </div>

            {/* ==== ALERTAS DE INVENTARIO ==== */}
            <Card>
              <div className="flex items-start sm:items-center justify-between mb-3 gap-2 flex-wrap">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#F97316]" /> Alertas de Inventario
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#5BC0DE]">Insumos que requieren reabastecimiento urgente</p>
                </div>
                <button
                  onClick={() => setActiveTab("Inventario")}
                  className="text-[10px] font-bold text-[#5BC0DE] hover:text-[#F4D6B0] transition-colors shrink-0"
                >
                  Ver inventario completo →
                </button>
              </div>

              {insumosCriticos.length === 0 ? (
                <div className="bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-[#4ADE80] font-semibold">✓ Todos los insumos están en nivel óptimo</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {insumosCriticos.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab("Inventario")}
                      className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-1 cursor-pointer hover:border-[#F97316]/50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#F4D6B0] truncate">{item.nombre}</p>
                          <p className="text-[9px] text-[#5BC0DE]">{item.categoria}</p>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                            item.estado === "Agotado"
                              ? "bg-[#E57373]/20 text-[#E57373]"
                              : "bg-[#FBBF24]/20 text-[#FBBF24]"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] mt-1 pt-1 border-t border-[#3A506B]/50">
                        <span className="text-[#5BC0DE]">
                          Stock: <span className="text-[#F4D6B0] font-semibold">{item.stockActual}</span>
                        </span>
                        <span className="text-[#5BC0DE]">
                          Gasto ref: <span className="text-[#F4D6B0] font-semibold">{formatearMoneda(item.gastoDia)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ================= CAJA ================= */}
        {activeTab === "Caja" && (
          <div className="space-y-3 sm:space-y-6 animate-in fade-in duration-300">
            <Card className="bg-[#3A506B]/20">
              <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-3">Consolidado General de Caja</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
                <div className="bg-[#1C2541] p-2 sm:p-3 rounded-xl border border-[#3A506B]">
                  <span className="text-[9px] sm:text-[10px] text-[#5BC0DE] uppercase block font-semibold">Efectivo</span>
                  <span className="text-xs sm:text-base font-bold text-[#F4D6B0]">{formatearMoneda(dataCajas.reduce((a,b)=>a+b.ventasEfectivo,0))}</span>
                </div>
                <div className="bg-[#1C2541] p-2 sm:p-3 rounded-xl border border-[#3A506B]">
                  <span className="text-[9px] sm:text-[10px] text-[#5BC0DE] uppercase block font-semibold">Tarjeta</span>
                  <span className="text-xs sm:text-base font-bold text-[#F4D6B0]">{formatearMoneda(dataCajas.reduce((a,b)=>a+b.ventasTarjeta,0))}</span>
                </div>
                <div className="bg-[#1C2541] p-2 sm:p-3 rounded-xl border border-[#3A506B]">
                  <span className="text-[9px] sm:text-[10px] text-[#5BC0DE] uppercase block font-semibold">Transferencia</span>
                  <span className="text-xs sm:text-base font-bold text-[#F4D6B0]">{formatearMoneda(dataCajas.reduce((a,b)=>a+b.ventasTransferencia,0))}</span>
                </div>
                <div className="bg-[#1C2541] p-2 sm:p-3 rounded-xl border border-[#3A506B]">
                  <span className="text-[9px] sm:text-[10px] text-[#E57373] uppercase block font-semibold">Egresos</span>
                  <span className="text-xs sm:text-base font-bold text-[#E57373]">{formatearMoneda(dataCajas.reduce((a,b)=>a+b.egresosTotales,0))}</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Métodos de Pago Recibidos</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-3">Distribución por canal de cobro</p>
                <SlimDonutChart data={cajaMetodosPagoData} />
              </Card>

              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Volumen por Turno</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-3">Total generado por cada cajero/turno</p>
                <BarChartWithLabels items={dataCajas.map(c => ({ label: c.cajero.split(" ")[0], value: c.totalGenerado }))} />
              </Card>
            </div>

            <Card>
              <div className="mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0]">Turnos de Caja Registrados</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE]">Auditoría detallada de apertura, cierre y arqueos</p>
              </div>
              
              {dataCajas.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5BC0DE]/60">
                  No hay turnos de caja registrados para este período.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#3A506B] text-xs text-[#5BC0DE]">
                          <th className="pb-3 font-semibold">Turno / Cajero</th>
                          <th className="pb-3 font-semibold">Horario</th>
                          <th className="pb-3 text-right font-semibold">Base Inicial</th>
                          <th className="pb-3 text-right font-semibold">Total Generado</th>
                          <th className="pb-3 text-right font-semibold">Egresos</th>
                          <th className="pb-3 text-center font-semibold">Estado / Dif.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataCajas.map(caja => (
                          <tr key={caja.id} onClick={() => setModalCaja(caja)} className="border-b border-[#3A506B]/50 hover:bg-[#3A506B]/30 transition-colors cursor-pointer">
                            <td className="py-3 font-medium text-[#F4D6B0]">{caja.cajero} <span className="text-[10px] text-[#5BC0DE] block">ID: {caja.id}</span></td>
                            <td className="py-3 text-xs text-[#5BC0DE]">{caja.horaApertura} - {caja.horaCierre}</td>
                            <td className="py-3 text-right text-[#5BC0DE]">{formatearMoneda(caja.baseInicial)}</td>
                            <td className="py-3 text-right font-bold text-[#F4D6B0]">{formatearMoneda(caja.totalGenerado)}</td>
                            <td className="py-3 text-right text-[#E57373]">{formatearMoneda(caja.egresosTotales)}</td>
                            <td className="py-3 text-center">
                              <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold ${caja.diferencia === 0 ? 'bg-[#5BC0DE]/20 text-[#5BC0DE]' : 'bg-[#E57373]/20 text-[#E57373]'}`}>
                                {caja.diferencia === 0 ? "Cuadrada" : `Dif: ${formatearMoneda(caja.diferencia)}`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-2">
                    {dataCajas.map(caja => (
                      <div key={caja.id} onClick={() => setModalCaja(caja)} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-1.5 shadow-sm active:scale-[0.99]">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-xs text-[#F4D6B0]">{caja.cajero}</span>
                            <span className="text-[9px] text-[#5BC0DE] block">{caja.horaApertura} - {caja.horaCierre}</span>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${caja.diferencia === 0 ? 'bg-[#5BC0DE]/20 text-[#5BC0DE]' : 'bg-[#E57373]/20 text-[#E57373]'}`}>
                            {caja.diferencia === 0 ? "Cuadrada" : "Diferencia"}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-[#3A506B]/50 pt-1.5 mt-0.5 text-[10px]">
                          <span className="text-[#5BC0DE]">Base: {formatearMoneda(caja.baseInicial)}</span>
                          <span className="font-bold text-[#F4D6B0]">Gen: {formatearMoneda(caja.totalGenerado)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* ================= PRODUCTOS ================= */}
        {activeTab === "Productos" && (
          <div className="space-y-3 sm:space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Rendimiento por Producto</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-3">Comparativa de ingresos directos facturados</p>
                <BarChartWithLabels items={dataProductos.filter(p => p.ingresos > 0).slice(0, 6).map(p => ({ label: p.nombre.split(" ")[0], value: p.ingresos }))} />
              </Card>

              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Participación en Ingresos</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-3">Cuota porcentual de venta</p>
                <SlimDonutChart data={dataProductos.filter(p => p.ingresos > 0).slice(0, 5).map((p, i) => ({ label: p.nombre, value: p.ingresos, color: ["#5BC0DE", "#F4D6B0", "#D97706", "#E57373", "#4ADE80"][i % 5] }))} />
              </Card>
            </div>

            <Card>
              <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-3">Catálogo y Rendimiento de Productos</h3>
              
              {dataProductos.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5BC0DE]/60">
                  No hay productos registrados en el sistema.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#3A506B] text-xs text-[#5BC0DE]">
                          <th className="pb-3 font-semibold">Producto</th>
                          <th className="pb-3 font-semibold">Categoría</th>
                          <th className="pb-3 text-center font-semibold">Unidades Vendidas</th>
                          <th className="pb-3 text-right font-semibold">Precio Venta</th>
                          <th className="pb-3 text-right font-semibold">Ingresos Totales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataProductos.map(prod => (
                          <tr key={prod.id} onClick={() => setModalProducto(prod)} className="border-b border-[#3A506B]/50 hover:bg-[#3A506B]/30 transition-colors cursor-pointer">
                            <td className="py-3 font-medium text-[#F4D6B0]">{prod.nombre} <span className="text-[10px] text-[#5BC0DE] block">ID: {prod.id}</span></td>
                            <td className="py-3"><span className="text-[10px] px-2 py-0.5 rounded-md bg-[#3A506B]/40 border border-[#3A506B] text-[#5BC0DE]">{prod.categoria}</span></td>
                            <td className="py-3 text-center font-bold text-[#F4D6B0]">{prod.unidadesVendidas} unid</td>
                            <td className="py-3 text-right text-[#5BC0DE]">{formatearMoneda(prod.precioPromedio)}</td>
                            <td className="py-3 text-right font-bold text-[#5BC0DE]">{formatearMoneda(prod.ingresos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-2">
                    {dataProductos.map(prod => (
                      <div key={prod.id} onClick={() => setModalProducto(prod)} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-1.5 shadow-sm active:scale-[0.99]">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs text-[#F4D6B0]">{prod.nombre}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#3A506B]/40 rounded text-[#5BC0DE]">{prod.categoria}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] mt-1">
                          <span className="text-[#5BC0DE]">{prod.unidadesVendidas} vendidos</span>
                          <span className="font-bold text-[#5BC0DE]">{formatearMoneda(prod.ingresos)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* ================= RENDIMIENTO EMPLEADOS ================= */}
        {activeTab === "Empleados" && (
          <div className="space-y-3 sm:space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Ventas Generadas</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-2">Desempeño por integrante del equipo</p>
                <BarChartWithLabels items={dataEmpleados.map(e => ({ label: e.nombre.split(" ")[0], value: e.totalVendido }))} />
              </Card>

              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Distribución de Propinas</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-2">Monto recolectado por empleado</p>
                <SlimDonutChart data={dataEmpleados.map((e, i) => ({ label: e.nombre, value: e.propinas, color: ["#5BC0DE", "#F4D6B0", "#D97706", "#E57373"][i % 4] }))} />
              </Card>
            </div>

            <Card>
              <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-3">Resumen de Desempeño del Personal</h3>

              {dataEmpleados.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5BC0DE]/60">
                  No se encontraron registros de empleados en el sistema.
                </div>
              ) : (() => {
                // Ordenar por propinas desc para ranking de medallas
                const rankingPropinas = [...dataEmpleados].sort((a, b) => b.propinas - a.propinas);
                const medallas: Record<number, string> = {};
                rankingPropinas.slice(0, 3).forEach((e, i) => {
                  medallas[e.id] = ["🥇", "🥈", "🥉"][i];
                });
                const badgeRol = (rol: string) => {
                  const r = rol.toLowerCase();
                  if (r.includes("mesero") || r.includes("mozo") || r.includes("waiter")) {
                    return <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-[#5BC0DE]/20 text-[#5BC0DE] border border-[#5BC0DE]/30">{rol}</span>;
                  }
                  return <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-[#F4D6B0]/10 text-[#F4D6B0]/70 border border-[#F4D6B0]/20">{rol}</span>;
                };
                return (
                  <>
                    {/* Tabla desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#3A506B] text-xs text-[#5BC0DE]">
                            <th className="pb-3 font-semibold">#</th>
                            <th className="pb-3 font-semibold">Empleado</th>
                            <th className="pb-3 text-center font-semibold">Comandas</th>
                            <th className="pb-3 text-right font-semibold">Ventas</th>
                            <th className="pb-3 text-right font-semibold">Propinas</th>
                            <th className="pb-3 text-right font-semibold">% Propina</th>
                            <th className="pb-3 text-center font-semibold">Último Turno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataEmpleados.map(emp => {
                            const pct = emp.totalVendido > 0
                              ? Math.round((emp.propinas / emp.totalVendido) * 100)
                              : 0;
                            const medalla = medallas[emp.id] ?? "";
                            return (
                              <tr key={emp.id} onClick={() => setModalEmpleado(emp)} className="border-b border-[#3A506B]/50 hover:bg-[#3A506B]/30 transition-colors cursor-pointer">
                                <td className="py-3 text-base">{medalla || <span className="text-[#5BC0DE]/30 text-xs">—</span>}</td>
                                <td className="py-3 font-medium text-[#F4D6B0]">
                                  {emp.nombre}
                                  <span className="block mt-0.5">{badgeRol(emp.rol)}</span>
                                </td>
                                <td className="py-3 text-center text-[#F4D6B0]">{emp.comandasAtendidas}</td>
                                <td className="py-3 text-right font-bold text-[#5BC0DE]">{formatearMoneda(emp.totalVendido)}</td>
                                <td className="py-3 text-right font-bold text-[#F4D6B0]">{formatearMoneda(emp.propinas)}</td>
                                <td className="py-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pct >= 15 ? "bg-green-500/20 text-green-400" : pct >= 8 ? "bg-yellow-500/20 text-yellow-400" : "bg-[#3A506B]/40 text-[#5BC0DE]/60"}`}>
                                    {pct}%
                                  </span>
                                </td>
                                <td className="py-3 text-center text-xs text-[#5BC0DE]">{emp.ultimoDiaTrabajado}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Cards mobile */}
                    <div className="md:hidden space-y-2">
                      {dataEmpleados.map(emp => {
                        const pct = emp.totalVendido > 0
                          ? Math.round((emp.propinas / emp.totalVendido) * 100)
                          : 0;
                        const medalla = medallas[emp.id] ?? "";
                        return (
                          <div key={emp.id} onClick={() => setModalEmpleado(emp)} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-1 shadow-sm active:scale-[0.99]">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-[#F4D6B0]">
                                {medalla && <span className="mr-1">{medalla}</span>}
                                {emp.nombre}
                              </span>
                              <span className="text-[10px] font-bold text-[#5BC0DE]">{formatearMoneda(emp.totalVendido)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {badgeRol(emp.rol)}
                            </div>
                            <div className="flex justify-between text-[10px] text-[#5BC0DE] mt-1">
                              <span>{emp.comandasAtendidas} comandas</span>
                              <span>
                                Prop: {formatearMoneda(emp.propinas)}
                                <span className={`ml-1 px-1.5 rounded-full font-semibold ${pct >= 15 ? "text-green-400" : pct >= 8 ? "text-yellow-400" : "text-[#5BC0DE]/50"}`}>
                                  ({pct}%)
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </Card>
          </div>
        )}

        {/* ================= GASTOS ================= */}
        {activeTab === "Gastos" && (
          <div className="space-y-3 sm:space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Categorización de Gastos</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-2">Desglose por rubros principales</p>
                <SlimDonutChart data={gastosPorCategoriaData} />
              </Card>

              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Comparativa de Egresos</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-2">Monto total registrado por rubro</p>
                <BarChartWithLabels items={gastosPorCategoriaData.map(g => ({ label: g.label, value: g.value }))} />
              </Card>
            </div>

            <Card>
              <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-3">Registro Detallado de Egresos</h3>
              
              {dataGastos.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5BC0DE]/60">
                  No hay gastos ni egresos registrados en este período.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#3A506B] text-xs text-[#5BC0DE]">
                          <th className="pb-3 font-semibold">Concepto</th>
                          <th className="pb-3 font-semibold">Categoría</th>
                          <th className="pb-3 font-semibold">Fecha</th>
                          <th className="pb-3 text-right font-semibold">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataGastos.map(gasto => (
                          <tr key={gasto.id} onClick={() => setModalGasto(gasto)} className="border-b border-[#3A506B]/50 hover:bg-[#3A506B]/30 transition-colors cursor-pointer">
                            <td className="py-3 font-medium text-[#F4D6B0]">{gasto.concepto} <span className="text-[10px] text-[#5BC0DE] block">{gasto.detalle}</span></td>
                            <td className="py-3"><span className="text-[10px] px-2 py-0.5 rounded-md bg-[#3A506B]/40 border border-[#3A506B] text-[#5BC0DE]">{gasto.categoria}</span></td>
                            <td className="py-3 text-xs text-[#5BC0DE]">{gasto.fecha}</td>
                            <td className="py-3 text-right font-bold text-[#E57373]">{formatearMoneda(gasto.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-2">
                    {dataGastos.map(gasto => (
                      <div key={gasto.id} onClick={() => setModalGasto(gasto)} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-1 shadow-sm active:scale-[0.99]">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-xs text-[#F4D6B0] truncate">{gasto.concepto}</span>
                          <span className="text-[10px] font-bold text-[#E57373] shrink-0">{formatearMoneda(gasto.monto)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#3A506B]/40 rounded text-[#5BC0DE]">{gasto.categoria}</span>
                          <span className="text-[9px] text-[#5BC0DE]">{gasto.fecha}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* ================= INVENTARIO ================= */}
        {activeTab === "Inventario" && (
          <div className="space-y-3 sm:space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Gasto Proyectado en Insumos</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-3">Inversión mensual estimada en materias primas</p>
                <BarChartWithLabels items={dataInsumos.slice(0, 6).map(i => ({ label: i.nombre.split(" ")[0], value: i.gastoMes }))} />
              </Card>

              <Card>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-1">Distribución del Stock</h3>
                <p className="text-[10px] sm:text-[11px] text-[#5BC0DE] mb-3">Proporción de inversión por insumo</p>
                <SlimDonutChart data={dataInsumos.slice(0, 5).map((i, idx) => ({ label: i.nombre, value: i.gastoMes, color: ["#5BC0DE", "#F4D6B0", "#D97706", "#E57373", "#60A5FA"][idx % 5] }))} />
              </Card>
            </div>

            <Card>
              <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-3">Auditoría de Insumos e Inventario</h3>
              
              {dataInsumos.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5BC0DE]/60">
                  No hay insumos registrados en el inventario.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#3A506B] text-xs text-[#5BC0DE]">
                          <th className="pb-3 font-semibold">Insumo</th>
                          <th className="pb-3 font-semibold">Categoría</th>
                          <th className="pb-3 font-semibold">Stock Actual</th>
                          <th className="pb-3 text-right font-semibold">Gasto Día (est.)</th>
                          <th className="pb-3 text-right font-semibold">Gasto Mes (est.)</th>
                          <th className="pb-3 text-center font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataInsumos.map(item => (
                          <tr key={item.id} className="border-b border-[#3A506B]/50 hover:bg-[#3A506B]/30 transition-colors">
                            <td className="py-3 font-medium text-[#F4D6B0]">{item.nombre} <span className="text-[10px] text-[#5BC0DE] block">ID: {item.id}</span></td>
                            <td className="py-3"><span className="text-[10px] px-2 py-0.5 rounded-md bg-[#3A506B]/40 border border-[#3A506B] text-[#5BC0DE]">{item.categoria}</span></td>
                            <td className="py-3 text-[#F4D6B0] font-semibold">{item.stockActual}</td>
                            <td className="py-3 text-right text-[#5BC0DE]">{formatearMoneda(item.gastoDia)}</td>
                            <td className="py-3 text-right font-bold text-[#5BC0DE]">{formatearMoneda(item.gastoMes)}</td>
                            <td className="py-3 text-center">
                              <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold ${item.estado === 'Óptimo' ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : item.estado === 'Agotado' ? 'bg-[#E57373]/20 text-[#E57373]' : 'bg-[#FBBF24]/20 text-[#FBBF24]'}`}>
                                {item.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-2">
                    {dataInsumos.map(item => (
                      <div key={item.id} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs text-[#F4D6B0] truncate">{item.nombre}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${item.estado === 'Óptimo' ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : item.estado === 'Agotado' ? 'bg-[#E57373]/20 text-[#E57373]' : 'bg-[#FBBF24]/20 text-[#FBBF24]'}`}>
                            {item.estado}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#5BC0DE] mt-1">
                          <span>Stock: {item.stockActual}</span>
                          <span>Gasto Mes: {formatearMoneda(item.gastoMes)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

      </main>

      {/* ================= MODALES EMERGENTES ================= */}

      {/* MODAL REPORTE IA */}
      <FixedModal isOpen={modalIA} onClose={() => setModalIA(false)} title="Análisis de Inteligencia Artificial">
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#3A506B]/30 p-3 rounded-xl border border-[#3A506B]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FBBF24]" />
              <div>
                <p className="text-xs font-bold text-[#F4D6B0]">Consultor Gastronómico IA</p>
                <p className="text-[10px] text-[#5BC0DE]">Análisis de rendimiento, menú, inventario y finanzas</p>
              </div>
            </div>
            {reporteIATexto && !generandoIA && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setModalIA(false);
                    setModalInformeImpresion(true);
                  }}
                  className="flex items-center gap-1.5 bg-[#1C2541] hover:bg-[#3A506B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs px-2.5 py-1.5 rounded-lg border border-[#3A506B] transition-colors"
                  title="Imprimir informe ejecutivo o guardar en PDF"
                >
                  <Printer size={13} />
                  <span>Imprimir PDF</span>
                </button>
                <button
                  type="button"
                  onClick={copiarInforme}
                  className="flex items-center gap-1 bg-[#1C2541] hover:bg-[#3A506B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs px-2.5 py-1.5 rounded-lg border border-[#3A506B] transition-colors"
                >
                  {copiado ? <Check size={14} className="text-[#4ADE80]" /> : <Copy size={14} />}
                  <span>{copiado ? "Copiado" : "Copiar"}</span>
                </button>
              </div>
            )}
          </div>

          {generandoIA ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-[#5BC0DE]">
              <RotateCw className="w-8 h-8 animate-spin text-[#FBBF24]" />
              <p className="text-xs font-medium">Analizando métricas y redactando informe...</p>
            </div>
          ) : (
            <div className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-4 text-xs sm:text-sm text-[#F4D6B0] leading-relaxed font-sans [scrollbar-width:thin] max-h-[60vh] overflow-y-auto">
              <FormatoContenidoIA contenido={reporteIATexto} />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalIA(false)}
              className="px-4 py-2 bg-[#5BC0DE] text-[#0B132B] font-semibold rounded-xl text-xs hover:bg-[#5BC0DE]/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </FixedModal>

      <FixedModal isOpen={!!modalCaja} onClose={() => setModalCaja(null)} title={`Arqueo - ${modalCaja?.id}`}>
        {modalCaja && (
          <>
            <div className="bg-[#F4D6B0] text-[#0B132B] p-3 sm:p-4 rounded-xl space-y-2 text-xs sm:text-sm shadow-md">
              <div className="flex justify-between"><span className="text-[#3A506B] font-semibold">Cajero:</span> <span className="font-bold">{modalCaja.cajero}</span></div>
              <div className="flex justify-between"><span className="text-[#3A506B] font-semibold">Horario:</span> <span>{modalCaja.horaApertura} - {modalCaja.horaCierre}</span></div>
              <div className="flex justify-between pt-2 border-t border-[#3A506B]/20"><span className="text-[#3A506B] font-semibold">Total Generado:</span> <span className="font-bold text-[#0B132B]">{formatearMoneda(modalCaja.totalGenerado)}</span></div>
            </div>
            <h4 className="text-[10px] sm:text-xs font-bold text-[#5BC0DE] uppercase pt-2">Movimientos</h4>
            <div className="space-y-2">
              {modalCaja.movimientos.length === 0 ? (
                <div className="text-center py-3 text-xs text-[#5BC0DE]/60">Sin movimientos registrados</div>
              ) : (
                modalCaja.movimientos.map((m, i) => (
                  <div key={i} className="flex justify-between bg-[#3A506B]/30 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm border border-[#3A506B]">
                    <span className="truncate pr-2">{m.concepto}</span>
                    <span className={`font-bold shrink-0 ${m.tipo === "Ingreso" ? "text-[#5BC0DE]" : "text-[#E57373]"}`}>
                      {m.tipo === "Ingreso" ? "+" : "-"}{formatearMoneda(m.monto)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </FixedModal>

      <FixedModal isOpen={!!modalEmpleado} onClose={() => setModalEmpleado(null)} title={modalEmpleado?.nombre || ""}>
        {modalEmpleado && (
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="bg-[#F4D6B0] text-[#0B132B] p-4 rounded-xl text-center shadow-md">
              <p className="text-[10px] text-[#3A506B] font-bold uppercase">{modalEmpleado.rol}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] mt-1">{formatearMoneda(modalEmpleado.totalVendido)}</p>
              <p className="text-[9px] text-[#3A506B] mt-0.5 font-semibold">Ventas Totales</p>
            </div>
            <div className="flex justify-between bg-[#3A506B]/30 p-2.5 sm:p-3 rounded-xl border border-[#3A506B]"><span className="text-[#5BC0DE]">Comandas:</span> <strong>{modalEmpleado.comandasAtendidas}</strong></div>
            <div className="flex justify-between bg-[#3A506B]/30 p-2.5 sm:p-3 rounded-xl border border-[#3A506B]"><span className="text-[#5BC0DE]">Propinas:</span> <strong className="text-[#5BC0DE]">{formatearMoneda(modalEmpleado.propinas)}</strong></div>
            <div className="flex justify-between bg-[#3A506B]/30 p-2.5 sm:p-3 rounded-xl border border-[#3A506B]"><span className="text-[#5BC0DE]">Último Turno:</span> <strong>{modalEmpleado.ultimoDiaTrabajado}</strong></div>
          </div>
        )}
      </FixedModal>

      <FixedModal isOpen={!!modalGasto} onClose={() => setModalGasto(null)} title="Especificación del Gasto">
        {modalGasto && (
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="bg-[#F4D6B0] text-[#0B132B] p-4 rounded-xl space-y-1 shadow-md">
              <h4 className="text-sm sm:text-base font-bold text-[#0B132B]">{modalGasto.concepto}</h4>
              <p className="text-[10px] sm:text-xs text-[#3A506B]">{modalGasto.detalle}</p>
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs px-1"><span className="text-[#5BC0DE]">Categoría:</span> <span>{modalGasto.categoria}</span></div>
            <div className="flex justify-between text-[10px] sm:text-xs px-1"><span className="text-[#5BC0DE]">Responsable:</span> <span>{modalGasto.responsable}</span></div>
            <div className="flex justify-between pt-3 border-t border-[#3A506B] font-bold text-sm sm:text-base px-1">
              <span>Monto:</span> <span className="text-[#E57373]">{formatearMoneda(modalGasto.monto)}</span>
            </div>
          </div>
        )}
      </FixedModal>

      <FixedModal isOpen={!!modalProducto} onClose={() => setModalProducto(null)} title={modalProducto?.nombre || ""}>
        {modalProducto && (
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="bg-[#F4D6B0] text-[#0B132B] p-4 rounded-xl text-center shadow-md">
              <p className="text-[10px] text-[#3A506B] font-bold uppercase">{modalProducto.categoria}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] mt-1">{formatearMoneda(modalProducto.ingresos)}</p>
            </div>
            <div className="flex justify-between bg-[#3A506B]/30 p-2.5 sm:p-3 rounded-xl border border-[#3A506B]"><span className="text-[#5BC0DE]">Unidades Vendidas:</span> <strong>{modalProducto.unidadesVendidas}</strong></div>
            <div className="flex justify-between bg-[#3A506B]/30 p-2.5 sm:p-3 rounded-xl border border-[#3A506B]"><span className="text-[#5BC0DE]">Precio Promedio:</span> <strong>{formatearMoneda(modalProducto.precioPromedio)}</strong></div>
          </div>
        )}
      </FixedModal>

      {/* MODAL / VISTA DE IMPRESIÓN Y EXPORTACIÓN EJECUTIVA */}
      <InformeEjecutivoImpresion
        isOpen={modalInformeImpresion}
        onClose={() => setModalInformeImpresion(false)}
        negocioNombre={negocioConfig?.nombre}
        negocioNit={negocioConfig?.nit}
        negocioDireccion={negocioConfig?.direccion}
        negocioTelefono={negocioConfig?.telefono}
        periodo={fechaFiltro}
        totales={{
          ingresos: totalGeneradoCajas,
          gastos: totalGastosRegistrados,
          balanceNeto,
          propinas: totalPropinas,
        }}
        cajas={dataCajas}
        productos={dataProductos}
        gastos={dataGastos}
        empleados={dataEmpleados}
        inventarioBajo={insumosCriticos}
        reporteIATexto={reporteIATexto || undefined}
        onExportarCSV={handleExportarExcel}
      />

    </div>
  );
}
