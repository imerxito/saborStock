import React from 'react';
import {
  Users, Clock, Plus, Minus, CheckCircle2, X, Search, ChefHat,
  LayoutGrid, Filter, ArrowRight, ArrowLeft, Trash2,
  RotateCw, Settings, Edit, List, Printer, CreditCard, MessageSquare, Lock, DollarSign,
  ShoppingBag, Sparkles, Building2, Utensils, Layers
} from 'lucide-react';
import ConfiguracionMesas from './ConfiguracionMesas';
import FormatoTicketTermico from '../../componentes/FormatoTicketTermico';
import {
  useMesas,
  getBordeMesa,
  CATEGORIAS,
  NOTAS_RAPIDAS,
  PASO_MIN,
} from './hooks/useMesas';

// ─── Tipos públicos exportados (el hook los importa desde aquí) ────────────────
export type CategoriaProducto = 'Platos Fuertes' | 'Comidas Rápidas' | 'Entradas' | 'Bebidas' | 'Postres';

export interface Producto {
  id: string;
  idProducto?: number;
  idCategoria?: number;
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
  descripcion?: string;
}

export interface ItemPedido {
  producto: Producto;
  cantidad: number;
  notas?: string;
}

export interface ComandaTicket {
  id: string;
  comandaId?: number;
  items: ItemPedido[];
  total: number;
  estado: 'En preparación' | 'Listo' | 'Entregado' | 'Pagando';
  mesero: string;
  hora: string;
  timestampCreacion: number;
  notas?: string;
}

export interface VentaMesa {
  id: string;
  mesaId: string;
  numeroMesa: number;
  idSeccion?: number;
  seccionNombre?: string;
  cliente: string;
  meseroPrincipal: string;
  horaEstimada: string;
  personas: number;
  timestampCreacion: number;
  comandasTicket: ComandaTicket[];
  itemsConsolidados: ItemPedido[];
  totalVentaAcumulado: number;
}

export interface TicketAImprimir {
  venta: VentaMesa;
  comandaTicket?: ComandaTicket;
  esTicketGlobal?: boolean;
  tipo: 'precuenta' | 'comanda';
  impresoraNombre?: string;
  itemsFiltrados: ItemPedido[];
  totalTicket: number;
}

export interface Mesa {
  id: string;
  idBackend: number;
  numero: number;
  seccion: string;
  idSeccion?: number;
  seccionId?: number;
  capacidad: number;
  estado: 'Disponible' | 'Ocupada' | 'Reservada' | 'Pagando';
  ventasActuales: VentaMesa[];
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Mesas() {
  const {
    usuario,
    conectadoBackend,
    esAdminODueno,
    puedeLiberar,
    cargando,
    guardando,
    configAbierta,
    setConfigAbierta,
    seccionFiltro,
    setSeccionFiltro,
    seccionesDisponibles,
    mesasDeZona,
    mesaSeleccionada,
    pasoModal,
    setPasoModal,
    ventaActivaId,
    setVentaActivaId,
    ventaEnEdicion,
    nombreCliente,
    setNombreCliente,
    horaEstimada,
    horaObjetivo,
    horaMinima,
    horaMaxima,
    minutosEspera,
    personas,
    setPersonas,
    notasMesa,
    setNotasMesa,
    categoriaActiva,
    setCategoriaActiva,
    busquedaProducto,
    setBusquedaProducto,
    carrito,
    notaAbiertaId,
    setNotaAbiertaId,
    productosVisibles,
    cantidadPorCategoria,
    totalCarrito,
    scrollRef,
    isDragging,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
    ticketAImprimir,
    negocioConfig,
    facturacionConfig,
    impresorasConfig,
    modalImpresorasMesa,
    setModalImpresorasMesa,
    rondaSeleccionadaId,
    setRondaSeleccionadaId,
    cargarDatosBackend,
    recargar,
    abrirMesa,
    iniciarNuevaVenta,
    prepararNuevaComandaParaVenta,
    cerrarModal,
    modificarCantidad,
    fijarCantidad,
    ajustarMinutos,
    fijarNota,
    agregarNotaRapida,
    tocarProducto,
    guardarPedido,
    despacharVentaCompleta,
    liberarMesaCompleta,
    imprimirPrecuenta,
    imprimirComandaParaImpresora,
  } = useMesas();

  return (
    <>
      <div className="h-[100dvh] sm:h-full w-full max-w-full flex flex-col bg-[#0B132B] text-[#F4D6B0] p-2 sm:p-3 md:p-6 font-sans antialiased overflow-x-hidden print:hidden">

        <header className="shrink-0 bg-[#1C2541] mb-2 sm:mb-4 border border-[#3A506B] p-3 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between gap-2 lg:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0B132B] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE] shadow-md shrink-0">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#F4D6B0] tracking-tight truncate">Gestión de Ventas</h2>
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${conectadoBackend ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${conectadoBackend ? 'bg-emerald-400 animate-pulse' : 'bg-[#D97706]'}`} />
                    {conectadoBackend ? 'Online' : 'Local'}
                  </span>
                </div>
                <p className="text-[11px] text-[#5BC0DE] hidden sm:block">Control de mesas y comandas en tiempo real.</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button onClick={() => { void recargar(); void cargarDatosBackend(); }} disabled={cargando} className="p-2 sm:p-2.5 rounded-xl bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] hover:text-white hover:border-[#5BC0DE] transition-colors">
                <RotateCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              </button>
              {esAdminODueno && (
                <button onClick={() => setConfigAbierta(true)} className="p-2 sm:p-2.5 rounded-xl bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] hover:text-white hover:border-[#5BC0DE] transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between sm:justify-start gap-2 bg-[#0B132B] p-1 rounded-xl border border-[#3A506B] w-full sm:w-fit">
            <div className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Disp: {mesasDeZona.filter((m) => m.estado === 'Disponible').length}
            </div>
            <div className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-[#D97706] text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Ocup: {mesasDeZona.filter((m) => m.estado === 'Ocupada').length}
            </div>
            <div className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-[#5BC0DE] text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5BC0DE]" /> Pagando: {mesasDeZona.filter((m) => m.estado === 'Pagando').length}
            </div>
          </div>

          <div className="mt-3 border-t border-[#3A506B]/50 pt-3 flex items-center gap-2">
            <span className="hidden sm:flex text-xs font-bold text-[#5BC0DE] items-center gap-1 shrink-0 w-16">
              <Filter className="w-3.5 h-3.5" /> Zona:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden touch-pan-x pb-1">
              {seccionesDisponibles.map((sec) => (
                <button key={sec} onClick={() => setSeccionFiltro(sec)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border ${seccionFiltro === sec ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-md' : 'bg-[#0B132B] text-[#F4D6B0] border-[#3A506B] hover:bg-[#3A506B]/50'}`}>
                  {sec}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 pb-24 sm:pb-4">
            {mesasDeZona.map((mesa) => {
              const estaOcupada = mesa.estado === 'Ocupada' || mesa.estado === 'Pagando';
              const estaPagando = mesa.estado === 'Pagando';
              const totalMesa = mesa.ventasActuales.reduce((a, b) => a + b.totalVentaAcumulado, 0);
              const meseroAtiende = mesa.ventasActuales[0]?.meseroPrincipal || 'Sin asignar';

              return (
                <div
                  key={mesa.id}
                  onClick={() => abrirMesa(mesa)}
                  className={`bg-[#0B132B] border-2 rounded-2xl transition-all shadow-md group relative cursor-pointer overflow-hidden flex flex-col justify-between active:scale-[0.98] hover:-translate-y-0.5 ${getBordeMesa(mesa.estado)}`}
                >
                  {/* Header de la tarjeta */}
                  <div className="p-2 sm:p-2.5 flex items-center justify-between gap-1 bg-[#1C2541]/50 border-b border-[#3A506B]/40 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl border-2 flex items-center justify-center font-black text-sm sm:text-base transition-colors bg-[#0B132B] ${estaPagando ? 'border-[#5BC0DE] text-[#5BC0DE]' : estaOcupada ? 'border-[#D97706] text-[#D97706]' : 'border-emerald-500 text-emerald-400'}`}>
                        {mesa.numero}
                      </div>
                      <div className="hidden sm:flex flex-col min-w-0">
                        <span className="text-[10px] text-[#5BC0DE] font-bold uppercase tracking-wider truncate">{mesa.seccion}</span>
                        {estaOcupada ? (
                          <span className="text-[10px] text-[#F4D6B0] flex items-center gap-1 mt-0.5 font-semibold min-w-0">
                            <Users className="w-3 h-3 shrink-0" /> <span className="truncate">{meseroAtiende}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#3A506B] mt-0.5 truncate">{mesa.capacidad} pers.</span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      estaPagando ? 'bg-[#5BC0DE]/20 text-[#5BC0DE] border-[#5BC0DE]/40' :
                      estaOcupada ? 'bg-[#D97706]/20 text-[#D97706] border-[#D97706]/40' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {estaPagando ? 'Pag.' : estaOcupada ? 'Ocup.' : 'Libre'}
                    </span>
                  </div>

                  {/* Info móvil */}
                  <div className="sm:hidden px-2 pt-1.5 text-[10px] leading-tight min-w-0">
                    <p className="font-bold text-[#5BC0DE] truncate">{mesa.seccion}</p>
                    {estaOcupada && <p className="text-[#F4D6B0] truncate">{meseroAtiende}</p>}
                  </div>

                  {/* Contenido central */}
                  <div className="px-2 py-2 sm:p-3 flex-1 flex flex-col items-center justify-center min-w-0">
                    {estaOcupada ? (
                      <div className="flex flex-col items-center gap-1.5 w-full min-w-0">
                        <div className={`w-full flex items-center justify-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${estaPagando ? 'bg-[#5BC0DE]/10 text-[#5BC0DE] border-[#5BC0DE]/30' : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30'}`}>
                          {estaPagando ? <CreditCard className="w-3.5 h-3.5 shrink-0" /> : <List className="w-3.5 h-3.5 shrink-0" />}
                          <span>{mesa.ventasActuales.length} vta{mesa.ventasActuales.length !== 1 ? 's.' : '.'}</span>
                        </div>
                        <span className="text-xs text-[#F4D6B0] font-bold font-mono truncate max-w-full">
                          ${totalMesa.toLocaleString('es-CO')}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[#3A506B] text-[10px] italic flex items-center gap-1 text-center">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Lista</span>
                      </div>
                    )}
                  </div>

                  {/* Footer acción */}
                  <div className="px-2 py-1.5 bg-[#1C2541] border-t border-[#3A506B]/50 flex justify-between items-center group-hover:bg-[#5BC0DE] transition-colors">
                    <div className="flex gap-1">
                      {estaOcupada && puedeLiberar && (
                        <button
                          onClick={(e) => { e.stopPropagation(); liberarMesaCompleta(mesa.id); }}
                          className="p-1 text-rose-400 hover:bg-rose-500/20 rounded transition-colors group-hover:text-[#0B132B]"
                          title="Liberar mesa"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      {estaOcupada
                        ? <><Edit className="w-3.5 h-3.5 text-[#D97706] group-hover:text-[#0B132B]" /><span className="text-[#D97706] group-hover:text-[#0B132B] hidden sm:inline">Editar</span></>
                        : <><Plus className="w-3.5 h-3.5 text-[#5BC0DE] group-hover:text-[#0B132B]" /><span className="text-[#5BC0DE] group-hover:text-[#0B132B] hidden sm:inline">Abrir</span></>
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {esAdminODueno && <ConfiguracionMesas abierto={configAbierta} onCerrar={() => setConfigAbierta(false)} onActualizado={() => { void recargar(); void cargarDatosBackend(); }} />}

        {/* MODAL PRINCIPAL DE MESA */}
        {mesaSeleccionada && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-2 pt-2 pb-14 sm:p-5 animate-in fade-in duration-200">
            <div className={`bg-[#1C2541] border border-[#3A506B] rounded-2xl sm:rounded-3xl w-full overflow-hidden flex flex-col shadow-2xl max-h-full ${pasoModal === 'menu' ? 'max-w-4xl' : 'max-w-xl'}`}>

              <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#5BC0DE] text-[#0B132B] flex items-center justify-center font-black text-lg sm:text-xl shadow-md">
                    {mesaSeleccionada.numero}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-base sm:text-lg font-extrabold text-[#F4D6B0] truncate">Mesa {mesaSeleccionada.numero}</h2>
                      <span className="text-[10px] bg-[#1C2541] border border-[#3A506B] text-[#5BC0DE] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider truncate max-w-[50%]">{mesaSeleccionada.seccion}</span>
                    </div>
                    <p className="text-[11px] text-[#5BC0DE] mt-0.5 truncate">
                      {pasoModal === 'lista' ? 'Detalle de la Venta' : pasoModal === 'info' ? 'Nueva Venta' : ventaEnEdicion ? 'Agregar Productos' : 'Seleccionar Productos'}
                    </p>
                  </div>
                </div>
                <button onClick={cerrarModal} className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-2.5 sm:p-5 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 min-h-0 space-y-4 bg-[#1C2541] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/60 [&::-webkit-scrollbar-thumb]:rounded-full">

                {pasoModal === 'lista' && (
                  <div className="space-y-4 w-full min-w-0">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                       <h3 className="text-[#F4D6B0] font-bold text-sm">Ventas Actuales de la Mesa</h3>
                       <button onClick={() => iniciarNuevaVenta(mesaSeleccionada)} className="flex items-center gap-1 bg-[#5BC0DE] text-[#0B132B] px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-[#4CA8C4]">
                          <Plus className="w-4 h-4" /> Abrir Otra Venta
                       </button>
                    </div>

                    <div className="flex overflow-x-auto gap-2 pb-2 touch-pan-x [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#3A506B]">
                      {mesaSeleccionada.ventasActuales.map((venta, idx) => {
                        const esActiva = venta.id === ventaActivaId || (!ventaActivaId && idx === 0);
                        return (
                          <button
                            key={venta.id}
                            onClick={() => setVentaActivaId(venta.id)}
                            className={`px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 border-b-2 flex items-center gap-2 ${
                              esActiva
                                ? 'bg-[#5BC0DE]/10 border-[#5BC0DE] text-[#5BC0DE]'
                                : 'bg-[#0B132B] border-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B]/50'
                            }`}
                          >
                            Venta #{idx + 1} ({venta.cliente})
                            <span className="text-[10px] bg-[#0B132B] px-1.5 py-0.5 rounded text-[#F4D6B0]">${venta.totalVentaAcumulado.toLocaleString('es-CO')}</span>
                          </button>
                        );
                      })}
                    </div>

                    {mesaSeleccionada.ventasActuales.map((venta, idx) => {
                      const esActiva = venta.id === ventaActivaId || (!ventaActivaId && idx === 0);
                      if (!esActiva) return null;
                      return (
                        <div key={venta.id} className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3 sm:p-4 space-y-4 w-full min-w-0 overflow-hidden shadow-sm">

                          <div className="flex flex-wrap justify-between items-start gap-2 border-b border-[#3A506B] pb-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-[#F4D6B0] font-bold truncate">Venta #{idx + 1} - Cliente: <span className="text-[#5BC0DE]">{venta.cliente}</span> ({venta.personas} pers.)</p>
                              <p className="text-xs text-[#3A506B] mt-0.5 truncate">Atendido por: <strong className="text-[#F4D6B0]">{venta.meseroPrincipal}</strong></p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-[#5BC0DE] font-semibold">TOTAL ACUMULADO</p>
                              <p className="text-[#D97706] font-bold font-mono text-lg sm:text-xl">${venta.totalVentaAcumulado.toLocaleString('es-CO')}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1C2541] p-2 rounded-xl border border-[#3A506B]">
                            <button onClick={() => prepararNuevaComandaParaVenta(venta)} className="text-xs font-bold bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-colors w-full sm:w-auto justify-center">
                              <Plus className="w-4 h-4" /> Agregar Productos
                            </button>

                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => imprimirPrecuenta(venta)}
                                className="flex-1 sm:flex-none text-xs font-bold text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] hover:bg-[#3A506B] px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Printer className="w-4 h-4 text-[#5BC0DE]" /> Imprimir Pre-cuenta
                              </button>

                              {puedeLiberar && (
                                <button
                                  onClick={() => despacharVentaCompleta(venta)}
                                  disabled={guardando}
                                  className="flex-1 sm:flex-none text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Despachar Venta
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 w-full min-w-0">
                            <h4 className="text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wide">Productos en la Venta Actual</h4>

                            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl overflow-hidden w-full">
                              <div className="grid grid-cols-12 bg-[#0B132B]/80 p-2 text-[11px] font-bold text-[#5BC0DE] border-b border-[#3A506B]">
                                <span className="col-span-2 text-center">Cant.</span>
                                <span className="col-span-6">Producto</span>
                                <span className="col-span-4 text-right">Subtotal</span>
                              </div>

                              <div className="divide-y divide-[#3A506B]/40 max-h-[220px] overflow-y-auto overscroll-contain">
                                {venta.itemsConsolidados.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-[#3A506B] italic">No hay productos en esta venta.</div>
                                ) : (
                                  venta.itemsConsolidados.map((item, itemIdx) => (
                                    <div key={itemIdx} className="grid grid-cols-12 p-2.5 items-center text-xs gap-1">
                                      <div className="col-span-2 text-center font-black text-[#5BC0DE] bg-[#0B132B] py-1 rounded border border-[#3A506B]">
                                        {item.cantidad}x
                                      </div>
                                      <div className="col-span-6 text-[#F4D6B0] font-semibold pr-2 min-w-0">
                                        <p className="break-words">{item.producto.nombre}</p>
                                        {item.notas && <p className="text-[10px] italic text-[#D97706] break-words">"{item.notas}"</p>}
                                      </div>
                                      <div className="col-span-4 text-right font-mono font-bold text-[#D97706]">
                                        ${(item.producto.precio * item.cantidad).toLocaleString('es-CO')}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {pasoModal === 'info' && (
                  <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 py-1 sm:py-2 w-full">
                    <div className="bg-[#0B132B] p-3 sm:p-4 rounded-xl border border-[#3A506B] flex items-center gap-3 text-xs text-[#5BC0DE]">
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <span className="min-w-0">Iniciando nueva venta. Atiende: <strong>{usuario?.nombre || 'Sin asignar'}</strong></span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F4D6B0] mb-1.5">Nombre del Cliente</label>
                      <input type="text" placeholder="Ej. Juan Pérez" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] font-bold px-3 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] outline-none text-xs h-[42px] transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F4D6B0] mb-1.5">
                          Hora Estimada <span className="text-[#5BC0DE] normal-case tracking-normal">(en {minutosEspera} min)</span>
                        </label>
                        <div className="flex items-center gap-1 bg-[#0B132B] p-0.5 rounded-xl border border-[#3A506B] h-[42px]">
                          <button
                            type="button"
                            onClick={() => ajustarMinutos(-PASO_MIN)}
                            disabled={horaObjetivo <= horaMinima}
                            aria-label="Restar 5 minutos"
                            className="w-9 h-full flex items-center justify-center bg-[#1C2541] rounded-lg text-[#5BC0DE] hover:bg-[#3A506B] disabled:opacity-30 transition-colors shrink-0"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1 flex items-center justify-center gap-1.5 font-black text-xs text-[#F4D6B0] whitespace-nowrap min-w-0">
                            <Clock className="w-3.5 h-3.5 text-[#5BC0DE] shrink-0" /> <span className="truncate">{horaEstimada}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => ajustarMinutos(PASO_MIN)}
                            disabled={horaObjetivo >= horaMaxima}
                            aria-label="Sumar 5 minutos"
                            className="w-9 h-full flex items-center justify-center bg-[#1C2541] rounded-lg text-[#5BC0DE] hover:bg-[#3A506B] disabled:opacity-30 transition-colors shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F4D6B0] mb-1.5">Personas</label>
                        <div className="flex items-center gap-1 bg-[#0B132B] p-0.5 rounded-xl border border-[#3A506B] h-[42px]">
                          <button onClick={() => setPersonas(p => Math.max(1, p - 1))} className="w-9 h-full flex items-center justify-center bg-[#1C2541] rounded-lg text-[#5BC0DE] hover:bg-[#3A506B] transition-colors shrink-0"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="flex-1 text-center font-black text-xs text-[#F4D6B0]">{personas}</span>
                          <button onClick={() => setPersonas(p => p + 1)} className="w-9 h-full flex items-center justify-center bg-[#1C2541] rounded-lg text-[#5BC0DE] hover:bg-[#3A506B] transition-colors shrink-0"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F4D6B0] mb-1.5">Notas de la Venta</label>
                      <textarea rows={2} placeholder="Alergias, observaciones..." value={notasMesa} onChange={(e) => setNotasMesa(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] font-bold p-3 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] outline-none text-xs transition-colors" />
                    </div>
                  </div>
                )}

                {pasoModal === 'menu' && (
                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-5 items-start w-full max-w-full overflow-x-hidden">
                    <div className="w-full lg:col-span-7 min-w-0">
                      <div className="sticky top-0 z-10 bg-[#1C2541] pb-3 space-y-3 w-full">
                        {ventaEnEdicion && (
                          <div className="bg-[#5BC0DE]/10 border border-[#5BC0DE]/30 px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-[#5BC0DE] font-bold w-full min-w-0">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span className="truncate">Agregando a: <strong>{ventaEnEdicion.cliente}</strong>.</span>
                          </div>
                        )}
                        <div className="relative w-full">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                          <input type="text" placeholder="Buscar producto..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] pl-10 pr-4 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] outline-none text-xs h-[42px] transition-colors" />
                        </div>

                        <div
                          ref={scrollRef}
                          onMouseDown={handleMouseDown}
                          onMouseLeave={handleMouseLeave}
                          onMouseUp={handleMouseUp}
                          onMouseMove={handleMouseMove}
                          className={`flex items-center gap-2 overflow-x-auto pb-1 select-none touch-pan-x w-full [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#3A506B] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        >
                          {CATEGORIAS.map((cat) => {
                            const enCat = cantidadPorCategoria[cat] || 0;
                            const activa = categoriaActiva === cat && !busquedaProducto;
                            return (
                              <button
                                key={cat}
                                onClick={() => {
                                  if (!isDragging) { setCategoriaActiva(cat); setBusquedaProducto(''); }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${activa ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-md' : 'bg-[#0B132B] text-[#F4D6B0] border-[#3A506B] hover:bg-[#3A506B]'}`}
                              >
                                {cat}
                                {enCat > 0 && (
                                  <span className={`min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ${activa ? 'bg-[#0B132B] text-[#5BC0DE]' : 'bg-[#D97706] text-white'}`}>{enCat}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#3A506B] bg-[#0B132B] divide-y divide-[#3A506B]/50 max-h-[min(28rem,38dvh)] lg:max-h-[min(40.5rem,60dvh)] overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                        {productosVisibles.length === 0 ? (
                          <div className="p-6 text-center text-xs text-[#5BC0DE] italic">No hay productos en esta búsqueda.</div>
                        ) : (
                          productosVisibles.map((producto) => {
                            const itemCarrito = carrito.find((i) => i.producto.id === producto.id);
                            const cant = itemCarrito?.cantidad ?? 0;
                            const nota = itemCarrito?.notas ?? '';
                            const abierta = notaAbiertaId === producto.id && cant > 0;

                            return (
                              <div key={producto.id} className={`p-3 transition-colors w-full min-w-0 ${cant > 0 ? 'bg-[#5BC0DE]/10' : ''}`}>
                                <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => tocarProducto(producto)}
                                    aria-expanded={abierta}
                                    aria-label={`Comentario para ${producto.nombre}`}
                                    className="min-w-0 flex-1 text-left"
                                  >
                                    <h4 className="font-bold text-[#F4D6B0] text-sm leading-tight break-words">{producto.nombre}</h4>
                                    {producto.descripcion && <p className="text-[11px] text-[#7B8FA8] line-clamp-1 mt-0.5">{producto.descripcion}</p>}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                      <span className="font-mono font-bold text-[11px] text-[#5BC0DE]">${producto.precio.toLocaleString('es-CO')}</span>
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${nota ? 'text-[#D97706]' : 'text-[#7B8FA8]'}`}>
                                        <MessageSquare className="w-3 h-3" />{nota ? 'Con comentario' : 'Comentario'}
                                      </span>
                                    </div>
                                  </button>

                                  <div className="flex items-center gap-0.5 bg-[#1C2541] p-1 rounded-xl border border-[#3A506B] shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => modificarCantidad(producto, -1)}
                                      disabled={cant === 0}
                                      aria-label={`Quitar uno de ${producto.nombre}`}
                                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-[#F4D6B0] hover:bg-[#3A506B] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      aria-label={`Cantidad de ${producto.nombre}`}
                                      value={cant}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => fijarCantidad(producto, parseInt(e.target.value.replace(/\D/g, ''), 10))}
                                      className={`w-7 sm:w-9 h-7 sm:h-8 text-center rounded-lg text-xs font-black bg-[#0B132B] border focus:outline-none focus:border-[#5BC0DE] ${cant > 0 ? 'text-[#5BC0DE] border-[#5BC0DE]/40' : 'text-[#F4D6B0] border-transparent'}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => modificarCantidad(producto, 1)}
                                      aria-label={`Agregar uno de ${producto.nombre}`}
                                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {nota && !abierta && (
                                  <p className="mt-1.5 text-[11px] italic font-semibold text-[#D97706] break-words">"{nota}"</p>
                                )}

                                {abierta && (
                                  <div className="mt-2 rounded-xl border border-[#3A506B] bg-[#1C2541] p-2.5 space-y-2 w-full">
                                    <div className="flex flex-wrap gap-1.5">
                                      {NOTAS_RAPIDAS.map((txt) => (
                                        <button
                                          key={txt}
                                          type="button"
                                          onClick={() => agregarNotaRapida(producto, txt)}
                                          className="px-2 py-1 rounded-lg text-[10px] font-bold border border-[#3A506B] text-[#F4D6B0] bg-[#0B132B] hover:border-[#5BC0DE] active:scale-95 transition-all"
                                        >
                                          {txt}
                                        </button>
                                      ))}
                                    </div>
                                    <textarea
                                      rows={2}
                                      maxLength={120}
                                      value={nota}
                                      onChange={(e) => fijarNota(producto, e.target.value)}
                                      placeholder="Ej. sin cebolla, término medio..."
                                      className="w-full bg-[#0B132B] text-[#F4D6B0] text-xs font-semibold p-2.5 rounded-lg border border-[#3A506B] focus:border-[#5BC0DE] outline-none resize-none transition-colors"
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                      {nota ? (
                                        <button type="button" onClick={() => fijarNota(producto, '')} className="text-[11px] font-bold text-rose-400 hover:text-rose-300">Borrar</button>
                                      ) : <span />}
                                      <button type="button" onClick={() => setNotaAbiertaId(null)} className="px-4 py-1.5 rounded-lg bg-[#5BC0DE] text-[#0B132B] text-[11px] font-bold hover:bg-[#4CA8C4]">Listo</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* CARRITO / TICKET */}
                    <div className="lg:hidden w-full bg-[#F4D6B0] text-[#0B132B] rounded-xl px-3 py-2 shadow-lg border border-[#D97706]/30 box-border">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ChefHat className="w-4 h-4 text-[#D97706] shrink-0" />
                          <span className="font-black text-[11px] uppercase tracking-tight truncate">
                            {ventaEnEdicion ? 'Nuevos' : 'Nueva Venta'}
                          </span>
                          <span className="text-[10px] text-[#0B132B]/60 truncate">· {nombreCliente || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {carrito.length > 0 && (
                            <span className="bg-[#0B132B] text-[#F4D6B0] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {carrito.reduce((s, i) => s + i.cantidad, 0)} ítem{carrito.reduce((s, i) => s + i.cantidad, 0) !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="font-black text-sm text-[#D97706] font-mono whitespace-nowrap">
                            ${totalCarrito.toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                      {carrito.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-[#0B132B]/15 flex flex-wrap gap-x-3 gap-y-0.5 max-h-14 overflow-hidden">
                          {carrito.map((item) => (
                            <span key={item.producto.id} className="text-[10px] font-semibold text-[#0B132B]/80 whitespace-nowrap">
                              {item.cantidad}× {item.producto.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:flex w-full lg:col-span-5 lg:sticky lg:top-0 bg-[#F4D6B0] text-[#0B132B] rounded-2xl p-5 flex-col justify-between shadow-xl border border-[#D97706]/30 box-border overflow-hidden">
                      <div className="space-y-3 w-full min-w-0">
                        <div className="border-b-2 border-dashed border-[#0B132B]/20 pb-3 w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <ChefHat className="w-5 h-5 text-[#D97706] shrink-0" />
                              <span className="font-black text-sm uppercase tracking-tight truncate">
                                {ventaEnEdicion ? 'Nuevos Productos' : 'Nueva Venta'}
                              </span>
                            </div>
                            <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded shrink-0">{horaEstimada}</span>
                          </div>
                          <div className="text-xs font-bold text-[#0B132B]/80 mt-1.5 break-words">Cliente: <span className="text-[#0B132B]">{nombreCliente || 'Cliente General'}</span></div>
                          <div className="text-xs font-bold text-[#0B132B]/80 mt-1 break-words">Atiende: <span className="text-[#0B132B]">{usuario?.nombre || 'Sin asignar'}</span></div>
                        </div>
                        {carrito.length === 0 ? (
                          <div className="text-center py-6 text-xs text-[#3A506B] italic"><ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#D97706]" />Selecciona ítems a agregar.</div>
                        ) : (
                          <div className="space-y-2 max-h-[min(22rem,38dvh)] overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y pr-1 w-full min-w-0 box-border [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                            {carrito.map((item) => (
                              <div key={item.producto.id} className="flex items-center justify-between text-xs font-bold border-b border-[#0B132B]/10 pb-1.5 gap-2 w-full min-w-0 box-border">
                                <div className="min-w-0 flex-1 pr-1 overflow-hidden">
                                  <div className="break-words font-extrabold text-[#0B132B] leading-tight">{item.producto.nombre}</div>
                                  <div className="text-[10px] text-[#3A506B] font-mono font-normal">${item.producto.precio.toLocaleString('es-CO')} c/u</div>
                                  {item.notas && <div className="text-[10px] italic font-semibold text-[#D97706] break-words">"{item.notas}"</div>}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                  <span className="bg-[#0B132B] text-[#F4D6B0] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">x{item.cantidad}</span>
                                  <span className="font-mono font-bold text-[#0B132B] whitespace-nowrap">${(item.producto.precio * item.cantidad).toLocaleString('es-CO')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="pt-3 border-t-2 border-dashed border-[#0B132B]/20 mt-3 w-full box-border">
                        <div className="flex items-center justify-between font-black text-base">
                          <span>Total a Enviar:</span>
                          <span className="text-[#D97706] font-mono whitespace-nowrap">${totalCarrito.toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del modal */}
              <div className="p-3 sm:p-5 pb-[max(0.70rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex flex-wrap items-center justify-between gap-2 shrink-0 w-full">
                <div className="shrink-0">
                  {pasoModal === 'lista' && <button onClick={cerrarModal} className="text-xs font-bold text-[#5BC0DE] hover:text-white transition-colors">Cerrar</button>}
                  {pasoModal !== 'lista' && <button onClick={() => mesaSeleccionada.ventasActuales.length > 0 ? setPasoModal('lista') : cerrarModal()} className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors"><ArrowLeft className="w-4 h-4" /> Volver</button>}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
                  {pasoModal === 'info' && (
                    <button onClick={() => setPasoModal('menu')} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] shadow-md transition-colors h-[42px]"><span>Ir al Menú</span><ArrowRight className="w-4 h-4" /></button>
                  )}
                  {pasoModal === 'menu' && (
                    <button onClick={guardarPedido} disabled={carrito.length === 0 || guardando} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold bg-[#D97706] text-white hover:bg-[#C26A05] disabled:opacity-40 shadow-md transition-colors h-[42px]">
                      <CheckCircle2 className="w-4 h-4" />
                      {guardando ? 'Enviando...' : ventaEnEdicion ? 'Enviar Comanda Adicional' : 'Confirmar Venta Inicial'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* MODAL DE IMPRESIÓN POR IMPRESORAS */}
      {modalImpresorasMesa && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center px-2 pt-2 pb-14 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h3 className="font-extrabold text-[#F4D6B0] text-sm sm:text-base flex items-center gap-2 truncate">
                  <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-[#5BC0DE] shrink-0" />
                  Comandas por Impresora • Mesa #{modalImpresorasMesa.numeroMesa}
                </h3>
                <p className="text-[11px] text-[#5BC0DE] truncate mt-0.5">
                  Sección: <span className="font-bold text-[#F4D6B0]">{modalImpresorasMesa.seccionNombre || 'General'}</span> • Cliente: {modalImpresorasMesa.cliente}
                </p>
              </div>
              <button
                onClick={() => setModalImpresorasMesa(null)}
                className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-4 bg-[#1C2541] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/60 [&::-webkit-scrollbar-thumb]:rounded-full">
              <p className="text-xs text-[#F4D6B0]/80 leading-relaxed">
                Cada impresora recibe únicamente los ítems correspondientes a sus <strong>categorías configuradas</strong> y verifica que atienda la sección <strong>{modalImpresorasMesa.seccionNombre}</strong>.
              </p>

              {modalImpresorasMesa.comandasTicket && modalImpresorasMesa.comandasTicket.length > 1 && (
                <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#5BC0DE]">
                    <span>Tanda a reimprimir:</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {rondaSeleccionadaId === 'todas'
                        ? 'Consolidado acumulado'
                        : rondaSeleccionadaId === 'ultima'
                        ? `Última adición (Tanda #${modalImpresorasMesa.comandasTicket.length})`
                        : `Tanda seleccionada`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRondaSeleccionadaId('ultima')}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        rondaSeleccionadaId === 'ultima'
                          ? 'bg-[#5BC0DE] text-[#0B132B] shadow-sm'
                          : 'bg-[#1C2541] text-[#F4D6B0] border border-[#3A506B] hover:border-[#5BC0DE]'
                      }`}
                    >
                      ⚡ Última adición (#{modalImpresorasMesa.comandasTicket.length})
                    </button>
                    {modalImpresorasMesa.comandasTicket.map((ticket, idx) => (
                      <button
                        key={ticket.id || idx}
                        type="button"
                        onClick={() => setRondaSeleccionadaId(ticket.comandaId || idx + 1)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          rondaSeleccionadaId === (ticket.comandaId || idx + 1)
                            ? 'bg-[#5BC0DE] text-[#0B132B] shadow-sm'
                            : 'bg-[#1C2541] text-[#F4D6B0] border border-[#3A506B] hover:border-[#5BC0DE]'
                        }`}
                      >
                        Tanda #{idx + 1} ({ticket.items.length})
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setRondaSeleccionadaId('todas')}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        rondaSeleccionadaId === 'todas'
                          ? 'bg-[#5BC0DE] text-[#0B132B] shadow-sm'
                          : 'bg-[#1C2541] text-[#F4D6B0] border border-[#3A506B] hover:border-[#5BC0DE]'
                      }`}
                    >
                      📋 Consolidado Total ({modalImpresorasMesa.itemsConsolidados?.length || 0})
                    </button>
                  </div>
                </div>
              )}

              {impresorasConfig.filter(i => i.activa).length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5BC0DE]/70 bg-[#0B132B] rounded-xl border border-[#3A506B]/50 space-y-1">
                  <Printer className="w-6 h-6 mx-auto text-[#3A506B]" />
                  <p>No hay impresoras activas configuradas.</p>
                  <p className="text-[10px]">Ve a Configuración &gt; Impresoras para registrar tus impresoras de cocina y barra.</p>
                </div>
              ) : (
                (() => {
                  let itemsParaModal: ItemPedido[] = [];
                  if (!modalImpresorasMesa.comandasTicket || modalImpresorasMesa.comandasTicket.length <= 1) {
                    itemsParaModal = modalImpresorasMesa.itemsConsolidados || [];
                  } else if (rondaSeleccionadaId === 'todas') {
                    itemsParaModal = modalImpresorasMesa.itemsConsolidados || [];
                  } else if (rondaSeleccionadaId === 'ultima') {
                    const ultTicket = modalImpresorasMesa.comandasTicket[modalImpresorasMesa.comandasTicket.length - 1];
                    itemsParaModal = ultTicket ? ultTicket.items : (modalImpresorasMesa.itemsConsolidados || []);
                  } else {
                    const ticketEncontrado = modalImpresorasMesa.comandasTicket.find(
                      (t, idx) => (t.comandaId || idx + 1) === rondaSeleccionadaId
                    );
                    itemsParaModal = ticketEncontrado ? ticketEncontrado.items : (modalImpresorasMesa.itemsConsolidados || []);
                  }

                  return impresorasConfig.filter(i => i.activa).map(imp => {
                    const atiendeSeccion = !imp.seccionesIds || imp.seccionesIds.length === 0 ||
                      (modalImpresorasMesa.idSeccion && imp.seccionesIds.includes(modalImpresorasMesa.idSeccion));

                    const itemsFiltrados = itemsParaModal.filter(it => {
                      if (!imp.categoriasIds || imp.categoriasIds.length === 0) return true;
                      return it.producto.idCategoria ? imp.categoriasIds.includes(it.producto.idCategoria) : true;
                    });

                    return (
                      <div
                        key={imp.id}
                        className={`p-3 rounded-xl border transition-all ${
                          atiendeSeccion
                            ? 'bg-[#0B132B] border-[#3A506B] hover:border-[#5BC0DE]'
                            : 'bg-[#0B132B]/40 border-[#3A506B]/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Printer size={15} className={atiendeSeccion ? 'text-[#5BC0DE]' : 'text-gray-500'} />
                              <h4 className="text-xs font-bold text-[#F4D6B0] truncate">{imp.nombre}</h4>
                              <span className="text-[9px] bg-[#3A506B]/40 text-[#5BC0DE] px-1.5 py-0.5 rounded font-mono">
                                {imp.tipo}
                              </span>
                            </div>
                            {!atiendeSeccion ? (
                              <p className="text-[10px] text-[#E57373] mt-0.5 font-medium">
                                No atiende la sección "{modalImpresorasMesa.seccionNombre}"
                              </p>
                            ) : (
                              <p className="text-[10px] text-[#4ADE80] mt-0.5 font-medium">
                                {itemsFiltrados.length} producto(s) asignados a esta impresora
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={!atiendeSeccion || itemsFiltrados.length === 0}
                            onClick={() => imprimirComandaParaImpresora(modalImpresorasMesa, imp, itemsFiltrados)}
                            className="px-3 py-1.5 bg-[#5BC0DE] hover:bg-[#4CA8C4] disabled:opacity-30 disabled:hover:bg-[#5BC0DE] text-[#0B132B] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                          >
                            <Printer size={13} /> Imprimir
                          </button>
                        </div>

                        {itemsFiltrados.length > 0 && atiendeSeccion && (
                          <div className="bg-[#1C2541] rounded-lg p-2.5 border border-[#3A506B]/40 space-y-1.5">
                            {itemsFiltrados.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-[#F4D6B0] gap-2">
                                <span className="truncate">{it.cantidad}x {it.producto.nombre}</span>
                                <span className="text-[#5BC0DE] font-semibold shrink-0">${(it.producto.precio * it.cantidad).toLocaleString('es-CO')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>

            <div className="p-3 sm:p-5 pb-[max(0.70rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setModalImpresorasMesa(null)}
                className="px-5 py-2.5 bg-[#3A506B] text-[#F4D6B0] text-xs font-bold rounded-xl hover:bg-[#3A506B]/80 transition-colors h-[42px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLANTILLA DE IMPRESIÓN FÍSICA ESC/POS (80mm) */}
      {ticketAImprimir && (
        <FormatoTicketTermico
          tipo={ticketAImprimir.tipo}
          negocio={negocioConfig}
          facturacion={facturacionConfig}
          titulo={ticketAImprimir.tipo === 'precuenta' ? 'PRE-CUENTA / DETALLE DE CONSUMO' : 'COMANDA DE DESPACHO'}
          mesa={ticketAImprimir.venta.numeroMesa}
          seccion={ticketAImprimir.venta.seccionNombre}
          cliente={ticketAImprimir.venta.cliente}
          mesero={ticketAImprimir.venta.meseroPrincipal}
          nombreImpresora={ticketAImprimir.impresoraNombre}
          items={ticketAImprimir.itemsFiltrados.map(it => ({
            nombre: it.producto.nombre,
            cantidad: it.cantidad,
            precioUnitario: it.producto.precio,
            subtotal: it.producto.precio * it.cantidad,
            nota: it.notas,
          }))}
          subtotal={ticketAImprimir.totalTicket}
          total={ticketAImprimir.totalTicket}
          mensajePie="¡Gracias por su visita!"
        />
      )}
    </>
  );
}