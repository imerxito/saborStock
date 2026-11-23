import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Receipt,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  CreditCard,
  DollarSign,
  QrCode,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter,
  Clock,
  Layers,
  Calendar,
  UserCheck,
  Eye,
  Search,
  X,
  RotateCw,
  Printer,
  Settings,
  Edit2,
  Store,
  Power
} from 'lucide-react';
import FormatoTicketTermico from '../../componentes/FormatoTicketTermico';
import { useCaja } from './hooks/useCaja';

export interface TicketCaja {
  titulo: string;
  cliente: string;
  mesa?: string;
  seccion?: string;
  items: { nombre: string; cantidad: number; precio: number; nota?: string }[];
  subtotal: number;
  descuento?: number;
  propina?: number;
  total: number;
  metodoPago: string;
  fecha: string;
  mensajePie?: string;
}

export interface EmpleadoNomina {
  idUsuario: number;
  nombre: string;
  cedula: string;
  telefono: string;
  cargo: string;
}

export interface EventoHistorialMesa {
  id: number;
  idMesa: number;
  mesa: string;
  seccion: string;
  idVenta: number | null;
  idUsuario: number;
  usuario: string;
  estado: string;
  monto: number | null;
  motivo: string;
  fecha: string;
}

export default function Caja(): React.ReactElement {
  const {
    // Auth
    usuario,
    // Turno
    turnoActual,
    turnoAbierto,
    verificandoTurno,
    bannerCerradoDescartado, setBannerCerradoDescartado,
    baseInicial, setBaseInicial,
    montoCierre, setMontoCierre,
    modalTurno, setModalTurno,
    cargando,
    // Ticket
    ticketAImprimir, setTicketAImprimir,
    negocioConfig,
    facturacionConfig,
    // Cobro
    cobrandoMesa,
    cobrandoVentaDirecta,
    // Movimientos
    movimientos,
    nuevoMovTipo, setNuevoMovTipo,
    nuevoMovConcepto, setNuevoMovConcepto,
    nuevoMovMonto, setNuevoMovMonto,
    // Nómina
    nominas,
    empleados,
    busquedaEmpleado, setBusquedaEmpleado,
    empleadoSeleccionado, setEmpleadoSeleccionado,
    mostrarSugerencias, setMostrarSugerencias,
    nomBase, setNomBase,
    nomBono, setNomBono,
    metodoPagoNomina, setMetodoPagoNomina,
    empleadosFiltrados,
    // Cajas
    cajas,
    cajaActivaId, setCajaActivaId,
    modalGestionCajas, setModalGestionCajas,
    nuevaCajaNombre, setNuevaCajaNombre,
    cajaEditandoId, setCajaEditandoId,
    cajaEditandoNombre, setCajaEditandoNombre,
    guardandoCaja,
    // Tabs
    activeTab, setActiveTab,
    // Historial
    historialMesas,
    eventosMesas,
    busquedaHistorial, setBusquedaHistorial,
    filtroTipoHistorial, setFiltroTipoHistorial,
    filtroSeccionHistorial, setFiltroSeccionHistorial,
    vistaHistorial, setVistaHistorial,
    cargandoHistorial,
    mesaDetalleModal, setMesaDetalleModal,
    // Venta Directa
    categoriaSeleccionada, setCategoriaSeleccionada,
    busquedaProductoVenta, setBusquedaProductoVenta,
    carrito, setCarrito,
    nombreCliente, setNombreCliente,
    lastAddedId,
    modalCobroVenta, setModalCobroVenta,
    metodoPagoVenta, setMetodoPagoVenta,
    montoRecibidoVenta, setMontoRecibidoVenta,
    montoEfectivoVenta, setMontoEfectivoVenta,
    montoDigitalVenta, setMontoDigitalVenta,
    // Cobrar Mesa
    busquedaMesa, setBusquedaMesa,
    filtroSeccion, setFiltroSeccion,
    mesaACobrar, setMesaACobrar,
    ventaSeleccionada, setVentaSeleccionada,
    metodoPago, setMetodoPago,
    montoEfectivo, setMontoEfectivo,
    montoDigital, setMontoDigital,
    propina, setPropina,
    descuento, setDescuento,
    montoRecibidoSimple, setMontoRecibidoSimple,
    // Derived
    totalesTurno,
    esDuenoOAdmin,
    categoriasDisponibles,
    productosFiltradosVenta,
    mesasActivas,
    seccionesHistorial,
    historialMesasFiltrado,
    eventosMesasFiltrados,
    totalRecaudadoHistorial,
    totalCarrito,
    cambioVenta,
    isPagoIncompletoVenta,
    mesasFiltradas,
    subtotalMesa,
    descuentoAplicado,
    totalCobroMesa,
    cambioCalculado,
    isPagoIncompletoMesa,
    // Handlers
    cambiarCajaActiva,
    crearCaja,
    guardarEdicionCaja,
    alternarEstadoCaja,
    eliminarCaja,
    agregarAlCarrito,
    actualizarCantidadItem,
    cobrarComandaRapida,
    abrirCobroMesa,
    cobrarVentaMesa,
    registrarMovimiento,
    abrirTurnoOperacional,
    cerrarTurnoOperacional,
    registrarNomina,
    eliminarPagoNomina,
    imprimirComprobanteNomina,
    recargarHistorial,
  } = useCaja();

  return (
    <div className="h-[100dvh] sm:h-full w-full flex flex-col bg-[#0B132B] text-[#F4D6B0] p-2.5 sm:p-3 font-sans overflow-hidden">
      
      <header className="flex flex-wrap justify-between items-center gap-2 mb-2.5 pb-1.5 border-b border-[#3A506B] shrink-0 min-h-8">
        <div className="flex items-center gap-2.5">
          <DollarSign className="text-[#5BC0DE]" size={15} />
          <h2 className="text-xs sm:text-sm font-bold text-[#F4D6B0] leading-none">
            Control de Caja y Turnos
          </h2>
          <span className="hidden md:inline text-[11px] text-[#5BC0DE] border-l border-[#3A506B] pl-2.5 leading-none">
            Gestión de facturación, comandeo rápido y flujo de efectivo.
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Caja Activa - Bloqueado si el turno está abierto */}
          <div className="flex items-center gap-1.5 bg-[#1C2541] px-2 py-0.5 rounded-lg border border-[#3A506B] h-7">
            {turnoAbierto ? (
              <Lock size={13} className="text-[#D97706] shrink-0" />
            ) : (
              <Store size={13} className="text-[#5BC0DE] shrink-0" />
            )}
            <select
              value={cajaActivaId}
              disabled={turnoAbierto}
              onChange={(e) => void cambiarCajaActiva(Number(e.target.value))}
              className="bg-transparent text-[#F4D6B0] text-[11px] font-bold focus:outline-none cursor-pointer pr-1 disabled:opacity-60 disabled:cursor-not-allowed"
              title={turnoAbierto ? "Cierra el turno para cambiar de caja" : "Cambiar Caja Activa"}
            >
              {cajas.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0B132B] text-[#F4D6B0]">
                  {c.nombre} {!c.activo ? '(Inactiva)' : ''}
                </option>
              ))}
            </select>
            {esDuenoOAdmin && (
              <button
                type="button"
                onClick={() => setModalGestionCajas(true)}
                title="Personalizar Cajas (Dueño / Admin)"
                className="p-1 hover:bg-[#3A506B] text-[#5BC0DE] hover:text-[#F4D6B0] rounded-md transition-all ml-0.5"
              >
                <Settings size={12} />
              </button>
            )}
          </div>

          {/* Indicador de Turno */}
          <div className="flex items-center gap-2 bg-[#1C2541] px-2 py-0.5 rounded-lg border border-[#3A506B] h-7">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                verificandoTurno
                  ? 'bg-[#5BC0DE]/50 animate-pulse'
                  : turnoAbierto
                    ? 'bg-[#5BC0DE] animate-pulse'
                    : 'bg-[#D97706]'
              }`} />
              <span className="text-[11px] font-semibold text-[#F4D6B0]">
                {verificandoTurno
                  ? (turnoAbierto ? 'Turno Abierto' : 'Verificando...')
                  : (turnoAbierto ? 'Turno Abierto' : 'Turno Cerrado')}
              </span>
            </div>
            <button
              onClick={() => {
                if (turnoAbierto) {
                  setMontoCierre(totalesTurno.efectivoEstimado);
                }
                setModalTurno(true);
              }}
              className={`flex items-center gap-1 px-2 py-0.2 rounded font-bold text-[10px] transition-all ${
                turnoAbierto
                  ? 'bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30 hover:bg-[#D97706]/25'
                  : 'bg-[#5BC0DE] text-[#0B132B] hover:bg-[#5BC0DE]/90 shadow-sm'
              }`}
            >
              {turnoAbierto ? <Lock size={10} /> : <Unlock size={10} />}
              {turnoAbierto ? 'Cerrar Turno' : 'Abrir Turno'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {!verificandoTurno && !turnoAbierto && !bannerCerradoDescartado && (
          <div className="bg-[#D97706]/15 border border-[#D97706]/40 p-2.5 sm:p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#F4D6B0] mb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-[#D97706] shrink-0" />
              <div>
                <p className="font-bold text-[#F4D6B0]">
                  {cajas.find(c => c.id === cajaActivaId)?.nombre || 'Caja'} actualmente sin turno abierto
                </p>
                <p className="text-[11px] text-[#5BC0DE]">
                  Puedes navegar por el menú, consultar historial de mesas y movimientos. Para procesar cobros, abre un turno.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setModalTurno(true)}
                className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 shadow-md"
              >
                <Unlock size={12} /> Abrir Turno de Caja
              </button>
              {esDuenoOAdmin && (
                <button
                  type="button"
                  onClick={() => setModalGestionCajas(true)}
                  className="px-2.5 py-1.5 bg-[#1C2541] hover:bg-[#3A506B] text-[#5BC0DE] border border-[#3A506B] rounded-xl font-bold transition-all text-xs flex items-center gap-1"
                >
                  <Settings size={12} /> Personalizar Cajas
                </button>
              )}
              <button
                type="button"
                onClick={() => setBannerCerradoDescartado(true)}
                title="Descartar aviso"
                className="p-1 hover:bg-[#D97706]/20 rounded-lg text-[#F4D6B0]/70 hover:text-white transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-b border-[#3A506B] mb-3 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          {[
            { id: 'ventas', label: 'Venta Directa', icon: ShoppingCart },
            { id: 'cobrar', label: 'Cobrar Mesas', icon: Receipt },
            { id: 'historialMesas', label: 'Historial Mesas', icon: Clock },
            { id: 'movimientos', label: 'Ingresos / Egresos', icon: ArrowUpRight },
            { id: 'nomina', label: 'Nómina & Bonos', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'border-[#5BC0DE] bg-[#1C2541] text-[#5BC0DE]'
                  : 'border-transparent text-[#5BC0DE]/70 hover:text-[#F4D6B0] hover:bg-[#1C2541]/50'
              }`}
            >
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-24 sm:pb-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/60 [&::-webkit-scrollbar-thumb]:rounded-full">

          {activeTab === 'ventas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:h-full">
              <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#5BC0DE]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0]">Menú Rápido</h3>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5BC0DE]" size={13} />
                    <input
                      type="text"
                      placeholder="Buscar producto o comida..."
                      value={busquedaProductoVenta}
                      onChange={(e) => setBusquedaProductoVenta(e.target.value)}
                      className="w-full bg-[#0B132B] border border-[#3A506B] pl-8 pr-7 py-1.5 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE] placeholder:text-[#5BC0DE]/40"
                    />
                    {busquedaProductoVenta && (
                      <button
                        type="button"
                        onClick={() => setBusquedaProductoVenta('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5BC0DE] hover:text-[#F4D6B0]"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Categorías estilo Mesas */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2.5 border-b border-[#3A506B] shrink-0 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#3A506B] touch-pan-x">
                  {categoriasDisponibles.map((cat) => {
                    const isActive = categoriaSeleccionada === cat && !busquedaProductoVenta;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategoriaSeleccionada(cat);
                          setBusquedaProductoVenta('');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-md'
                            : 'bg-[#0B132B] text-[#F4D6B0] border-[#3A506B] hover:bg-[#3A506B]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 max-h-[50vh] lg:max-h-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                  {productosFiltradosVenta.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-[#5BC0DE]/60 text-xs">
                      <Search size={24} className="mb-2 text-[#5BC0DE]/30" />
                      <p>No se encontraron productos coincidentes.</p>
                      {busquedaProductoVenta && (
                        <button
                          type="button"
                          onClick={() => setBusquedaProductoVenta('')}
                          className="mt-2 text-[11px] text-[#5BC0DE] underline hover:text-[#F4D6B0]"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {productosFiltradosVenta.map((prod) => (
                        <motion.button
                          key={prod.id}
                          onClick={() => agregarAlCarrito(prod)}
                          whileTap={{ scale: 0.95 }}
                          className={`bg-[#0B132B] border p-3 rounded-2xl text-left transition-colors flex flex-col justify-between group shadow-sm ${
                            lastAddedId === prod.id ? 'border-[#5BC0DE] bg-[#5BC0DE]/10' : 'border-[#3A506B] hover:border-[#5BC0DE]'
                          }`}
                        >
                          <div>
                            <span className="text-[9px] text-[#5BC0DE] font-bold uppercase tracking-wider">{prod.categoria}</span>
                            <span className="block font-medium text-[#F4D6B0] group-hover:text-white mt-1 text-xs leading-tight">{prod.nombre}</span>
                          </div>
                          <span className="text-[#5BC0DE] font-bold mt-2 text-xs sm:text-sm font-mono">${prod.precio.toLocaleString()}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0 shadow-sm">
                <div className="flex flex-col shrink-0 mb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2">Comanda Rápida</h3>
                  <input
                    type="text"
                    placeholder="Cliente / Para llevar"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-1.5 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE] transition-colors"
                  />
                </div>
                <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[100px] mb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                  {carrito.length === 0 ? (
                    <div className="text-center py-6">
                      <ShoppingCart className="mx-auto text-[#5BC0DE]/40 mb-2" size={28} />
                      <p className="text-[#5BC0DE] text-xs font-semibold">El carrito está vacío</p>
                      <span className="text-[10px] text-[#3A506B] block mt-1">Selecciona items para vender</span>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {carrito.map((item) => (
                        <motion.div
                          key={item.producto.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          layout
                          className="bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B] flex flex-col gap-1 overflow-hidden"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-medium text-[#F4D6B0] line-clamp-2">{item.producto.nombre}</span>
                            <span className="font-bold text-[#5BC0DE] text-xs whitespace-nowrap">${(item.producto.precio * item.cantidad).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-[#5BC0DE]">${item.producto.precio.toLocaleString()} c/u</span>
                            <div className="flex items-center gap-1 bg-[#1C2541] px-1.5 py-0.5 rounded-lg border border-[#3A506B]">
                              <button onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad - 1)} className="text-[#5BC0DE] hover:text-white p-1 rounded transition-colors"><Minus size={11} /></button>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarCantidadItem(item.producto.id, parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                                className="w-6 bg-transparent text-center text-xs text-[#F4D6B0] font-bold focus:outline-none"
                              />
                              <button onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad + 1)} className="text-[#5BC0DE] hover:text-white p-1 rounded transition-colors"><Plus size={11} /></button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
                <div className="shrink-0 pt-2 border-t border-[#3A506B]">
                  <div className="flex justify-between text-[#5BC0DE] text-[11px] mb-2 font-bold">
                    <span>Total a Pagar:</span>
                    <span className="text-[#F4D6B0] text-sm font-mono">${totalCarrito.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCarrito([])}
                      disabled={carrito.length === 0}
                      className="px-2.5 py-2 bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20 rounded-xl hover:bg-[#D97706]/20 disabled:opacity-40 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      disabled={!turnoAbierto || carrito.length === 0}
                      onClick={() => {
                        if (!turnoAbierto) {
                          alert('🔒 La caja está cerrada. Debes abrir un turno para operar.');
                          setModalTurno(true);
                          return;
                        }
                        setModalCobroVenta(true);
                      }}
                      className="flex-1 bg-[#5BC0DE] hover:bg-[#4CA8C4] disabled:opacity-40 text-[#0B132B] font-bold py-2 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      {!turnoAbierto ? <Lock size={12} /> : null}
                      {!turnoAbierto ? 'Abrir Turno' : 'Cobrar Comanda'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cobrar' && (
            <div className="flex flex-col gap-3 lg:h-full w-full">
              <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col w-full shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2.5 shrink-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] flex items-center gap-1.5">
                    <Filter size={15} className="text-[#5BC0DE]" /> Mesas Ocupadas
                  </h3>
                  <div className="flex gap-1 flex-wrap">
                    {['Todas', 'Piscina', 'Terraza', 'VIP'].map(sec => (
                      <button
                        key={sec}
                        onClick={() => setFiltroSeccion(sec)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          filtroSeccion === sec ? 'bg-[#5BC0DE] text-[#0B132B]' : 'bg-[#0B132B] text-[#5BC0DE] border border-[#3A506B] hover:border-[#5BC0DE]/50'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative mb-2.5 shrink-0">
                  <Search className="absolute left-3 top-2 text-[#5BC0DE]/60" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar mesa o mesero..."
                    value={busquedaMesa}
                    onChange={(e) => setBusquedaMesa(e.target.value)}
                    className="w-full bg-[#0B132B] border border-[#3A506B] pl-8 pr-3 py-1.5 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 flex-1 overflow-y-auto pr-1 max-h-[60vh] lg:max-h-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                  {mesasFiltradas.length === 0 ? (
                    <p className="text-[#5BC0DE] text-xs col-span-full text-center py-10">No hay mesas ocupadas activas.</p>
                  ) : (
                    mesasFiltradas.map((m) => {
                      const totalMesa = m.ventas.reduce((acc, v) => acc + v.total, 0);
                      return (
                        <div
                          key={m.id}
                          onClick={() => abrirCobroMesa(m)}
                          className="cursor-pointer p-3 rounded-2xl border bg-[#0B132B] border-[#3A506B] hover:border-[#5BC0DE] transition-all flex flex-col justify-between shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-1.5 gap-1">
                            <div className="min-w-0 pr-1">
                              <span className="font-bold text-[#F4D6B0] text-sm truncate block">{m.nombre}</span>
                              <span className="block text-[10px] text-[#5BC0DE] truncate">{m.seccion} • {(m.mesero || 'Mesero').split(' ')[0]}</span>
                            </div>
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[#D97706]/15 text-[#D97706] text-[10px] font-bold border border-[#D97706]/30">{m.ventas.length} Ventas</span>
                          </div>

                          <div className="my-1.5 space-y-1 max-h-16 overflow-y-auto scrollbar-none bg-[#1C2541]/70 p-2 rounded-xl border border-[#3A506B]/50 text-[10px]">
                            {m.ventas.flatMap(v => v.items).slice(0, 3).map((it, idx) => (
                              <div key={idx} className="flex justify-between text-[#5BC0DE] truncate">
                                <span className="truncate">{it.cantidad}x {it.nombre}</span>
                                <span className="text-[#F4D6B0] ml-1 shrink-0 font-mono">${(it.precio * it.cantidad).toLocaleString()}</span>
                              </div>
                            ))}
                            {m.ventas.flatMap(v => v.items).length > 3 && (
                              <span className="text-[9px] text-[#5BC0DE]/60 italic block text-center">
                                +{m.ventas.flatMap(v => v.items).length - 3} ítems más...
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-1 pt-2 border-t border-[#3A506B] text-[11px]">
                            <span className="text-[#5BC0DE] font-semibold">Total:</span>
                            <span className="font-bold text-[#D97706] text-sm font-mono">${totalMesa.toLocaleString()}</span>
                          </div>
                          <button
                            disabled={!turnoAbierto}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!turnoAbierto) {
                                alert('🔒 La caja está cerrada. Debes abrir un turno para cobrar mesas.');
                                setModalTurno(true);
                                return;
                              }
                              abrirCobroMesa(m);
                            }}
                            className="w-full mt-2 py-1.5 bg-[#5BC0DE]/10 text-[#5BC0DE] border border-[#5BC0DE]/30 rounded-xl text-[11px] font-bold hover:bg-[#5BC0DE]/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {!turnoAbierto ? <Lock size={12} /> : null}
                            {!turnoAbierto ? 'Abrir Turno' : 'Gestionar Cobro'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historialMesas' && (
            <div className="bg-[#1C2541] p-3 sm:p-4 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-[#3A506B] shrink-0">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] flex items-center gap-1.5">
                    <Clock className="text-[#5BC0DE]" size={16} /> Historial de Mesas
                  </h3>
                  <p className="text-[11px] text-[#5BC0DE]">
                    Registro de cobros facturados y auditoría.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-[#0B132B] p-0.5 rounded-xl border border-[#3A506B]">
                    <button
                      type="button"
                      onClick={() => setVistaHistorial('cuentas')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        vistaHistorial === 'cuentas'
                          ? 'bg-[#5BC0DE] text-[#0B132B] shadow-sm'
                          : 'text-[#5BC0DE]/70 hover:text-[#F4D6B0]'
                      }`}
                    >
                      <Receipt size={13} /> Cuentas ({historialMesasFiltrado.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaHistorial('eventos')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        vistaHistorial === 'eventos'
                          ? 'bg-[#5BC0DE] text-[#0B132B] shadow-sm'
                          : 'text-[#5BC0DE]/70 hover:text-[#F4D6B0]'
                      }`}
                    >
                      <RotateCw size={13} /> Auditoría ({eventosMesasFiltrados.length})
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={cargandoHistorial}
                    onClick={() => void recargarHistorial()}
                    title="Refrescar historial de mesas"
                    className="px-2.5 py-1.5 bg-[#0B132B] hover:bg-[#3A506B] text-[#5BC0DE] border border-[#3A506B] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCw size={13} className={cargandoHistorial ? 'animate-spin text-[#5BC0DE]' : ''} />
                    <span className="hidden sm:inline">Refrescar</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3 shrink-0">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <div className="relative flex-1 min-w-[190px] sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5BC0DE]" size={13} />
                    <input
                      type="text"
                      placeholder={vistaHistorial === 'cuentas' ? "Buscar mesa, cliente, mesero..." : "Buscar mesa, estado, motivo..."}
                      value={busquedaHistorial}
                      onChange={(e) => setBusquedaHistorial(e.target.value)}
                      className="w-full bg-[#0B132B] border border-[#3A506B] pl-8 pr-7 py-1.5 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE] placeholder:text-[#5BC0DE]/40"
                    />
                    {busquedaHistorial && (
                      <button
                        type="button"
                        onClick={() => setBusquedaHistorial('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5BC0DE] hover:text-[#F4D6B0]"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {seccionesHistorial.length > 2 && (
                    <select
                      value={filtroSeccionHistorial}
                      onChange={(e) => setFiltroSeccionHistorial(e.target.value)}
                      className="bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                    >
                      {seccionesHistorial.map(s => (
                        <option key={s} value={s}>{s === 'Todas' ? 'Todas las secciones' : s}</option>
                      ))}
                    </select>
                  )}

                  {vistaHistorial === 'cuentas' && (
                    <div className="flex gap-1 overflow-x-auto scrollbar-none">
                      {(['todos', 'mesas', 'directa'] as const).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFiltroTipoHistorial(f)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                            filtroTipoHistorial === f
                              ? 'bg-[#5BC0DE]/20 text-[#5BC0DE] border border-[#5BC0DE]'
                              : 'bg-[#0B132B] text-[#5BC0DE]/60 border border-[#3A506B] hover:text-[#F4D6B0]'
                          }`}
                        >
                          {f === 'todos' ? 'Todos' : f === 'mesas' ? 'Mesas' : 'Venta Directa'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {vistaHistorial === 'cuentas' && (
                    <div className="bg-[#0B132B] px-3 py-1.5 rounded-xl border border-[#3A506B] text-[11px] flex items-center gap-1.5 shadow-sm">
                      <span className="text-[#5BC0DE]">Recaudado:</span>
                      <span className="font-bold text-emerald-400 font-mono">${totalRecaudadoHistorial.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="bg-[#0B132B] px-3 py-1.5 rounded-xl border border-[#3A506B] text-[11px] text-[#5BC0DE] shadow-sm">
                    <span>Registros: <strong className="text-[#F4D6B0]">{vistaHistorial === 'cuentas' ? historialMesasFiltrado.length : eventosMesasFiltrados.length}</strong></span>
                  </div>
                </div>
              </div>

              {vistaHistorial === 'cuentas' && (
                <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#3A506B] rounded-xl bg-[#0B132B] min-h-0 max-h-[65vh] lg:max-h-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead className="sticky top-0 bg-[#1C2541] border-b border-[#3A506B] text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider z-10 shadow-sm">
                      <tr>
                        <th className="py-2.5 px-3">Mesa / Origen</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Productos</th>
                        <th className="py-2.5 px-3">Atendido Por</th>
                        <th className="py-2.5 px-3">Fecha y Hora</th>
                        <th className="py-2.5 px-3">Método Pago</th>
                        <th className="py-2.5 px-3 text-right">Total Cobrado</th>
                        <th className="py-2.5 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A506B]/60 text-xs text-[#F4D6B0]">
                      {historialMesasFiltrado.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-[#5BC0DE]/60 text-xs">
                            <Receipt size={24} className="mx-auto mb-2 text-[#5BC0DE]/30" />
                            <p>No se encontraron cuentas con los filtros aplicados.</p>
                            {(busquedaHistorial || filtroTipoHistorial !== 'todos' || filtroSeccionHistorial !== 'Todas') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBusquedaHistorial('');
                                  setFiltroTipoHistorial('todos');
                                  setFiltroSeccionHistorial('Todas');
                                }}
                                className="mt-2 text-[11px] text-[#5BC0DE] underline hover:text-[#F4D6B0]"
                              >
                                Restablecer filtros
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        historialMesasFiltrado.map((hm) => (
                          <tr key={hm.id} className="hover:bg-[#1C2541]/60 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-white">
                              <div className="flex items-center gap-1.5">
                                <span>{hm.mesa}</span>
                                {hm.seccion && (
                                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-[#3A506B]/50 text-[#5BC0DE]">
                                    {hm.seccion}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[#5BC0DE]">{hm.cliente}</td>
                            <td className="py-2.5 px-3 max-w-[280px]">
                              {hm.items && hm.items.length > 0 ? (
                                <div className="flex flex-wrap gap-1 items-center">
                                  {hm.items.slice(0, 3).map((it, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0B132B] border border-[#3A506B] text-[10px] text-[#F4D6B0]"
                                      title={`${it.cantidad}x ${it.nombre} - $${(it.precio * it.cantidad).toLocaleString()}`}
                                    >
                                      <strong className="text-[#5BC0DE] font-bold">{it.cantidad}x</strong>
                                      <span className="truncate max-w-[110px]">{it.nombre}</span>
                                    </span>
                                  ))}
                                  {hm.items.length > 3 && (
                                    <button
                                      type="button"
                                      onClick={() => setMesaDetalleModal(hm)}
                                      className="text-[10px] text-[#5BC0DE] font-bold hover:text-white px-1.5 py-0.5 rounded bg-[#3A506B]/50 hover:bg-[#3A506B] transition-all"
                                    >
                                      +{hm.items.length - 3} más
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-[#5BC0DE]/50 italic">Sin detalle individual</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[#F4D6B0]">{hm.mesero}</td>
                            <td className="py-2.5 px-3 text-[#5BC0DE] text-[11px] whitespace-nowrap">{hm.fechaCierre}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[#1C2541] border border-[#3A506B] text-[10px] font-semibold text-[#F4D6B0]">
                                {hm.metodoPago}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#5BC0DE] text-sm font-mono">
                              ${hm.monto.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setMesaDetalleModal(hm)}
                                  title="Ver detalle del pedido"
                                  className="p-1.5 bg-[#3A506B] hover:bg-[#5BC0DE] hover:text-[#0B132B] text-[#5BC0DE] rounded-lg transition-all"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTicketAImprimir({
                                      titulo: `Comprobante de Pago - ${hm.mesa}`,
                                      cliente: hm.cliente,
                                      mesa: hm.mesa,
                                      seccion: hm.seccion,
                                      items: hm.items.map(it => ({ nombre: it.nombre, cantidad: it.cantidad, precio: it.precio })),
                                      subtotal: hm.monto,
                                      total: hm.monto,
                                      metodoPago: hm.metodoPago,
                                      fecha: hm.fechaCierre || new Date().toLocaleDateString('es-CO'),
                                    });
                                  }}
                                  title="Reimprimir ticket"
                                  className="p-1.5 bg-[#3A506B] hover:bg-[#5BC0DE] hover:text-[#0B132B] text-[#5BC0DE] rounded-lg transition-all"
                                >
                                  <Printer size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {vistaHistorial === 'eventos' && (
                <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#3A506B] rounded-xl bg-[#0B132B] min-h-0 max-h-[65vh] lg:max-h-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead className="sticky top-0 bg-[#1C2541] border-b border-[#3A506B] text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider z-10 shadow-sm">
                      <tr>
                        <th className="py-2.5 px-3">Mesa / Sección</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">Motivo / Acción</th>
                        <th className="py-2.5 px-3">Usuario</th>
                        <th className="py-2.5 px-3 text-right">Monto</th>
                        <th className="py-2.5 px-3">Fecha y Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A506B]/60 text-xs text-[#F4D6B0]">
                      {eventosMesasFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-[#5BC0DE]/60 text-xs">
                            <RotateCw size={24} className="mx-auto mb-2 text-[#5BC0DE]/30" />
                            <p>No se encontraron eventos con los filtros aplicados.</p>
                            {busquedaHistorial && (
                              <button
                                type="button"
                                onClick={() => setBusquedaHistorial('')}
                                className="mt-2 text-[11px] text-[#5BC0DE] underline hover:text-[#F4D6B0]"
                              >
                                Limpiar búsqueda
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        eventosMesasFiltrados.map((ev) => {
                          const estLower = ev.estado.toLowerCase();
                          const badgeColor =
                            estLower.includes('libre') || estLower.includes('disponible')
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : estLower.includes('ocupad')
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : estLower.includes('pagan')
                              ? 'bg-[#5BC0DE]/15 text-[#5BC0DE] border-[#5BC0DE]/30'
                              : 'bg-purple-500/15 text-purple-400 border-purple-500/30';

                          return (
                            <tr key={ev.id} className="hover:bg-[#1C2541]/60 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-white">
                                <div className="flex items-center gap-1.5">
                                  <span>{ev.mesa}</span>
                                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-[#3A506B]/50 text-[#5BC0DE]">
                                    {ev.seccion}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeColor}`}>
                                  {ev.estado}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[#F4D6B0]">{ev.motivo}</td>
                              <td className="py-2.5 px-3 text-[#5BC0DE]">{ev.usuario}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-[#5BC0DE] font-mono">
                                {ev.monto != null ? `$${ev.monto.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-[#5BC0DE] text-[11px] whitespace-nowrap">{ev.fecha}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'movimientos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:h-full">
              <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] h-fit shadow-sm">
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5">Registrar Movimiento</h3>
                <form onSubmit={registrarMovimiento} className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[#5BC0DE] mb-1 block text-[11px] font-semibold">Tipo</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNuevoMovTipo('ingreso')}
                        className={`flex-1 py-1.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-1 ${
                          nuevoMovTipo === 'ingreso' ? 'bg-[#5BC0DE]/20 border-[#5BC0DE] text-[#5BC0DE]' : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE]/60'
                        }`}
                      >
                        <ArrowDownLeft size={14} /> Ingreso
                      </button>
                      <button
                        type="button"
                        onClick={() => setNuevoMovTipo('egreso')}
                        className={`flex-1 py-1.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-1 ${
                          nuevoMovTipo === 'egreso' ? 'bg-[#D97706]/20 border-[#D97706] text-[#D97706]' : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE]/60'
                        }`}
                      >
                        <ArrowUpRight size={14} /> Egreso
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[#5BC0DE] mb-1 block text-[11px] font-semibold">Concepto / Motivo</label>
                    <input
                      type="text"
                      placeholder="Ej: Error del mesero en comanda"
                      value={nuevoMovConcepto}
                      onChange={(e) => setNuevoMovConcepto(e.target.value)}
                      className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-2 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                    />
                  </div>
                  <div>
                    <label className="text-[#5BC0DE] mb-1 block text-[11px] font-semibold">Monto ($)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={nuevoMovMonto}
                      onChange={(e) => setNuevoMovMonto(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-2 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!turnoAbierto}
                    className="w-full bg-[#5BC0DE] hover:bg-[#4CA8C4] disabled:opacity-40 text-[#0B132B] font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    {!turnoAbierto ? <Lock size={13} /> : null}
                    {!turnoAbierto ? 'Turno Cerrado' : 'Guardar Movimiento'}
                  </button>
                </form>
              </div>
              <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0 shadow-sm">
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5">Flujo de Caja (Turno Actual)</h3>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[55vh] lg:max-h-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                  {movimientos.length === 0 ? (
                    <p className="text-center text-xs text-[#5BC0DE]/50 py-6">No hay movimientos registrados en este turno.</p>
                  ) : (
                    movimientos.map((m) => (
                      <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-[#0B132B] border border-[#3A506B] text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-xl ${m.tipo === 'ingreso' ? 'bg-[#5BC0DE]/15 text-[#5BC0DE]' : 'bg-[#D97706]/15 text-[#D97706]'}`}>
                            {m.tipo === 'ingreso' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                          </div>
                          <div>
                            <p className="font-semibold text-[#F4D6B0] text-xs">{m.concepto}</p>
                            <p className="text-[10px] text-[#5BC0DE]">{m.hora}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${m.tipo === 'ingreso' ? 'text-[#5BC0DE]' : 'text-[#D97706]'}`}>
                          {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nomina' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:h-full lg:min-h-0">
              <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full overflow-y-auto max-h-[80vh] lg:max-h-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 shadow-sm">
                <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5 shrink-0">Pago de Personal</h3>
                <form onSubmit={registrarNomina} className="space-y-2.5 text-xs flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="relative">
                      <label className="text-[#5BC0DE] mb-1 block text-[11px] font-semibold">Buscar Empleado</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-[#5BC0DE]" size={14} />
                        <input
                          type="text"
                          placeholder="Nombre, C.C o cargo..."
                          value={busquedaEmpleado}
                          onChange={(e) => {
                            setBusquedaEmpleado(e.target.value);
                            setMostrarSugerencias(true);
                          }}
                          onFocus={() => setMostrarSugerencias(true)}
                          className="w-full bg-[#0B132B] border border-[#3A506B] pl-8 pr-3 py-2 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                        />
                      </div>
                      {mostrarSugerencias && busquedaEmpleado.trim() !== '' && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0B132B] border border-[#3A506B] rounded-xl shadow-2xl z-20 max-h-36 overflow-y-auto">
                          {empleadosFiltrados.length === 0 ? (
                            <div className="p-2 text-[11px] text-[#5BC0DE] text-center">No se encontraron empleados</div>
                          ) : (
                            empleadosFiltrados.map(emp => (
                              <div
                                key={emp.idUsuario}
                                onClick={() => {
                                  setEmpleadoSeleccionado(emp);
                                  setBusquedaEmpleado(emp.nombre);
                                  setMostrarSugerencias(false);
                                }}
                                className="p-2 hover:bg-[#3A506B]/50 cursor-pointer border-b border-[#3A506B] last:border-0 transition-colors"
                              >
                                <p className="text-xs font-bold text-[#F4D6B0]">{emp.nombre}</p>
                                <p className="text-[10px] text-[#5BC0DE]">C.C: {emp.cedula} • {emp.cargo}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {empleadoSeleccionado ? (
                      <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] space-y-1 text-[#F4D6B0]">
                        <p className="flex items-center gap-1 font-bold text-[#5BC0DE] text-xs">
                          <UserCheck size={13} /> {empleadoSeleccionado.nombre}
                        </p>
                        <p className="text-[11px] text-[#5BC0DE]">Cédula: <span className="text-[#F4D6B0]">{empleadoSeleccionado.cedula}</span></p>
                        <p className="text-[11px] text-[#5BC0DE]">Cargo: <span className="text-[#F4D6B0]">{empleadoSeleccionado.cargo}</span></p>
                      </div>
                    ) : (
                      <div className="bg-[#0B132B]/60 p-3 rounded-xl border border-dashed border-[#3A506B] text-center text-[#5BC0DE]/60 text-[11px]">
                        Selecciona un empleado de la lista
                      </div>
                    )}

                    <div>
                      <label className="text-[#5BC0DE] mb-1 block text-[11px] font-semibold">Sueldo Base ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={nomBase}
                        onChange={(e) => setNomBase(Number(e.target.value.replace(/\D/g, '')) || 0)}
                        className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-2 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                      />
                    </div>

                    <div>
                      <label className="text-[#5BC0DE] mb-1 block text-[11px] font-semibold">Bono / Incentivo ($)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={nomBono || ''}
                        onChange={(e) => setNomBono(Number(e.target.value.replace(/\D/g, '')) || 0)}
                        className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-2 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                      />
                    </div>

                    <div>
                      <label className="text-[#5BC0DE] mb-1 block text-[11px] font-semibold">Método de Pago</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['Efectivo', 'Transferencia', 'Tarjeta', 'Daviplata'].map((met) => (
                          <button
                            key={met}
                            type="button"
                            onClick={() => setMetodoPagoNomina(met)}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition border ${
                              metodoPagoNomina === met
                                ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] font-bold'
                                : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                            }`}
                          >
                            {met}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 shrink-0">
                    <div className="p-2.5 bg-[#5BC0DE]/15 border border-[#5BC0DE]/30 rounded-xl flex justify-between items-center font-bold text-[#5BC0DE] text-xs">
                      <span>Total Pago:</span>
                      <span className="font-mono">${(Number(nomBase) + Number(nomBono)).toLocaleString()}</span>
                    </div>
                    <button
                      type="submit"
                      disabled={!turnoAbierto || !empleadoSeleccionado}
                      className="w-full bg-[#5BC0DE] hover:bg-[#4CA8C4] disabled:opacity-40 text-[#0B132B] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      {!turnoAbierto ? <Lock size={14} /> : <Plus size={15} />}
                      {!turnoAbierto ? 'Turno Cerrado' : 'Registrar Pago'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0 shadow-sm">
                <div className="flex justify-between items-center mb-2.5 shrink-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0]">Pagos Registrados</h3>
                  <span className="text-[11px] text-[#5BC0DE] font-bold bg-[#0B132B] px-2.5 py-1 rounded-lg border border-[#3A506B]">{nominas.length} registros</span>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[55vh] lg:max-h-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                  {nominas.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#5BC0DE]/70">
                      No hay pagos de nómina registrados.
                    </div>
                  ) : (
                    nominas.map((n) => (
                      <div key={n.id} className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 p-3 rounded-xl bg-[#0B132B] border border-[#3A506B] text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-[#5BC0DE]/15 text-[#5BC0DE] shrink-0">
                            <Users size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#F4D6B0] text-xs truncate">
                              {n.empleado} <span className="text-[10px] text-[#5BC0DE] font-normal">({n.cedula})</span>
                            </p>
                            <p className="text-[10px] text-[#5BC0DE] truncate">
                              {n.cargo} • Base: ${n.montoBase.toLocaleString()} + Bono: ${n.bono.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-[#5BC0DE]/60 mt-0.5">
                              {n.fecha} • {n.metodo}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                          <span className="font-bold text-[#5BC0DE] text-sm font-mono">
                            ${n.montoTotal.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => imprimirComprobanteNomina(n)}
                            className="p-1.5 rounded-lg border border-[#5BC0DE]/40 bg-[#5BC0DE]/10 hover:bg-[#5BC0DE]/20 text-[#5BC0DE] transition"
                            title="Imprimir comprobante"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarPagoNomina(n.id)}
                            className="p-1.5 rounded-lg border border-[#E57373]/40 bg-[#E57373]/10 hover:bg-[#E57373]/20 text-[#E57373] transition"
                            title="Eliminar registro"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE COBRO PARA VENTA DIRECTA - Estilo Mesas */}
      {modalCobroVenta && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
              <div>
                <h3 className="font-extrabold text-[#F4D6B0] text-sm sm:text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#5BC0DE]" /> Cobrar Comanda
                </h3>
                <p className="text-[11px] text-[#5BC0DE] mt-0.5">Cliente: {nombreCliente.trim() || 'General'}</p>
              </div>
              <button onClick={() => setModalCobroVenta(false)} className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 flex-1 min-h-0 space-y-4">
              <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                <div className="flex justify-between text-[#5BC0DE] text-sm font-bold">
                  <span>Total a Pagar:</span>
                  <span className="text-[#5BC0DE] font-mono">${totalCarrito.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#5BC0DE] mb-1.5 block font-bold uppercase tracking-wider">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                    { id: 'transferencia', label: 'Transferencia', icon: QrCode },
                    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                    { id: 'mixto', label: 'Pago Mixto', icon: Receipt },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMetodoPagoVenta(m.id as any);
                        setMontoRecibidoVenta(0);
                        setMontoEfectivoVenta(0);
                        setMontoDigitalVenta(0);
                      }}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        metodoPagoVenta === m.id
                          ? 'bg-[#5BC0DE]/15 border-[#5BC0DE] text-[#5BC0DE]'
                          : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE]/70 hover:text-[#F4D6B0]'
                      }`}
                    >
                      <m.icon size={14} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {(metodoPagoVenta === 'efectivo' || metodoPagoVenta === 'transferencia') && (
                <div className="space-y-2 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                  <div>
                    <label className="text-[11px] text-[#5BC0DE] block mb-1 font-bold">Monto Recibido ($)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="$0"
                      value={montoRecibidoVenta || ''}
                      onChange={(e) => setMontoRecibidoVenta(Number(e.target.value.replace(/\D/g, '')) || 0)}
                      className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-lg text-[#F4D6B0] text-sm font-bold focus:outline-none focus:border-[#5BC0DE]"
                    />
                    <div className="flex gap-1.5 mt-2">
                      <button type="button" onClick={() => setMontoRecibidoVenta(totalCarrito)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors">Exacto</button>
                      {[20000, 50000, 100000].map(billete => (
                        <button key={billete} type="button" onClick={() => setMontoRecibidoVenta(billete)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors">${billete / 1000}k</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(metodoPagoVenta === 'efectivo' || metodoPagoVenta === 'transferencia' || metodoPagoVenta === 'mixto') && (
                <div className="flex justify-between items-center px-1 text-xs">
                  <span className="text-[#5BC0DE] font-bold">
                    {(metodoPagoVenta === 'mixto' ? (montoEfectivoVenta + montoDigitalVenta) : montoRecibidoVenta) >= totalCarrito ? 'Vuelto (Cambio):' : 'Falta por pagar:'}
                  </span>
                  <span className={`font-bold text-sm font-mono ${((metodoPagoVenta === 'mixto' ? (montoEfectivoVenta + montoDigitalVenta) : montoRecibidoVenta) >= totalCarrito) ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${Math.abs(((metodoPagoVenta === 'mixto' ? (montoEfectivoVenta + montoDigitalVenta) : montoRecibidoVenta)) - totalCarrito).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-5 pb-[max(0.70rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex gap-2 shrink-0">
              <button disabled={cobrandoVentaDirecta} onClick={() => setModalCobroVenta(false)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 disabled:opacity-40 text-[#F4D6B0] font-bold py-2.5 rounded-xl text-xs transition-all h-[42px]">
                Cancelar
              </button>
              <button disabled={isPagoIncompletoVenta || cobrandoVentaDirecta} onClick={cobrarComandaRapida} className="flex-1 bg-[#5BC0DE] hover:bg-[#4CA8C4] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B132B] font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 h-[42px]">
                {cobrandoVentaDirecta ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#0B132B] border-t-transparent rounded-full animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} /> Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COBRO PARA MESAS - Estilo Mesas */}
      {mesaACobrar && ventaSeleccionada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h3 className="font-extrabold text-[#F4D6B0] text-sm sm:text-base flex items-center gap-2 truncate">
                  <Receipt className="w-4 h-4 text-[#5BC0DE] shrink-0" /> Cobrar {mesaACobrar.nombre}
                </h3>
                <p className="text-[11px] text-[#5BC0DE] mt-0.5 truncate">Sección: {mesaACobrar.seccion}</p>
              </div>
              <button onClick={() => setMesaACobrar(null)} className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 flex-1 min-h-0 space-y-4">
              
              <div className="flex overflow-x-auto gap-1 pb-2 touch-pan-x border-b border-[#3A506B] [&::-webkit-scrollbar]:hidden">
                {mesaACobrar.ventas.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVentaSeleccionada(v);
                      setMontoRecibidoSimple(0);
                      setPropina(0);
                      setDescuento(0);
                      setMontoEfectivo(0);
                      setMontoDigital(0);
                    }}
                    className={`px-3 py-1.5 rounded-t-lg text-[11px] font-bold whitespace-nowrap shrink-0 border-b-2 transition-all ${
                      ventaSeleccionada.id === v.id
                        ? 'bg-[#5BC0DE]/10 border-[#5BC0DE] text-[#5BC0DE]'
                        : 'bg-[#0B132B] border-transparent text-[#F4D6B0] hover:bg-[#3A506B]/50'
                    }`}
                  >
                    Venta {idx + 1} ({v.cliente})
                  </button>
                ))}
              </div>

              <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                <div className="flex justify-between text-[#F4D6B0] font-bold text-xs mb-1">
                  <span>Cliente:</span>
                  <span>{ventaSeleccionada.cliente}</span>
                </div>
                <div className="max-h-24 overflow-y-auto pr-1 space-y-1 my-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#3A506B]">
                  {ventaSeleccionada.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-[#5BC0DE]">
                      <span>{it.cantidad}x {it.nombre}</span>
                      <span className="text-[#F4D6B0] font-mono">${(it.precio * it.cantidad).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#3A506B]/50">
                  <span className="text-[#5BC0DE]">Subtotal:</span>
                  <span className="text-[#5BC0DE] font-mono">${subtotalMesa.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#5BC0DE] mb-1.5 block font-bold uppercase tracking-wider">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                    { id: 'transferencia', label: 'Transferencia', icon: QrCode },
                    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                    { id: 'mixto', label: 'Pago Mixto', icon: Receipt },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMetodoPago(m.id as any);
                        setMontoRecibidoSimple(0);
                        setPropina(0);
                        setDescuento(0);
                        setMontoEfectivo(0);
                        setMontoDigital(0);
                      }}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        metodoPago === m.id
                          ? 'bg-[#5BC0DE]/15 border-[#5BC0DE] text-[#5BC0DE]'
                          : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE]/70 hover:text-[#F4D6B0]'
                      }`}
                    >
                      <m.icon size={14} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                <div>
                  <label className="text-[11px] text-[#5BC0DE] block mb-1 font-bold">Descuento ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="$0"
                    value={descuento || ''}
                    onChange={(e) => {
                      const raw = Number(e.target.value.replace(/\D/g, '')) || 0;
                      setDescuento(Math.min(raw, subtotalMesa));
                    }}
                    className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-lg text-[#F4D6B0] text-sm font-bold focus:outline-none focus:border-[#5BC0DE]"
                  />
                  <div className="flex gap-1.5 mt-2">
                    <button type="button" onClick={() => setDescuento(0)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors">Sin descuento</button>
                    {[5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDescuento(Math.round(subtotalMesa * (pct / 100)))}
                        className={`flex-1 py-1.5 border rounded-md text-[10px] font-bold transition-colors ${
                          descuento === Math.round(subtotalMesa * (pct / 100)) && descuento > 0
                            ? 'bg-[#D97706]/20 border-[#D97706] text-[#D97706]'
                            : 'bg-[#1C2541] border-[#3A506B] text-[#5BC0DE] hover:bg-[#3A506B]'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  {descuentoAplicado > 0 && (
                    <p className="text-[10px] text-[#D97706] mt-1.5 font-bold">Descuento aplicado: -${descuentoAplicado.toLocaleString()}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#3A506B]/50">
                  <label className="text-[11px] text-[#5BC0DE] block mb-1 font-bold">Propina ($) — opcional</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="$0"
                    value={propina || ''}
                    onChange={(e) => setPropina(Number(e.target.value.replace(/\D/g, '')) || 0)}
                    className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-lg text-[#F4D6B0] text-sm font-bold focus:outline-none focus:border-[#5BC0DE]"
                  />
                </div>

                <div className="pt-2 border-t border-[#3A506B]/50 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-[#5BC0DE]">
                    <span>Subtotal:</span>
                    <span className="text-[#F4D6B0] font-mono">${subtotalMesa.toLocaleString()}</span>
                  </div>
                  {descuentoAplicado > 0 && (
                    <div className="flex justify-between text-[11px] text-[#D97706]">
                      <span>Descuento:</span>
                      <span className="font-mono">-${descuentoAplicado.toLocaleString()}</span>
                    </div>
                  )}
                  {propina > 0 && (
                    <div className="flex justify-between text-[11px] text-[#5BC0DE]">
                      <span>Propina:</span>
                      <span className="font-mono">+${Number(propina).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#3A506B]/50">
                    <span className="text-[#5BC0DE]">Total a Pagar:</span>
                    <span className="text-[#5BC0DE] font-mono">${totalCobroMesa.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {(metodoPago === 'efectivo' || metodoPago === 'transferencia') && (
                <div className="space-y-2 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                  <div>
                    <label className="text-[11px] text-[#5BC0DE] block mb-1 font-bold">Monto Recibido ($)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="$0"
                      value={montoRecibidoSimple || ''}
                      onChange={(e) => setMontoRecibidoSimple(Number(e.target.value.replace(/\D/g, '')) || 0)}
                      className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-lg text-[#F4D6B0] text-sm font-bold focus:outline-none focus:border-[#5BC0DE]"
                    />
                    <div className="flex gap-1.5 mt-2">
                      <button type="button" onClick={() => setMontoRecibidoSimple(totalCobroMesa)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors">Exacto</button>
                      {[20000, 50000, 100000].map(billete => (
                        <button key={billete} type="button" onClick={() => setMontoRecibidoSimple(billete)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors">${billete / 1000}k</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {metodoPago === 'mixto' && (
                <div className="space-y-3 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                  <div>
                    <label className="text-[11px] text-[#5BC0DE] block mb-1 font-bold">Efectivo ($)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="$0"
                      value={montoEfectivo || ''}
                      onChange={(e) => setMontoEfectivo(Number(e.target.value.replace(/\D/g, '')) || 0)}
                      className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-lg text-[#F4D6B0] text-sm font-bold focus:outline-none focus:border-[#5BC0DE]"
                    />
                    <div className="flex gap-1.5 mt-2">
                      <button type="button" onClick={() => setMontoEfectivo(Math.max(0, totalCobroMesa - montoDigital))} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors">Resto</button>
                      {[20000, 50000, 100000].map(billete => (
                        <button key={billete} type="button" onClick={() => setMontoEfectivo(billete)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors">${billete / 1000}k</button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#3A506B]/50">
                    <label className="text-[11px] text-[#5BC0DE] block mb-1 font-bold">Digital/Tarjeta ($)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="$0"
                      value={montoDigital || ''}
                      onChange={(e) => setMontoDigital(Number(e.target.value.replace(/\D/g, '')) || 0)}
                      className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-lg text-[#F4D6B0] text-sm font-bold focus:outline-none focus:border-[#5BC0DE]"
                    />
                  </div>
                </div>
              )}

              {(metodoPago === 'efectivo' || metodoPago === 'transferencia' || metodoPago === 'mixto') && (
                <div className="flex justify-between items-center px-1 text-xs">
                  <span className="text-[#5BC0DE] font-bold">
                    {(metodoPago === 'mixto' ? (montoEfectivo + montoDigital) : montoRecibidoSimple) >= totalCobroMesa ? 'Vuelto (Cambio):' : 'Falta por pagar:'}
                  </span>
                  <span className={`font-bold text-sm font-mono ${((metodoPago === 'mixto' ? (montoEfectivo + montoDigital) : montoRecibidoSimple) >= totalCobroMesa) ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${Math.abs(((metodoPago === 'mixto' ? (montoEfectivo + montoDigital) : montoRecibidoSimple)) - totalCobroMesa).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-5 pb-[max(0.70rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex gap-2 shrink-0">
              <button disabled={cobrandoMesa} onClick={() => setMesaACobrar(null)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 disabled:opacity-40 text-[#F4D6B0] font-bold py-2.5 rounded-xl text-xs transition-all h-[42px]">
                Cancelar
              </button>
              <button disabled={isPagoIncompletoMesa || cobrandoMesa} onClick={cobrarVentaMesa} className="flex-1 bg-[#5BC0DE] hover:bg-[#4CA8C4] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B132B] font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 h-[42px]">
                {cobrandoMesa ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#0B132B] border-t-transparent rounded-full animate-spin" />
                    <span>Cobrando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} /> Cobrar Venta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {mesaDetalleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl sm:rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h3 className="font-extrabold text-[#F4D6B0] text-sm sm:text-base flex items-center gap-2 truncate">
                  <Receipt size={16} className="text-[#5BC0DE] shrink-0" /> {mesaDetalleModal.mesa}
                </h3>
                {mesaDetalleModal.seccion && (
                  <p className="text-[10px] text-[#5BC0DE] mt-0.5 truncate">{mesaDetalleModal.seccion}</p>
                )}
              </div>
              <button onClick={() => setMesaDetalleModal(null)} className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 flex-1 min-h-0 space-y-4">
              <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5BC0DE]">Cliente:</span>
                  <span className="font-bold text-[#F4D6B0]">{mesaDetalleModal.cliente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BC0DE]">Atendido por:</span>
                  <span className="text-[#F4D6B0]">{mesaDetalleModal.mesero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BC0DE]">Fecha y hora:</span>
                  <span className="text-[#F4D6B0]">{mesaDetalleModal.fechaCierre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BC0DE]">Método de pago:</span>
                  <span className="text-emerald-400 font-bold">{mesaDetalleModal.metodoPago}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#5BC0DE] font-bold uppercase tracking-wider block mb-1.5">
                  Productos ({mesaDetalleModal.items.length})
                </span>
                <div className="space-y-1.5 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#3A506B]">
                  {mesaDetalleModal.items.length === 0 ? (
                    <p className="text-center py-2 text-[#5BC0DE]/50 text-xs">Sin detalle de productos</p>
                  ) : (
                    mesaDetalleModal.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[#F4D6B0] pb-1.5 border-b border-[#3A506B]/40 last:border-0 text-[11px] gap-2">
                        <div className="min-w-0">
                          <span className="text-white font-bold">{it.cantidad}x </span>
                          <span className="truncate">{it.nombre}</span>
                        </div>
                        <span className="font-semibold text-[#5BC0DE] font-mono shrink-0">${(it.precio * it.cantidad).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-sm bg-[#0B132B] px-3 py-2.5 rounded-xl border border-[#3A506B]">
                <span className="text-[#F4D6B0]">Total Pagado:</span>
                <span className="text-emerald-400 font-mono">${mesaDetalleModal.monto.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 sm:p-5 pb-[max(0.70rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex gap-2 shrink-0">
              <button
                onClick={() => {
                  setTicketAImprimir({
                    titulo: `Comprobante de Pago - ${mesaDetalleModal.mesa}`,
                    cliente: mesaDetalleModal.cliente,
                    mesa: mesaDetalleModal.mesa,
                    seccion: mesaDetalleModal.seccion,
                    items: mesaDetalleModal.items.map(it => ({ nombre: it.nombre, cantidad: it.cantidad, precio: it.precio })),
                    subtotal: mesaDetalleModal.monto,
                    total: mesaDetalleModal.monto,
                    metodoPago: mesaDetalleModal.metodoPago,
                    fecha: mesaDetalleModal.fechaCierre || new Date().toLocaleDateString('es-CO'),
                  });
                }}
                className="flex-1 bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-md h-[42px]"
              >
                <Printer size={14} /> Reimprimir
              </button>
              <button onClick={() => setMesaDetalleModal(null)} className="px-4 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] py-2.5 rounded-xl font-bold transition-all text-xs h-[42px]">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalTurno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl sm:rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
              <h3 className="font-extrabold text-[#F4D6B0] text-sm sm:text-base flex items-center gap-2">
                {turnoAbierto ? <Lock size={16} className="text-[#D97706]" /> : <Unlock size={16} className="text-[#5BC0DE]" />}
                {turnoAbierto ? 'Cerrar Turno' : 'Abrir Turno'}
              </h3>
              <button onClick={() => setModalTurno(false)} className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 flex-1 min-h-0 space-y-4">
              <p className="text-[#5BC0DE] mb-2 text-[11px]">
                {turnoAbierto
                  ? 'Al cerrar el turno, los ingresos acumulados quedarán registrados para el arqueo final. Ingresa el monto en caja al cierre:'
                  : 'Ingresa el monto de base para aperturar la caja.'}
              </p>
              {turnoAbierto ? (
                <div className="space-y-3">
                  <div className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 text-[11px] space-y-1.5">
                    <div className="flex justify-between text-[#5BC0DE]">
                      <span>Base inicial:</span>
                      <span className="font-semibold text-[#F4D6B0] font-mono">${totalesTurno.baseInicial.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#5BC0DE]">
                      <span>Ventas en efectivo:</span>
                      <span className="font-semibold text-[#5BC0DE] font-mono">+${totalesTurno.ventasEfectivo.toLocaleString()}</span>
                    </div>
                    {totalesTurno.ventasOtros > 0 && (
                      <div className="flex justify-between text-[#5BC0DE]/70 text-[10px]">
                        <span>Ventas tarjeta/transf:</span>
                        <span className="font-mono">${totalesTurno.ventasOtros.toLocaleString()}</span>
                      </div>
                    )}
                    {totalesTurno.egresos > 0 && (
                      <div className="flex justify-between text-[#D97706]">
                        <span>Egresos registrados:</span>
                        <span className="font-semibold font-mono">-${totalesTurno.egresos.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-[#3A506B] pt-1.5 text-xs font-bold text-[#F4D6B0]">
                      <span>Efectivo esperado:</span>
                      <span className="text-[#5BC0DE] font-mono">${totalesTurno.efectivoEstimado.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[#5BC0DE] text-[11px] font-bold">Efectivo contado físico ($)</label>
                      <span className={`text-[10px] font-bold ${
                        montoCierre - totalesTurno.efectivoEstimado === 0
                          ? 'text-emerald-400'
                          : montoCierre - totalesTurno.efectivoEstimado > 0
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {montoCierre - totalesTurno.efectivoEstimado === 0
                          ? 'Cuadrado exacto'
                          : `Dif: ${(montoCierre - totalesTurno.efectivoEstimado > 0 ? '+' : '')}$${(montoCierre - totalesTurno.efectivoEstimado).toLocaleString()}`}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={montoCierre}
                      onChange={(e) => setMontoCierre(Number(e.target.value.replace(/\D/g, '')) || 0)}
                      className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-2 rounded-xl text-[#F4D6B0] text-sm font-bold focus:outline-none focus:border-[#5BC0DE]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[#5BC0DE] text-[11px] font-bold flex items-center gap-1">
                        <Store size={13} /> 1. Selecciona la Caja:
                      </label>
                      {esDuenoOAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalTurno(false);
                            setModalGestionCajas(true);
                          }}
                          className="text-[10px] text-[#5BC0DE] hover:text-[#F4D6B0] flex items-center gap-1 underline font-medium transition-colors"
                        >
                          <Settings size={11} /> Personalizar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#3A506B]">
                      {cajas.filter(c => c.activo).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCajaActivaId(c.id);
                            try { localStorage.setItem('sabor_caja_id', String(c.id)); } catch {}
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            cajaActivaId === c.id
                              ? 'bg-[#5BC0DE]/20 border-[#5BC0DE] text-white shadow-sm'
                              : 'bg-[#0B132B] border-[#3A506B] text-[#F4D6B0] hover:border-[#5BC0DE]/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Store size={14} className={cajaActivaId === c.id ? 'text-[#5BC0DE]' : 'text-[#5BC0DE]/50'} />
                            <span className="font-bold text-xs">{c.nombre}</span>
                          </div>
                          {cajaActivaId === c.id && (
                            <span className="text-[10px] font-bold text-[#5BC0DE] bg-[#5BC0DE]/20 px-1.5 py-0.5 rounded border border-[#5BC0DE]/40">
                              Elegida
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[#5BC0DE] block mb-1.5 text-[11px] font-bold">
                      2. Monto Base Inicial ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={baseInicial}
                      onChange={(e) => setBaseInicial(Number(e.target.value.replace(/\D/g, '')) || 0)}
                      className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-2 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-[#5BC0DE]"
                    />
                    <div className="flex gap-1.5 mt-2">
                      {[50000, 100000, 150000, 200000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBaseInicial(val)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            baseInicial === val
                              ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE]'
                              : 'bg-[#0B132B] text-[#5BC0DE]/70 border-[#3A506B] hover:text-[#F4D6B0]'
                          }`}
                        >
                          ${val.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-5 pb-[max(0.70rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex gap-2 shrink-0">
              <button onClick={() => setModalTurno(false)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] py-2.5 rounded-xl font-bold text-xs transition-colors h-[42px]">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (turnoAbierto) {
                    void cerrarTurnoOperacional(montoCierre);
                  } else {
                    void abrirTurnoOperacional(baseInicial, cajaActivaId);
                  }
                }}
                className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition-all shadow-md h-[42px] ${
                  turnoAbierto ? 'bg-[#D97706] hover:bg-[#B45309] text-white' : 'bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B]'
                }`}
              >
                {turnoAbierto ? 'Cerrar Turno' : `Abrir Caja`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZAR CAJAS */}
      {modalGestionCajas && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-[#5BC0DE]" />
                <div>
                  <h3 className="font-extrabold text-[#F4D6B0] text-sm sm:text-base">Personalizar Cajas</h3>
                  <p className="text-[11px] text-[#5BC0DE] mt-0.5">Configuración para Dueño / Admin.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setModalGestionCajas(false);
                  setCajaEditandoId(null);
                  setCajaEditandoNombre('');
                }}
                className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 flex-1 min-h-0 space-y-4">
              <form onSubmit={crearCaja} className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                <label className="text-[11px] text-[#5BC0DE] font-bold block mb-1.5">Nueva Caja / Punto de Cobro:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: Caja Barra, Caja Terraza..."
                    value={nuevaCajaNombre}
                    onChange={(e) => setNuevaCajaNombre(e.target.value)}
                    className="flex-1 bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-xl text-white text-xs focus:outline-none focus:border-[#5BC0DE] placeholder:text-[#5BC0DE]/40"
                  />
                  <button
                    type="submit"
                    disabled={guardandoCaja || !nuevaCajaNombre.trim()}
                    className="px-3 py-2 bg-[#5BC0DE] hover:bg-[#4CA8C4] disabled:opacity-40 text-[#0B132B] font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <Plus size={14} /> Crear
                  </button>
                </div>
              </form>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider">
                    Cajas Registradas ({cajas.length})
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#3A506B]">
                  {cajas.map((c) => {
                    const estaEditando = cajaEditandoId === c.id;
                    const esCajaActual = cajaActivaId === c.id;

                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          esCajaActual
                            ? 'bg-[#0B132B] border-[#5BC0DE]'
                            : 'bg-[#0B132B]/80 border-[#3A506B]'
                        }`}
                      >
                        {estaEditando ? (
                          <div className="flex items-center gap-2 flex-1 w-full">
                            <input
                              type="text"
                              value={cajaEditandoNombre}
                              onChange={(e) => setCajaEditandoNombre(e.target.value)}
                              className="flex-1 bg-[#1C2541] border border-[#5BC0DE] px-2.5 py-1.5 rounded-lg text-white text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => void guardarEdicionCaja(c.id)}
                              disabled={guardandoCaja || !cajaEditandoNombre.trim()}
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCajaEditandoId(null);
                                setCajaEditandoNombre('');
                              }}
                              className="px-2.5 py-1.5 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] rounded-lg text-xs transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl ${c.activo ? 'bg-[#5BC0DE]/15 text-[#5BC0DE]' : 'bg-gray-500/15 text-gray-400'}`}>
                                <Store size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#F4D6B0] text-xs sm:text-sm">{c.nombre}</span>
                                  {esCajaActual && (
                                    <span className="text-[9px] bg-[#5BC0DE]/20 text-[#5BC0DE] border border-[#5BC0DE]/40 px-1.5 py-0.5 rounded font-semibold">
                                      En Uso
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#5BC0DE]/70 mt-0.5">
                                  <span>ID: #{c.id}</span>
                                  <span>•</span>
                                  <span className={c.activo ? 'text-emerald-400' : 'text-gray-400'}>
                                    {c.activo ? 'Activa' : 'Inactiva'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setCajaEditandoId(c.id);
                                  setCajaEditandoNombre(c.nombre);
                                }}
                                title="Editar nombre"
                                className="p-1.5 bg-[#1C2541] hover:bg-[#3A506B] text-[#5BC0DE] rounded-lg transition-all"
                              >
                                <Edit2 size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => void alternarEstadoCaja(c)}
                                title={c.activo ? "Desactivar caja" : "Activar caja"}
                                className={`p-1.5 rounded-lg transition-all ${
                                  c.activo
                                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30'
                                    : 'bg-gray-500/15 text-gray-400 hover:bg-gray-500/30'
                                }`}
                              >
                                <Power size={13} />
                              </button>

                              {cajas.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => void eliminarCaja(c)}
                                  title="Eliminar caja"
                                  className="p-1.5 bg-rose-500/15 text-rose-400 hover:bg-rose-500/30 rounded-lg transition-all"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-5 pb-[max(0.70rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setModalGestionCajas(false);
                  setCajaEditandoId(null);
                  setCajaEditandoNombre('');
                }}
                className="px-5 py-2.5 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] font-bold rounded-xl text-xs transition-all h-[42px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET DE IMPRESIÓN */}
      {ticketAImprimir && (
        <FormatoTicketTermico
          tipo="factura"
          negocio={negocioConfig}
          facturacion={facturacionConfig}
          titulo={ticketAImprimir.titulo || 'FACTURA DE VENTA'}
          mesa={ticketAImprimir.mesa}
          seccion={ticketAImprimir.seccion}
          cliente={ticketAImprimir.cliente}
          fechaHora={ticketAImprimir.fecha}
          metodoPago={ticketAImprimir.metodoPago}
          items={ticketAImprimir.items.map(it => ({
            nombre: it.nombre,
            cantidad: it.cantidad,
            precioUnitario: it.precio,
            subtotal: it.precio * it.cantidad,
          }))}
          subtotal={ticketAImprimir.subtotal}
          descuento={ticketAImprimir.descuento}
          propina={ticketAImprimir.propina}
          total={ticketAImprimir.total}
          mensajePie="¡GRACIAS POR SU COMPRA!"
        />
      )}

    </div>
  );
}