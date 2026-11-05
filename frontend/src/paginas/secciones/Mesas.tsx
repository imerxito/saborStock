import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Clock, Plus, Minus, CheckCircle2, X, Search, ChefHat, 
  AlertCircle, LayoutGrid, Filter, ArrowRight, ArrowLeft, Trash2, 
  Receipt, Sparkles, ShoppingBag, RotateCw, Settings, Edit, List, Printer, CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexto/AuthContexto';
import { useComandas } from '../../contexto/ComandasContexto';
import { MesaServicio, type SeccionBackend } from '../../servicios/MesaServicio';
import type { MesaBackend, ProductoBackend } from '../../tipos/Comanda';
import ConfiguracionMesas from './ConfiguracionMesas';

// --- TIPOS DE DATOS ---
export type CategoriaProducto = 'Platos Fuertes' | 'Comidas Rápidas' | 'Entradas' | 'Bebidas' | 'Postres';

export interface Producto {
  id: string;
  idProducto?: number;
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

export interface Pedido {
  id: string;
  comandaId?: number;
  mesaId: string;
  numeroMesa: number;
  cliente: string;
  mesero: string;
  horaEstimada: string;
  personas: number;
  notasIniciales?: string;
  items: ItemPedido[];
  total: number;
  estado: 'En preparación' | 'Listo' | 'Entregado' | 'Pagando';
}

export interface Mesa {
  id: string;
  idBackend: number;
  numero: number;
  seccion: string;
  capacidad: number;
  estado: 'Disponible' | 'Ocupada' | 'Reservada' | 'Pagando';
  pedidosActuales: Pedido[];
}

const MENU_RESPALDO: Producto[] = [
  { id: 'p1', idProducto: 1, nombre: 'Bandeja Paisa Tradicional', precio: 34000, categoria: 'Platos Fuertes', descripcion: 'Chicharrón crujiente, carne molida, huevo, arepa y aguacate.' },
  { id: 'p2', idProducto: 2, nombre: 'Sancocho de Gallina Criolla', precio: 28000, categoria: 'Platos Fuertes', descripcion: 'Servido con arroz, banano, aguacate y arepa dorada.' },
  { id: 'p3', idProducto: 3, nombre: 'Lomo al Trapo (300g)', precio: 42000, categoria: 'Platos Fuertes', descripcion: 'Corte magro a la parrilla con papas al vapor.' },
  { id: 'p4', idProducto: 4, nombre: 'Hamburguesa Artesanal Doble', precio: 26000, categoria: 'Comidas Rápidas', descripcion: 'Pan brioche, queso cheddar doble y tocineta.' },
  { id: 'p5', idProducto: 5, nombre: 'Salchipapa Especial Gigante', precio: 22000, categoria: 'Comidas Rápidas', descripcion: 'Papas, salchicha manguera, queso costeño.' },
  { id: 'p6', idProducto: 6, nombre: 'Arepa de Choclo con Queso', precio: 12000, categoria: 'Entradas', descripcion: 'Queso doble crema fundido.' },
  { id: 'p7', idProducto: 7, nombre: 'Empanadas Criollas (5 uds)', precio: 10000, categoria: 'Entradas', descripcion: 'Rellenas de carne y papa.' },
  { id: 'p8', idProducto: 8, nombre: 'Jugo Natural en Agua / Leche', precio: 8500, categoria: 'Bebidas', descripcion: 'Mango, Maracuyá, Lulo, Mora.' },
  { id: 'p9', idProducto: 9, nombre: 'Limonada de Coco Cremosita', precio: 11000, categoria: 'Bebidas', descripcion: 'Crema de coco natural.' },
  { id: 'p10', idProducto: 10, nombre: 'Cerveza Club Colombia', precio: 7500, categoria: 'Bebidas', descripcion: 'Botella helada 330ml.' },
  { id: 'p11', idProducto: 11, nombre: 'Tres Leches de la Casa', precio: 12000, categoria: 'Postres', descripcion: 'Bizcocho húmedo con canela.' },
];

const CATEGORIAS: CategoriaProducto[] = ['Platos Fuertes', 'Comidas Rápidas', 'Entradas', 'Bebidas', 'Postres'];

export default function Mesas() {
  const { usuario } = useAuth();
  const { comandas, crear, cambiarEstado, recargar, conectadoBackend } = useComandas();

  const [mesasRaw, setMesasRaw] = useState<MesaBackend[]>([]);
  const [seccionesRaw, setSeccionesRaw] = useState<SeccionBackend[]>([]);
  const [productosMenu, setProductosMenu] = useState<Producto[]>(MENU_RESPALDO);
  
  // Filtro de Zona
  const [seccionFiltro, setSeccionFiltro] = useState<string>('Todas');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [configAbierta, setConfigAbierta] = useState(false);
  
  // Permisos
  const rol = String(usuario?.rol ?? '').toLowerCase();
  const esAdminODueno = rol.includes('due') || rol.includes('admin');
  const esCajero = rol.includes('caja');
  const puedeLiberar = esAdminODueno || esCajero;

  // Modal
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [pasoModal, setPasoModal] = useState<'lista' | 'info' | 'menu'>('lista');
  const [pedidoActivoId, setPedidoActivoId] = useState<string | null>(null);

  // Formulario
  const [nombreCliente, setNombreCliente] = useState('');
  const [horaEstimada, setHoraEstimada] = useState('09:30 p. m.');
  const [personas, setPersonas] = useState(2);
  const [notasMesa, setNotasMesa] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaProducto>('Platos Fuertes');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);

  // ESTADOS DE IMPRESIÓN Y PAGO
  const [pedidosPagando, setPedidosPagando] = useState<Set<number>>(new Set());
  const [comandaAImprimir, setComandaAImprimir] = useState<Pedido | null>(null);

  // Lógica para deslizar las categorías
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Efecto para lanzar la impresión cuando los datos del ticket estén listos
  useEffect(() => {
    if (comandaAImprimir) {
      // Pequeño delay para asegurar que el DOM se haya actualizado con el ticket
      const timer = setTimeout(() => {
        window.print();
        setComandaAImprimir(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [comandaAImprimir]);

  // Cargar datos
  const cargarDatosBackend = useCallback(async () => {
    setCargando(true);
    try {
      const [mesasData, prodsData, secsData] = await Promise.all([
        MesaServicio.listarMesas(),
        MesaServicio.obtenerProductos(),
        MesaServicio.obtenerSecciones()
      ]);

      setMesasRaw(mesasData);
      setSeccionesRaw(secsData);

      if (prodsData && prodsData.length > 0) {
        const prodsMapeados: Producto[] = prodsData.map((p) => {
          let cat: CategoriaProducto = 'Platos Fuertes';
          const nom = p.nombre.toLowerCase();
          if (nom.includes('hamburguesa') || nom.includes('salchipapa') || nom.includes('perro')) cat = 'Comidas Rápidas';
          else if (nom.includes('arepa') || nom.includes('empanada') || nom.includes('patacón')) cat = 'Entradas';
          else if (nom.includes('jugo') || nom.includes('limonada') || nom.includes('cerveza') || nom.includes('gaseosa')) cat = 'Bebidas';
          else if (nom.includes('leches') || nom.includes('flan') || nom.includes('postre')) cat = 'Postres';
          return { id: `p-${p.id_producto}`, idProducto: p.id_producto, nombre: p.nombre, precio: p.precio_venta, categoria: cat, descripcion: p.descripcion };
        });
        setProductosMenu(prodsMapeados);
      }
    } catch (e) {
      console.warn('Error al cargar:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargarDatosBackend(); }, [cargarDatosBackend]);

  // ORDEN DE LAS ZONAS
  const seccionesDisponibles = useMemo(() => {
    const prioridadZonas: Record<string, number> = {
      'Piscina': 1, 'Terraza': 2, 'Salón Principal': 3, 'Salón': 3, 'Entrada': 4, 'VIP': 5
    };
    let nombresZonas: string[] = seccionesRaw.length > 0 ? seccionesRaw.map(s => s.nombre) : Array.from(new Set(mesasRaw.map(m => m.seccionNombre).filter(Boolean) as string[]));
    if (nombresZonas.length === 0) nombresZonas = ['Salón', 'Piscina', 'Terraza', 'Entrada'];
    const zonasOrdenadas = [...nombresZonas].sort((a, b) => (prioridadZonas[a] || 99) - (prioridadZonas[b] || 99) || a.localeCompare(b));
    return ['Todas', ...zonasOrdenadas];
  }, [mesasRaw, seccionesRaw]);

  // Lógica de cruce de mesas
  const mesas = useMemo<Mesa[]>(() => {
    return mesasRaw.map((m) => {
      const comandasActivas = comandas.filter(
        (c) => (c.idMesa === m.id || c.mesa === m.numero) && c.estado !== 'Entregada' && c.estado !== 'Cerrado'
      );

      const pedidosActuales: Pedido[] = comandasActivas.map((c) => {
        const isPagando = pedidosPagando.has(c.id);
        const itemsPedido: ItemPedido[] = c.items.map((it) => {
          const prodCatalogo = productosMenu.find(p => p.idProducto === it.idProducto || p.nombre === it.producto) || {
            id: `p-${it.idProducto ?? 0}`, idProducto: it.idProducto, nombre: it.producto, precio: it.precio || 0, categoria: 'Platos Fuertes' as CategoriaProducto,
          };
          return { producto: prodCatalogo, cantidad: it.cantidad, notas: it.nota };
        });

        return {
          id: `CMD-#${c.id}`,
          comandaId: c.id,
          mesaId: String(m.id),
          numeroMesa: m.numero,
          cliente: c.cliente || 'Cliente General',
          mesero: c.mesero || 'Sin asignar',
          horaEstimada: new Date(c.creada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }),
          personas: c.personas || 2,
          notasIniciales: c.nota,
          items: itemsPedido,
          total: itemsPedido.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0),
          estado: isPagando ? 'Pagando' : (c.estado === 'Lista' ? 'Listo' : c.estado === 'Entregada' ? 'Entregado' : 'En preparación'),
        };
      });

      // Lógica: Si se agrega una nueva, la mesa vuelve a ocupada
      let estadoMesa: Mesa['estado'] = 'Disponible';
      if (pedidosActuales.length > 0) {
        const todasPagando = pedidosActuales.every(p => p.estado === 'Pagando');
        estadoMesa = todasPagando ? 'Pagando' : 'Ocupada';
      } else if (m.estado === 'Reservada') {
        estadoMesa = 'Reservada';
      }

      return {
        id: String(m.id),
        idBackend: m.id,
        numero: m.numero,
        seccion: m.seccionNombre || 'Salón Principal',
        capacidad: m.numero === 5 || m.numero === 8 ? 8 : m.numero % 2 === 0 ? 6 : 4,
        estado: estadoMesa,
        pedidosActuales,
      };
    });
  }, [mesasRaw, comandas, productosMenu, pedidosPagando]);

  const mesasDeZona = useMemo(() => {
    return mesas.filter((m) => seccionFiltro === 'Todas' || m.seccion === seccionFiltro);
  }, [mesas, seccionFiltro]);

  // Acciones
  const abrirMesa = (mesa: Mesa) => {
    setMesaSeleccionada(mesa);
    if (mesa.pedidosActuales.length > 0) {
      setPasoModal('lista');
      setPedidoActivoId(mesa.pedidosActuales[0].id);
    } else {
      iniciarNuevaComanda(mesa);
    }
  };

  const iniciarNuevaComanda = (mesa: Mesa) => {
    setNombreCliente('');
    setHoraEstimada(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }));
    setPersonas(mesa.capacidad);
    setNotasMesa('');
    setCarrito([]);
    setPasoModal('info');
  };

  const cargarComandaParaEditar = (pedido: Pedido) => {
    setNombreCliente(pedido.cliente);
    setHoraEstimada(pedido.horaEstimada);
    setPersonas(pedido.personas);
    setNotasMesa(pedido.notasIniciales || '');
    setCarrito(pedido.items);
    setPasoModal('menu');
  };

  const cerrarModal = () => setMesaSeleccionada(null);

  const modificarCantidad = (producto: Producto, cambio: number) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id);
      if (!existe) return cambio > 0 ? [...prev, { producto, cantidad: 1 }] : prev;
      const nuevaCantidad = existe.cantidad + cambio;
      if (nuevaCantidad <= 0) return prev.filter((item) => item.producto.id !== producto.id);
      return prev.map((item) => item.producto.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item);
    });
  };

  const guardarPedido = async () => {
    if (!mesaSeleccionada || carrito.length === 0) return;
    setGuardando(true);
    try {
      await crear({
        mesa: mesaSeleccionada.numero,
        idMesa: mesaSeleccionada.idBackend,
        items: carrito.map((it) => ({
          idProducto: it.producto.idProducto, producto: it.producto.nombre, cantidad: it.cantidad, precio: it.producto.precio, categoria: it.producto.categoria, nota: it.notas,
        })),
        nota: notasMesa.trim(),
        mesero: usuario?.nombre?.trim() || 'Sin asignar', 
        cliente: nombreCliente.trim() || 'Cliente General',
        personas: personas,
      });

      await MesaServicio.actualizarMesa(mesaSeleccionada.idBackend, { estado: 'Ocupada' });
      await recargar();
      await cargarDatosBackend();
      cerrarModal();
    } catch (err) {
      console.error(err);
      alert('Error al enviar comanda.');
    } finally {
      setGuardando(false);
    }
  };

  const liberarMesa = async (mesaId: string) => {
    const mesaTarget = mesas.find((m) => m.id === mesaId);
    if (!mesaTarget) return;
    if (!window.confirm(`¿Deseas liberar y despachar la Mesa ${mesaTarget.numero}?`)) return;

    setGuardando(true);
    try {
      for (const pedido of mesaTarget.pedidosActuales) {
        if (pedido.comandaId) {
          await cambiarEstado(pedido.comandaId, 'Entregada');
          setPedidosPagando(prev => { const next = new Set(prev); next.delete(pedido.comandaId!); return next; });
        }
      }
      await MesaServicio.actualizarMesa(mesaTarget.idBackend, { estado: 'Libre' });
      await recargar();
      await cargarDatosBackend();
      cerrarModal();
    } catch (err) {
      console.error('Error al liberar mesa:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Función que se encarga de preparar la comanda individual para impresión
  const imprimirComanda = (pedido: Pedido) => {
    setComandaAImprimir(pedido);
    if (pedido.comandaId) {
      setPedidosPagando(prev => new Set(prev).add(pedido.comandaId!));
    }
  };

  const totalCarrito = useMemo(() => carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0), [carrito]);

  const getBordeMesa = (estado: Mesa['estado']) => {
    switch (estado) {
      case 'Disponible': return 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)] bg-[#1C2541]';
      case 'Ocupada': return 'border-[#D97706] shadow-[0_0_12px_rgba(217,119,6,0.25)] bg-[#1C2541]';
      case 'Pagando': return 'border-[#5BC0DE] shadow-[0_0_12px_rgba(91,192,222,0.3)] bg-[#1C2541]';
      case 'Reservada': return 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.25)] bg-[#1C2541]';
      default: return 'border-[#3A506B] bg-[#1C2541]';
    }
  };

  return (
    <>
      {/* OCULTAR TODA LA PANTALLA AL IMPRIMIR Y MOSTRAR SOLO EL TICKET */}
      <div className="h-full w-full flex flex-col bg-[#0B132B] text-[#F4D6B0] p-3 md:p-6 font-sans antialiased overflow-hidden print:hidden">
        
        {/* HEADER */}
        <header className="shrink-0 bg-[#1C2541] mb-3 border border-[#3A506B] pb-4 px-4 pt-4 rounded-xl shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B132B] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE] shadow-md">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-bold text-[#F4D6B0] tracking-tight">Gestión de Mesas</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${conectadoBackend ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${conectadoBackend ? 'bg-emerald-400 animate-pulse' : 'bg-[#D97706]'}`} />
                    {conectadoBackend ? 'Backend' : 'Local'}
                  </span>
                </div>
                <p className="text-[11px] text-[#3A506B] hidden sm:block">Control de disponibilidad y pedidos sincronizados.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#0B132B] p-1 rounded-xl border border-[#3A506B]">
                <div className="px-2.5 py-1 rounded-lg text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Disp: {mesasDeZona.filter((m) => m.estado === 'Disponible').length}
                </div>
                <div className="px-2.5 py-1 rounded-lg text-[#D97706] text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Ocup: {mesasDeZona.filter((m) => m.estado === 'Ocupada').length}
                </div>
                <div className="px-2.5 py-1 rounded-lg text-[#5BC0DE] text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5BC0DE]" /> Pagando: {mesasDeZona.filter((m) => m.estado === 'Pagando').length}
                </div>
              </div>

              <button onClick={() => { void recargar(); void cargarDatosBackend(); }} disabled={cargando} className="p-2 rounded-xl bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] hover:text-white hover:border-[#5BC0DE] transition-colors">
                <RotateCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              </button>
              {esAdminODueno && (
                <button onClick={() => setConfigAbierta(true)} className="p-2 rounded-xl bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] hover:text-white hover:border-[#5BC0DE] transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#3A506B]/50 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] font-bold text-[#5BC0DE] flex items-center gap-1 shrink-0 w-16">
                <Filter className="w-3 h-3" /> Zona:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {seccionesDisponibles.map((sec) => (
                  <button key={sec} onClick={() => setSeccionFiltro(sec)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border ${seccionFiltro === sec ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-md' : 'bg-[#0B132B] text-[#F4D6B0] border-[#3A506B] hover:bg-[#3A506B]/50'}`}>
                    {sec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* GRID DE MESAS */}
        <main className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {mesasDeZona.map((mesa) => {
              const estaOcupada = mesa.estado === 'Ocupada' || mesa.estado === 'Pagando';
              const estaPagando = mesa.estado === 'Pagando';

              return (
                <div 
                  key={mesa.id} 
                  onClick={() => abrirMesa(mesa)} 
                  className={`group relative rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between hover:-translate-y-1 ${getBordeMesa(mesa.estado)}`}
                >
                  
                  <div className="p-3.5 flex items-center justify-between bg-[#0B132B]/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-lg transition-colors bg-[#0B132B] ${estaPagando ? 'border-[#5BC0DE] text-[#5BC0DE]' : estaOcupada ? 'border-[#D97706] text-[#D97706]' : 'border-emerald-500 text-emerald-400'}`}>
                        {mesa.numero}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#5BC0DE] font-bold uppercase tracking-wider">{mesa.seccion}</span>
                        {estaOcupada && (
                          <span className="text-[11px] text-[#F4D6B0] flex items-center gap-1 mt-0.5 font-semibold">
                            <Users className="w-3.5 h-3.5" /> {mesa.pedidosActuales[0]?.mesero || 'Sin asignar'}
                          </span>
                        )}
                        {!estaOcupada && (
                           <span className="text-[11px] text-[#3A506B] mt-0.5">Capacidad: {mesa.capacidad} pers.</span>
                        )}
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                      estaPagando ? 'bg-[#5BC0DE]/20 text-[#5BC0DE] border-[#5BC0DE]/40' : 
                      estaOcupada ? 'bg-[#D97706]/20 text-[#D97706] border-[#D97706]/40' : 
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {estaPagando ? 'Pagando' : mesa.estado}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col items-center justify-center">
                     {estaOcupada ? (
                       <div className="flex flex-col items-center gap-2">
                          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${estaPagando ? 'bg-[#5BC0DE]/10 text-[#5BC0DE] border-[#5BC0DE]/30' : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30'}`}>
                             {estaPagando ? <CreditCard className="w-5 h-5" /> : <List className="w-5 h-5" />}
                             <span className="font-bold text-sm">{mesa.pedidosActuales.length} Comanda(s)</span>
                          </div>
                          <span className="text-xs text-[#F4D6B0] font-semibold">Total: ${mesa.pedidosActuales.reduce((a,b)=>a+b.total, 0).toLocaleString('es-CO')}</span>
                       </div>
                     ) : (
                       <div className="text-[#3A506B] text-sm italic flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Lista para recibir clientes
                       </div>
                     )}
                  </div>

                  <div className="p-2 bg-[#0B132B]/80 border-t border-[#3A506B] flex justify-between items-center group-hover:bg-[#5BC0DE] transition-colors">
                    <div className="flex gap-1">
                       {estaOcupada && puedeLiberar && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); liberarMesa(mesa.id); }}
                           className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors group-hover:text-[#0B132B]"
                           title="Liberar / Despachar Mesa"
                         >
                           <CheckCircle2 className="w-4 h-4" />
                         </button>
                       )}
                    </div>
                    <div className="flex items-center">
                       {estaOcupada ? <Edit className="w-4 h-4 text-[#D97706] group-hover:text-[#0B132B]" /> : <Plus className="w-4 h-4 text-[#5BC0DE] group-hover:text-[#0B132B]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* MODALES */}
        {esAdminODueno && <ConfiguracionMesas abierto={configAbierta} onCerrar={() => setConfigAbierta(false)} onActualizado={() => { void recargar(); void cargarDatosBackend(); }} />}

        {mesaSeleccionada && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
            <div className="bg-[#1C2541] border border-[#3A506B] rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
              
              <div className="p-4 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#5BC0DE] text-[#0B132B] flex items-center justify-center font-black text-xl shadow-md">
                    {mesaSeleccionada.numero}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-[#F4D6B0]">Mesa {mesaSeleccionada.numero}</h2>
                      <span className="text-xs bg-[#1C2541] border border-[#3A506B] text-[#5BC0DE] px-2.5 py-0.5 rounded-full font-semibold">{mesaSeleccionada.seccion}</span>
                    </div>
                    <p className="text-xs text-[#5BC0DE] mt-0.5">
                      {pasoModal === 'lista' ? 'Detalle de comandas' : pasoModal === 'info' ? 'Nueva comanda' : 'Agregar productos'}
                    </p>
                  </div>
                </div>
                <button onClick={cerrarModal} className="p-2 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-[#1C2541]">
                
                {pasoModal === 'lista' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-[#F4D6B0] font-bold text-sm">Comandas Activas</h3>
                       <button onClick={() => iniciarNuevaComanda(mesaSeleccionada)} className="flex items-center gap-1 bg-[#5BC0DE] text-[#0B132B] px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-[#4CA8C4]">
                          <Plus className="w-4 h-4" /> Nueva Comanda
                       </button>
                    </div>

                    <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#3A506B]">
                      {mesaSeleccionada.pedidosActuales.map((pedido, idx) => (
                        <button
                          key={pedido.id}
                          onClick={() => setPedidoActivoId(pedido.id)}
                          className={`px-4 py-2 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
                            pedidoActivoId === pedido.id
                              ? 'bg-[#5BC0DE]/10 border-[#5BC0DE] text-[#5BC0DE]'
                              : 'bg-[#0B132B] border-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B]/50'
                          }`}
                        >
                          {idx === 0 ? 'Principal' : `Comanda #${pedido.comandaId}`}
                          <span className="text-[10px] bg-[#0B132B] px-1.5 py-0.5 rounded text-[#F4D6B0]">{pedido.items.reduce((a,b)=>a+b.cantidad,0)}</span>
                        </button>
                      ))}
                    </div>
                    
                    {mesaSeleccionada.pedidosActuales.map(pedido => {
                      if (pedido.id !== pedidoActivoId) return null;
                      return (
                        <div key={pedido.id} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[#5BC0DE] font-bold font-mono text-sm">{pedido.id}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${pedido.estado === 'Pagando' ? 'bg-[#5BC0DE] text-[#0B132B]' : 'bg-[#3A506B] text-[#F4D6B0]'}`}>
                                  {pedido.estado}
                                </span>
                              </div>
                              <p className="text-xs text-[#F4D6B0]">Cliente: <span className="font-bold">{pedido.cliente}</span> ({pedido.personas} pers.)</p>
                              <p className="text-xs text-[#5BC0DE] mt-0.5">Atendido por: <span className="font-bold">{pedido.mesero}</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-[#D97706] font-bold font-mono text-lg">${pedido.total.toLocaleString('es-CO')}</p>
                            </div>
                          </div>
                          
                          <div className="border-t border-[#3A506B] pt-3">
                             <h4 className="text-xs font-bold text-[#5BC0DE] mb-2 uppercase tracking-wide">Productos</h4>
                             <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                               {pedido.items.map((item, i) => (
                                 <div key={i} className="flex justify-between text-xs border-b border-[#3A506B]/30 pb-1">
                                   <span className="text-[#F4D6B0]">{item.cantidad}x {item.producto.nombre}</span>
                                   <span className="text-[#5BC0DE] font-mono">${(item.producto.precio * item.cantidad).toLocaleString('es-CO')}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-2 border-t border-[#3A506B]">
                             <button onClick={() => cargarComandaParaEditar(pedido)} className="text-xs font-bold text-[#5BC0DE] hover:bg-[#5BC0DE]/10 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                               <Edit className="w-3.5 h-3.5" /> Editar / Agregar
                             </button>
                             <button 
                               onClick={() => imprimirComanda(pedido)} // Aquí se llama la función con TODO el pedido
                               disabled={pedido.estado === 'Pagando'}
                               className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${pedido.estado === 'Pagando' ? 'bg-[#5BC0DE]/20 text-[#5BC0DE] opacity-50 cursor-not-allowed' : 'text-[#D97706] hover:bg-[#D97706]/10'}`}
                             >
                               <Printer className="w-3.5 h-3.5" /> {pedido.estado === 'Pagando' ? 'Impreso' : 'Imprimir / Pagar'}
                             </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {pasoModal === 'info' && (
                  <div className="max-w-2xl mx-auto space-y-5 py-2">
                    <div className="bg-[#0B132B] p-4 rounded-2xl border border-[#3A506B] flex items-center gap-3 text-xs text-[#5BC0DE]">
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <span>Ingresa los datos iniciales para abrir una nueva comanda en la mesa.</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#F4D6B0] mb-1.5">Nombre del Cliente</label>
                      <input type="text" placeholder="Ej. Juan Pérez" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] font-bold p-3.5 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#F4D6B0] mb-1.5">Hora Estimada</label>
                        <div className="relative">
                          <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                          <input type="text" value={horaEstimada} onChange={(e) => setHoraEstimada(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] font-bold pl-10 pr-3.5 py-3.5 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#F4D6B0] mb-1.5">Personas</label>
                        <div className="flex items-center gap-3 bg-[#0B132B] p-2 rounded-xl border border-[#3A506B]">
                          <button onClick={() => setPersonas(p => Math.max(1, p - 1))} className="p-2 rounded-lg bg-[#1C2541] text-[#5BC0DE] hover:bg-[#3A506B]"><Minus className="w-4 h-4" /></button>
                          <span className="flex-1 text-center font-black text-[#F4D6B0]">{personas}</span>
                          <button onClick={() => setPersonas(p => p + 1)} className="p-2 rounded-lg bg-[#1C2541] text-[#5BC0DE] hover:bg-[#3A506B]"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#F4D6B0] mb-1.5">Notas</label>
                      <textarea rows={2} placeholder="Alergias, observaciones..." value={notasMesa} onChange={(e) => setNotasMesa(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] font-bold p-3.5 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] focus:outline-none" />
                    </div>
                  </div>
                )}

                {pasoModal === 'menu' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                        <input type="text" placeholder="Buscar producto..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] pl-10 pr-4 py-3 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] focus:outline-none text-sm" />
                      </div>

                      <div 
                        ref={scrollRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className={`flex items-center gap-2 overflow-x-auto pb-2 select-none [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#3A506B] [&::-webkit-scrollbar-thumb]:rounded-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                      >
                        {CATEGORIAS.map((cat) => (
                          <button 
                            key={cat} 
                            onClick={() => {
                              if(!isDragging) setCategoriaActiva(cat);
                            }} 
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${categoriaActiva === cat ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-md' : 'bg-[#0B132B] text-[#F4D6B0] border-[#3A506B] hover:bg-[#3A506B]'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                        {productosMenu.filter((p) => busquedaProducto ? p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) : p.categoria === categoriaActiva).map((producto) => {
                          const itemEnCarrito = carrito.find((i) => i.producto.id === producto.id);
                          return (
                            <div key={producto.id} className="bg-[#0B132B] border border-[#3A506B] p-3.5 rounded-2xl flex flex-col justify-between gap-3 hover:border-[#5BC0DE]/50 transition-colors">
                              <div>
                                <h4 className="font-bold text-[#F4D6B0] text-sm">{producto.nombre}</h4>
                                {producto.descripcion && <p className="text-[11px] text-[#3A506B] line-clamp-2 mt-1">{producto.descripcion}</p>}
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-[#3A506B]/60">
                                <span className="font-mono font-bold text-sm text-[#5BC0DE]">${producto.precio.toLocaleString('es-CO')}</span>
                                <div className="flex items-center gap-1.5 bg-[#1C2541] p-1 rounded-xl border border-[#3A506B]">
                                  <button onClick={() => modificarCantidad(producto, -1)} className="p-1 rounded-lg text-[#F4D6B0] hover:text-white hover:bg-[#3A506B]"><Minus className="w-3.5 h-3.5" /></button>
                                  <span className="w-5 text-center text-xs font-black text-[#F4D6B0]">{itemEnCarrito ? itemEnCarrito.cantidad : 0}</span>
                                  <button onClick={() => modificarCantidad(producto, 1)} className="p-1 rounded-lg bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4]"><Plus className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-[#F4D6B0] text-[#0B132B] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl border border-[#D97706]/30">
                      <div className="space-y-3">
                        <div className="border-b-2 border-dashed border-[#0B132B]/20 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ChefHat className="w-5 h-5 text-[#D97706]" />
                              <span className="font-black text-base uppercase tracking-tight">Comanda Nueva</span>
                            </div>
                            <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded">{horaEstimada}</span>
                          </div>
                          <div className="text-xs font-bold text-[#0B132B]/80 mt-1">Cliente: <span className="text-[#0B132B]">{nombreCliente || 'Cliente General'}</span></div>
                          <div className="text-xs font-bold text-[#0B132B]/80 mt-1">Atendido por: <span className="text-[#0B132B]">{usuario?.nombre || 'Sin asignar'}</span></div>
                        </div>

                        {carrito.length === 0 ? (
                          <div className="text-center py-12 text-xs text-[#3A506B] italic"><ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#D97706]" />Selecciona ítems del menú.</div>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {carrito.map((item) => (
                              <div key={item.producto.id} className="flex items-center justify-between text-xs font-bold border-b border-[#0B132B]/10 pb-1.5">
                                <div className="pr-2"><div>{item.producto.nombre}</div><div className="text-[10px] text-[#3A506B] font-mono font-normal">${item.producto.precio.toLocaleString('es-CO')} c/u</div></div>
                                <div className="flex items-center gap-2 shrink-0"><span className="bg-[#0B132B] text-[#F4D6B0] px-2 py-0.5 rounded text-[10px] font-mono font-bold">x{item.cantidad}</span><span className="font-mono font-bold text-[#0B132B]">${(item.producto.precio * item.cantidad).toLocaleString('es-CO')}</span></div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t-2 border-dashed border-[#0B132B]/20 mt-4 space-y-2">
                        <div className="flex items-center justify-between font-black text-lg"><span>Total:</span><span className="text-[#D97706] font-mono">${totalCarrito.toLocaleString('es-CO')}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 bg-[#0B132B] border-t border-[#3A506B] flex items-center justify-between shrink-0">
                <div>
                  {pasoModal === 'lista' && <button onClick={cerrarModal} className="text-xs font-bold text-[#5BC0DE] hover:text-white">Cerrar</button>}
                  {pasoModal !== 'lista' && <button onClick={() => mesaSeleccionada.pedidosActuales.length > 0 ? setPasoModal('lista') : cerrarModal()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#5BC0DE] hover:bg-[#3A506B]"><ArrowLeft className="w-4 h-4" /> Volver</button>}
                </div>

                <div className="flex items-center gap-3">
                  {pasoModal === 'lista' && mesaSeleccionada.pedidosActuales.length > 0 && puedeLiberar && (
                    <button 
                      onClick={() => liberarMesa(mesaSeleccionada.id)} 
                      disabled={guardando} 
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Despachar / Liberar
                    </button>
                  )}

                  {pasoModal === 'info' && (
                    <button onClick={() => setPasoModal('menu')} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] shadow-lg"><span>Ir al Menú</span><ArrowRight className="w-4 h-4" /></button>
                  )}
                  {pasoModal === 'menu' && (
                    <button onClick={guardarPedido} disabled={carrito.length === 0 || guardando} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#D97706] text-white hover:bg-[#C26A05] disabled:opacity-40 shadow-lg"><CheckCircle2 className="w-4 h-4" />{guardando ? 'Enviando...' : 'Confirmar Comanda'}</button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ZONA DE IMPRESIÓN: SOLO SE MUESTRA AL IMPRIMIR            */}
      {/* ========================================================= */}
      {comandaAImprimir && (
        <div className="hidden print:block absolute top-0 left-0 w-[80mm] bg-white text-black p-4 font-mono text-sm leading-tight">
          <div className="text-center border-b border-black border-dashed pb-2 mb-2">
            <h1 className="font-bold text-lg uppercase">Sabor&Stock</h1>
            <p className="text-xs">COMANDA: {comandaAImprimir.id}</p>
          </div>
          
          <div className="mb-2 border-b border-black border-dashed pb-2 text-xs">
            <div className="flex justify-between font-bold">
              <span>MESA: {comandaAImprimir.numeroMesa}</span>
              <span>{comandaAImprimir.horaEstimada}</span>
            </div>
            <p>Cliente: {comandaAImprimir.cliente}</p>
            <p>Mesero: {comandaAImprimir.mesero}</p>
          </div>

          <div className="mb-2">
            <div className="flex font-bold border-b border-black pb-1 mb-1 text-xs">
              <span className="w-8">Cant</span>
              <span className="flex-1">Producto</span>
            </div>
            {comandaAImprimir.items.map((item, idx) => (
              <div key={idx} className="mb-1">
                <div className="flex text-xs font-bold">
                  <span className="w-8">{item.cantidad}x</span>
                  <span className="flex-1 uppercase">{item.producto.nombre}</span>
                </div>
                {item.notas && (
                  <div className="pl-8 text-[10px] italic">
                    * {item.notas}
                  </div>
                )}
              </div>
            ))}
          </div>

          {comandaAImprimir.notasIniciales && (
            <div className="border-t border-black border-dashed pt-2 mb-2">
              <p className="font-bold text-xs">OBSERVACIONES:</p>
              <p className="text-[10px] uppercase">{comandaAImprimir.notasIniciales}</p>
            </div>
          )}

          <div className="text-center text-[10px] mt-4 border-t border-black border-dashed pt-2">
            <p>Generado: {new Date().toLocaleString()}</p>
            <p>*** FIN DE COMANDA ***</p>
          </div>
        </div>
      )}
    </>
  );
}