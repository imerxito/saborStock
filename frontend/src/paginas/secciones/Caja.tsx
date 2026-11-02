import React, { useState, useMemo } from 'react';
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
  X
} from 'lucide-react';

// --- Tipos de Datos ---
type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

interface ItemPedido {
  producto: Producto;
  cantidad: number;
}

interface Movimiento {
  id: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: number;
  hora: string;
}

interface PagoNomina {
  id: string;
  empleado: string;
  cedula: string;
  telefono: string;
  cargo: string;
  montoBase: number;
  bono: number;
  montoTotal: number;
  metodo: string;
  fecha: string;
}

interface HistorialMesaItem {
  id: string;
  mesa: string;
  seccion: string;
  monto: number;
  mesero: string;
  metodoPago: string;
  estado: 'Pagada' | 'Cancelada' | 'En proceso';
  fechaApertura: string;
  fechaCierre: string;
  items: { nombre: string; cantidad: number; precio: number }[];
}

interface MesaActiva {
  id: string;
  nombre: string;
  seccion: string;
  total: number;
  mesero: string;
  items: { nombre: string; cantidad: number; precio: number }[];
}

// Datos Mock del Sistema
const CATEGORIAS: string[] = ['Todas', 'Comidas', 'Bebidas', 'Licores', 'Adicionales'];

const PRODUCTOS_MOCK: Producto[] = [
  { id: '1', nombre: 'Hamburguesa Especial', precio: 22000, categoria: 'Comidas' },
  { id: '2', nombre: 'Pizza Personal Peperoni', precio: 18000, categoria: 'Comidas' },
  { id: '3', nombre: 'Papas a la Francesa', precio: 8000, categoria: 'Comidas' },
  { id: '4', nombre: 'Cerveza Club Colombia', precio: 7000, categoria: 'Bebidas' },
  { id: '5', nombre: 'Limonada Cerezada', precio: 9000, categoria: 'Bebidas' },
  { id: '6', nombre: 'Aguardiente Antioqueño (Botella)', precio: 65000, categoria: 'Licores' },
  { id: '7', nombre: 'Ron Medellín 8 Años (Botella)', precio: 85000, categoria: 'Licores' },
  { id: '8', nombre: 'Salsa Extra BBQ', precio: 3000, categoria: 'Adicionales' },
  { id: '9', nombre: 'Tocineta Adicional', precio: 4500, categoria: 'Adicionales' },
];

const EMPLEADOS_MOCK = [
  { nombre: 'Carlos Gómez', cedula: '1065789123', telefono: '3001234567', cargo: 'Mesero' },
  { nombre: 'Ana María Pérez', cedula: '1065987456', telefono: '3109876543', cargo: 'Cajera' },
  { nombre: 'Luis Fernando Díaz', cedula: '1065412789', telefono: '3204567891', cargo: 'Chef Principal' },
  { nombre: 'Mariana López', cedula: '1098456123', telefono: '3157894561', cargo: 'Auxiliar de Cocina' },
];

const MESAS_INICIALES: MesaActiva[] = [
  { id: 'm3', nombre: 'Mesa 3', seccion: 'Piscina', total: 45000, mesero: 'Carlos Gómez', items: [{ nombre: 'Cerveza Club Colombia', cantidad: 1, precio: 7000 }, { nombre: 'Pizza Personal Peperoni', cantidad: 1, precio: 18000 }, { nombre: 'Hamburguesa Especial', cantidad: 1, precio: 20000 }] },
  { id: 'm5', nombre: 'Mesa 5', seccion: 'Terraza', total: 82000, mesero: 'Carlos Gómez', items: [{ nombre: 'Hamburguesa Especial', cantidad: 2, precio: 22000 }, { nombre: 'Limonada Cerezada', cantidad: 2, precio: 9000 }, { nombre: 'Papas a la Francesa', cantidad: 2, precio: 10000 }] },
  { id: 'm8', nombre: 'Mesa 8', seccion: 'VIP', total: 150000, mesero: 'Ana María Pérez', items: [{ nombre: 'Ron Medellín 8 Años (Botella)', cantidad: 1, precio: 85000 }, { nombre: 'Aguardiente Antioqueño (Botella)', cantidad: 1, precio: 65000 }] },
];

const HISTORIAL_MESAS_MOCK: HistorialMesaItem[] = [
  { id: 'HM-101', mesa: 'Mesa 1', seccion: 'Piscina', monto: 45000, mesero: 'Carlos Gómez', metodoPago: 'Efectivo', estado: 'Pagada', fechaApertura: '02/11/2026 - 01:30 PM', fechaCierre: '02/11/2026 - 02:40 PM', items: [{ nombre: 'Hamburguesa Especial', cantidad: 1, precio: 22000 }, { nombre: 'Limonada Cerezada', cantidad: 1, precio: 9000 }, { nombre: 'Papas a la Francesa', cantidad: 1, precio: 8000 }] },
  { id: 'HM-102', mesa: 'Mesa 4', seccion: 'Terraza', monto: 72000, mesero: 'Ana María Pérez', metodoPago: 'Transferencia', estado: 'Pagada', fechaApertura: '02/11/2026 - 02:15 PM', fechaCierre: '02/11/2026 - 03:10 PM', items: [{ nombre: 'Aguardiente Antioqueño (Botella)', cantidad: 1, precio: 65000 }, { nombre: 'Cerveza Club Colombia', cantidad: 1, precio: 7000 }] },
  { id: 'HM-103', mesa: 'Mesa 2', seccion: 'Piscina', monto: 18000, mesero: 'Carlos Gómez', metodoPago: 'N/A', estado: 'Cancelada', fechaApertura: '02/11/2026 - 03:00 PM', fechaCierre: '02/11/2026 - 03:15 PM', items: [{ nombre: 'Pizza Personal Peperoni', cantidad: 1, precio: 18000 }] },
  { id: 'HM-104', mesa: 'Mesa 6', seccion: 'VIP', monto: 125000, mesero: 'Luis Fernando Díaz', metodoPago: 'Tarjeta', estado: 'Pagada', fechaApertura: '02/11/2026 - 03:30 PM', fechaCierre: '02/11/2026 - 05:00 PM', items: [{ nombre: 'Hamburguesa Especial', cantidad: 3, precio: 22000 }, { nombre: 'Limonada Cerezada', cantidad: 3, precio: 9000 }, { nombre: 'Aguardiente Antioqueño (Botella)', cantidad: 1, precio: 32000 }] },
  { id: 'HM-105', mesa: 'Mesa 7', seccion: 'Terraza', monto: 35000, mesero: 'Carlos Gómez', metodoPago: 'Mixto', estado: 'Pagada', fechaApertura: '02/11/2026 - 04:10 PM', fechaCierre: '02/11/2026 - 05:20 PM', items: [{ nombre: 'Pizza Personal Peperoni', cantidad: 1, precio: 18000 }, { nombre: 'Cerveza Club Colombia', cantidad: 2, precio: 7000 }] },
];

export default function Caja(): React.ReactElement {
  const [turnoAbierto, setTurnoAbierto] = useState<boolean>(true);
  const [baseInicial, setBaseInicial] = useState<number>(150000);
  const [modalTurno, setModalTurno] = useState<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<'ventas' | 'cobrar' | 'historialMesas' | 'movimientos' | 'nomina'>('ventas');

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);
  const [nombreCliente, setNombreCliente] = useState<string>('');

  const [mesasActivas, setMesasActivas] = useState<MesaActiva[]>(MESAS_INICIALES);
  const [busquedaMesa, setBusquedaMesa] = useState<string>('');
  const [filtroSeccion, setFiltroSeccion] = useState<string>('Todas');
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState<string>('m3');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [montoEfectivo, setMontoEfectivo] = useState<number>(0);
  const [montoDigital, setMontoDigital] = useState<number>(0);

  const [historialMesas, setHistorialMesas] = useState<HistorialMesaItem[]>(HISTORIAL_MESAS_MOCK);
  const [mesaDetalleModal, setMesaDetalleModal] = useState<HistorialMesaItem | null>(null);

  const [movimientos, setMovimientos] = useState<Movimiento[]>([
    { id: '1', tipo: 'ingreso', concepto: 'Base inicial de caja', monto: 150000, hora: '08:00 AM' },
    { id: '2', tipo: 'egreso', concepto: 'Compra de hielo de emergencia', monto: 12000, hora: '10:30 AM' },
  ]);
  const [nuevoMovTipo, setNuevoMovTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [nuevoMovConcepto, setNuevoMovConcepto] = useState<string>('');
  const [nuevoMovMonto, setNuevoMovMonto] = useState<string>('');

  const [nominas, setNominas] = useState<PagoNomina[]>([
    { id: '1', empleado: 'Carlos Gómez', cedula: '1065789123', telefono: '3001234567', cargo: 'Mesero', montoBase: 50000, bono: 10000, montoTotal: 60000, metodo: 'Efectivo', fecha: 'Hoy' }
  ]);
  const [busquedaEmpleado, setBusquedaEmpleado] = useState<string>('');
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(EMPLEADOS_MOCK[0]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false);
  const [nomBase, setNomBase] = useState<number>(50000);
  const [nomBono, setNomBono] = useState<number>(0);

  const agregarAlCarrito = (prod: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === prod.id);
      if (existe) {
        return prev.map(item =>
          item.producto.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { producto: prod, cantidad: 1 }];
    });
  };

  const actualizarCantidadItem = (id: string, nuevaCantidad: number) => {
    if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
      setCarrito(prev => prev.filter(item => item.producto.id !== id));
    } else {
      setCarrito(prev => prev.map(item => 
        item.producto.id === id ? { ...item, cantidad: nuevaCantidad } : item
      ));
    }
  };

  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  }, [carrito]);

  const cobrarComandaRapida = () => {
    if (carrito.length === 0) return;
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const clienteStr = nombreCliente.trim() ? ` (${nombreCliente.trim()})` : ' (Sin Mesa)';
    
    const nuevoMov: Movimiento = {
      id: Date.now().toString(),
      tipo: 'ingreso',
      concepto: `Venta comanda rápida${clienteStr}`,
      monto: totalCarrito,
      hora: horaActual
    };
    setMovimientos(prev => [nuevoMov, ...prev]);
    setCarrito([]);
    setNombreCliente('');
    alert(`Comanda procesada exitosamente por $${totalCarrito.toLocaleString()}`);
  };

  const mesasFiltradas = useMemo(() => {
    return mesasActivas.filter(m => {
      const coincideSeccion = filtroSeccion === 'Todas' || m.seccion === filtroSeccion;
      const coincideTexto = m.nombre.toLowerCase().includes(busquedaMesa.toLowerCase()) || 
                            m.mesero.toLowerCase().includes(busquedaMesa.toLowerCase());
      return coincideSeccion && coincideTexto;
    });
  }, [mesasActivas, filtroSeccion, busquedaMesa]);

  const mesaActual = useMemo(() => {
    return mesasActivas.find(m => m.id === mesaSeleccionadaId) || mesasActivas[0];
  }, [mesasActivas, mesaSeleccionadaId]);

  const cobrarMesa = () => {
    if (!mesaActual) return;
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fechaActual = new Date().toLocaleDateString() + ' - ' + horaActual;

    const nuevoMov: Movimiento = {
      id: Date.now().toString(),
      tipo: 'ingreso',
      concepto: `Cobro Factura ${mesaActual.nombre} (${mesaActual.seccion}) - ${metodoPago.toUpperCase()}`,
      monto: mesaActual.total,
      hora: horaActual
    };
    setMovimientos(prev => [nuevoMov, ...prev]);

    const nuevoHistorial: HistorialMesaItem = {
      id: `HM-${Date.now().toString().slice(-3)}`,
      mesa: mesaActual.nombre,
      seccion: mesaActual.seccion,
      monto: mesaActual.total,
      mesero: mesaActual.mesero,
      metodoPago: metodoPago === 'mixto' ? `Mixto (Ef: $${montoEfectivo} / Dig: $${montoDigital})` : metodoPago.toUpperCase(),
      estado: 'Pagada',
      fechaApertura: fechaActual,
      fechaCierre: fechaActual,
      items: mesaActual.items
    };
    setHistorialMesas(prev => [nuevoHistorial, ...prev]);

    setMesasActivas(prev => {
      const actualizadas = prev.filter(m => m.id !== mesaActual.id);
      if (actualizadas.length > 0) {
        setMesaSeleccionadaId(actualizadas[0].id);
      }
      return actualizadas;
    });

    setMontoEfectivo(0);
    setMontoDigital(0);
  };

  const registrarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMovConcepto.trim() || !nuevoMovMonto || parseFloat(nuevoMovMonto) <= 0) return;
    const nuevo: Movimiento = {
      id: Date.now().toString(),
      tipo: nuevoMovTipo,
      concepto: nuevoMovConcepto.trim(),
      monto: parseFloat(nuevoMovMonto),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMovimientos(prev => [nuevo, ...prev]);
    setNuevoMovConcepto('');
    setNuevoMovMonto('');
  };

  const registrarNomina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoSeleccionado) return;
    const total = Number(nomBase) + Number(nomBono);
    const nueva: PagoNomina = {
      id: Date.now().toString(),
      empleado: empleadoSeleccionado.nombre,
      cedula: empleadoSeleccionado.cedula,
      telefono: empleadoSeleccionado.telefono,
      cargo: empleadoSeleccionado.cargo,
      montoBase: Number(nomBase),
      bono: Number(nomBono),
      montoTotal: total,
      metodo: 'Efectivo',
      fecha: new Date().toLocaleDateString()
    };
    setNominas(prev => [nueva, ...prev]);

    const egresoNomina: Movimiento = {
      id: Date.now().toString(),
      tipo: 'egreso',
      concepto: `Pago Nómina a ${empleadoSeleccionado.nombre} (${empleadoSeleccionado.cargo})`,
      monto: total,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMovimientos(prev => [egresoNomina, ...prev]);
    setNomBono(0);
    setBusquedaEmpleado('');
  };

  const empleadosFiltrados = EMPLEADOS_MOCK.filter(emp => 
    emp.nombre.toLowerCase().includes(busquedaEmpleado.toLowerCase()) ||
    emp.cedula.includes(busquedaEmpleado) ||
    emp.cargo.toLowerCase().includes(busquedaEmpleado.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col bg-[#081318] text-[#F7F5EB] p-3 sm:p-4 font-sans overflow-hidden">
      
      {/* 1. HEADER COMPACTO CON SEPARACIÓN ADECUADA */}
      <header className="flex justify-between items-center gap-3 mb-4 pb-2.5 border-b border-[#16353E] shrink-0 h-10">
        <div className="flex items-center gap-3">
          <DollarSign className="text-[#10B981]" size={16} />
          <h2 className="text-sm sm:text-base font-bold text-white leading-none">
            Control de Caja y Turnos
          </h2>
          <span className="hidden md:inline text-xs text-[#8CBCC4] border-l border-[#16353E] pl-3 leading-none">
            Gestión de facturación, comandeo rápido y flujo de efectivo.
          </span>
        </div>

        {/* Indicador de Estado */}
        <div className="flex items-center gap-2.5 bg-[#0B1A20] px-2.5 py-1 rounded-xl border border-[#16353E] h-8">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${turnoAbierto ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`} />
            <span className="text-xs font-semibold">{turnoAbierto ? 'Turno Abierto' : 'Turno Cerrado'}</span>
          </div>
          <button
            onClick={() => setModalTurno(true)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-xs transition-all ${
              turnoAbierto 
                ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25' 
                : 'bg-[#10B981] text-[#081318] hover:bg-[#10B981]/90 shadow-sm'
            }`}
          >
            {turnoAbierto ? <Lock size={11} /> : <Unlock size={11} />}
            {turnoAbierto ? 'Cerrar Turno' : 'Abrir Turno'}
          </button>
        </div>
      </header>

      {/* SI EL TURNO ESTÁ CERRADO */}
      {!turnoAbierto ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#0E2229] border border-[#16353E] rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl">
            <AlertCircle className="mx-auto text-amber-400 mb-2" size={40} />
            <h2 className="text-lg font-bold text-white mb-1">La caja se encuentra cerrada</h2>
            <p className="text-[#8CBCC4] text-xs mb-4">Ingresa la base inicial en efectivo para aperturar el turno operacional.</p>
            <div className="flex flex-col gap-2.5">
              <div className="text-left">
                <label className="text-xs text-[#8CBCC4] font-semibold mb-1 block">Base Inicial de Caja ($)</label>
                <input 
                  type="number" 
                  value={baseInicial}
                  onChange={(e) => setBaseInicial(Number(e.target.value))}
                  className="w-full bg-[#081318] border border-[#16353E] px-3.5 py-2 rounded-xl text-center text-white text-base font-bold focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <button 
                onClick={() => setTurnoAbierto(true)}
                className="w-full bg-[#10B981] text-[#081318] font-bold py-2.5 rounded-xl text-xs hover:bg-[#10B981]/90 transition-all shadow-md mt-1"
              >
                Abrir Turno Ahora
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* 2. NAVEGACIÓN POR PESTAÑAS (Con espacio de separación) */}
          <div className="flex gap-2 border-b border-[#16353E] mb-4 overflow-x-auto pb-1 shrink-0 scrollbar-none">
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
                className={`flex items-center gap-2 px-3.5 py-2 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#10B981] bg-[#0E2229] text-[#10B981]'
                    : 'border-transparent text-[#8CBCC4]/70 hover:text-[#F7F5EB] hover:bg-[#0E2229]/50'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          {/* 3. ÁREA DE CONTENIDO PRINCIPAL (Tipografía más legible y holgada) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            
            {/* PESTAÑA 1: VENTA DIRECTA */}
            {activeTab === 'ventas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                
                {/* Catálogo Rápido */}
                <div className="lg:col-span-2 bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] flex flex-col h-full min-h-0">
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <Layers size={17} className="text-[#10B981]" />
                    <h3 className="text-sm font-bold text-white">Menú Rápido por Categorías</h3>
                  </div>

                  {/* Selector de Categorías */}
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-[#16353E] shrink-0">
                    {CATEGORIAS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoriaSeleccionada(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                          categoriaSeleccionada === cat
                            ? 'bg-[#10B981] text-[#081318] shadow-md'
                            : 'bg-[#081318] text-[#8CBCC4] border border-[#16353E] hover:border-[#10B981]/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grid Productos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 overflow-y-auto pr-1">
                    {PRODUCTOS_MOCK.filter(p => categoriaSeleccionada === 'Todas' || p.categoria === categoriaSeleccionada).map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => agregarAlCarrito(prod)}
                        className="bg-[#081318] border border-[#16353E] hover:border-[#10B981] p-3.5 rounded-xl text-left transition-all flex flex-col justify-between group shadow-sm"
                      >
                        <div>
                          <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider">{prod.categoria}</span>
                          <span className="block font-medium text-slate-100 group-hover:text-white mt-1 text-sm">{prod.nombre}</span>
                        </div>
                        <span className="text-[#10B981] font-bold mt-2 text-sm sm:text-base">${prod.precio.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comanda Rápida Lateral */}
                <div className="bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] flex flex-col justify-between h-full min-h-0">
                  <div className="flex flex-col min-h-0">
                    <h3 className="text-sm font-bold text-white mb-2">Comanda Rápida (Sin Mesa)</h3>
                    <input
                      type="text"
                      placeholder="Nombre del Cliente / Para llevar"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      className="w-full bg-[#081318] border border-[#16353E] px-3.5 py-2 rounded-xl text-sm text-slate-200 mb-3 focus:outline-none focus:border-[#10B981]"
                    />
                    
                    <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[320px]">
                      {carrito.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingCart className="mx-auto text-[#8CBCC4]/40 mb-2" size={32} />
                          <p className="text-[#8CBCC4] text-sm">El carrito está vacío</p>
                          <span className="text-xs text-slate-500 block mt-1">Selecciona items para vender</span>
                        </div>
                      ) : (
                        carrito.map((item) => (
                          <div key={item.producto.id} className="bg-[#081318] p-3 rounded-xl border border-[#16353E] flex flex-col gap-1.5">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-slate-100">{item.producto.nombre}</span>
                              <span className="font-bold text-[#10B981] text-sm">${(item.producto.precio * item.cantidad).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-[#8CBCC4]">${item.producto.precio.toLocaleString()} c/u</span>
                              
                              <div className="flex items-center gap-1.5 bg-[#0E2229] px-2 py-1 rounded-lg border border-[#16353E]">
                                <button onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad - 1)} className="text-[#8CBCC4] hover:text-white p-0.5"><Minus size={13} /></button>
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={item.cantidad} 
                                  onChange={(e) => actualizarCantidadItem(item.producto.id, parseInt(e.target.value))} 
                                  className="w-8 bg-transparent text-center text-sm text-white font-bold focus:outline-none" 
                                />
                                <button onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad + 1)} className="text-[#8CBCC4] hover:text-white p-0.5"><Plus size={13} /></button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#16353E] pt-3 mt-3 shrink-0">
                    <div className="flex justify-between items-center mb-3 text-sm font-bold">
                      <span>Total Pagar:</span>
                      <span className="text-[#10B981] text-base sm:text-lg">${totalCarrito.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCarrito([])} 
                        disabled={carrito.length === 0} 
                        className="px-3 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        disabled={carrito.length === 0} 
                        onClick={cobrarComandaRapida} 
                        className="flex-1 bg-[#10B981] hover:bg-[#10B981]/90 disabled:opacity-40 text-[#081318] font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md"
                      >
                        Cobrar Comanda Rápida
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: COBRAR MESAS */}
            {activeTab === 'cobrar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                
                <div className="lg:col-span-2 bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] flex flex-col h-full min-h-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 shrink-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Filter size={16} className="text-[#10B981]" /> Seleccionar Mesa Ocupada
                    </h3>
                    
                    <div className="flex gap-1.5">
                      {['Todas', 'Piscina', 'Terraza', 'VIP'].map(sec => (
                        <button
                          key={sec}
                          onClick={() => setFiltroSeccion(sec)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            filtroSeccion === sec ? 'bg-[#10B981] text-[#081318]' : 'bg-[#081318] text-[#8CBCC4] border border-[#16353E]'
                          }`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative mb-3 shrink-0">
                    <Search className="absolute left-3 top-2.5 text-[#8CBCC4]/60" size={15} />
                    <input
                      type="text"
                      placeholder="Buscar mesa o mesero..."
                      value={busquedaMesa}
                      onChange={(e) => setBusquedaMesa(e.target.value)}
                      className="w-full bg-[#081318] border border-[#16353E] pl-9 pr-3 py-2 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
                    {mesasFiltradas.length === 0 ? (
                      <p className="text-[#8CBCC4] text-sm col-span-2 text-center py-10">No hay mesas ocupadas activas.</p>
                    ) : (
                      mesasFiltradas.map((m) => {
                        const seleccionada = m.id === mesaSeleccionadaId;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setMesaSeleccionadaId(m.id)}
                            className={`cursor-pointer p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                              seleccionada 
                                ? 'bg-[#10B981]/10 border-[#10B981] shadow-md' 
                                : 'bg-[#081318] border-[#16353E] hover:border-slate-600'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-bold text-white text-sm">{m.nombre}</span>
                                <span className="block text-xs text-[#8CBCC4]">{m.seccion} • {m.mesero}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold">Ocupada</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#16353E] text-xs sm:text-sm">
                              <span className="text-[#8CBCC4]">{m.items.length} items</span>
                              <span className="font-bold text-[#10B981] text-sm">${m.total.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] flex flex-col justify-between h-full min-h-0">
                  {mesasActivas.length > 0 && mesaActual ? (
                    <div className="flex flex-col min-h-0">
                      <div className="flex justify-between items-center mb-3 shrink-0">
                        <h3 className="text-sm font-bold text-white">Cobrar {mesaActual.nombre}</h3>
                        <span className="text-sm px-2.5 py-1 rounded-lg bg-[#10B981]/15 text-[#10B981] font-bold">${mesaActual.total.toLocaleString()}</span>
                      </div>

                      <div className="bg-[#081318] p-3 rounded-xl border border-[#16353E] space-y-1.5 mb-3 max-h-36 overflow-y-auto text-xs sm:text-sm shrink-0">
                        {mesaActual.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300">
                            <span>{it.cantidad}x {it.nombre}</span>
                            <span className="text-[#8CBCC4]">${(it.precio * it.cantidad).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <label className="text-xs text-[#8CBCC4] mb-1.5 block font-semibold">Método de Pago</label>
                      <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
                        {[
                          { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                          { id: 'transferencia', label: 'Transferencia', icon: QrCode },
                          { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                          { id: 'mixto', label: 'Pago Mixto', icon: Receipt },
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => setMetodoPago(m.id as MetodoPago)}
                            className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                              metodoPago === m.id 
                                ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]' 
                                : 'bg-[#081318] border-[#16353E] text-[#8CBCC4] hover:text-white'
                            }`}
                          >
                            <m.icon size={14} /> {m.label}
                          </button>
                        ))}
                      </div>

                      {metodoPago === 'mixto' && (
                        <div className="space-y-2 bg-[#081318] p-3 rounded-xl border border-[#16353E] mb-3 text-xs shrink-0">
                          <div>
                            <label className="text-xs text-[#8CBCC4]">Efectivo ($)</label>
                            <input type="number" placeholder="$0" value={montoEfectivo || ''} onChange={(e) => setMontoEfectivo(Number(e.target.value))} className="w-full bg-[#0E2229] border border-[#16353E] px-2.5 py-1.5 rounded-lg text-white text-sm mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-[#8CBCC4]">Digital/Tarjeta ($)</label>
                            <input type="number" placeholder="$0" value={montoDigital || ''} onChange={(e) => setMontoDigital(Number(e.target.value))} className="w-full bg-[#0E2229] border border-[#16353E] px-2.5 py-1.5 rounded-lg text-white text-sm mt-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[#8CBCC4] text-sm text-center py-10">Selecciona una mesa ocupada disponible.</p>
                  )}

                  <button
                    disabled={mesasActivas.length === 0}
                    onClick={cobrarMesa}
                    className="w-full bg-[#10B981] hover:bg-[#10B981]/90 disabled:opacity-40 text-[#081318] font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
                  >
                    <CheckCircle size={16} /> Confirmar Pago Factura
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: HISTORIAL DE MESAS */}
            {activeTab === 'historialMesas' && (
              <div className="bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] flex flex-col h-full min-h-0">
                <div className="mb-3 shrink-0">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="text-cyan-400" size={17} /> Historial General de Mesas
                  </h3>
                  <p className="text-xs text-[#8CBCC4]">Registro histórico de comandes, mesero y estado de cobro.</p>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#16353E] rounded-xl bg-[#081318] min-h-0">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="sticky top-0 bg-[#0E2229] border-b border-[#16353E] text-xs font-bold text-[#8CBCC4] uppercase tracking-wider z-10">
                      <tr>
                        <th className="py-3 px-4">Mesa</th>
                        <th className="py-3 px-4">Sección</th>
                        <th className="py-3 px-4">Mesero</th>
                        <th className="py-3 px-4">Apertura / Cierre</th>
                        <th className="py-3 px-4">Método Pago</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4 text-center">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#16353E]/60 text-sm text-slate-200">
                      {historialMesas.map((hm) => (
                        <tr key={hm.id} className="hover:bg-[#0E2229]/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{hm.mesa}</td>
                          <td className="py-3 px-4 text-[#8CBCC4]">{hm.seccion}</td>
                          <td className="py-3 px-4">{hm.mesero}</td>
                          <td className="py-3 px-4 text-[#8CBCC4] text-xs">{hm.fechaApertura}</td>
                          <td className="py-3 px-4">{hm.metodoPago}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              hm.estado === 'Pagada' 
                                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' 
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}>
                              {hm.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#10B981]">${hm.monto.toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => setMesaDetalleModal(hm)} 
                              className="p-2 bg-[#16353E] hover:bg-[#16353E]/80 text-cyan-400 rounded-lg transition-all"
                              title="Ver Productos"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PESTAÑA 4: INGRESOS Y EGRESOS */}
            {activeTab === 'movimientos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                <div className="bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] h-fit">
                  <h3 className="text-sm font-bold text-white mb-3">Registrar Movimiento de Caja</h3>
                  <form onSubmit={registrarMovimiento} className="space-y-3 text-sm">
                    <div>
                      <label className="text-[#8CBCC4] mb-1 block text-xs">Tipo Movimiento</label>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setNuevoMovTipo('ingreso')} 
                          className={`flex-1 py-2 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm ${
                            nuevoMovTipo === 'ingreso' ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' : 'bg-[#081318] border-[#16353E] text-slate-400'
                          }`}
                        >
                          <ArrowDownLeft size={15} /> Ingreso
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setNuevoMovTipo('egreso')} 
                          className={`flex-1 py-2 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm ${
                            nuevoMovTipo === 'egreso' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-[#081318] border-[#16353E] text-slate-400'
                          }`}
                        >
                          <ArrowUpRight size={15} /> Egreso
                        </button>
                      </div>
                    </div>

                    {nuevoMovTipo === 'egreso' && (
                      <div>
                        <label className="text-xs text-[#8CBCC4] mb-1 block">Casos Comunes</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Error del mesero', 
                            'El cliente no lo quiso', 
                            'Percance / Plato averiado', 
                            'Cortesía'
                          ].map(caso => (
                            <button 
                              key={caso} 
                              type="button" 
                              onClick={() => setNuevoMovConcepto(caso)} 
                              className="text-xs bg-[#081318] border border-[#16353E] hover:border-rose-500/50 text-slate-200 px-2.5 py-1 rounded-lg"
                            >
                              {caso}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[#8CBCC4] mb-1 block text-xs">Concepto / Motivo</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Error del mesero en comanda" 
                        value={nuevoMovConcepto} 
                        onChange={(e) => setNuevoMovConcepto(e.target.value)} 
                        className="w-full bg-[#081318] border border-[#16353E] px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-[#10B981] text-sm" 
                      />
                    </div>

                    <div>
                      <label className="text-[#8CBCC4] mb-1 block text-xs">Monto ($)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={nuevoMovMonto} 
                        onChange={(e) => setNuevoMovMonto(e.target.value)} 
                        className="w-full bg-[#081318] border border-[#16353E] px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-[#10B981] text-sm" 
                      />
                    </div>

                    <button type="submit" className="w-full bg-[#10B981] hover:bg-[#10B981]/90 text-[#081318] font-bold py-2.5 rounded-xl transition-all text-sm shadow-md">
                      Guardar Movimiento
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] flex flex-col h-full min-h-0">
                  <h3 className="text-sm font-bold text-white mb-3">Flujo de Caja (Turno Actual)</h3>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {movimientos.map((m) => (
                      <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-[#081318] border border-[#16353E] text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${m.tipo === 'ingreso' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-rose-500/15 text-rose-400'}`}>
                            {m.tipo === 'ingreso' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 text-sm">{m.concepto}</p>
                            <p className="text-xs text-[#8CBCC4]">{m.hora}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm sm:text-base ${m.tipo === 'ingreso' ? 'text-[#10B981]' : 'text-rose-400'}`}>
                          {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 5: NÓMINA & BONOS */}
            {activeTab === 'nomina' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                
                <div className="bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] h-fit">
                  <h3 className="text-sm font-bold text-white mb-3">Pago de Personal / Nómina</h3>
                  <form onSubmit={registrarNomina} className="space-y-3 text-sm">
                    
                    <div className="relative">
                      <label className="text-[#8CBCC4] mb-1 block text-xs">Buscar Empleado</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-[#8CBCC4]" size={15} />
                        <input
                          type="text"
                          placeholder="Buscar por nombre, C.C..."
                          value={busquedaEmpleado}
                          onChange={(e) => {
                            setBusquedaEmpleado(e.target.value);
                            setMostrarSugerencias(true);
                          }}
                          onFocus={() => setMostrarSugerencias(true)}
                          className="w-full bg-[#081318] border border-[#16353E] pl-9 pr-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-[#10B981] text-sm"
                        />
                      </div>

                      {mostrarSugerencias && busquedaEmpleado.trim() !== '' && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#081318] border border-[#16353E] rounded-xl shadow-2xl z-20 max-h-40 overflow-y-auto">
                          {empleadosFiltrados.length === 0 ? (
                            <div className="p-2 text-xs text-[#8CBCC4] text-center">No se encontraron empleados</div>
                          ) : (
                            empleadosFiltrados.map(emp => (
                              <div
                                key={emp.cedula}
                                onClick={() => {
                                  setEmpleadoSeleccionado(emp);
                                  setBusquedaEmpleado(emp.nombre);
                                  setMostrarSugerencias(false);
                                }}
                                className="p-2.5 hover:bg-[#16353E]/50 cursor-pointer border-b border-[#16353E] last:border-0 transition-colors"
                              >
                                <p className="text-sm font-bold text-white">{emp.nombre}</p>
                                <p className="text-xs text-[#8CBCC4]">C.C: {emp.cedula} • {emp.cargo}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#081318] p-3 rounded-xl border border-[#16353E] space-y-1 text-slate-300">
                      <p className="flex items-center gap-1.5 font-bold text-[#10B981] text-sm">
                        <UserCheck size={14} /> {empleadoSeleccionado.nombre}
                      </p>
                      <p className="text-[#8CBCC4] text-xs">Cédula: <span className="text-slate-200">{empleadoSeleccionado.cedula}</span></p>
                      <p className="text-[#8CBCC4] text-xs">Cargo: <span className="text-slate-200">{empleadoSeleccionado.cargo}</span></p>
                    </div>

                    <div>
                      <label className="text-[#8CBCC4] mb-1 block text-xs">Sueldo Base ($)</label>
                      <input 
                        type="number" 
                        value={nomBase} 
                        onChange={(e) => setNomBase(Number(e.target.value))} 
                        className="w-full bg-[#081318] border border-[#16353E] px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-[#10B981] text-sm" 
                      />
                    </div>

                    <div>
                      <label className="text-[#8CBCC4] mb-1 block text-xs">Bono / Incentivo ($)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={nomBono || ''} 
                        onChange={(e) => setNomBono(Number(e.target.value))} 
                        className="w-full bg-[#081318] border border-[#16353E] px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-[#10B981] text-sm" 
                      />
                    </div>

                    <div className="p-2.5 bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl flex justify-between items-center font-bold text-[#10B981] text-sm">
                      <span>Total Pago:</span>
                      <span>${(Number(nomBase) + Number(nomBono)).toLocaleString()}</span>
                    </div>

                    <button type="submit" className="w-full bg-[#10B981] hover:bg-[#10B981]/90 text-[#081318] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md">
                      <Plus size={16} /> Registrar Pago Nómina
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-[#0E2229] p-4 rounded-2xl border border-[#16353E] flex flex-col h-full min-h-0">
                  <h3 className="text-sm font-bold text-white mb-3">Pagos de Personal Registrados</h3>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {nominas.map((n) => (
                      <div key={n.id} className="flex justify-between items-center p-3 rounded-xl bg-[#081318] border border-[#16353E] text-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                            <Users size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 text-sm">{n.empleado} <span className="text-xs text-[#8CBCC4] font-normal">({n.cedula})</span></p>
                            <p className="text-xs text-[#8CBCC4]">{n.cargo} • Base: ${n.montoBase.toLocaleString()} + Bono: ${n.bono.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#10B981] text-sm sm:text-base">${n.montoTotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL DETALLE DE MESA */}
      {mesaDetalleModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0E2229] border border-[#16353E] rounded-2xl max-w-sm w-full p-4.5 shadow-2xl text-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm">Detalle {mesaDetalleModal.mesa} ({mesaDetalleModal.seccion})</h3>
              <button onClick={() => setMesaDetalleModal(null)} className="text-[#8CBCC4] hover:text-white font-bold"><X size={16} /></button>
            </div>

            <div className="space-y-1.5 bg-[#081318] p-3 rounded-xl border border-[#16353E] mb-3 max-h-40 overflow-y-auto">
              {mesaDetalleModal.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-300 pb-1.5 border-b border-[#16353E]/40 last:border-0 text-xs">
                  <span>{it.cantidad}x {it.nombre}</span>
                  <span className="font-semibold text-[#10B981]">${(it.precio * it.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center font-bold text-white mb-3 text-sm">
              <span>Total Consumido:</span>
              <span className="text-[#10B981]">${mesaDetalleModal.monto.toLocaleString()}</span>
            </div>

            <button onClick={() => setMesaDetalleModal(null)} className="w-full bg-[#16353E] hover:bg-[#16353E]/80 text-white py-2 rounded-xl font-bold transition-all text-xs">
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

      {/* MODAL CAMBIO TURNO */}
      {modalTurno && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0E2229] border border-[#16353E] rounded-2xl max-w-sm w-full p-4.5 shadow-2xl text-sm">
            <h3 className="font-bold text-white text-sm mb-1.5">
              {turnoAbierto ? '¿Cerrar Turno Actual?' : '¿Abrir Nuevo Turno?'}
            </h3>
            <p className="text-[#8CBCC4] mb-3 text-xs">
              {turnoAbierto 
                ? 'Al cerrar el turno, los ingresos acumulados quedarán registrados para el arqueo final.' 
                : 'Ingresa el monto de base para aperturar la caja.'}
            </p>
            {!turnoAbierto && (
              <div className="mb-3">
                <label className="text-[#8CBCC4] block mb-1 text-xs">Base Inicial ($)</label>
                <input 
                  type="number" 
                  value={baseInicial} 
                  onChange={(e) => setBaseInicial(Number(e.target.value))} 
                  className="w-full bg-[#081318] border border-[#16353E] px-3 py-1.5 rounded-xl text-white text-sm" 
                />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setModalTurno(false)} className="flex-1 bg-[#16353E] hover:bg-[#16353E]/80 text-white py-2 rounded-xl font-bold text-xs">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setTurnoAbierto(!turnoAbierto);
                  setModalTurno(false);
                }} 
                className={`flex-1 font-bold py-2 rounded-xl text-xs ${turnoAbierto ? 'bg-rose-500 text-white' : 'bg-[#10B981] text-[#081318]'}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}