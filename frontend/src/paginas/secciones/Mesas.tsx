import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Clock, Plus, Minus, CheckCircle2, X, Search, ChefHat, 
  LayoutGrid, Filter, ArrowRight, ArrowLeft, Trash2, 
  RotateCw, Settings, Edit, List, Printer, CreditCard, MessageSquare, Lock, DollarSign,
  ShoppingBag, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexto/AuthContexto';
import { useComandas } from '../../contexto/ComandasContexto';
import { MesaServicio, type SeccionBackend } from '../../servicios/MesaServicio';
import type { MesaBackend } from '../../tipos/Comanda';
import ConfiguracionMesas from './ConfiguracionMesas';

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
  cliente: string;
  meseroPrincipal: string;
  horaEstimada: string;
  personas: number;
  timestampCreacion: number;
  comandasTicket: ComandaTicket[];
  itemsConsolidados: ItemPedido[];
  totalVentaAcumulado: number;
}

export interface Mesa {
  id: string;
  idBackend: number;
  numero: number;
  seccion: string;
  capacidad: number;
  estado: 'Disponible' | 'Ocupada' | 'Reservada' | 'Pagando';
  ventasActuales: VentaMesa[];
}

const CATEGORIAS: CategoriaProducto[] = ['Platos Fuertes', 'Comidas Rápidas', 'Entradas', 'Bebidas', 'Postres'];

const ESPERA_INICIAL_MIN = 20;
const PASO_MIN = 5;
const ESPERA_MAX_MIN = 180;
const MIN5_MS = PASO_MIN * 60000;
const redondear5 = (ms: number) => Math.ceil(ms / MIN5_MS) * MIN5_MS;
const formatearHora = (ms: number) =>
  new Date(ms).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

const NOTAS_RAPIDAS = ['Sin cebolla', 'Sin picante', 'Sin hielo', 'Bien cocido', 'Para llevar'];

export default function Mesas() {
  const { usuario } = useAuth();
  const { comandas, crear, cambiarEstado, recargar, conectadoBackend } = useComandas();

  const [mesasRaw, setMesasRaw] = useState<MesaBackend[]>([]);
  const [seccionesRaw, setSeccionesRaw] = useState<SeccionBackend[]>([]);
  const [productosMenu, setProductosMenu] = useState<Producto[]>([]);
  
  const [seccionFiltro, setSeccionFiltro] = useState<string>('Todas');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [configAbierta, setConfigAbierta] = useState(false);
  
  const rol = String(usuario?.rol ?? '').toLowerCase();
  const esAdminODueno = rol.includes('due') || rol.includes('admin');
  const esCajero = rol.includes('caja');
  const puedeLiberar = esAdminODueno || esCajero;

  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [pasoModal, setPasoModal] = useState<'lista' | 'info' | 'menu'>('lista');
  const [ventaActivaId, setVentaActivaId] = useState<string | null>(null);
  const [ventaEnEdicion, setVentaEnEdicion] = useState<VentaMesa | null>(null);

  const [nombreCliente, setNombreCliente] = useState('');
  const [horaEstimada, setHoraEstimada] = useState('09:30 p. m.');
  const [horaBase, setHoraBase] = useState<number>(() => Date.now());
  const [horaObjetivo, setHoraObjetivo] = useState<number>(() => redondear5(Date.now() + ESPERA_INICIAL_MIN * 60000));
  const minutosEspera = Math.max(0, Math.round((horaObjetivo - horaBase) / 60000));
  const horaMinima = redondear5(horaBase);
  const horaMaxima = horaMinima + ESPERA_MAX_MIN * 60000;
  const [personas, setPersonas] = useState(2);
  const [notasMesa, setNotasMesa] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaProducto>('Platos Fuertes');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);
  const [notaAbiertaId, setNotaAbiertaId] = useState<string | null>(null);

  const [pedidosPagando, setPedidosPagando] = useState<Set<number>>(new Set());
  const [comandaAImprimir, setComandaAImprimir] = useState<{ venta: VentaMesa; comandaTicket?: ComandaTicket; esTicketGlobal?: boolean } | null>(null);

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

  useEffect(() => {
    if (comandaAImprimir) {
      const timer = setTimeout(() => {
        window.print();
        setComandaAImprimir(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [comandaAImprimir]);

  const cargarDatosBackend = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const [mesasData, prodsData, secsData] = await Promise.all([
        MesaServicio.listarMesas(),
        MesaServicio.obtenerProductos(),
        MesaServicio.obtenerSecciones()
      ]);

      setMesasRaw(mesasData);
      setSeccionesRaw(secsData);

      setProductosMenu(prodsData.map((p) => {
        let cat: CategoriaProducto = 'Platos Fuertes';
        const nom = p.nombre.toLowerCase();
        if (nom.includes('hamburguesa') || nom.includes('salchipapa') || nom.includes('perro')) cat = 'Comidas Rápidas';
        else if (nom.includes('arepa') || nom.includes('empanada') || nom.includes('patacón')) cat = 'Entradas';
        else if (nom.includes('jugo') || nom.includes('limonada') || nom.includes('cerveza') || nom.includes('gaseosa')) cat = 'Bebidas';
        else if (nom.includes('leches') || nom.includes('flan') || nom.includes('postre')) cat = 'Postres';
        return { id: `p-${p.id_producto}`, idProducto: p.id_producto, nombre: p.nombre, precio: p.precio_venta, categoria: cat, descripcion: p.descripcion };
      }));
    } catch (e) {
      console.warn('Error al cargar:', e);
      if (!silencioso) alert('Error al cargar datos de mesas: ' + (e instanceof Error ? e.message : 'Error desconocido'));
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => { void cargarDatosBackend(); }, [cargarDatosBackend]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      void recargar();
      void cargarDatosBackend(true);
    }, 4000);
    return () => clearInterval(intervalo);
  }, [recargar, cargarDatosBackend]);

  const seccionesDisponibles = useMemo(() => {
    const prioridadZonas: Record<string, number> = {
      'Piscina': 1, 'Terraza': 2, 'Salón Principal': 3, 'Salón': 3, 'Entrada': 4, 'VIP': 5
    };
    let nombresZonas: string[] = seccionesRaw.length > 0 ? seccionesRaw.map(s => s.nombre) : Array.from(new Set(mesasRaw.map(m => m.seccionNombre).filter(Boolean) as string[]));
    if (nombresZonas.length === 0) nombresZonas = ['Salón', 'Piscina', 'Terraza', 'Entrada'];
    const zonasOrdenadas = [...nombresZonas].sort((a, b) => (prioridadZonas[a] || 99) - (prioridadZonas[b] || 99) || a.localeCompare(b));
    return ['Todas', ...zonasOrdenadas];
  }, [mesasRaw, seccionesRaw]);

  const mesas = useMemo<Mesa[]>(() => {
    return mesasRaw.map((m) => {
      const comandasActivas = comandas.filter(
        (c) => (c.idMesa === m.id || c.mesa === m.numero) && c.estado !== 'Cerrado'
      );

      const mapaVentas = new Map<string, ComandaTicket[]>();
      const infoVentaMap = new Map<string, { cliente: string; mesero: string; personas: number; hora: string; minTimestamp: number }>();

      comandasActivas.forEach(c => {
        const clienteKey = (c.cliente || 'Cliente General').trim().toLowerCase();
        const ticketTimestamp = new Date(c.creada).getTime();

        if (!mapaVentas.has(clienteKey)) {
          mapaVentas.set(clienteKey, []);
          infoVentaMap.set(clienteKey, {
            cliente: c.cliente || 'Cliente General',
            mesero: c.mesero || 'Sin asignar',
            personas: c.personas || 2,
            hora: formatearHora(ticketTimestamp),
            minTimestamp: ticketTimestamp
          });
        } else {
          const infoActual = infoVentaMap.get(clienteKey)!;
          if (ticketTimestamp < infoActual.minTimestamp) {
            infoActual.minTimestamp = ticketTimestamp;
            infoActual.hora = formatearHora(ticketTimestamp);
          }
        }

        const itemsComanda: ItemPedido[] = c.items.map((it) => {
          const prodCatalogo = productosMenu.find(p => p.idProducto === it.idProducto || p.nombre === it.producto) || {
            id: `p-${it.idProducto ?? 0}`, idProducto: it.idProducto, nombre: it.producto, precio: it.precio || 0, categoria: 'Platos Fuertes' as CategoriaProducto,
          };
          return { producto: prodCatalogo, cantidad: it.cantidad, notas: it.nota };
        });

        const isPagando = pedidosPagando.has(c.id);

        mapaVentas.get(clienteKey)!.push({
          id: `CMD-#${c.id}`,
          comandaId: c.id,
          items: itemsComanda,
          total: itemsComanda.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0),
          estado: isPagando ? 'Pagando' : (c.estado === 'Lista' ? 'Listo' : c.estado === 'Entregada' ? 'Entregado' : 'En preparación'),
          mesero: c.mesero || 'Sin asignar',
          hora: formatearHora(ticketTimestamp),
          timestampCreacion: ticketTimestamp,
          notas: c.nota
        });
      });

      const ventasDesordenadas: VentaMesa[] = Array.from(mapaVentas.entries()).map(([key, tickets]) => {
        const info = infoVentaMap.get(key)!;
        
        tickets.sort((a, b) => a.timestampCreacion - b.timestampCreacion);

        const mapaConsolidado = new Map<string, ItemPedido>();
        tickets.forEach(ticket => {
          ticket.items.forEach(it => {
            const prodId = it.producto.id;
            if (mapaConsolidado.has(prodId)) {
              const existente = mapaConsolidado.get(prodId)!;
              existente.cantidad += it.cantidad;
              if (it.notas && !existente.notas?.includes(it.notas)) {
                existente.notas = existente.notas ? `${existente.notas}, ${it.notas}` : it.notas;
              }
            } else {
              mapaConsolidado.set(prodId, { ...it });
            }
          });
        });

        const itemsConsolidados = Array.from(mapaConsolidado.values());
        const totalVentaSumado = itemsConsolidados.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);

        return {
          id: `VENTA-${m.numero}-${info.minTimestamp}`,
          mesaId: String(m.id),
          numeroMesa: m.numero,
          cliente: info.cliente,
          meseroPrincipal: info.mesero,
          horaEstimada: info.hora,
          personas: info.personas,
          timestampCreacion: info.minTimestamp,
          comandasTicket: tickets,
          itemsConsolidados,
          totalVentaAcumulado: totalVentaSumado
        };
      });

      ventasDesordenadas.sort((a, b) => a.timestampCreacion - b.timestampCreacion);

      let estadoMesa: Mesa['estado'] = 'Disponible';
      if (ventasDesordenadas.length > 0) {
        const todasPagando = ventasDesordenadas.every(v => v.comandasTicket.every(t => t.estado === 'Pagando'));
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
        ventasActuales: ventasDesordenadas,
      };
    });
  }, [mesasRaw, comandas, productosMenu, pedidosPagando]);

  useEffect(() => {
    if (mesaSeleccionada) {
      const mesaActualizada = mesas.find(m => m.id === mesaSeleccionada.id);
      if (mesaActualizada) {
        setMesaSeleccionada(mesaActualizada);
      }
    }
  }, [mesas]);

  const mesasDeZona = useMemo(() => {
    return mesas.filter((m) => seccionFiltro === 'Todas' || m.seccion === seccionFiltro);
  }, [mesas, seccionFiltro]);

  const abrirMesa = (mesa: Mesa) => {
    setMesaSeleccionada(mesa);
    if (mesa.ventasActuales.length > 0) {
      setPasoModal('lista');
      setVentaActivaId(mesa.ventasActuales[0].id);
    } else {
      iniciarNuevaVenta(mesa);
    }
  };

  const iniciarNuevaVenta = (mesa: Mesa) => {
    setNombreCliente('');
    const ahora = Date.now();
    const objetivo = redondear5(ahora + ESPERA_INICIAL_MIN * 60000);
    setHoraBase(ahora);
    setHoraObjetivo(objetivo);
    setHoraEstimada(formatearHora(objetivo));
    setPersonas(mesa.capacidad);
    setNotasMesa('');
    setCarrito([]);
    setVentaEnEdicion(null);
    setPasoModal('info');
  };

  const prepararNuevaComandaParaVenta = (venta: VentaMesa) => {
    setVentaEnEdicion(venta);
    setNombreCliente(venta.cliente);
    setPersonas(venta.personas);
    setNotasMesa('');
    setCarrito([]);
    setPasoModal('menu');
  };

  const cerrarModal = () => { 
    setMesaSeleccionada(null); 
    setNotaAbiertaId(null); 
    setVentaEnEdicion(null);
  };

  const modificarCantidad = (producto: Producto, cambio: number) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id);
      if (!existe) return cambio > 0 ? [...prev, { producto, cantidad: 1 }] : prev;
      
      const nuevaCantidad = existe.cantidad + cambio;
      if (nuevaCantidad <= 0) return prev.filter((item) => item.producto.id !== producto.id);
      
      return prev.map((item) => item.producto.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item);
    });
  };

  const fijarCantidad = (producto: Producto, cantidad: number) => {
    const n = Math.max(0, Math.min(99, Math.floor(cantidad) || 0));
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id);
      if (n <= 0) return prev.filter((item) => item.producto.id !== producto.id);
      if (!existe) return [...prev, { producto, cantidad: n }];
      return prev.map((item) => item.producto.id === producto.id ? { ...item, cantidad: n } : item);
    });
  };

  const ajustarMinutos = (delta: number) => {
    const nuevo = Math.max(horaMinima, Math.min(horaMaxima, horaObjetivo + delta * 60000));
    setHoraObjetivo(nuevo);
    setHoraEstimada(formatearHora(nuevo));
  };

  const fijarNota = (producto: Producto, nota: string) => {
    setCarrito((prev) => prev.map((item) => item.producto.id === producto.id ? { ...item, notas: nota } : item));
  };

  const agregarNotaRapida = (producto: Producto, texto: string) => {
    const actual = carrito.find((item) => item.producto.id === producto.id)?.notas?.trim() ?? '';
    if (actual.toLowerCase().includes(texto.toLowerCase())) return;
    fijarNota(producto, actual ? `${actual}, ${texto}` : texto);
  };

  const tocarProducto = (producto: Producto) => {
    const existe = carrito.some((item) => item.producto.id === producto.id);
    if (!existe) {
      setCarrito((prev) => [...prev, { producto, cantidad: 1 }]);
      setNotaAbiertaId(producto.id);
      return;
    }
    setNotaAbiertaId((prev) => (prev === producto.id ? null : producto.id));
  };

  const guardarPedido = async () => {
    if (!mesaSeleccionada || carrito.length === 0) return;
    setGuardando(true);
    try {
      const clienteObjetivo = nombreCliente.trim() || ventaEnEdicion?.cliente || 'Cliente General';
      const notaComanda = notasMesa.trim();

      const idUsuarioActual = Number(usuario?.idUsuario ?? usuario?.id_usuario) || null;
      await crear({
        mesa: mesaSeleccionada.numero,
        idMesa: mesaSeleccionada.idBackend,
        idUsuario: idUsuarioActual,
        items: carrito.map((item) => ({
          idProducto: item.producto.idProducto,
          producto: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.producto.precio,
          categoria: item.producto.categoria,
          nota: item.notas?.trim() || undefined,
        })),
        nota: notaComanda,
        mesero: usuario?.nombre?.trim() || 'Sin asignar',
        cliente: clienteObjetivo,
        personas: personas,
      });

      await MesaServicio.actualizarMesa(mesaSeleccionada.idBackend, { estado: 'Ocupada' });
      await recargar();
      await cargarDatosBackend(true);

      if (ventaEnEdicion) {
        const mesaActualizada = mesas.find(m => m.id === mesaSeleccionada.id);
        const ventaCorrespondiente = mesaActualizada?.ventasActuales.find(v => v.cliente.toLowerCase() === ventaEnEdicion.cliente.toLowerCase());
        if (ventaCorrespondiente) {
          setVentaActivaId(ventaCorrespondiente.id);
        }
      }

      setVentaEnEdicion(null);
      setPasoModal('lista');
    } catch (err) {
      console.error(err);
      alert('Error al guardar la comanda.');
    } finally {
      setGuardando(false);
    }
  };

  const despacharVentaCompleta = async (venta: VentaMesa) => {
    if (!window.confirm(`¿Deseas despachar y cerrar TODA la venta del cliente "${venta.cliente}" (Total: $${venta.totalVentaAcumulado.toLocaleString('es-CO')})?`)) return;

    setGuardando(true);
    try {
      for (const ticket of venta.comandasTicket) {
        if (ticket.comandaId) {
          await cambiarEstado(ticket.comandaId, 'Cerrado');
          setPedidosPagando(prev => { const next = new Set(prev); next.delete(ticket.comandaId!); return next; });
        }
      }
      await recargar();
      await cargarDatosBackend(true);

      const otrasVentas = mesaSeleccionada?.ventasActuales.filter(v => v.id !== venta.id) || [];
      if (otrasVentas.length === 0 && mesaSeleccionada) {
        await MesaServicio.actualizarMesa(mesaSeleccionada.idBackend, { estado: 'Libre' });
        await cargarDatosBackend(true);
        cerrarModal();
      } else if (otrasVentas.length > 0) {
        setVentaActivaId(otrasVentas[0].id);
      }
    } catch (err) {
      console.error('Error al despachar la venta completa:', err);
      alert('Error al despachar la venta: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  const liberarMesaCompleta = async (mesaId: string) => {
    const mesaTarget = mesas.find((m) => m.id === mesaId);
    if (!mesaTarget) return;
    if (!window.confirm(`¿Deseas liberar y despachar TODAS las cuentas de la Mesa ${mesaTarget.numero}?`)) return;

    setGuardando(true);
    try {
      for (const venta of mesaTarget.ventasActuales) {
        for (const ticket of venta.comandasTicket) {
          if (ticket.comandaId) {
            await cambiarEstado(ticket.comandaId, 'Cerrado');
            setPedidosPagando(prev => { const next = new Set(prev); next.delete(ticket.comandaId!); return next; });
          }
        }
      }
      await MesaServicio.actualizarMesa(mesaTarget.idBackend, { estado: 'Libre' });
      await recargar();
      await cargarDatosBackend(true);
      cerrarModal();
    } catch (err) {
      console.error('Error al liberar mesa:', err);
      alert('Error al liberar la mesa: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  const imprimirPrecuenta = (venta: VentaMesa) => {
    setComandaAImprimir({ venta, esTicketGlobal: true });
  };

  const cantidadPorCategoria = useMemo(() => {
    const mapa: Partial<Record<CategoriaProducto, number>> = {};
    carrito.forEach((item) => {
      mapa[item.producto.categoria] = (mapa[item.producto.categoria] || 0) + item.cantidad;
    });
    return mapa;
  }, [carrito]);

  const productosVisibles = productosMenu.filter((p) =>
    busquedaProducto ? p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) : p.categoria === categoriaActiva
  );

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
      <div className="h-[100dvh] sm:h-full w-full max-w-full flex flex-col bg-[#0B132B] text-[#F4D6B0] p-2 sm:p-3 md:p-6 font-sans antialiased overflow-x-hidden print:hidden">
        
        <header className="shrink-0 bg-[#1C2541] mb-2 sm:mb-3 border border-[#3A506B] pb-2.5 px-3 pt-2.5 sm:pb-4 sm:px-4 sm:pt-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between gap-2 lg:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#0B132B] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE] shadow-md shrink-0">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#F4D6B0] tracking-tight truncate">Gestión de Ventas y Comandas</h2>
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${conectadoBackend ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${conectadoBackend ? 'bg-emerald-400 animate-pulse' : 'bg-[#D97706]'}`} />
                    {conectadoBackend ? 'Backend' : 'Local'}
                  </span>
                </div>
                <p className="text-[11px] text-[#3A506B] hidden sm:block">Control de mesas, ventas acumuladas y comandas en tiempo real.</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button onClick={() => { void recargar(); void cargarDatosBackend(); }} disabled={cargando} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] hover:text-white hover:border-[#5BC0DE] transition-colors">
                <RotateCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              </button>
              {esAdminODueno && (
                <button onClick={() => setConfigAbierta(true)} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] hover:text-white hover:border-[#5BC0DE] transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between sm:justify-start gap-1 bg-[#0B132B] p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-[#3A506B] w-full sm:w-fit">
            <div className="flex-1 sm:flex-none px-1.5 sm:px-2.5 py-1 rounded-lg text-emerald-400 text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Disp: {mesasDeZona.filter((m) => m.estado === 'Disponible').length}
            </div>
            <div className="flex-1 sm:flex-none px-1.5 sm:px-2.5 py-1 rounded-lg text-[#D97706] text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Ocup: {mesasDeZona.filter((m) => m.estado === 'Ocupada').length}
            </div>
            <div className="flex-1 sm:flex-none px-1.5 sm:px-2.5 py-1 rounded-lg text-[#5BC0DE] text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5BC0DE]" /> Pagando: {mesasDeZona.filter((m) => m.estado === 'Pagando').length}
            </div>
          </div>

          <div className="mt-2 sm:mt-4 border-t border-[#3A506B]/50 pt-2 sm:pt-4 flex items-center gap-2">
            <span className="hidden sm:flex text-[11px] font-bold text-[#5BC0DE] items-center gap-1 shrink-0 w-16">
              <Filter className="w-3 h-3" /> Zona:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden touch-pan-x">
              {seccionesDisponibles.map((sec) => (
                <button key={sec} onClick={() => setSeccionFiltro(sec)} className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap border ${seccionFiltro === sec ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-md' : 'bg-[#0B132B] text-[#F4D6B0] border-[#3A506B] hover:bg-[#3A506B]/50'}`}>
                  {sec}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 pb-24 sm:pb-4">
            {mesasDeZona.map((mesa) => {
              const estaOcupada = mesa.estado === 'Ocupada' || mesa.estado === 'Pagando';
              const estaPagando = mesa.estado === 'Pagando';
              const totalMesa = mesa.ventasActuales.reduce((a, b) => a + b.totalVentaAcumulado, 0);
              const meseroAtiende = mesa.ventasActuales[0]?.meseroPrincipal || 'Sin asignar';

              return (
                <div 
                  key={mesa.id} 
                  onClick={() => abrirMesa(mesa)} 
                  className={`group relative rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between active:scale-[0.98] sm:hover:-translate-y-1 ${getBordeMesa(mesa.estado)}`}
                >
                  <div className="p-2 sm:p-3.5 flex items-center justify-between gap-1.5 sm:gap-2 bg-[#0B132B]/50 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-lg sm:rounded-xl border flex items-center justify-center font-black text-sm sm:text-lg transition-colors bg-[#0B132B] ${estaPagando ? 'border-[#5BC0DE] text-[#5BC0DE]' : estaOcupada ? 'border-[#D97706] text-[#D97706]' : 'border-emerald-500 text-emerald-400'}`}>
                        {mesa.numero}
                      </div>
                      <div className="hidden sm:flex flex-col min-w-0">
                        <span className="text-[11px] text-[#5BC0DE] font-bold uppercase tracking-wider truncate">{mesa.seccion}</span>
                        {estaOcupada ? (
                          <span className="text-[11px] text-[#F4D6B0] flex items-center gap-1 mt-0.5 font-semibold min-w-0">
                            <Users className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Atiende: {meseroAtiende}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#3A506B] mt-0.5 truncate">Capacidad: {mesa.capacidad} pers.</span>
                        )}
                      </div>
                    </div>
                    
                    <span className={`shrink-0 whitespace-nowrap px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold border ${
                      estaPagando ? 'bg-[#5BC0DE]/20 text-[#5BC0DE] border-[#5BC0DE]/40' : 
                      estaOcupada ? 'bg-[#D97706]/20 text-[#D97706] border-[#D97706]/40' : 
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {estaPagando ? 'Pagando' : mesa.estado}
                    </span>
                  </div>

                  <div className="sm:hidden px-2.5 pt-1.5 text-[10px] leading-tight space-y-0.5 min-w-0">
                    <p className="font-bold uppercase tracking-wider text-[#5BC0DE] truncate">{mesa.seccion}</p>
                    <p className="text-[#F4D6B0] font-semibold flex items-center gap-1 min-w-0">
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">{estaOcupada ? `Atiende: ${meseroAtiende}` : `${mesa.capacidad} pers.`}</span>
                    </p>
                  </div>

                  <div className="p-2 sm:p-4 flex-1 flex flex-col items-center justify-center min-w-0">
                    {estaOcupada ? (
                      <div className="flex flex-col items-center gap-1 sm:gap-2 w-full min-w-0">
                        <div className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 border ${estaPagando ? 'bg-[#5BC0DE]/10 text-[#5BC0DE] border-[#5BC0DE]/30' : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30'}`}>
                          {estaPagando ? <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" /> : <List className="w-4 h-4 sm:w-5 sm:h-5" />}
                          <span className="font-bold text-[11px] sm:text-sm whitespace-nowrap">
                            {mesa.ventasActuales.length} <span className="hidden sm:inline">Venta(s)</span><span className="sm:hidden">vta.</span>
                          </span>
                        </div>
                        <span className="text-[11px] sm:text-xs text-[#F4D6B0] font-semibold truncate max-w-full">
                          <span className="hidden sm:inline">Total Venta: </span>${totalMesa.toLocaleString('es-CO')}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[#3A506B] text-[10px] sm:text-sm italic flex items-center gap-1 sm:gap-2 text-center">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="sm:hidden">Libre</span>
                        <span className="hidden sm:inline">Lista para recibir clientes</span>
                      </div>
                    )}
                  </div>

                  <div className="p-1 sm:p-2 bg-[#0B132B]/80 border-t border-[#3A506B] flex justify-between items-center sm:group-hover:bg-[#5BC0DE] transition-colors">
                    <div className="flex gap-1">
                      {estaOcupada && puedeLiberar && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); liberarMesaCompleta(mesa.id); }}
                          className="p-1 sm:p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors sm:group-hover:text-[#0B132B]"
                          title="Liberar todas las ventas de la mesa"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center p-1 sm:p-0">
                      {estaOcupada ? <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97706] sm:group-hover:text-[#0B132B]" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5BC0DE] sm:group-hover:text-[#0B132B]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {esAdminODueno && <ConfiguracionMesas abierto={configAbierta} onCerrar={() => setConfigAbierta(false)} onActualizado={() => { void recargar(); void cargarDatosBackend(); }} />}

        {mesaSeleccionada && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-1 sm:p-5 animate-in fade-in duration-200 overflow-x-hidden">
            <div className={`bg-[#1C2541] border border-[#3A506B] rounded-2xl sm:rounded-3xl w-full max-w-full overflow-hidden flex flex-col shadow-2xl ${pasoModal === 'menu' ? 'max-w-4xl h-[calc(100dvh-0.5rem)] sm:h-auto sm:max-h-[860px]' : 'max-w-xl max-h-[calc(100dvh-0.5rem)]'}`}>
              
              <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#5BC0DE] text-[#0B132B] flex items-center justify-center font-black text-lg sm:text-xl shadow-md shrink-0">
                    {mesaSeleccionada.numero}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-lg sm:text-xl font-extrabold text-[#F4D6B0] truncate">Mesa {mesaSeleccionada.numero}</h2>
                      <span className="text-xs bg-[#1C2541] border border-[#3A506B] text-[#5BC0DE] px-2.5 py-0.5 rounded-full font-semibold shrink-0 max-w-[50%] truncate">{mesaSeleccionada.seccion}</span>
                    </div>
                    <p className="text-xs text-[#5BC0DE] mt-0.5 truncate">
                      {pasoModal === 'lista' ? 'Detalle de la Venta' : pasoModal === 'info' ? 'Nueva Venta' : ventaEnEdicion ? 'Agregar Productos' : 'Seleccionar Productos'}
                    </p>
                  </div>
                </div>
                <button onClick={cerrarModal} className="p-2 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors shrink-0">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-2.5 sm:p-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 min-h-0 space-y-4 sm:space-y-6 bg-[#1C2541] w-full max-w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/60 [&::-webkit-scrollbar-thumb]:rounded-full">
                
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
                        <div key={venta.id} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 sm:p-5 space-y-4 w-full min-w-0 overflow-hidden">
                          
                          <div className="flex flex-wrap justify-between items-start gap-2 border-b border-[#3A506B] pb-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-[#F4D6B0] font-bold truncate">Venta #{idx + 1} - Cliente: <span className="text-[#5BC0DE]">{venta.cliente}</span> ({venta.personas} pers.)</p>
                              <p className="text-xs text-[#3A506B] mt-0.5 truncate">Atendido por: <strong className="text-[#F4D6B0]">{venta.meseroPrincipal}</strong></p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-[#5BC0DE] font-semibold">TOTAL ACUMULADO</p>
                              <p className="text-[#D97706] font-bold font-mono text-lg sm:text-xl">${venta.totalVentaAcumulado.toLocaleString('es-CO')}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1C2541] p-2 rounded-xl border border-[#3A506B]">
                            <button onClick={() => prepararNuevaComandaParaVenta(venta)} className="text-xs font-bold bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-colors w-full sm:w-auto justify-center">
                              <Plus className="w-4 h-4" /> Agregar Productos 
                            </button>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
                            <h4 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wide">Productos en la Venta Actual</h4>

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
                                        {item.notas && <p className="text-[10px] italic text-[#D97706] break-words">“{item.notas}”</p>}
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
                    <div className="bg-[#0B132B] p-3 sm:p-4 rounded-2xl border border-[#3A506B] flex items-center gap-3 text-xs text-[#5BC0DE]">
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <span className="min-w-0">Iniciando nueva venta. Atiende: <strong>{usuario?.nombre || 'Sin asignar'}</strong></span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#F4D6B0] mb-1.5">Nombre del Cliente</label>
                      <input type="text" placeholder="Ej. Juan Pérez" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] font-bold p-3 sm:p-3.5 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] focus:outline-none text-sm" />
                    </div>
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#F4D6B0] mb-1.5">
                          Hora Estimada <span className="text-[#5BC0DE] font-semibold">(en {minutosEspera} min)</span>
                        </label>
                        <div className="flex items-center gap-2 bg-[#0B132B] p-2 rounded-xl border border-[#3A506B]">
                          <button
                            type="button"
                            onClick={() => ajustarMinutos(-PASO_MIN)}
                            disabled={horaObjetivo <= horaMinima}
                            aria-label="Restar 5 minutos"
                            className="p-2 rounded-lg bg-[#1C2541] text-[#5BC0DE] hover:bg-[#3A506B] disabled:opacity-30 disabled:hover:bg-[#1C2541] shrink-0"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="flex-1 flex items-center justify-center gap-1.5 font-black text-sm text-[#F4D6B0] whitespace-nowrap min-w-0">
                            <Clock className="w-4 h-4 text-[#5BC0DE] shrink-0" /> <span className="truncate">{horaEstimada}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => ajustarMinutos(PASO_MIN)}
                            disabled={horaObjetivo >= horaMaxima}
                            aria-label="Sumar 5 minutos"
                            className="p-2 rounded-lg bg-[#1C2541] text-[#5BC0DE] hover:bg-[#3A506B] disabled:opacity-30 disabled:hover:bg-[#1C2541] shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#F4D6B0] mb-1.5">Personas</label>
                        <div className="flex items-center gap-3 bg-[#0B132B] p-2 rounded-xl border border-[#3A506B]">
                          <button onClick={() => setPersonas(p => Math.max(1, p - 1))} className="p-2 rounded-lg bg-[#1C2541] text-[#5BC0DE] hover:bg-[#3A506B] shrink-0"><Minus className="w-4 h-4" /></button>
                          <span className="flex-1 text-center font-black text-[#F4D6B0]">{personas}</span>
                          <button onClick={() => setPersonas(p => p + 1)} className="p-2 rounded-lg bg-[#1C2541] text-[#5BC0DE] hover:bg-[#3A506B] shrink-0"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#F4D6B0] mb-1.5">Notas de la Venta</label>
                      <textarea rows={2} placeholder="Alergias, observaciones..." value={notasMesa} onChange={(e) => setNotasMesa(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] font-bold p-3 sm:p-3.5 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] focus:outline-none text-sm" />
                    </div>
                  </div>
                )}

                {pasoModal === 'menu' && (
                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-6 items-start w-full max-w-full overflow-x-hidden">
                    <div className="w-full lg:col-span-7 min-w-0">
                      <div className="sticky top-0 z-10 bg-[#1C2541] pb-3 space-y-3 w-full">
                        {ventaEnEdicion && (
                          <div className="bg-[#5BC0DE]/10 border border-[#5BC0DE]/30 px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-[#5BC0DE] font-bold w-full min-w-0">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span className="truncate">Agregando productos a la venta de: <strong>{ventaEnEdicion.cliente}</strong>.</span>
                          </div>
                        )}
                        <div className="relative w-full">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                          <input type="text" placeholder="Buscar producto..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} className="w-full bg-[#0B132B] text-[#F4D6B0] pl-10 pr-4 py-2.5 rounded-xl border border-[#3A506B] focus:border-[#5BC0DE] focus:outline-none text-sm" />
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
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${activa ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-md' : 'bg-[#0B132B] text-[#F4D6B0] border-[#3A506B] hover:bg-[#3A506B]'}`}
                              >
                                {cat}
                                {enCat > 0 && (
                                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${activa ? 'bg-[#0B132B] text-[#5BC0DE]' : 'bg-[#D97706] text-white'}`}>{enCat}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#3A506B] bg-[#0B132B] divide-y divide-[#3A506B]/50 max-h-[min(32rem,36dvh)] lg:max-h-[min(40.5rem,60dvh)] overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
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
                                      <span className="font-mono font-bold text-xs text-[#5BC0DE]">${producto.precio.toLocaleString('es-CO')}</span>
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${nota ? 'text-[#D97706]' : 'text-[#7B8FA8]'}`}>
                                        <MessageSquare className="w-3 h-3" />{nota ? 'Con comentario' : 'Comentario'}
                                      </span>
                                    </div>
                                  </button>

                                  <div className="flex items-center gap-0.5 sm:gap-1 bg-[#1C2541] p-1 rounded-xl border border-[#3A506B] shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => modificarCantidad(producto, -1)}
                                      disabled={cant === 0}
                                      aria-label={`Quitar uno de ${producto.nombre}`}
                                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#F4D6B0] hover:bg-[#3A506B] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      aria-label={`Cantidad de ${producto.nombre}`}
                                      value={cant}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => fijarCantidad(producto, parseInt(e.target.value.replace(/\D/g, ''), 10))}
                                      className={`w-8 sm:w-11 h-8 sm:h-9 text-center rounded-lg text-sm font-black bg-[#0B132B] border focus:outline-none focus:border-[#5BC0DE] ${cant > 0 ? 'text-[#5BC0DE] border-[#5BC0DE]/40' : 'text-[#F4D6B0] border-transparent'}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => modificarCantidad(producto, 1)}
                                      aria-label={`Agregar uno de ${producto.nombre}`}
                                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] transition-colors"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {nota && !abierta && (
                                  <p className="mt-1.5 text-[11px] italic font-semibold text-[#D97706] break-words">“{nota}”</p>
                                )}

                                {abierta && (
                                  <div className="mt-2 rounded-xl border border-[#3A506B] bg-[#1C2541] p-2.5 space-y-2 w-full">
                                    <div className="flex flex-wrap gap-1.5">
                                      {NOTAS_RAPIDAS.map((txt) => (
                                        <button
                                          key={txt}
                                          type="button"
                                          onClick={() => agregarNotaRapida(producto, txt)}
                                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-[#3A506B] text-[#F4D6B0] bg-[#0B132B] hover:border-[#5BC0DE] active:scale-95 transition-all"
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
                                      className="w-full bg-[#0B132B] text-[#F4D6B0] text-xs font-semibold p-2.5 rounded-lg border border-[#3A506B] focus:border-[#5BC0DE] focus:outline-none resize-none"
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                      {nota ? (
                                        <button type="button" onClick={() => fijarNota(producto, '')} className="text-[11px] font-bold text-rose-400 hover:text-rose-300">Borrar comentario</button>
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

                    {/* TARJETA DE RESUMEN 100% RESPONSIVA Y FIJA AL ANCHO */}
                    <div className="w-full lg:col-span-5 lg:sticky lg:top-0 bg-[#F4D6B0] text-[#0B132B] rounded-2xl p-3 sm:p-5 flex flex-col justify-between shadow-xl border border-[#D97706]/30 box-border overflow-hidden">
                      <div className="space-y-3 w-full min-w-0">
                        <div className="border-b-2 border-dashed border-[#0B132B]/20 pb-3 w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <ChefHat className="w-5 h-5 text-[#D97706] shrink-0" />
                              <span className="font-black text-sm sm:text-base uppercase tracking-tight truncate">
                                {ventaEnEdicion ? 'Nuevos Productos' : 'Nueva Venta'}
                              </span>
                            </div>
                            <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded shrink-0">{horaEstimada}</span>
                          </div>
                          <div className="text-xs font-bold text-[#0B132B]/80 mt-1 break-words">Cliente: <span className="text-[#0B132B]">{nombreCliente || 'Cliente General'}</span></div>
                          <div className="text-xs font-bold text-[#0B132B]/80 mt-1 break-words">Atiende: <span className="text-[#0B132B]">{usuario?.nombre || 'Sin asignar'}</span></div>
                        </div>

                        {carrito.length === 0 ? (
                          <div className="text-center py-4 sm:py-6 text-xs text-[#3A506B] italic"><ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#D97706]" />Selecciona ítems a agregar.</div>
                        ) : (
                          <div className="space-y-2 max-h-[min(12rem,22dvh)] lg:max-h-[min(22rem,38dvh)] overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y pr-1 w-full min-w-0 box-border [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                            {carrito.map((item) => (
                              <div key={item.producto.id} className="flex items-center justify-between text-xs font-bold border-b border-[#0B132B]/10 pb-1.5 gap-2 w-full min-w-0 box-border">
                                <div className="min-w-0 flex-1 pr-1 overflow-hidden">
                                  <div className="break-words font-extrabold text-[#0B132B] leading-tight">{item.producto.nombre}</div>
                                  <div className="text-[10px] text-[#3A506B] font-mono font-normal">${item.producto.precio.toLocaleString('es-CO')} c/u</div>
                                  {item.notas && <div className="text-[10px] italic font-semibold text-[#D97706] break-words">“{item.notas}”</div>}
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

                      <div className="pt-3 border-t-2 border-dashed border-[#0B132B]/20 mt-3 space-y-2 w-full box-border">
                        <div className="flex items-center justify-between font-black text-base sm:text-lg">
                          <span>Total a Enviar:</span>
                          <span className="text-[#D97706] font-mono whitespace-nowrap">${totalCarrito.toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex flex-wrap items-center justify-between gap-2 shrink-0 w-full">
                <div className="shrink-0">
                  {pasoModal === 'lista' && <button onClick={cerrarModal} className="text-xs font-bold text-[#5BC0DE] hover:text-white">Cerrar</button>}
                  {pasoModal !== 'lista' && <button onClick={() => mesaSeleccionada.ventasActuales.length > 0 ? setPasoModal('lista') : cerrarModal()} className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold text-[#5BC0DE] hover:bg-[#3A506B]"><ArrowLeft className="w-4 h-4" /> Volver</button>}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
                  {pasoModal === 'info' && (
                    <button onClick={() => setPasoModal('menu')} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] shadow-lg"><span>Ir al Menú</span><ArrowRight className="w-4 h-4" /></button>
                  )}
                  {pasoModal === 'menu' && (
                    <button onClick={guardarPedido} disabled={carrito.length === 0 || guardando} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold bg-[#D97706] text-white hover:bg-[#C26A05] disabled:opacity-40 shadow-lg">
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

      {comandaAImprimir && (
        <div className="hidden print:block absolute top-0 left-0 w-[80mm] bg-white text-black p-4 font-mono text-sm leading-tight">
          <div className="text-center border-b border-black border-dashed pb-2 mb-2">
            <h1 className="font-bold text-lg uppercase">Sabor&Stock</h1>
            <p className="text-xs">PRE-CUENTA / FACTURA DE VENTA</p>
          </div>
          
          <div className="mb-2 border-b border-black border-dashed pb-2 text-xs">
            <div className="flex justify-between font-bold">
              <span>MESA: {comandaAImprimir.venta.numeroMesa}</span>
              <span>{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
            <p>Cliente: {comandaAImprimir.venta.cliente}</p>
            <p>Atiende: {comandaAImprimir.venta.meseroPrincipal}</p>
          </div>

          <div className="mb-2">
            <div className="flex font-bold border-b border-black pb-1 mb-1 text-xs">
              <span className="w-8">Cant</span>
              <span className="flex-1">Producto</span>
              <span className="w-16 text-right">Subtotal</span>
            </div>
            
            {comandaAImprimir.venta.itemsConsolidados.map((item, idx) => (
              <div key={idx} className="flex text-xs mb-1">
                <span className="w-8">{item.cantidad}x</span>
                <span className="flex-1 uppercase">{item.producto.nombre}</span>
                <span className="w-16 text-right">${(item.producto.precio * item.cantidad).toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-black border-dashed pt-2 mb-2 text-right">
            <p className="font-bold text-sm">TOTAL A PAGAR: ${comandaAImprimir.venta.totalVentaAcumulado.toLocaleString('es-CO')}</p>
          </div>

          <div className="text-center text-[10px] mt-4 border-t border-black border-dashed pt-2">
            <p>Generado: {new Date().toLocaleString()}</p>
            <p>*** SABOR & STOCK ***</p>
          </div>
        </div>
      )}
    </>
  );
}