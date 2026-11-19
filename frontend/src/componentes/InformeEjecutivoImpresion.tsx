import React, { useEffect } from "react";
import { 
  Printer, 
  X, 
  FileSpreadsheet, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Utensils, 
  Users, 
  Package, 
  Calendar,
  Building,
  CheckCircle2,
  FileText
} from "lucide-react";
import FormatoContenidoIA from "./FormatoContenidoIA";

interface InformeEjecutivoProps {
  isOpen: boolean;
  onClose: () => void;
  autoImprimir?: boolean;
  negocioNombre?: string;
  negocioNit?: string | null;
  negocioDireccion?: string | null;
  negocioTelefono?: string | null;
  periodo: "Hoy" | "Semana" | "Mes";
  totales: {
    ingresos: number;
    gastos: number;
    balanceNeto: number;
    propinas: number;
  };
  cajas: {
    cajero: string;
    fecha: string;
    totalGenerado: number;
    ventasEfectivo: number;
    ventasTarjeta: number;
    ventasTransferencia: number;
    egresosTotales: number;
    diferencia: number;
  }[];
  productos: {
    nombre: string;
    categoria: string;
    unidadesVendidas: number;
    precioPromedio: number;
    ingresos: number;
  }[];
  gastos: {
    fecha: string;
    categoria: string;
    concepto: string;
    monto: number;
  }[];
  empleados: {
    nombre: string;
    rol: string;
    comandasAtendidas: number;
    totalVendido: number;
    propinas: number;
  }[];
  inventarioBajo: {
    nombre: string;
    stockActual: string;
    estado: string;
  }[];
  reporteIATexto?: string;
  onExportarCSV: () => void;
}

const formatearMoneda = (val: number) =>
  val.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function InformeEjecutivoImpresion({
  isOpen,
  onClose,
  autoImprimir = false,
  negocioNombre = "Sabor & Stock",
  negocioNit,
  negocioDireccion,
  negocioTelefono,
  periodo,
  totales,
  cajas,
  productos,
  gastos,
  empleados,
  inventarioBajo,
  reporteIATexto,
  onExportarCSV,
}: InformeEjecutivoProps) {
  const periodoTexto = periodo === "Hoy" ? "Diario (Hoy)" : periodo === "Semana" ? "Semanal (Últimos 7 días)" : "Mensual (Mes en Curso)";
  const fechaGeneracion = new Date().toLocaleString("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const handlePrint = () => {
    document.body.classList.add("imprimiendo-informe-pdf");
    setTimeout(() => {
      window.print();
    }, 60);
  };

  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove("imprimiendo-informe-pdf");
      return;
    }

    document.body.classList.add("imprimiendo-informe-pdf");

    if (autoImprimir) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }

    const handleAfterPrint = () => {
      // Dejar la clase activa si el modal sigue abierto para que no salte estilos si vuelven a imprimir
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("imprimiendo-informe-pdf");
    };
  }, [isOpen, autoImprimir]);

  if (!isOpen) return null;

  return (
    <div className="modal-informe-overlay fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      {/* Estilos específicos de impresión para cuando se use Imprimir / Guardar como PDF */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 10mm 12mm;
          }
          body * {
            visibility: hidden;
          }
          #seccion-informe-imprimible, #seccion-informe-imprimible * {
            visibility: visible !important;
          }
          #seccion-informe-imprimible {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .no-imprimir {
            display: none !important;
          }
          .imprimir-tarjeta {
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            box-shadow: none !important;
          }
          .imprimir-texto-oscuro {
            color: #0f172a !important;
          }
          .imprimir-texto-secundario {
            color: #475569 !important;
          }
          .imprimir-borde {
            border-color: #cbd5e1 !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          thead tr {
            background: #f1f5f9 !important;
            border-bottom: 2px solid #cbd5e1 !important;
          }
          th {
            color: #334155 !important;
            font-weight: 700 !important;
          }
          tbody tr {
            border-bottom: 1px solid #e2e8f0 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          h1, h2, h3, h4, strong {
            color: #0f172a !important;
          }
        }
      `}</style>

      <div className="modal-informe-card bg-[#1C2541] border border-[#5BC0DE]/40 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* BARRA SUPERIOR DE ACCIONES (NO SE IMPRIME) */}
        <div className="bg-[#0B132B] px-4 py-3 border-b border-[#3A506B] flex flex-wrap items-center justify-between gap-2.5 shrink-0 no-imprimir">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#5BC0DE]/15 flex items-center justify-center border border-[#5BC0DE]/30">
              <FileText className="w-4 h-4 text-[#5BC0DE]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F4D6B0]">
                Informe Ejecutivo Imprimible / PDF
              </h2>
              <p className="text-[10px] text-[#5BC0DE]">
                Formato institucional de auditoría y análisis de gerencia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportarCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2541] hover:bg-[#3A506B] text-[#5BC0DE] text-xs font-semibold border border-[#3A506B] transition-colors"
              title="Descargar en formato Excel (.CSV)"
            >
              <FileSpreadsheet size={14} className="text-[#4ADE80]" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] text-xs font-bold transition-all shadow-md active:scale-95"
              title="Imprimir o Guardar como PDF"
            >
              <Printer size={14} />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#1C2541] hover:bg-[#3A506B] text-[#5BC0DE] hover:text-[#F4D6B0] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL REPORTE IMPRIMIBLE */}
        <div 
          id="seccion-informe-imprimible" 
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 text-[#F4D6B0] bg-[#1C2541] [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]"
        >
          {/* ENCABEZADO INSTITUCIONAL */}
          <div className="border-b-2 border-[#5BC0DE] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 imprimir-borde">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#F4D6B0] uppercase imprimir-texto-oscuro">
                  {negocioNombre}
                </span>
                <span className="text-[10px] bg-[#5BC0DE]/15 text-[#5BC0DE] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-[#5BC0DE]/30">
                  Auditoría
                </span>
              </div>
              <p className="text-xs text-[#5BC0DE] mt-1 imprimir-texto-secundario">
                {negocioNit ? `NIT: ${negocioNit}` : "Sistema de Gestión y Control Sabor & Stock"}
                {negocioDireccion ? ` • ${negocioDireccion}` : ""}
                {negocioTelefono ? ` • Tel: ${negocioTelefono}` : ""}
              </p>
            </div>
            <div className="text-left sm:text-right text-xs">
              <span className="block font-bold text-[#F4D6B0] uppercase tracking-wider text-[11px] imprimir-texto-oscuro">
                Período: {periodoTexto}
              </span>
              <span className="text-[10px] text-[#5BC0DE] block imprimir-texto-secundario">
                Emitido el {fechaGeneracion}
              </span>
            </div>
          </div>

          {/* 1. TARJETAS DE INDICADORES CLAVE (KPIs) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5BC0DE] mb-2.5 flex items-center gap-1.5 imprimir-texto-secundario">
              <TrendingUp size={14} /> 1. Balance Financiero Consolidado
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] imprimir-tarjeta">
                <span className="text-[10px] text-[#5BC0DE] font-semibold uppercase block imprimir-texto-secundario">Ingresos Totales</span>
                <span className="text-base sm:text-lg font-black text-[#4ADE80] block mt-1">
                  {formatearMoneda(totales.ingresos)}
                </span>
                <span className="text-[9px] text-[#5BC0DE]/70 block mt-0.5 imprimir-texto-secundario">Ventas brutas caja</span>
              </div>
              <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] imprimir-tarjeta">
                <span className="text-[10px] text-[#E57373] font-semibold uppercase block">Gastos Registrados</span>
                <span className="text-base sm:text-lg font-black text-[#E57373] block mt-1">
                  {formatearMoneda(totales.gastos)}
                </span>
                <span className="text-[9px] text-[#5BC0DE]/70 block mt-0.5 imprimir-texto-secundario">Compras, nómina y otros</span>
              </div>
              <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] imprimir-tarjeta">
                <span className="text-[10px] text-[#FBBF24] font-semibold uppercase block">Balance Neto</span>
                <span className={`text-base sm:text-lg font-black block mt-1 ${totales.balanceNeto >= 0 ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
                  {formatearMoneda(totales.balanceNeto)}
                </span>
                <span className="text-[9px] text-[#5BC0DE]/70 block mt-0.5 imprimir-texto-secundario">Flujo de caja estimado</span>
              </div>
              <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] imprimir-tarjeta">
                <span className="text-[10px] text-[#5BC0DE] font-semibold uppercase block imprimir-texto-secundario">Propinas Equipo</span>
                <span className="text-base sm:text-lg font-black text-[#F4D6B0] block mt-1 imprimir-texto-oscuro">
                  {formatearMoneda(totales.propinas)}
                </span>
                <span className="text-[9px] text-[#5BC0DE]/70 block mt-0.5 imprimir-texto-secundario">Para repartición de servicio</span>
              </div>
            </div>
          </div>

          {/* 2. VENTAS POR PRODUCTO Y PLATOS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5BC0DE] mb-2 flex items-center gap-1.5 imprimir-texto-secundario">
              <Utensils size={14} /> 2. Desglose de Platos y Productos más Vendidos
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[#3A506B] bg-[#0B132B] imprimir-tarjeta">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1C2541] border-b border-[#3A506B] text-[10px] font-bold text-[#5BC0DE] uppercase tracking-wider">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Producto / Plato</th>
                    <th className="py-2 px-3">Categoría</th>
                    <th className="py-2 px-3 text-center">Unidades</th>
                    <th className="py-2 px-3 text-right">Precio Prom.</th>
                    <th className="py-2 px-3 text-right">Total Generado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A506B]/50 text-[#F4D6B0] imprimir-texto-oscuro">
                  {productos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-[#5BC0DE]/60 italic">Sin ventas registradas en este período</td>
                    </tr>
                  ) : (
                    productos.slice(0, 10).map((prod, idx) => (
                      <tr key={idx} className="hover:bg-[#1C2541]/40">
                        <td className="py-2 px-3 font-bold text-[#5BC0DE]">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold">{prod.nombre}</td>
                        <td className="py-2 px-3 text-[#5BC0DE] text-[11px]">{prod.categoria}</td>
                        <td className="py-2 px-3 text-center font-bold">{prod.unidadesVendidas}</td>
                        <td className="py-2 px-3 text-right text-[11px]">{formatearMoneda(prod.precioPromedio)}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#4ADE80]">{formatearMoneda(prod.ingresos)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. CONTROL DE ARQUEOS Y CAJAS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5BC0DE] mb-2 flex items-center gap-1.5 imprimir-texto-secundario">
              <Building size={14} /> 3. Cuadre de Turnos de Caja
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[#3A506B] bg-[#0B132B] imprimir-tarjeta">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1C2541] border-b border-[#3A506B] text-[10px] font-bold text-[#5BC0DE] uppercase tracking-wider">
                    <th className="py-2 px-3">Cajero</th>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3 text-right">Efectivo</th>
                    <th className="py-2 px-3 text-right">Digital/Tarjeta</th>
                    <th className="py-2 px-3 text-right">Total Ventas</th>
                    <th className="py-2 px-3 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A506B]/50 text-[#F4D6B0] imprimir-texto-oscuro">
                  {cajas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-[#5BC0DE]/60 italic">Sin turnos registrados en este período</td>
                    </tr>
                  ) : (
                    cajas.slice(0, 8).map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold">{c.cajero}</td>
                        <td className="py-2 px-3 text-[#5BC0DE] text-[11px]">{c.fecha}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatearMoneda(c.ventasEfectivo)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatearMoneda(c.ventasTarjeta + c.ventasTransferencia)}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#4ADE80]">{formatearMoneda(c.totalGenerado)}</td>
                        <td className={`py-2 px-3 text-right font-bold font-mono ${c.diferencia === 0 ? "text-[#4ADE80]" : c.diferencia > 0 ? "text-[#FBBF24]" : "text-[#F87171]"}`}>
                          {formatearMoneda(c.diferencia)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. INSUMOS BAJOS Y ALERTAS */}
          {inventarioBajo.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E57373] mb-2 flex items-center gap-1.5">
                <Package size={14} /> 4. Insumos Críticos bajo Nivel Mínimo ({inventarioBajo.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {inventarioBajo.slice(0, 6).map((ins, idx) => (
                  <div key={idx} className="bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B] flex items-center justify-between text-xs imprimir-tarjeta">
                    <span className="font-semibold text-[#F4D6B0] truncate pr-2 imprimir-texto-oscuro">{ins.nombre}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/40 shrink-0">
                      Stock: {ins.stockActual}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. ANÁLISIS ESTRATÉGICO DE INTELIGENCIA ARTIFICIAL (SI ESTÁ PRESENTE) */}
          {reporteIATexto && (
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FBBF24] mb-2 flex items-center gap-1.5">
                <Sparkles size={14} /> 5. Diagnóstico y Recomendaciones Ejecutivas (IA)
              </h3>
              <div className="bg-[#0B132B] p-4 rounded-xl border border-[#3A506B] text-xs leading-relaxed imprimir-tarjeta">
                <FormatoContenidoIA contenido={reporteIATexto} />
              </div>
            </div>
          )}

          {/* ÁREA DE FIRMAS Y CONFORMIDAD */}
          <div className="pt-8 border-t border-[#3A506B]/50 grid grid-cols-2 gap-8 text-center text-xs text-[#5BC0DE] mt-6 imprimir-borde">
            <div>
              <div className="border-b border-[#3A506B] w-48 mx-auto mb-2 imprimir-borde" />
              <p className="font-bold text-[#F4D6B0] imprimir-texto-oscuro">Gerencia / Administración</p>
              <p className="text-[10px] text-[#5BC0DE] imprimir-texto-secundario">Revisado y Conforme</p>
            </div>
            <div>
              <div className="border-b border-[#3A506B] w-48 mx-auto mb-2 imprimir-borde" />
              <p className="font-bold text-[#F4D6B0] imprimir-texto-oscuro">Auditoría / Control Interno</p>
              <p className="text-[10px] text-[#5BC0DE] imprimir-texto-secundario">Sabor & Stock Pos</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
