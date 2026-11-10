import React, { useState, useMemo } from 'react';
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
  X
} from 'lucide-react';

// --- Tipos de Datos ---
type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';

interface Producto { id: string; nombre: string; precio: number; categoria: string; }
interface ItemPedido { producto: Producto; cantidad: number; }
interface Movimiento { id: string; tipo: 'ingreso' | 'egreso'; concepto: string; monto: number; hora: string; }
interface PagoNomina { id: string; empleado: string; cedula: string; telefono: string; cargo: string; montoBase: number; bono: number; montoTotal: number; metodo: string; fecha: string; }

// NUEVO: SubVentas dentro de una mesa
interface SubVenta {
  id: string;
  cliente: string;
  total: number;
  items: { nombre: string; cantidad: number; precio: number }[];
}

interface HistorialMesaItem { 
  id: string; 
  mesa: string; 
  seccion: string; 
  cliente: string; 
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
  mesero: string; 
  ventas: SubVenta[]; // Reemplaza a los items y total únicos
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

// Actualizamos las mesas para que tengan múltiples ventas
const MESAS_INICIALES: MesaActiva[] = [
  { 
    id: 'm3', nombre: 'Mesa 3', seccion: 'Piscina', mesero: 'Carlos Gómez', 
    ventas: [
      { id: 'v1', cliente: 'Juan Pérez', total: 45000, items: [{ nombre: 'Cerveza Club Colombia', cantidad: 1, precio: 7000 }, { nombre: 'Pizza Personal Peperoni', cantidad: 1, precio: 18000 }, { nombre: 'Hamburguesa Especial', cantidad: 1, precio: 20000 }] }
    ] 
  },
  { 
    id: 'm5', nombre: 'Mesa 5', seccion: 'Terraza', mesero: 'Carlos Gómez', 
    ventas: [
      { id: 'v2', cliente: 'Cliente General', total: 44000, items: [{ nombre: 'Hamburguesa Especial', cantidad: 2, precio: 22000 }] },
      { id: 'v3', cliente: 'Ana (Amiga)', total: 38000, items: [{ nombre: 'Limonada Cerezada', cantidad: 2, precio: 9000 }, { nombre: 'Papas a la Francesa', cantidad: 2, precio: 10000 }] }
    ] 
  },
  { 
    id: 'm8', nombre: 'Mesa 8', seccion: 'VIP', mesero: 'Ana María Pérez', 
    ventas: [
      { id: 'v4', cliente: 'Empresa XYZ', total: 150000, items: [{ nombre: 'Ron Medellín 8 Años (Botella)', cantidad: 1, precio: 85000 }, { nombre: 'Aguardiente Antioqueño (Botella)', cantidad: 1, precio: 65000 }] }
    ] 
  },
];

const HISTORIAL_MESAS_MOCK: HistorialMesaItem[] = [
  { id: 'HM-101', mesa: 'Mesa 1', seccion: 'Piscina', cliente: 'Fam. Rodríguez', monto: 45000, mesero: 'Carlos Gómez', metodoPago: 'Efectivo', estado: 'Pagada', fechaApertura: '02/11/2026 - 01:30 PM', fechaCierre: '02/11/2026 - 02:40 PM', items: [{ nombre: 'Hamburguesa Especial', cantidad: 1, precio: 22000 }, { nombre: 'Limonada Cerezada', cantidad: 1, precio: 9000 }, { nombre: 'Papas a la Francesa', cantidad: 1, precio: 8000 }] },
  { id: 'HM-102', mesa: 'Mesa 4', seccion: 'Terraza', cliente: 'Carlos Ruiz', monto: 72000, mesero: 'Ana María Pérez', metodoPago: 'Transferencia', estado: 'Pagada', fechaApertura: '02/11/2026 - 02:15 PM', fechaCierre: '02/11/2026 - 03:10 PM', items: [{ nombre: 'Aguardiente Antioqueño (Botella)', cantidad: 1, precio: 65000 }, { nombre: 'Cerveza Club Colombia', cantidad: 1, precio: 7000 }] },
];

export default function Caja(): React.ReactElement {
  const [turnoAbierto, setTurnoAbierto] = useState<boolean>(true);
  const [baseInicial, setBaseInicial] = useState<number>(150000);
  const [modalTurno, setModalTurno] = useState<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<'ventas' | 'cobrar' | 'historialMesas' | 'movimientos' | 'nomina'>('ventas');

  // Estados Venta Directa
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);
  const [nombreCliente, setNombreCliente] = useState<string>('');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  
  // Modal de Cobro Venta Directa
  const [modalCobroVenta, setModalCobroVenta] = useState<boolean>(false);
  const [metodoPagoVenta, setMetodoPagoVenta] = useState<MetodoPago>('efectivo');
  const [montoRecibidoVenta, setMontoRecibidoVenta] = useState<number>(0);
  const [montoEfectivoVenta, setMontoEfectivoVenta] = useState<number>(0);
  const [montoDigitalVenta, setMontoDigitalVenta] = useState<number>(0);

  // Estados Cobrar Mesas
  const [mesasActivas, setMesasActivas] = useState<MesaActiva[]>(MESAS_INICIALES);
  const [busquedaMesa, setBusquedaMesa] = useState<string>('');
  const [filtroSeccion, setFiltroSeccion] = useState<string>('Todas');
  
  // Estado para el modal de cobro de mesa
  const [mesaACobrar, setMesaACobrar] = useState<MesaActiva | null>(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<SubVenta | null>(null);
  
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [montoEfectivo, setMontoEfectivo] = useState<number>(0);
  const [montoDigital, setMontoDigital] = useState<number>(0);
  const [propina, setPropina] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0); // NUEVO
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
    setLastAddedId(prod.id);
    setTimeout(() => setLastAddedId(null), 500); // Reset animation state

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

  // Cálculos Venta Directa
  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  }, [carrito]);

  const cambioVenta = useMemo(() => {
    let pagoTotal = 0;
    if (metodoPagoVenta === 'efectivo' || metodoPagoVenta === 'transferencia') pagoTotal = montoRecibidoVenta;
    else if (metodoPagoVenta === 'mixto') pagoTotal = montoEfectivoVenta + montoDigitalVenta;
    return Math.max(0, pagoTotal - totalCarrito);
  }, [metodoPagoVenta, montoRecibidoVenta, montoEfectivoVenta, montoDigitalVenta, totalCarrito]);

  const isPagoIncompletoVenta = useMemo(() => {
    if (metodoPagoVenta === 'efectivo' || metodoPagoVenta === 'transferencia') {
      return montoRecibidoVenta > 0 && montoRecibidoVenta < totalCarrito;
    }
    if (metodoPagoVenta === 'mixto') {
      const totalMixto = montoEfectivoVenta + montoDigitalVenta;
      return totalMixto > 0 && totalMixto < totalCarrito;
    }
    return false;
  }, [metodoPagoVenta, montoRecibidoVenta, montoEfectivoVenta, montoDigitalVenta, totalCarrito]);

  const cobrarComandaRapida = () => {
    if (carrito.length === 0) return;
    if (isPagoIncompletoVenta) {
      alert('El monto ingresado es menor al total a pagar. Por favor verifica.');
      return;
    }

    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const clienteStr = nombreCliente.trim() ? ` (${nombreCliente.trim()})` : ' (Sin Mesa)';
    
    let detalleExtra = '';
    if (metodoPagoVenta === 'mixto') {
      const totalMixto = montoEfectivoVenta + montoDigitalVenta;
      const vueltoMixto = Math.max(0, totalMixto - totalCarrito);
      detalleExtra = ` (Ef: $${montoEfectivoVenta} / Dig: $${montoDigitalVenta})${vueltoMixto > 0 ? ` [Cambio: $${vueltoMixto}]` : ''}`;
    } else if ((metodoPagoVenta === 'efectivo' || metodoPagoVenta === 'transferencia') && montoRecibidoVenta > 0) {
      detalleExtra = ` (Recibido: $${montoRecibidoVenta} / Cambio: $${cambioVenta})`;
    }

    const nuevoMov: Movimiento = {
      id: Date.now().toString(),
      tipo: 'ingreso',
      concepto: `Venta comanda rápida${clienteStr} - ${metodoPagoVenta.toUpperCase()}${detalleExtra}`,
      monto: totalCarrito,
      hora: horaActual
    };
    setMovimientos(prev => [nuevoMov, ...prev]);
    
    setCarrito([]);
    setNombreCliente('');
    setMetodoPagoVenta('efectivo');
    setMontoRecibidoVenta(0);
    setMontoEfectivoVenta(0);
    setMontoDigitalVenta(0);
    setModalCobroVenta(false);
  };

  // Cálculos Cobrar Mesas
  const mesasFiltradas = useMemo(() => {
    return mesasActivas.filter(m => {
      const coincideSeccion = filtroSeccion === 'Todas' || m.seccion === filtroSeccion;
      const coincideTexto = m.nombre.toLowerCase().includes(busquedaMesa.toLowerCase()) || 
                            m.mesero.toLowerCase().includes(busquedaMesa.toLowerCase());
      return coincideSeccion && coincideTexto;
    });
  }, [mesasActivas, filtroSeccion, busquedaMesa]);

  // Lógica para iniciar el cobro de una mesa
  const abrirCobroMesa = (mesa: MesaActiva) => {
    setMesaACobrar(mesa);
    setVentaSeleccionada(mesa.ventas[0]); // Por defecto selecciona la primera venta
    setMetodoPago('efectivo');
    setMontoRecibidoSimple(0);
    setPropina(0);
    setDescuento(0); // NUEVO
    setMontoEfectivo(0);
    setMontoDigital(0);
  };

  // Subtotal (consumo del cliente, sin propina ni descuento)
  const subtotalMesa = useMemo(() => {
    if (!ventaSeleccionada) return 0;
    return ventaSeleccionada.total;
  }, [ventaSeleccionada]);

  // Descuento aplicado (no negativo ni mayor al subtotal)
  const descuentoAplicado = useMemo(() => {
    return Math.min(Math.max(0, Number(descuento) || 0), subtotalMesa);
  }, [descuento, subtotalMesa]);

  // Total final a pagar = subtotal - descuento + propina
  const totalCobroMesa = useMemo(() => {
    if (!ventaSeleccionada) return 0;
    return Math.max(0, subtotalMesa - descuentoAplicado + (Number(propina) || 0));
  }, [subtotalMesa, descuentoAplicado, propina]);

  const cambioCalculado = useMemo(() => {
    let pagoTotal = 0;
    if (metodoPago === 'efectivo' || metodoPago === 'transferencia') pagoTotal = montoRecibidoSimple;
    else if (metodoPago === 'mixto') pagoTotal = montoEfectivo + montoDigital;
    return Math.max(0, pagoTotal - totalCobroMesa);
  }, [metodoPago, montoRecibidoSimple, montoEfectivo, montoDigital, totalCobroMesa]);
  
  const isPagoIncompletoMesa = useMemo(() => {
    if (metodoPago === 'efectivo' || metodoPago === 'transferencia') {
      return montoRecibidoSimple > 0 && montoRecibidoSimple < totalCobroMesa;
    }
    if (metodoPago === 'mixto') {
      const totalMixto = montoEfectivo + montoDigital;
      return totalMixto > 0 && totalMixto < totalCobroMesa;
    }
    return false; 
  }, [metodoPago, montoRecibidoSimple, totalCobroMesa, montoEfectivo, montoDigital]);

  const cobrarVentaMesa = () => {
    if (!mesaACobrar || !ventaSeleccionada) return;
    if (isPagoIncompletoMesa) {
      alert('El monto ingresado es menor al total a pagar. Por favor verifica.');
      return;
    }

    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fechaActual = new Date().toLocaleDateString() + ' - ' + horaActual;

    let detalleExtra = '';
    if (metodoPago === 'mixto') {
      const totalMixto = montoEfectivo + montoDigital;
      const vueltoMixto = Math.max(0, totalMixto - totalCobroMesa);
      detalleExtra = ` (Ef: $${montoEfectivo} / Dig: $${montoDigital})${vueltoMixto > 0 ? ` [Cambio: $${vueltoMixto}]` : ''}${propina > 0 ? ` {Propina: $${propina}}` : ''}`;
    } else if (metodoPago === 'tarjeta') {
      detalleExtra = propina > 0 ? ` {Propina: $${propina}}` : '';
    } else if ((metodoPago === 'efectivo' || metodoPago === 'transferencia') && montoRecibidoSimple > 0) {
      detalleExtra = ` (Recibido: $${montoRecibidoSimple} / Cambio: $${cambioCalculado})${propina > 0 ? ` {Propina: $${propina}}` : ''}`;
    }
    // NUEVO: reflejar descuento en el detalle del concepto
    if (descuentoAplicado > 0) {
      detalleExtra += ` [Desc: -$${descuentoAplicado}]`;
    }

    const nuevoMov: Movimiento = {
      id: Date.now().toString(),
      tipo: 'ingreso',
      concepto: `Cobro ${mesaACobrar.nombre} - ${ventaSeleccionada.cliente} - ${metodoPago.toUpperCase()}${detalleExtra}`,
      monto: totalCobroMesa,
      hora: horaActual
    };
    setMovimientos(prev => [nuevoMov, ...prev]);

    const nuevoHistorial: HistorialMesaItem = {
      id: `HM-${Date.now().toString().slice(-3)}`,
      mesa: mesaACobrar.nombre,
      seccion: mesaACobrar.seccion,
      cliente: ventaSeleccionada.cliente,
      monto: totalCobroMesa,
      mesero: mesaACobrar.mesero,
      metodoPago: (
        metodoPago === 'mixto' 
          ? `Mixto (Ef: $${montoEfectivo} / Dig: $${montoDigital})${propina > 0 ? ` + Prop: $${propina}` : ''}` 
          : metodoPago === 'tarjeta' 
            ? `Tarjeta${propina > 0 ? ` (Prop: $${propina})` : ''}` 
            : `${metodoPago.toUpperCase()}${montoRecibidoSimple > 0 ? ` (Recibido: $${montoRecibidoSimple})` : ''}${propina > 0 ? ` (Prop: $${propina})` : ''}`
      ) + (descuentoAplicado > 0 ? ` (Desc: -$${descuentoAplicado})` : ''),
      estado: 'Pagada',
      fechaApertura: fechaActual,
      fechaCierre: fechaActual,
      items: ventaSeleccionada.items
    };
    setHistorialMesas(prev => [nuevoHistorial, ...prev]);

    // Actualizar mesas: quitar la venta pagada. Si no quedan ventas, quitar la mesa.
    setMesasActivas(prev => {
      const actualizadas = prev.map(m => {
        if (m.id === mesaACobrar.id) {
          const ventasRestantes = m.ventas.filter(v => v.id !== ventaSeleccionada.id);
          return { ...m, ventas: ventasRestantes };
        }
        return m;
      }).filter(m => m.ventas.length > 0);

      // Si la mesa aún tiene ventas, seleccionar la siguiente
      const mesaActualizada = actualizadas.find(m => m.id === mesaACobrar.id);
      if (mesaActualizada && mesaActualizada.ventas.length > 0) {
        setVentaSeleccionada(mesaActualizada.ventas[0]);
      } else {
        setMesaACobrar(null);
      }
      return actualizadas;
    });

    // Limpiar montos
    setMontoEfectivo(0);
    setMontoDigital(0);
    setPropina(0);
    setDescuento(0); // NUEVO
    setMontoRecibidoSimple(0);
    setMetodoPago('efectivo');
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
                  min="0"
                  value={baseInicial}
                  onChange={(e) => setBaseInicial(Number(e.target.value.replace(/\D/g, '')) || 0)}
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

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-24 sm:pb-2">
            
            {activeTab === 'ventas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:h-full">
                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0">
                  <div className="flex items-center gap-2 mb-2.5 shrink-0">
                    <Layers size={16} className="text-[#5BC0DE]" />
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0]">Menú Rápido por Categorías</h3>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2.5 border-b border-[#3A506B] shrink-0 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {CATEGORIAS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoriaSeleccionada(cat)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                          categoriaSeleccionada === cat
                            ? 'bg-[#5BC0DE] text-[#0B132B] shadow-md'
                            : 'bg-[#0B132B] text-[#5BC0DE] border border-[#3A506B] hover:border-[#5BC0DE]/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 overflow-y-auto pr-1 max-h-[50vh] lg:max-h-none">
                    {PRODUCTOS_MOCK.filter(p => categoriaSeleccionada === 'Todas' || p.categoria === categoriaSeleccionada).map((prod) => (
                      <motion.button
                        key={prod.id}
                        onClick={() => agregarAlCarrito(prod)}
                        whileTap={{ scale: 0.95 }}
                        className={`bg-[#0B132B] border p-3 rounded-xl text-left transition-colors flex flex-col justify-between group shadow-sm ${
                          lastAddedId === prod.id ? 'border-[#5BC0DE] bg-[#5BC0DE]/10' : 'border-[#3A506B] hover:border-[#5BC0DE]'
                        }`}
                      >
                        <div>
                          <span className="text-[9px] text-[#5BC0DE] font-bold uppercase tracking-wider">{prod.categoria}</span>
                          <span className="block font-medium text-[#F4D6B0] group-hover:text-white mt-1 text-xs">{prod.nombre}</span>
                        </div>
                        <span className="text-[#5BC0DE] font-bold mt-2 text-xs sm:text-sm">${prod.precio.toLocaleString()}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0">
                  <div className="flex flex-col shrink-0 mb-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2">Comanda Rápida (Sin Mesa)</h3>
                    <input
                      type="text"
                      placeholder="Nombre del Cliente / Para llevar"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-1.5 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                    />
                  </div>
                  <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[100px] mb-2 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {carrito.length === 0 ? (
                      <div className="text-center py-6">
                        <ShoppingCart className="mx-auto text-[#5BC0DE]/40 mb-2" size={28} />
                        <p className="text-[#5BC0DE] text-xs">El carrito está vacío</p>
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
                                  onChange={(e) => actualizarCantidadItem(item.producto.id, parseInt(e.target.value.replace(/\D/g, '')) || 0)} 
                                  className="w-6 bg-transparent text-center text-xs text-[#F4D6B0] font-bold focus:outline-none" 
                                />
                                <button onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad + 1)} className="text-[#5BC0DE] hover:text-white p-0.5"><Plus size={11} /></button>
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
                      <span className="text-[#F4D6B0] text-sm">${totalCarrito.toLocaleString()}</span>
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
                        onClick={() => setModalCobroVenta(true)} 
                        className="flex-1 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 text-[#0B132B] font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                      >
                        Cobrar Comanda Rápida
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cobrar' && (
              <div className="flex flex-col gap-3 lg:h-full w-full">
                <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2.5 shrink-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] flex items-center gap-1.5">
                      <Filter size={15} className="text-[#5BC0DE]" /> Mesas Ocupadas (Toca para ver ventas)
                    </h3>
                    <div className="flex gap-1 flex-wrap">
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
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 flex-1 overflow-y-auto pr-1 max-h-[60vh] lg:max-h-none scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {mesasFiltradas.length === 0 ? (
                      <p className="text-[#5BC0DE] text-xs col-span-full text-center py-10">No hay mesas ocupadas activas.</p>
                    ) : (
                      mesasFiltradas.map((m) => {
                        const totalMesa = m.ventas.reduce((acc, v) => acc + v.total, 0);
                        return (
                          <div
                            key={m.id}
                            onClick={() => abrirCobroMesa(m)}
                            className="cursor-pointer p-2.5 rounded-xl border bg-[#0B132B] border-[#3A506B] hover:border-[#5BC0DE] transition-all flex flex-col justify-between"
                          >
                            <div className="flex justify-between items-start mb-1.5 gap-1">
                              <div className="min-w-0 pr-1">
                                <span className="font-bold text-[#F4D6B0] text-xs truncate block">{m.nombre}</span>
                                <span className="block text-[9px] text-[#5BC0DE] truncate">{m.seccion} • {m.mesero.split(' ')[0]}</span>
                              </div>
                              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[#D97706]/15 text-[#D97706] text-[9px] font-semibold">{m.ventas.length} Ventas</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-[#3A506B] text-[10px]">
                              <span className="text-[#5BC0DE]">Total Mesa:</span>
                              <span className="font-bold text-[#D97706] text-sm">${totalMesa.toLocaleString()}</span>
                            </div>
                            <button className="w-full mt-2 py-1 bg-[#5BC0DE]/10 text-[#5BC0DE] border border-[#5BC0DE]/30 rounded-lg text-[10px] font-bold hover:bg-[#5BC0DE]/20 transition-colors">
                              Gestionar Cobro
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
              <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0">
                <div className="mb-2.5 shrink-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] flex items-center gap-1.5">
                    <Calendar className="text-[#5BC0DE]" size={16} /> Historial General de Mesas
                  </h3>
                  <p className="text-[11px] text-[#5BC0DE]">Registro histórico de comandes, mesero y estado de cobro.</p>
                </div>
                <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#3A506B] rounded-xl bg-[#0B132B] min-h-0 max-h-[65vh] lg:max-h-none scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="sticky top-0 bg-[#1C2541] border-b border-[#3A506B] text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider z-10">
                      <tr>
                        <th className="py-2.5 px-3">Mesa</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Mesero</th>
                        <th className="py-2.5 px-3">Cierre</th>
                        <th className="py-2.5 px-3">Método Pago</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A506B]/60 text-xs text-[#F4D6B0]">
                      {historialMesas.map((hm) => (
                        <tr key={hm.id} className="hover:bg-[#1C2541]/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{hm.mesa}</td>
                          <td className="py-2.5 px-3 text-[#5BC0DE]">{hm.cliente}</td>
                          <td className="py-2.5 px-3">{hm.mesero}</td>
                          <td className="py-2.5 px-3 text-[#5BC0DE] text-[11px]">{hm.fechaCierre}</td>
                          <td className="py-2.5 px-3">{hm.metodoPago}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#5BC0DE]">${hm.monto.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button 
                              onClick={() => setMesaDetalleModal(hm)} 
                              className="p-1.5 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#5BC0DE] rounded-lg transition-all"
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

            {activeTab === 'movimientos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:h-full">
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
                        min="0"
                        placeholder="0" 
                        value={nuevoMovMonto} 
                        onChange={(e) => setNuevoMovMonto(e.target.value.replace(/\D/g, ''))} 
                        className="w-full bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]" 
                      />
                    </div>
                    <button type="submit" className="w-full bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-bold py-2 rounded-xl transition-all shadow-md">
                      Guardar Movimiento
                    </button>
                  </form>
                </div>
                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5">Flujo de Caja (Turno Actual)</h3>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[55vh] lg:max-h-none scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
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

            {activeTab === 'nomina' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:h-full lg:min-h-0">
                <div className="bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full overflow-y-auto max-h-[80vh] lg:max-h-none scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
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
                          min="0"
                          value={nomBase} 
                          onChange={(e) => setNomBase(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                          className="w-full bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]" 
                        />
                      </div>
                      <div>
                        <label className="text-[#5BC0DE] mb-1 block text-[11px]">Bono / Incentivo ($)</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="0" 
                          value={nomBono || ''} 
                          onChange={(e) => setNomBono(Number(e.target.value.replace(/\D/g, '')) || 0)} 
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
                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] mb-2.5 shrink-0">Pagos de Personal Registrados</h3>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[55vh] lg:max-h-none scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
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

      {/* MODAL DE COBRO PARA VENTA DIRECTA */}
      {modalCobroVenta && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl max-w-md w-full p-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[#F4D6B0] text-sm">Cobrar Comanda Rápida</h3>
              <button onClick={() => setModalCobroVenta(false)} className="text-[#5BC0DE] hover:text-[#F4D6B0]"><X size={18} /></button>
            </div>
            <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] mb-3 space-y-1">
              <div className="flex justify-between text-[#F4D6B0] font-bold text-xs">
                <span>Cliente:</span>
                <span>{nombreCliente.trim() || 'Cliente General'}</span>
              </div>
              <div className="flex justify-between text-[#5BC0DE] text-sm font-bold mt-2 pt-2 border-t border-[#3A506B]/50">
                <span>Total a Pagar:</span>
                <span className="text-[#5BC0DE]">${totalCarrito.toLocaleString()}</span>
              </div>
            </div>
            <label className="text-[11px] text-[#5BC0DE] mb-1 block font-semibold">Método de Pago</label>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {[
                { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                { id: 'transferencia', label: 'Transferencia', icon: QrCode },
                { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                { id: 'mixto', label: 'Pago Mixto', icon: Receipt },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMetodoPagoVenta(m.id as MetodoPago);
                    setMontoRecibidoVenta(0);
                    setMontoEfectivoVenta(0);
                    setMontoDigitalVenta(0);
                  }}
                  className={`flex items-center gap-1 p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    metodoPagoVenta === m.id 
                      ? 'bg-[#5BC0DE]/15 border-[#5BC0DE] text-[#5BC0DE]' 
                      : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE] hover:text-[#F4D6B0]'
                  }`}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>
            {(metodoPagoVenta === 'efectivo' || metodoPagoVenta === 'transferencia') && (
              <div className="space-y-2 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] mb-3">
                <div>
                  <label className="text-[10px] text-[#5BC0DE] block mb-1">Monto Recibido del Cliente ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="$0" 
                    value={montoRecibidoVenta || ''} 
                    onChange={(e) => setMontoRecibidoVenta(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-lg text-[#F4D6B0] text-sm focus:outline-none focus:border-[#5BC0DE]" 
                  />
                  <div className="flex gap-1 mt-2">
                    <button type="button" onClick={() => setMontoRecibidoVenta(totalCarrito)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B]">Exacto</button>
                    {[20000, 50000, 100000].map(billete => (
                      <button key={billete} type="button" onClick={() => setMontoRecibidoVenta(billete)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B]">${billete / 1000}k</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {(metodoPagoVenta === 'efectivo' || metodoPagoVenta === 'transferencia' || metodoPagoVenta === 'mixto') && (
              <div className="flex justify-between items-center px-2 pb-2 text-xs">
                <span className="text-[#5BC0DE] font-semibold">
                  {(metodoPagoVenta === 'mixto' ? (montoEfectivoVenta + montoDigitalVenta) : montoRecibidoVenta) >= totalCarrito ? 'Vuelto (Cambio):' : 'Falta por pagar:'}
                </span>
                <span className={`font-bold text-sm ${((metodoPagoVenta === 'mixto' ? (montoEfectivoVenta + montoDigitalVenta) : montoRecibidoVenta) >= totalCarrito) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${Math.abs(((metodoPagoVenta === 'mixto' ? (montoEfectivoVenta + montoDigitalVenta) : montoRecibidoVenta)) - totalCarrito).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setModalCobroVenta(false)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] font-bold py-2.5 rounded-xl text-xs transition-all">
                Cancelar
              </button>
              <button disabled={isPagoIncompletoVenta} onClick={cobrarComandaRapida} className="flex-1 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B132B] font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5">
                <CheckCircle size={15} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COBRO PARA MESAS (MÚLTIPLES VENTAS) */}
      {mesaACobrar && ventaSeleccionada && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl max-w-md w-full p-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-[#F4D6B0] text-sm">Cobrar {mesaACobrar.nombre}</h3>
              <button onClick={() => setMesaACobrar(null)} className="text-[#5BC0DE] hover:text-[#F4D6B0]"><X size={18} /></button>
            </div>

            {/* SELECTOR DE VENTAS (Pestañas) */}
            <div className="flex overflow-x-auto gap-1 pb-2 mb-2 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-[#3A506B]">
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

            <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] mb-3 space-y-1">
              <div className="flex justify-between text-[#F4D6B0] font-bold text-xs mb-1">
                <span>Cliente:</span>
                <span>{ventaSeleccionada.cliente}</span>
              </div>
              <div className="max-h-24 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B] space-y-1">
                {ventaSeleccionada.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] text-[#5BC0DE]">
                    <span>{it.cantidad}x {it.nombre}</span>
                    <span className="text-[#F4D6B0]">${(it.precio * it.cantidad).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[#5BC0DE] text-sm font-bold mt-2 pt-2 border-t border-[#3A506B]/50">
                <span>Subtotal:</span>
                <span className="text-[#5BC0DE]">${subtotalMesa.toLocaleString()}</span>
              </div>
            </div>

            <label className="text-[11px] text-[#5BC0DE] mb-1 block font-semibold">Método de Pago</label>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {[
                { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                { id: 'transferencia', label: 'Transferencia', icon: QrCode },
                { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                { id: 'mixto', label: 'Pago Mixto', icon: Receipt },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMetodoPago(m.id as MetodoPago);
                    setMontoRecibidoSimple(0);
                    setPropina(0);
                    setDescuento(0);
                    setMontoEfectivo(0);
                    setMontoDigital(0);
                  }}
                  className={`flex items-center gap-1 p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    metodoPago === m.id 
                      ? 'bg-[#5BC0DE]/15 border-[#5BC0DE] text-[#5BC0DE]' 
                      : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE] hover:text-[#F4D6B0]'
                  }`}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>

            {/* DESCUENTO Y PROPINA */}
            <div className="space-y-2.5 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] mb-3 text-xs">

              {/* DESCUENTO */}
              <div>
                <label className="text-[10px] text-[#5BC0DE] block mb-1 font-semibold">
                  Descuento ($)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="$0"
                  value={descuento || ''}
                  onChange={(e) => {
                    const raw = Number(e.target.value.replace(/\D/g, '')) || 0;
                    setDescuento(Math.min(raw, subtotalMesa));
                  }}
                  className="w-full bg-[#1C2541] border border-[#3A506B] px-2 py-1.5 rounded-lg text-[#F4D6B0] text-sm focus:outline-none focus:border-[#5BC0DE]"
                />
                <div className="flex gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setDescuento(0)}
                    className="flex-1 py-1 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B] transition-colors"
                  >
                    Sin descuento
                  </button>
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDescuento(Math.round(subtotalMesa * (pct / 100)))}
                      className={`flex-1 py-1 border rounded-md text-[10px] font-bold transition-colors ${
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
                  <p className="text-[10px] text-[#D97706] mt-1">
                    Descuento aplicado: -${descuentoAplicado.toLocaleString()}
                  </p>
                )}
              </div>

              {/* PROPINA (solo monto libre, sin %) */}
              <div className="pt-2 border-t border-[#3A506B]/50">
                <label className="text-[10px] text-[#5BC0DE] block mb-1 font-semibold">
                  Propina ($) — opcional
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="$0"
                  value={propina || ''}
                  onChange={(e) => setPropina(Number(e.target.value.replace(/\D/g, '')) || 0)}
                  className="w-full bg-[#1C2541] border border-[#3A506B] px-2 py-1.5 rounded-lg text-[#F4D6B0] text-sm focus:outline-none focus:border-[#5BC0DE]"
                />
              </div>

              {/* RESUMEN */}
              <div className="pt-2 border-t border-[#3A506B]/50 space-y-1">
                <div className="flex justify-between text-[11px] text-[#5BC0DE]">
                  <span>Subtotal:</span>
                  <span className="text-[#F4D6B0]">${subtotalMesa.toLocaleString()}</span>
                </div>
                {descuentoAplicado > 0 && (
                  <div className="flex justify-between text-[11px] text-[#D97706]">
                    <span>Descuento:</span>
                    <span>-${descuentoAplicado.toLocaleString()}</span>
                  </div>
                )}
                {propina > 0 && (
                  <div className="flex justify-between text-[11px] text-[#5BC0DE]">
                    <span>Propina:</span>
                    <span>+${Number(propina).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#3A506B]/50">
                  <span className="text-[#5BC0DE]">Total a Pagar:</span>
                  <span className="text-[#5BC0DE]">${totalCobroMesa.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {(metodoPago === 'efectivo' || metodoPago === 'transferencia') && (
              <div className="space-y-2 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] mb-3">
                <div>
                  <label className="text-[10px] text-[#5BC0DE] block mb-1">Monto Recibido del Cliente ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="$0" 
                    value={montoRecibidoSimple || ''} 
                    onChange={(e) => setMontoRecibidoSimple(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-2 rounded-lg text-[#F4D6B0] text-sm focus:outline-none focus:border-[#5BC0DE]" 
                  />
                  <div className="flex gap-1 mt-2">
                    <button type="button" onClick={() => setMontoRecibidoSimple(totalCobroMesa)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B]">Exacto</button>
                    {[20000, 50000, 100000].map(billete => (
                      <button key={billete} type="button" onClick={() => setMontoRecibidoSimple(billete)} className="flex-1 py-1.5 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B]">${billete / 1000}k</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {metodoPago === 'mixto' && (
              <div className="space-y-2 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] mb-3">
                <div>
                  <label className="text-[10px] text-[#5BC0DE]">Efectivo ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="$0" 
                    value={montoEfectivo || ''} 
                    onChange={(e) => setMontoEfectivo(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-1.5 rounded-lg text-[#F4D6B0] text-sm focus:outline-none focus:border-[#5BC0DE]" 
                  />
                  <div className="flex gap-1 mt-1.5">
                    <button type="button" onClick={() => setMontoEfectivo(Math.max(0, totalCobroMesa - montoDigital))} className="flex-1 py-1 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B]">Resto</button>
                    {[20000, 50000, 100000].map(billete => (
                      <button key={billete} type="button" onClick={() => setMontoEfectivo(billete)} className="flex-1 py-1 bg-[#1C2541] border border-[#3A506B] rounded-md text-[10px] font-bold text-[#5BC0DE] hover:bg-[#3A506B]">${billete / 1000}k</button>
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-[10px] text-[#5BC0DE]">Digital/Tarjeta ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="$0" 
                    value={montoDigital || ''} 
                    onChange={(e) => setMontoDigital(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-[#1C2541] border border-[#3A506B] px-3 py-1.5 rounded-lg text-[#F4D6B0] text-sm focus:outline-none focus:border-[#5BC0DE]" 
                  />
                </div>
              </div>
            )}

            {(metodoPago === 'efectivo' || metodoPago === 'transferencia' || metodoPago === 'mixto') && (
              <div className="flex justify-between items-center px-2 pb-2 text-xs">
                <span className="text-[#5BC0DE] font-semibold">
                  {(metodoPago === 'mixto' ? (montoEfectivo + montoDigital) : montoRecibidoSimple) >= totalCobroMesa ? 'Vuelto (Cambio):' : 'Falta por pagar:'}
                </span>
                <span className={`font-bold text-sm ${((metodoPago === 'mixto' ? (montoEfectivo + montoDigital) : montoRecibidoSimple) >= totalCobroMesa) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${Math.abs(((metodoPago === 'mixto' ? (montoEfectivo + montoDigital) : montoRecibidoSimple)) - totalCobroMesa).toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button onClick={() => setMesaACobrar(null)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] font-bold py-2.5 rounded-xl text-xs transition-all">
                Cancelar
              </button>
              <button disabled={isPagoIncompletoMesa} onClick={cobrarVentaMesa} className="flex-1 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B132B] font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5">
                <CheckCircle size={15} /> Cobrar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {mesaDetalleModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl max-w-sm w-full p-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="font-bold text-[#F4D6B0] text-xs">Detalle {mesaDetalleModal.mesa} ({mesaDetalleModal.seccion})</h3>
              <button onClick={() => setMesaDetalleModal(null)} className="text-[#5BC0DE] hover:text-[#F4D6B0] font-bold"><X size={15} /></button>
            </div>
            <div className="text-xs font-bold text-[#5BC0DE] mb-1">Cliente: <span className="text-[#F4D6B0]">{mesaDetalleModal.cliente}</span></div>
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

      {modalTurno && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl max-w-sm w-full p-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
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
                  min="0"
                  value={baseInicial} 
                  onChange={(e) => setBaseInicial(Number(e.target.value.replace(/\D/g, '')) || 0)} 
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