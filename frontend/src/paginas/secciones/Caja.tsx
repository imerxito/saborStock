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
  const [propinaTarjeta, setPropinaTarjeta] = useState<number>(0);
  const [montoRecibidoSimple, setMontoRecibidoSimple] = useState<number>(0);

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

  const totalCobroMesa = useMemo(() => {
    if (!mesaActual) return 0;
    let extra = 0;
    if (metodoPago === 'tarjeta') {
      extra = Number(propinaTarjeta) || 0;
    }
    return mesaActual.total + extra;
  }, [mesaActual, metodoPago, propinaTarjeta]);

  const cambioCalculado = useMemo(() => {
    if ((metodoPago === 'efectivo' || metodoPago === 'transferencia') && montoRecibidoSimple > 0) {
      return Math.max(0, montoRecibidoSimple - totalCobroMesa);
    }
    return 0;
  }, [metodoPago, montoRecibidoSimple, totalCobroMesa]);

  const cobrarMesa = () => {
    if (!mesaActual) return;
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fechaActual = new Date().toLocaleDateString() + ' - ' + horaActual;

    let detalleExtra = '';
    if (metodoPago === 'tarjeta' && propinaTarjeta > 0) {
      detalleExtra = ` (Propina: $${propinaTarjeta})`;
    } else if ((metodoPago === 'efectivo' || metodoPago === 'transferencia') && montoRecibidoSimple > 0) {
      detalleExtra = ` (Recibido: $${montoRecibidoSimple} / Cambio: $${cambioCalculado})`;
    }

    const nuevoMov: Movimiento = {
      id: Date.now().toString(),
      tipo: 'ingreso',
      concepto: `Cobro Factura ${mesaActual.nombre} (${mesaActual.seccion}) - ${metodoPago.toUpperCase()}${detalleExtra}`,
      monto: totalCobroMesa,
      hora: horaActual
    };
    setMovimientos(prev => [nuevoMov, ...prev]);

    const nuevoHistorial: HistorialMesaItem = {
      id: `HM-${Date.now().toString().slice(-3)}`,
      mesa: mesaActual.nombre,
      seccion: mesaActual.seccion,
      monto: totalCobroMesa,
      mesero: mesaActual.mesero,
      metodoPago: metodoPago === 'mixto' 
        ? `Mixto (Ef: $${montoEfectivo} / Dig: $${montoDigital})` 
        : metodoPago === 'tarjeta' 
          ? `Tarjeta (Propina: $${propinaTarjeta})` 
          : `${metodoPago.toUpperCase()}${montoRecibidoSimple > 0 ? ` (Recibido: $${montoRecibidoSimple})` : ''}`,
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
    setPropinaTarjeta(0);
    setMontoRecibidoSimple(0);
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
    <div className="h-full w-full flex flex-col bg-[#0B132B] text-[#F4D6B0] p-2.5 sm:p-3 font-sans overflow-hidden">
      
      {/* 1. HEADER MÁS PEQUEÑO Y COMPACTO */}
      <header className="flex justify-between items-center gap-2 mb-2.5 pb-1.5 border-b border-[#3A506B] shrink-0 h-8">
        <div className="flex items-center gap-2.5">
          <DollarSign className="text-[#5BC0DE]" size={15} />
          <h2 className="text-xs sm:text-sm font-bold text-[#F4D6B0] leading-none">
            Control de Caja y Turnos
          </h2>
          <span className="hidden md:inline text-[11px] text-[#5BC0DE] border-l border-[#3A506B] pl-2.5 leading-none">
            Gestión de facturación, comandeo rápido y flujo de efectivo.
          </span>
        </div>

        {/* Indicador de Estado */}
        <div className="flex items-center gap-2 bg-[#1C2541] px-2 py-0.5 rounded-lg border border-[#3A506B] h-7">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${turnoAbierto ? 'bg-[#5BC0DE] animate-pulse' : 'bg-[#D97706]'}`} />
            <span className="text-[11px] font-semibold text-[#F4D6B0]">{turnoAbierto ? 'Turno Abierto' : 'Turno Cerrado'}</span>
          </div>
          <button
            onClick={() => setModalTurno(true)}
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
      </header>

      {/* SI EL TURNO ESTÁ CERRADO */}
      {!turnoAbierto ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl">
            <AlertCircle className="mx-auto text-[#D97706] mb-2" size={40} />
            <h2 className="text-lg font-bold text-[#F4D6B0] mb-1">La caja se encuentra cerrada</h2>
            <p className="text-[#5BC0DE] text-xs mb-4">Ingresa la base inicial en efectivo para aperturar el turno operacional.</p>
            <div className="flex flex-col gap-2.5">
              <div className="text-left">
                <label className="text-xs text-[#5BC0DE] font-semibold mb-1 block">Base Inicial de Caja ($)</label>
                <input 
                  type="number" 
                  value={baseInicial}
                  onChange={(e) => setBaseInicial(Number(e.target.value))}
                  className="w-full bg-[#0B132B] border border-[#3A506B] px-3.5 py-2 rounded-xl text-center text-[#F4D6B0] text-base font-bold focus:outline-none focus:border-[#5BC0DE]"
                />
              </div>
              <button 
                onClick={() => setTurnoAbierto(true)}
                className="w-full bg-[#5BC0DE] text-[#0B132B] font-bold py-2.5 rounded-xl text-xs hover:bg-[#5BC0DE]/90 transition-all shadow-md mt-1"
              >
                Abrir Turno Ahora
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* NAVEGACIÓN POR PESTAÑAS */}
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
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#5BC0DE] bg-[#1C2541] text-[#5BC0DE]'
                    : 'border-transparent text-[#5BC0DE]/70 hover:text-[#F4D6B0] hover:bg-[#1C2541]/50'
                }`}
              >
                <tab.icon size={15} /> {tab.label}
              </button>
            ))}
          </div>

          {/* ÁREA DE CONTENIDO PRINCIPAL */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            
            {/* PESTAÑA 1: VENTA DIRECTA */}
            {activeTab === 'ventas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
                
                {/* Catálogo Rápido con scrollbar transparente en categorías */}
                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col h-full min-h-0">
                  <div className="flex items-center gap-2 mb-2.5 shrink-0">
                    <Layers size={16} className="text-[#5BC0DE]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0]">Menú Rápido por Categorías</h3>
                  </div>

                  {/* Selector de Categorías con scrollbar transparente */}
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2.5 border-b border-[#3A506B] shrink-0 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {CATEGORIAS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoriaSeleccionada(cat)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          categoriaSeleccionada === cat
                            ? 'bg-[#5BC0DE] text-[#0B132B] shadow-md'
                            : 'bg-[#0B132B] text-[#5BC0DE] border border-[#3A506B] hover:border-[#5BC0DE]/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grid Productos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 overflow-y-auto pr-1">
                    {PRODUCTOS_MOCK.filter(p => categoriaSeleccionada === 'Todas' || p.categoria === categoriaSeleccionada).map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => agregarAlCarrito(prod)}
                        className="bg-[#0B132B] border border-[#3A506B] hover:border-[#5BC0DE] p-3 rounded-xl text-left transition-all flex flex-col justify-between group shadow-sm"
                      >
                        <div>
                          <span className="text-[9px] text-[#5BC0DE] font-bold uppercase tracking-wider">{prod.categoria}</span>
                          <span className="block font-medium text-[#F4D6B0] group-hover:text-white mt-1 text-xs">{prod.nombre}</span>
                        </div>
                        <span className="text-[#5BC0DE] font-bold mt-2 text-xs sm:text-sm">${prod.precio.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comanda Rápida Lateral */}
                <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col justify-between h-full min-h-0">
                  <div className="flex flex-col min-h-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2">Comanda Rápida (Sin Mesa)</h3>
                    <input
                      type="text"
                      placeholder="Nombre del Cliente / Para llevar"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-1.5 rounded-xl text-xs text-[#F4D6B0] mb-2.5 focus:outline-none focus:border-[#5BC0DE]"
                    />
                    
                    <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[300px]">
                      {carrito.length === 0 ? (
                        <div className="text-center py-10">
                          <ShoppingCart className="mx-auto text-[#5BC0DE]/40 mb-2" size={28} />
                          <p className="text-[#5BC0DE] text-xs">El carrito está vacío</p>
                          <span className="text-[10px] text-[#3A506B] block mt-1">Selecciona items para vender</span>
                        </div>
                      ) : (
                        carrito.map((item) => (
                          <div key={item.producto.id} className="bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B] flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-medium text-[#F4D6B0]">{item.producto.nombre}</span>
                              <span className="font-bold text-[#5BC0DE] text-xs">${(item.producto.precio * item.cantidad).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-[#5BC0DE]">${item.producto.precio.toLocaleString()} c/u</span>
                              
                              <div className="flex items-center gap-1 bg-[#1C2541] px-1.5 py-0.5 rounded-lg border border-[#3A506B]">
                                <button onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad - 1)} className="text-[#5BC0DE] hover:text-white p-0.5"><Minus size={11} /></button>
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={item.cantidad} 
                                  onChange={(e) => actualizarCantidadItem(item.producto.id, parseInt(e.target.value))} 
                                  className="w-6 bg-transparent text-center text-xs text-[#F4D6B0] font-bold focus:outline-none" 
                                />
                                <button onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad + 1)} className="text-[#5BC0DE] hover:text-white p-0.5"><Plus size={11} /></button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#3A506B] pt-2.5 mt-2.5 shrink-0">
                    <div className="flex justify-between items-center mb-2.5 text-xs font-bold text-[#F4D6B0]">
                      <span>Total Pagar:</span>
                      <span className="text-[#5BC0DE] text-sm sm:text-base">${totalCarrito.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCarrito([])} 
                        disabled={carrito.length === 0} 
                        className="px-2.5 py-2 bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20 rounded-xl hover:bg-[#D97706]/20 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button 
                        disabled={carrito.length === 0} 
                        onClick={cobrarComandaRapida} 
                        className="flex-1 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 text-[#0B132B] font-bold py-2 rounded-xl text-xs transition-all shadow-md"
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
                
                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col h-full min-h-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2.5 shrink-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] flex items-center gap-1.5">
                      <Filter size={15} className="text-[#5BC0DE]" /> Seleccionar Mesa Ocupada
                    </h3>
                    
                    <div className="flex gap-1">
                      {['Todas', 'Piscina', 'Terraza', 'VIP'].map(sec => (
                        <button
                          key={sec}
                          onClick={() => setFiltroSeccion(sec)}
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                            filtroSeccion === sec ? 'bg-[#5BC0DE] text-[#0B132B]' : 'bg-[#0B132B] text-[#5BC0DE] border border-[#3A506B]'
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

                  {/* Grid con scrollbar transparente propio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {mesasFiltradas.length === 0 ? (
                      <p className="text-[#5BC0DE] text-xs col-span-2 text-center py-10">No hay mesas ocupadas activas.</p>
                    ) : (
                      mesasFiltradas.map((m) => {
                        const seleccionada = m.id === mesaSeleccionadaId;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setMesaSeleccionadaId(m.id)}
                            className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col justify-between ${
                              seleccionada 
                                ? 'bg-[#5BC0DE]/10 border-[#5BC0DE] shadow-md' 
                                : 'bg-[#0B132B] border-[#3A506B] hover:border-[#5BC0DE]/50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <div>
                                <span className="font-bold text-[#F4D6B0] text-xs">{m.nombre}</span>
                                <span className="block text-[10px] text-[#5BC0DE]">{m.seccion} • {m.mesero}</span>
                              </div>
                              <span className="px-2 py-0.2 rounded-full bg-[#D97706]/15 text-[#D97706] text-[10px] font-semibold">Ocupada</span>
                            </div>
                            <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-[#3A506B] text-xs">
                              <span className="text-[#5BC0DE]">{m.items.length} items</span>
                              <span className="font-bold text-[#5BC0DE] text-xs sm:text-sm">${m.total.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Panel de Cobro Optimizado y compacto */}
                <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col justify-between h-full min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                  {mesasActivas.length > 0 && mesaActual ? (
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-2 shrink-0">
                        <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0]">Cobrar {mesaActual.nombre}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-[#5BC0DE]/15 text-[#5BC0DE] font-bold">${totalCobroMesa.toLocaleString()}</span>
                      </div>

                      <div className="bg-[#0B132B] p-2 rounded-xl border border-[#3A506B] space-y-1 mb-2 max-h-24 overflow-y-auto text-[11px] shrink-0 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                        {mesaActual.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[#F4D6B0]">
                            <span>{it.cantidad}x {it.nombre}</span>
                            <span className="text-[#5BC0DE]">${(it.precio * it.cantidad).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <label className="text-[11px] text-[#5BC0DE] mb-1 block font-semibold">Método de Pago</label>
                      <div className="grid grid-cols-2 gap-1 mb-2 shrink-0">
                        {[
                          { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                          { id: 'transferencia', label: 'Transferencia', icon: QrCode },
                          { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                          { id: 'mixto', label: 'Pago Mixto', icon: Receipt },
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => setMetodoPago(m.id as MetodoPago)}
                            className={`flex items-center gap-1 p-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                              metodoPago === m.id 
                                ? 'bg-[#5BC0DE]/15 border-[#5BC0DE] text-[#5BC0DE]' 
                                : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE] hover:text-[#F4D6B0]'
                            }`}
                          >
                            <m.icon size={12} /> {m.label}
                          </button>
                        ))}
                      </div>

                      {/* Excedente / Cambio para Efectivo y Transferencia */}
                      {(metodoPago === 'efectivo' || metodoPago === 'transferencia') && (
                        <div className="space-y-1 bg-[#0B132B] p-2 rounded-xl border border-[#3A506B] mb-2 text-xs shrink-0">
                          <div>
                            <label className="text-[10px] text-[#5BC0DE] block mb-0.5">Monto Recibido del Cliente ($)</label>
                            <input 
                              type="number" 
                              placeholder="$0" 
                              value={montoRecibidoSimple || ''} 
                              onChange={(e) => setMontoRecibidoSimple(Number(e.target.value))} 
                              className="w-full bg-[#1C2541] border border-[#3A506B] px-2 py-1 rounded-lg text-[#F4D6B0] text-xs focus:outline-none focus:border-[#5BC0DE]" 
                            />
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-[#3A506B]/50 text-[11px]">
                            <span className="text-[#5BC0DE]">Cambio / Excedente:</span>
                            <span className="font-bold text-emerald-400">${cambioCalculado.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      {/* Configuración específica para Tarjeta */}
                      {metodoPago === 'tarjeta' && (
                        <div className="space-y-1 bg-[#0B132B] p-2 rounded-xl border border-[#3A506B] mb-2 text-xs shrink-0">
                          <div className="flex justify-between text-[#5BC0DE] text-[11px]">
                            <span>Subtotal Mesa:</span>
                            <span className="text-[#F4D6B0] font-bold">${mesaActual.total.toLocaleString()}</span>
                          </div>
                          <div>
                            <label className="text-[10px] text-[#5BC0DE] block mb-0.5">Propina Voluntaria / Adicional ($)</label>
                            <input 
                              type="number" 
                              placeholder="$0" 
                              value={propinaTarjeta || ''} 
                              onChange={(e) => setPropinaTarjeta(Number(e.target.value))} 
                              className="w-full bg-[#1C2541] border border-[#3A506B] px-2 py-1 rounded-lg text-[#F4D6B0] text-xs focus:outline-none focus:border-[#5BC0DE]" 
                            />
                          </div>
                        </div>
                      )}

                      {/* Configuración para Pago Mixto */}
                      {metodoPago === 'mixto' && (
                        <div className="space-y-1 bg-[#0B132B] p-2 rounded-xl border border-[#3A506B] mb-2 text-xs shrink-0">
                          <div>
                            <label className="text-[10px] text-[#5BC0DE]">Efectivo ($)</label>
                            <input type="number" placeholder="$0" value={montoEfectivo || ''} onChange={(e) => setMontoEfectivo(Number(e.target.value))} className="w-full bg-[#1C2541] border border-[#3A506B] px-2 py-0.5 rounded-lg text-[#F4D6B0] text-xs" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#5BC0DE]">Digital/Tarjeta ($)</label>
                            <input type="number" placeholder="$0" value={montoDigital || ''} onChange={(e) => setMontoDigital(Number(e.target.value))} className="w-full bg-[#1C2541] border border-[#3A506B] px-2 py-0.5 rounded-lg text-[#F4D6B0] text-xs" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[#5BC0DE] text-xs text-center py-10">Selecciona una mesa ocupada disponible.</p>
                  )}

                  <button
                    disabled={mesasActivas.length === 0}
                    onClick={cobrarMesa}
                    className="w-full bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 text-[#0B132B] font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shrink-0 mt-1"
                  >
                    <CheckCircle size={15} /> Confirmar Pago Factura
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: HISTORIAL DE MESAS */}
            {activeTab === 'historialMesas' && (
              <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col h-full min-h-0">
                <div className="mb-2.5 shrink-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] flex items-center gap-1.5">
                    <Calendar className="text-[#5BC0DE]" size={16} /> Historial General de Mesas
                  </h3>
                  <p className="text-[11px] text-[#5BC0DE]">Registro histórico de comandes, mesero y estado de cobro.</p>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#3A506B] rounded-xl bg-[#0B132B] min-h-0 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="sticky top-0 bg-[#1C2541] border-b border-[#3A506B] text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider z-10">
                      <tr>
                        <th className="py-2.5 px-3">Mesa</th>
                        <th className="py-2.5 px-3">Sección</th>
                        <th className="py-2.5 px-3">Mesero</th>
                        <th className="py-2.5 px-3">Apertura / Cierre</th>
                        <th className="py-2.5 px-3">Método Pago</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A506B]/60 text-xs text-[#F4D6B0]">
                      {historialMesas.map((hm) => (
                        <tr key={hm.id} className="hover:bg-[#1C2541]/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{hm.mesa}</td>
                          <td className="py-2.5 px-3 text-[#5BC0DE]">{hm.seccion}</td>
                          <td className="py-2.5 px-3">{hm.mesero}</td>
                          <td className="py-2.5 px-3 text-[#5BC0DE] text-[11px]">{hm.fechaApertura}</td>
                          <td className="py-2.5 px-3">{hm.metodoPago}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              hm.estado === 'Pagada' 
                                ? 'bg-[#5BC0DE]/15 text-[#5BC0DE] border border-[#5BC0DE]/30' 
                                : 'bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30'
                            }`}>
                              {hm.estado}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#5BC0DE]">${hm.monto.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button 
                              onClick={() => setMesaDetalleModal(hm)} 
                              className="p-1.5 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#5BC0DE] rounded-lg transition-all"
                              title="Ver Productos"
                            >
                              <Eye size={14} />
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
                
                {/* Formulario */}
                <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] h-fit">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5">Registrar Movimiento de Caja</h3>
                  <form onSubmit={registrarMovimiento} className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[#5BC0DE] mb-1 block text-[11px]">Tipo Movimiento</label>
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

                    {nuevoMovTipo === 'egreso' && (
                      <div>
                        <label className="text-[10px] text-[#5BC0DE] mb-1 block">Casos Comunes</label>
                        <div className="flex flex-wrap gap-1">
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
                              className="text-[10px] bg-[#0B132B] border border-[#3A506B] hover:border-[#D97706]/50 text-[#F4D6B0] px-2 py-0.5 rounded-lg"
                            >
                              {caso}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[#5BC0DE] mb-1 block text-[11px]">Concepto / Motivo</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Error del mesero en comanda" 
                        value={nuevoMovConcepto} 
                        onChange={(e) => setNuevoMovConcepto(e.target.value)} 
                        className="w-full bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]" 
                      />
                    </div>

                    <div>
                      <label className="text-[#5BC0DE] mb-1 block text-[11px]">Monto ($)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={nuevoMovMonto} 
                        onChange={(e) => setNuevoMovMonto(e.target.value)} 
                        className="w-full bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]" 
                      />
                    </div>

                    <button type="submit" className="w-full bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-bold py-2 rounded-xl transition-all shadow-md">
                      Guardar Movimiento
                    </button>
                  </form>
                </div>

                {/* Listado con scroll */}
                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col h-full min-h-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5">Flujo de Caja (Turno Actual)</h3>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {movimientos.map((m) => (
                      <div key={m.id} className="flex justify-between items-center p-2.5 rounded-xl bg-[#0B132B] border border-[#3A506B] text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-xl ${m.tipo === 'ingreso' ? 'bg-[#5BC0DE]/15 text-[#5BC0DE]' : 'bg-[#D97706]/15 text-[#D97706]'}`}>
                            {m.tipo === 'ingreso' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                          </div>
                          <div>
                            <p className="font-semibold text-[#F4D6B0] text-xs">{m.concepto}</p>
                            <p className="text-[10px] text-[#5BC0DE]">{m.hora}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-xs sm:text-sm ${m.tipo === 'ingreso' ? 'text-[#5BC0DE]' : 'text-[#D97706]'}`}>
                          {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 5: NÓMINA & BONOS (Sin sticky que corte el contenedor superior) */}
            {activeTab === 'nomina' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full min-h-0">
                
                {/* Formulario de Nómina Ajustado (Sin corte) */}
                <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5 shrink-0">Pago de Personal / Nómina</h3>
                  <form onSubmit={registrarNomina} className="space-y-2.5 text-xs flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="relative">
                        <label className="text-[#5BC0DE] mb-1 block text-[11px]">Buscar Empleado</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2 text-[#5BC0DE]" size={14} />
                          <input
                            type="text"
                            placeholder="Buscar por nombre, C.C..."
                            value={busquedaEmpleado}
                            onChange={(e) => {
                              setBusquedaEmpleado(e.target.value);
                              setMostrarSugerencias(true);
                            }}
                            onFocus={() => setMostrarSugerencias(true)}
                            className="w-full bg-[#0B132B] border border-[#3A506B] pl-8 pr-3 py-1.5 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                          />
                        </div>

                        {mostrarSugerencias && busquedaEmpleado.trim() !== '' && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0B132B] border border-[#3A506B] rounded-xl shadow-2xl z-20 max-h-36 overflow-y-auto">
                            {empleadosFiltrados.length === 0 ? (
                              <div className="p-2 text-[11px] text-[#5BC0DE] text-center">No se encontraron empleados</div>
                            ) : (
                              empleadosFiltrados.map(emp => (
                                <div
                                  key={emp.cedula}
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

                      <div className="bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B] space-y-0.5 text-[#F4D6B0]">
                        <p className="flex items-center gap-1 font-bold text-[#5BC0DE] text-xs">
                          <UserCheck size={13} /> {empleadoSeleccionado.nombre}
                        </p>
                        <p className="text-[11px] text-[#5BC0DE]">Cédula: <span className="text-[#F4D6B0]">{empleadoSeleccionado.cedula}</span></p>
                        <p className="text-[11px] text-[#5BC0DE]">Cargo: <span className="text-[#F4D6B0]">{empleadoSeleccionado.cargo}</span></p>
                      </div>

                      <div>
                        <label className="text-[#5BC0DE] mb-1 block text-[11px]">Sueldo Base ($)</label>
                        <input 
                          type="number" 
                          value={nomBase} 
                          onChange={(e) => setNomBase(Number(e.target.value))} 
                          className="w-full bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]" 
                        />
                      </div>

                      <div>
                        <label className="text-[#5BC0DE] mb-1 block text-[11px]">Bono / Incentivo ($)</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={nomBono || ''} 
                          onChange={(e) => setNomBono(Number(e.target.value))} 
                          className="w-full bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2 shrink-0">
                      <div className="p-2 bg-[#5BC0DE]/15 border border-[#5BC0DE]/30 rounded-xl flex justify-between items-center font-bold text-[#5BC0DE] text-xs">
                        <span>Total Pago:</span>
                        <span>${(Number(nomBase) + Number(nomBono)).toLocaleString()}</span>
                      </div>

                      <button type="submit" className="w-full bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md">
                        <Plus size={15} /> Registrar Pago Nómina
                      </button>
                    </div>
                  </form>
                </div>

                {/* Historial con scroll independiente */}
                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col h-full min-h-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5 shrink-0">Pagos de Personal Registrados</h3>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {nominas.map((n) => (
                      <div key={n.id} className="flex justify-between items-center p-2.5 rounded-xl bg-[#0B132B] border border-[#3A506B] text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-[#5BC0DE]/15 text-[#5BC0DE]">
                            <Users size={15} />
                          </div>
                          <div>
                            <p className="font-semibold text-[#F4D6B0] text-xs">{n.empleado} <span className="text-[10px] text-[#5BC0DE] font-normal">({n.cedula})</span></p>
                            <p className="text-[10px] text-[#5BC0DE]">{n.cargo} • Base: ${n.montoBase.toLocaleString()} + Bono: ${n.bono.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#5BC0DE] text-xs sm:text-sm">${n.montoTotal.toLocaleString()}</span>
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
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl max-w-sm w-full p-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="font-bold text-[#F4D6B0] text-xs">Detalle {mesaDetalleModal.mesa} ({mesaDetalleModal.seccion})</h3>
              <button onClick={() => setMesaDetalleModal(null)} className="text-[#5BC0DE] hover:text-[#F4D6B0] font-bold"><X size={15} /></button>
            </div>

            <div className="space-y-1 bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B] mb-2.5 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
              {mesaDetalleModal.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[#F4D6B0] pb-1 border-b border-[#3A506B]/40 last:border-0 text-[11px]">
                  <span>{it.cantidad}x {it.nombre}</span>
                  <span className="font-semibold text-[#5BC0DE]">${(it.precio * it.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center font-bold text-[#F4D6B0] mb-2.5 text-xs">
              <span>Total Consumido:</span>
              <span className="text-[#5BC0DE]">${mesaDetalleModal.monto.toLocaleString()}</span>
            </div>

            <button onClick={() => setMesaDetalleModal(null)} className="w-full bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] py-1.5 rounded-xl font-bold transition-all text-xs">
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

      {/* MODAL CAMBIO TURNO */}
      {modalTurno && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl max-w-sm w-full p-4 shadow-2xl text-xs">
            <h3 className="font-bold text-[#F4D6B0] text-xs mb-1">
              {turnoAbierto ? '¿Cerrar Turno Actual?' : '¿Abrir Nuevo Turno?'}
            </h3>
            <p className="text-[#5BC0DE] mb-2.5 text-[11px]">
              {turnoAbierto 
                ? 'Al cerrar el turno, los ingresos acumulados quedarán registrados para el arqueo final.' 
                : 'Ingresa el monto de base para aperturar la caja.'}
            </p>
            {!turnoAbierto && (
              <div className="mb-2.5">
                <label className="text-[#5BC0DE] block mb-1 text-[11px]">Base Inicial ($)</label>
                <input 
                  type="number" 
                  value={baseInicial} 
                  onChange={(e) => setBaseInicial(Number(e.target.value))} 
                  className="w-full bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-[#F4D6B0] text-xs" 
                />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setModalTurno(false)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] py-1.5 rounded-xl font-bold text-xs">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setTurnoAbierto(!turnoAbierto);
                  setModalTurno(false);
                }} 
                className={`flex-1 font-bold py-1.5 rounded-xl text-xs ${turnoAbierto ? 'bg-[#D97706] text-white' : 'bg-[#5BC0DE] text-[#0B132B]'}`}
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