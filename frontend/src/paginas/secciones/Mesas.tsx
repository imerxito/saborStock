import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Users, 
  Clock, 
  Plus, 
  Minus, 
  CheckCircle2, 
  X, 
  Search, 
  ChefHat, 
  AlertCircle,
  LayoutGrid,
  Filter,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Receipt,
  Sparkles,
  ShoppingBag,
  RotateCw,
  Settings
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
  imagenIcono?: string;
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
  horaEstimada: string;
  personas: number;
  notasIniciales?: string;
  items: ItemPedido[];
  total: number;
  estado: 'En preparación' | 'Listo' | 'Entregado';
  horaCreacion: string;
}

export interface Mesa {
  id: string;
  idBackend: number;
  numero: number;
  seccion: string;
  capacidad: number;
  estado: 'Disponible' | 'Ocupada' | 'Reservada';
  pedidoActual?: Pedido;
}

// Catálogo base de respaldo
const MENU_RESPALDO: Producto[] = [
  { id: 'p1', idProducto: 1, nombre: 'Bandeja Paisa Tradicional', precio: 34000, categoria: 'Platos Fuertes', descripcion: 'Chicharrón crujiente, carne molida, huevo, arepa, chorizo y aguacate.' },
  { id: 'p2', idProducto: 2, nombre: 'Sancocho de Gallina Criolla', precio: 28000, categoria: 'Platos Fuertes', descripcion: 'Servido con arroz, banano, aguacate y arepa dorada.' },
  { id: 'p3', idProducto: 3, nombre: 'Lomo al Trapo (300g)', precio: 42000, categoria: 'Platos Fuertes', descripcion: 'Corte magro a la parrilla con papas al vapor y chimichurri.' },
  { id: 'p4', idProducto: 4, nombre: 'Hamburguesa Artesanal Doble', precio: 26000, categoria: 'Comidas Rápidas', descripcion: 'Pan brioche, queso cheddar doble, tocineta ahumada y salsa especial.' },
  { id: 'p5', idProducto: 5, nombre: 'Salchipapa Especial Gigante', precio: 22000, categoria: 'Comidas Rápidas', descripcion: 'Papas a la francesa, salchicha manguera, queso costeño y maicitos.' },
  { id: 'p6', idProducto: 6, nombre: 'Arepa de Choclo con Queso', precio: 12000, categoria: 'Entradas', descripcion: 'Queso doble crema fundido sobre arepa dulce caliente.' },
  { id: 'p7', idProducto: 7, nombre: 'Empanadas Criollas (5 uds)', precio: 10000, categoria: 'Entradas', descripcion: 'Rellenas de carne y papa con ají casero picante.' },
  { id: 'p8', idProducto: 8, nombre: 'Jugo Natural en Agua / Leche', precio: 8500, categoria: 'Bebidas', descripcion: 'Mango, Maracuyá, Lulo, Mora o Guanábana.' },
  { id: 'p9', idProducto: 9, nombre: 'Limonada de Coco Cremosita', precio: 11000, categoria: 'Bebidas', descripcion: 'Preparada al instante con crema de coco natural.' },
  { id: 'p10', idProducto: 10, nombre: 'Cerveza Club Colombia Dorada', precio: 7500, categoria: 'Bebidas', descripcion: 'Botella helada 330ml.' },
  { id: 'p11', idProducto: 11, nombre: 'Tres Leches de la Casa', precio: 12000, categoria: 'Postres', descripcion: 'Bizcocho húmedo con canela y merengue tostado.' },
];

const CATEGORIAS: CategoriaProducto[] = ['Platos Fuertes', 'Comidas Rápidas', 'Entradas', 'Bebidas', 'Postres'];

export default function Mesas() {
  const { usuario } = useAuth();
  const { comandas, crear, cambiarEstado, recargar, conectadoBackend } = useComandas();

  const [mesasRaw, setMesasRaw] = useState<MesaBackend[]>([]);
  const [secciones, setSecciones] = useState<SeccionBackend[]>([]);
  const [productosMenu, setProductosMenu] = useState<Producto[]>(MENU_RESPALDO);
  const [seccionFiltro, setSeccionFiltro] = useState<string>('Todas');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [configAbierta, setConfigAbierta] = useState(false);
  const esDueno = String(usuario?.rol ?? '') === 'Dueno' || String(usuario?.rol ?? '') === 'Dueño';

  // Estado del modal de pedido en mesa
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [pasoModal, setPasoModal] = useState<'info' | 'menu'>('info');

  // Formulario Paso 1: Información previa de la mesa
  const [nombreCliente, setNombreCliente] = useState('');
  const [horaEstimada, setHoraEstimada] = useState('09:30 p. m.');
  const [personas, setPersonas] = useState(2);
  const [notasMesa, setNotasMesa] = useState('');

  // Formulario Paso 2: Menú y Comanda activa
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaProducto>('Platos Fuertes');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);

  // Cargar mesas y productos del Backend
  const cargarDatosBackend = useCallback(async () => {
    setCargando(true);
    try {
      const [mesasData, prodsData, secsData] = await Promise.all([
        MesaServicio.listarMesas(),
        MesaServicio.obtenerProductos(),
        MesaServicio.obtenerSecciones()
      ]);

      setMesasRaw(mesasData);
      setSecciones(secsData);

      if (prodsData && prodsData.length > 0) {
        const prodsMapeados: Producto[] = prodsData.map((p) => {
          let cat: CategoriaProducto = 'Platos Fuertes';
          const nom = p.nombre.toLowerCase();
          if (nom.includes('hamburguesa') || nom.includes('salchipapa') || nom.includes('perro') || nom.includes('desgranado')) {
            cat = 'Comidas Rápidas';
          } else if (nom.includes('arepa') || nom.includes('empanada') || nom.includes('patacón')) {
            cat = 'Entradas';
          } else if (nom.includes('jugo') || nom.includes('limonada') || nom.includes('cerveza') || nom.includes('gaseosa')) {
            cat = 'Bebidas';
          } else if (nom.includes('leches') || nom.includes('flan') || nom.includes('postre') || nom.includes('chocolate')) {
            cat = 'Postres';
          }

          return {
            id: `p-${p.id_producto}`,
            idProducto: p.id_producto,
            nombre: p.nombre,
            precio: p.precio_venta,
            categoria: cat,
            descripcion: p.descripcion,
          };
        });
        setProductosMenu(prodsMapeados);
      }
    } catch (e) {
      console.warn('Error al cargar mesas/productos:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatosBackend();
  }, [cargarDatosBackend]);

  // Lista de secciones dinámicas
  const seccionesDisponibles = useMemo(() => {
    if (secciones.length > 0) {
      return ['Todas', ...secciones.map((s) => s.nombre)];
    }
    const setSec = new Set<string>();
    mesasRaw.forEach((m) => {
      if (m.seccionNombre) setSec.add(m.seccionNombre);
    });
    const lista = Array.from(setSec);
    return ['Todas', ...(lista.length > 0 ? lista : ['Salón Principal', 'Piscina', 'Terraza', 'VIP'])];
  }, [mesasRaw, secciones]);

  // Cruzar mesas con comandas activas en tiempo real
  const mesas = useMemo<Mesa[]>(() => {
    return mesasRaw.map((m) => {
      // Buscar comanda activa para esta mesa (que no esté cerrada ni entregada)
      const comandaActiva = comandas.find(
        (c) =>
          (c.idMesa === m.id || c.mesa === m.numero) &&
          c.estado !== 'Entregada' &&
          c.estado !== 'Cerrado'
      );

      const estaOcupada = !!comandaActiva || m.estado === 'Ocupada';
      const estaReservada = m.estado === 'Reservada';

      let pedidoActual: Pedido | undefined = undefined;
      if (comandaActiva) {
        const itemsPedido: ItemPedido[] = comandaActiva.items.map((it) => {
          const prodCatalogo = productosMenu.find(
            (p) => p.idProducto === it.idProducto || p.nombre === it.producto
          ) || {
            id: `p-${it.idProducto ?? 0}`,
            idProducto: it.idProducto,
            nombre: it.producto,
            precio: it.precio || 0,
            categoria: 'Platos Fuertes' as CategoriaProducto,
          };

          return {
            producto: prodCatalogo,
            cantidad: it.cantidad,
            notas: it.nota,
          };
        });

        const totalPedido = itemsPedido.reduce(
          (sum, item) => sum + item.producto.precio * item.cantidad,
          0
        );

        const hora = new Date(comandaActiva.creada).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        pedidoActual = {
          id: `CMD-#${comandaActiva.id}`,
          comandaId: comandaActiva.id,
          mesaId: String(m.id),
          numeroMesa: m.numero,
          cliente: comandaActiva.cliente || 'Cliente en Salón',
          horaEstimada: hora,
          personas: comandaActiva.personas || 2,
          notasIniciales: comandaActiva.nota || undefined,
          items: itemsPedido,
          total: totalPedido,
          estado:
            comandaActiva.estado === 'Lista'
              ? 'Listo'
              : comandaActiva.estado === 'Entregada'
              ? 'Entregado'
              : 'En preparación',
          horaCreacion: hora,
        };
      }

      return {
        id: String(m.id),
        idBackend: m.id,
        numero: m.numero,
        seccion: m.seccionNombre || 'Salón Principal',
        capacidad: m.numero === 5 || m.numero === 8 ? 8 : m.numero % 2 === 0 ? 6 : 4,
        estado: estaOcupada ? 'Ocupada' : estaReservada ? 'Reservada' : 'Disponible',
        pedidoActual,
      };
    });
  }, [mesasRaw, comandas, productosMenu]);

  // Filtrado de mesas por sección
  const mesasFiltradas = useMemo(() => {
    return mesas.filter(
      (m) => seccionFiltro === 'Todas' || m.seccion === seccionFiltro
    );
  }, [mesas, seccionFiltro]);

  // Abrir modal de mesa al hacer clic
  const abrirMesa = (mesa: Mesa) => {
    setMesaSeleccionada(mesa);

    if (mesa.estado === 'Ocupada' && mesa.pedidoActual) {
      setNombreCliente(mesa.pedidoActual.cliente);
      setHoraEstimada(mesa.pedidoActual.horaEstimada);
      setPersonas(mesa.pedidoActual.personas);
      setNotasMesa(mesa.pedidoActual.notasIniciales || '');
      setCarrito(mesa.pedidoActual.items);
      setPasoModal('menu');
    } else {
      setNombreCliente('');
      const horaActual = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setHoraEstimada(horaActual);
      setPersonas(mesa.capacidad);
      setNotasMesa('');
      setCarrito([]);
      setPasoModal('info');
    }
  };

  const cerrarModal = () => {
    setMesaSeleccionada(null);
  };

  // Agregar / Disminuir items al carrito de la mesa
  const modificarCantidad = (producto: Producto, cambio: number) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id);
      if (!existe) {
        if (cambio > 0) return [...prev, { producto, cantidad: 1 }];
        return prev;
      }
      const nuevaCantidad = existe.cantidad + cambio;
      if (nuevaCantidad <= 0) {
        return prev.filter((item) => item.producto.id !== producto.id);
      }
      return prev.map((item) =>
        item.producto.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item
      );
    });
  };

  // Guardar/Confirmar Comanda en la Mesa (conectado con Backend)
  const guardarPedido = async () => {
    if (!mesaSeleccionada || carrito.length === 0) return;
    setGuardando(true);

    try {
      await crear({
        mesa: mesaSeleccionada.numero,
        idMesa: mesaSeleccionada.idBackend,
        items: carrito.map((it) => ({
          idProducto: it.producto.idProducto,
          producto: it.producto.nombre,
          cantidad: it.cantidad,
          precio: it.producto.precio,
          categoria: it.producto.categoria,
          nota: it.notas,
        })),
        nota: notasMesa.trim(),
        mesero: usuario?.nombre?.trim() || 'Mesero',
        cliente: nombreCliente.trim() || 'Cliente General',
        personas: personas,
      });

      await MesaServicio.actualizarMesa(mesaSeleccionada.idBackend, {
        estado: 'Ocupada',
      });

      await recargar();
      await cargarDatosBackend();
      cerrarModal();
    } catch (err) {
      console.error('Error guardando pedido en backend:', err);
      alert('Hubo un error al enviar la comanda. Se guardó localmente.');
      cerrarModal();
    } finally {
      setGuardando(false);
    }
  };

  // Despachar / Liberar Mesa (conectado con Backend)
  const liberarMesa = async (mesaId: string) => {
    const mesaTarget = mesas.find((m) => m.id === mesaId);
    if (!mesaTarget) return;

    if (!window.confirm(`¿Deseas liberar y despachar la Mesa ${mesaTarget.numero}?`)) {
      return;
    }

    setGuardando(true);
    try {
      // 1. Si tenía comanda activa, cambiar estado a Entregada
      if (mesaTarget.pedidoActual?.comandaId) {
        await cambiarEstado(mesaTarget.pedidoActual.comandaId, 'Entregada');
      }

      // 2. Marcar mesa como Libre en backend
      await MesaServicio.actualizarMesa(mesaTarget.idBackend, {
        estado: 'Libre',
      });

      await recargar();
      await cargarDatosBackend();
      cerrarModal();
    } catch (err) {
      console.error('Error al liberar mesa:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Total del carrito actual
  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  }, [carrito]);

  return (
    <div className="min-h-screen bg-[#07191d] text-slate-100 p-4 md:p-8 font-sans antialiased selection:bg-[#3ba28a] selection:text-[#07191d]">
      
      {/* --- ENCABEZADO Y BARRA PRINCIPAL --- */}
      <header className="mb-8 border-b border-[#143d46] pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0a2228] border border-[#143d46] flex items-center justify-center text-[#3ba28a] shadow-lg">
              <LayoutGrid className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Gestión de Mesas
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    conectadoBackend
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      conectadoBackend ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {conectadoBackend ? 'Backend en Línea' : 'Modo Local'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de disponibilidad, asignación y pedidos en vivo sincronizados con Cocina.
              </p>
            </div>
          </div>

          {/* Estadísticas de Mesas y Botón de Recarga */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0a2228] p-1.5 rounded-2xl border border-[#143d46] shadow-inner">
              <div className="px-3 py-1 rounded-xl bg-[#0e2a30] text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Disponibles: {mesas.filter((m) => m.estado === 'Disponible').length}
              </div>
              <div className="px-3 py-1 rounded-xl bg-[#0e2a30] text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Ocupadas: {mesas.filter((m) => m.estado === 'Ocupada').length}
              </div>
              <div className="px-3 py-1 rounded-xl bg-[#0e2a30] text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Reservadas: {mesas.filter((m) => m.estado === 'Reservada').length}
              </div>
            </div>

            <button
              onClick={() => {
                void recargar();
                void cargarDatosBackend();
              }}
              disabled={cargando}
              className="p-2.5 rounded-xl bg-[#0a2228] border border-[#143d46] text-slate-300 hover:text-white hover:border-[#3ba28a] hover:bg-[#0e2a30] transition-colors"
              title="Recargar mesas y comandas"
            >
              <RotateCw className={`w-4 h-4 ${cargando ? 'animate-spin text-[#3ba28a]' : ''}`} />
            </button>

            {esDueno && (
              <button
                onClick={() => setConfigAbierta(true)}
                className="p-2.5 rounded-xl bg-[#0a2228] border border-[#143d46] text-slate-300 hover:text-white hover:border-[#3ba28a] hover:bg-[#0e2a30] transition-colors"
                title="Configurar mesas y secciones"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pestañas de Secciones de Mesas */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-medium text-slate-400 mr-2 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Sección:
          </span>
          {seccionesDisponibles.map((sec) => (
            <button
              key={sec}
              onClick={() => setSeccionFiltro(sec)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                seccionFiltro === sec
                  ? 'bg-[#3ba28a] text-[#07191d] border-[#3ba28a] shadow-lg shadow-[#3ba28a]/20 scale-105'
                  : 'bg-[#0a2228] text-slate-300 border-[#143d46] hover:bg-[#0e2a30] hover:text-white'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </header>

      {/* --- GRID DE MESAS (TARJETAS MULTI-ESTADO) --- */}
      <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mesasFiltradas.map((mesa) => {
          const estaOcupada = mesa.estado === 'Ocupada';
          const estaReservada = mesa.estado === 'Reservada';

          return (
            <div
              key={mesa.id}
              onClick={() => abrirMesa(mesa)}
              className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-2xl hover:-translate-y-1 ${
                estaOcupada
                  ? 'bg-[#0e2a30] border-[#3ba28a]/50 hover:border-[#3ba28a]'
                  : estaReservada
                  ? 'bg-[#0a2228] border-amber-500/40 hover:border-amber-500'
                  : 'bg-[#0a2228] border-[#143d46] hover:border-[#3ba28a]/60 hover:bg-[#0e2a30]'
              }`}
            >
              {/* Encabezado de la Tarjeta */}
              <div className="p-4 border-b border-[#143d46] flex items-center justify-between bg-[#081e23]/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#07191d] border border-[#143d46] flex items-center justify-center text-white font-black text-lg group-hover:border-[#3ba28a] transition-colors">
                    {mesa.numero}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      Mesa {mesa.numero}
                    </h3>
                    <span className="text-xs text-slate-400">{mesa.seccion}</span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    estaOcupada
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : estaReservada
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {mesa.estado}
                </span>
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-4 space-y-3 flex-1 bg-[#091f24]/30">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#3ba28a]" />
                    Capacidad: {mesa.capacidad} pers.
                  </span>
                </div>

                {/* Vista previa de Comanda estilo tarjeta beige si la mesa está ocupada */}
                {estaOcupada && mesa.pedidoActual && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#f3ebd9] text-[#0a2228] space-y-2.5 text-xs shadow-md border border-[#e5dcc7]">
                    <div className="flex items-center justify-between border-b border-[#0a2228]/15 pb-2 font-bold">
                      <span className="flex items-center gap-1 font-mono text-xs">
                        <Receipt className="w-3.5 h-3.5 text-[#2b7264]" />
                        {mesa.pedidoActual.id}
                      </span>
                      <span className="bg-[#e63950] text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                        {mesa.pedidoActual.horaEstimada}
                      </span>
                    </div>

                    <div className="font-bold text-[#0a2228] truncate">
                      Cliente: <span className="font-semibold text-slate-800">{mesa.pedidoActual.cliente}</span>
                    </div>

                    {mesa.pedidoActual.notasIniciales && (
                      <div className="flex items-start gap-1 bg-amber-100/90 p-1.5 rounded text-[11px] text-amber-900 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                        <span className="line-clamp-2">{mesa.pedidoActual.notasIniciales}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#0a2228]/15 flex justify-between items-center font-black text-sm text-[#0a2228]">
                      <span>{mesa.pedidoActual.items.reduce((s, i) => s + i.cantidad, 0)} ítems</span>
                      <span className="text-[#2b7264] font-mono">
                        ${mesa.pedidoActual.total.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Acción Footer */}
              <div className="p-3 bg-[#0a2228] border-t border-[#143d46] text-center text-xs font-bold text-[#3ba28a] group-hover:bg-[#3ba28a] group-hover:text-[#07191d] transition-all flex items-center justify-center gap-2">
                {estaOcupada ? (
                  <>
                    <span>Ver / Editar Pedido</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tomar Pedido</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* --- MODAL INTERACTIVO DE ATENCIÓN Y TOMAR PEDIDO --- */}
      {esDueno && (
        <ConfiguracionMesas
          abierto={configAbierta}
          onCerrar={() => setConfigAbierta(false)}
          onActualizado={() => {
            void recargar();
            void cargarDatosBackend();
          }}
        />
      )}

      {mesaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-[#0a2228] border border-[#143d46] rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header del Modal */}
            <div className="p-4 sm:p-5 bg-[#0e2a30] border-b border-[#143d46] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#3ba28a] text-[#07191d] flex items-center justify-center font-black text-xl shadow-md">
                  M{mesaSeleccionada.numero}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-white">
                      Mesa {mesaSeleccionada.numero}
                    </h2>
                    <span className="text-xs bg-[#0a2228] border border-[#143d46] text-[#3ba28a] px-2.5 py-0.5 rounded-full font-semibold">
                      {mesaSeleccionada.seccion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {pasoModal === 'info'
                      ? 'Paso 1: Datos del cliente y comensales'
                      : 'Paso 2: Selección de menú y envío a cocina'}
                  </p>
                </div>
              </div>

              <button
                onClick={cerrarModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#143d46] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* ================= PASO 1: INFORMACIÓN DEL CLIENTE ================= */}
              {pasoModal === 'info' && (
                <div className="max-w-2xl mx-auto space-y-5 py-2">
                  <div className="bg-[#0e2a30] p-4 rounded-2xl border border-[#143d46] flex items-center gap-3 text-xs text-slate-300">
                    <Sparkles className="w-5 h-5 text-[#3ba28a] shrink-0" />
                    <span>
                      Ingresa la información inicial del cliente para abrir comanda en la mesa antes de seleccionar los platillos.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nombre del Cliente / Responsable
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      className="w-full bg-[#f3ebd9] text-[#0a2228] font-bold p-3.5 rounded-xl border-2 border-transparent focus:border-[#3ba28a] focus:outline-none placeholder-slate-500 shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Hora Estimada / Pedido
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                          type="text"
                          value={horaEstimada}
                          onChange={(e) => setHoraEstimada(e.target.value)}
                          placeholder="Ej. 09:30 p. m."
                          className="w-full bg-[#f3ebd9] text-[#0a2228] font-bold pl-10 pr-3.5 py-3.5 rounded-xl border-2 border-transparent focus:border-[#3ba28a] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Número de Personas
                      </label>
                      <div className="flex items-center gap-3 bg-[#0e2a30] p-2 rounded-xl border border-[#143d46]">
                        <button
                          type="button"
                          onClick={() => setPersonas((p) => Math.max(1, p - 1))}
                          className="p-2 rounded-lg bg-[#0a2228] text-white hover:bg-[#143d46] transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-center font-black text-white text-base">
                          {personas}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPersonas((p) => p + 1)}
                          className="p-2 rounded-lg bg-[#0a2228] text-white hover:bg-[#143d46] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Notas Especiales / Observaciones
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ej. Alergias, jugos primero, término de carne..."
                      value={notasMesa}
                      onChange={(e) => setNotasMesa(e.target.value)}
                      className="w-full bg-[#f3ebd9] text-[#0a2228] font-bold p-3.5 rounded-xl border-2 border-transparent focus:border-[#3ba28a] focus:outline-none placeholder-slate-500 shadow-inner"
                    />
                  </div>
                </div>
              )}

              {/* ================= PASO 2: MENÚ SECCIONADO Y COMANDA ================= */}
              {pasoModal === 'menu' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LADO IZQUIERDO: CATÁLOGO DE MENÚ (7 COLS) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Buscador de productos */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar plato, bebida o entrada..."
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                        className="w-full bg-[#0e2a30] text-white pl-10 pr-4 py-3 rounded-xl border border-[#143d46] focus:outline-none focus:border-[#3ba28a] text-sm placeholder-slate-400"
                      />
                    </div>

                    {/* Categorías Navegables */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {CATEGORIAS.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoriaActiva(cat)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                            categoriaActiva === cat
                              ? 'bg-[#3ba28a] text-[#07191d] border-[#3ba28a] shadow-md'
                              : 'bg-[#0e2a30] text-slate-300 border-[#143d46] hover:bg-[#143d46]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Lista de Productos Filtrados */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {productosMenu
                        .filter((p) => {
                          const coincideCat = p.categoria === categoriaActiva;
                          const coincideBusqueda = p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase());
                          return busquedaProducto ? coincideBusqueda : coincideCat;
                        })
                        .map((producto) => {
                          const itemEnCarrito = carrito.find((i) => i.producto.id === producto.id);
                          return (
                            <div
                              key={producto.id}
                              className="bg-[#0e2a30] border border-[#143d46] p-3.5 rounded-2xl flex flex-col justify-between gap-3 hover:border-[#3ba28a]/40 transition-colors"
                            >
                              <div>
                                <h4 className="font-bold text-white text-sm leading-snug">
                                  {producto.nombre}
                                </h4>
                                {producto.descripcion && (
                                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                                    {producto.descripcion}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-[#143d46]/60">
                                <span className="font-mono font-bold text-sm text-[#3ba28a]">
                                  ${producto.precio.toLocaleString('es-CO')}
                                </span>

                                <div className="flex items-center gap-1.5 bg-[#0a2228] p-1 rounded-xl border border-[#143d46]">
                                  <button
                                    onClick={() => modificarCantidad(producto, -1)}
                                    className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#143d46]"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-black text-white">
                                    {itemEnCarrito ? itemEnCarrito.cantidad : 0}
                                  </span>
                                  <button
                                    onClick={() => modificarCantidad(producto, 1)}
                                    className="p-1 rounded-lg bg-[#3ba28a] text-[#07191d] hover:bg-[#43b399]"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* LADO DERECHO: VISTA TICKET / COMANDA EN VIVO (5 COLS) */}
                  <div className="lg:col-span-5 bg-[#f3ebd9] text-[#0a2228] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl border border-[#e5dcc7] relative">
                    <div className="space-y-3">
                      {/* Cabecera del Ticket */}
                      <div className="border-b-2 border-dashed border-[#0a2228]/20 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-[#2b7264]" />
                            <span className="font-black text-base uppercase tracking-tight">Comanda Mesa #{mesaSeleccionada.numero}</span>
                          </div>
                          <span className="bg-[#2b7264] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {horaEstimada}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#0a2228]/80 mt-1">
                          Cliente: <span className="text-[#0a2228]">{nombreCliente || 'Cliente General'}</span> ({personas} personas)
                        </div>
                        {notasMesa && (
                          <div className="mt-1.5 text-[11px] bg-amber-200/80 p-1.5 rounded text-amber-900 font-semibold">
                            Nota: {notasMesa}
                          </div>
                        )}
                      </div>

                      {/* Items en el carrito */}
                      {carrito.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-600 italic">
                          <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#2b7264]" />
                          Selecciona ítems del menú a la izquierda para armar la comanda.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {carrito.map((item) => (
                            <div
                              key={item.producto.id}
                              className="flex items-center justify-between text-xs font-bold border-b border-[#0a2228]/10 pb-1.5"
                            >
                              <div className="pr-2">
                                <div>{item.producto.nombre}</div>
                                <div className="text-[10px] text-slate-600 font-mono font-normal">
                                  ${item.producto.precio.toLocaleString('es-CO')} c/u
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="bg-[#0a2228] text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                  x{item.cantidad}
                                </span>
                                <span className="font-mono font-bold">
                                  ${(item.producto.precio * item.cantidad).toLocaleString('es-CO')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Total y Resumen */}
                    <div className="pt-4 border-t-2 border-dashed border-[#0a2228]/20 mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Total Ítems:</span>
                        <span>{carrito.reduce((s, i) => s + i.cantidad, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between font-black text-lg">
                        <span>Total Comanda:</span>
                        <span className="text-[#2b7264] font-mono">
                          ${totalCarrito.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Footer Modal Acciones */}
            <div className="p-4 sm:p-5 bg-[#0e2a30] border-t border-[#143d46] flex items-center justify-between shrink-0">
              {mesaSeleccionada.estado === 'Ocupada' ? (
                <button
                  onClick={() => liberarMesa(mesaSeleccionada.id)}
                  disabled={guardando}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Despachar / Liberar Mesa
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                {pasoModal === 'menu' && (
                  <button
                    onClick={() => setPasoModal('info')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-[#143d46] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Datos Cliente
                  </button>
                )}

                {pasoModal === 'info' ? (
                  <button
                    onClick={() => setPasoModal('menu')}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#3ba28a] text-[#07191d] hover:bg-[#43b399] transition-all shadow-lg shadow-[#3ba28a]/20"
                  >
                    <span>Ir al Menú</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={guardarPedido}
                    disabled={carrito.length === 0 || guardando}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#3ba28a] text-[#07191d] hover:bg-[#43b399] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#3ba28a]/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {guardando ? 'Enviando a Cocina...' : 'Confirmar Pedido en Mesa'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
