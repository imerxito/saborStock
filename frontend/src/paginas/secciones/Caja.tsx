import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { useAuth } from '../../contexto/AuthContexto';
import { useComandas } from '../../contexto/ComandasContexto';
import { ComandaServicio } from '../../servicios/ComandaServicio';
import { MesaServicio } from '../../servicios/MesaServicio';
import { ProductoServicio } from '../../servicios/ProductoServicio';
import { CajaServicio, type TurnoCajaDTO } from '../../servicios/CajaServicio';
import type { Caja as TipoCaja } from '../../tipos/Caja';
import { UsuarioServicio } from '../../servicios/UsuarioServicio';
import { NominaServicio, type PagoNomina } from '../../servicios/NominaServicio';
import { 
  ConfiguracionServicio, 
  type ConfiguracionNegocio, 
  type ConfiguracionFacturacion,
  type ImpresoraFrontend
} from '../../servicios/ConfiguracionServicio';
import type { MesaBackend } from '../../tipos/Comanda';
import FormatoTicketTermico from '../../componentes/FormatoTicketTermico';

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

// --- Tipos de Datos ---
type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';

interface Producto { id: string; nombre: string; precio: number; categoria: string; idCategoria?: number; }
interface ItemPedido { producto: Producto; cantidad: number; }
interface Movimiento { id: string; tipo: 'ingreso' | 'egreso'; concepto: string; monto: number; hora: string; }

export interface EmpleadoNomina {
  idUsuario: number;
  nombre: string;
  cedula: string;
  telefono: string;
  cargo: string;
}

// NUEVO: SubVentas dentro de una mesa
interface SubVenta {
  id: string;
  comandaId?: number;
  idVenta?: number;
  cliente: string;
  total: number;
  items: { idProducto?: number; nombre: string; cantidad: number; precio: number }[];
}

interface HistorialMesaItem { 
  id: string; 
  idFactura?: number;
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

interface MesaActiva { 
  id: string; 
  idBackend?: number;
  nombre: string; 
  seccion: string; 
  mesero: string; 
  ventas: SubVenta[];
}

// Componente Principal
export default function Caja(): React.ReactElement {
  const { usuario } = useAuth();
  const { comandas, crear, cambiarEstado, recargar } = useComandas();

  const [mesasRaw, setMesasRaw] = useState<MesaBackend[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [turnoActual, setTurnoActual] = useState<TurnoCajaDTO | null>(null);
  const [turnoAbierto, setTurnoAbierto] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sabor_turno_abierto') === 'true';
    } catch {
      return false;
    }
  });
  const [verificandoTurno, setVerificandoTurno] = useState<boolean>(true);
  const [bannerCerradoDescartado, setBannerCerradoDescartado] = useState<boolean>(false);
  const [baseInicial, setBaseInicial] = useState<number>(150000);
  const [montoCierre, setMontoCierre] = useState<number>(0);
  const [modalTurno, setModalTurno] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [cobrandoMesa, setCobrandoMesa] = useState<boolean>(false);
  const [cobrandoVentaDirecta, setCobrandoVentaDirecta] = useState<boolean>(false);
  const [ticketAImprimir, setTicketAImprimir] = useState<TicketCaja | null>(null);
  const [negocioConfig, setNegocioConfig] = useState<ConfiguracionNegocio | null>(null);
  const [facturacionConfig, setFacturacionConfig] = useState<ConfiguracionFacturacion | null>(null);
  const [impresorasConfig, setImpresorasConfig] = useState<ImpresoraFrontend[]>([]);
  
  // Estados de Movimientos, Nómina y Empleados
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [nuevoMovTipo, setNuevoMovTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [nuevoMovConcepto, setNuevoMovConcepto] = useState<string>('');
  const [nuevoMovMonto, setNuevoMovMonto] = useState<string>('');

  const [nominas, setNominas] = useState<PagoNomina[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoNomina[]>([]);
  const [busquedaEmpleado, setBusquedaEmpleado] = useState<string>('');
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<EmpleadoNomina | null>(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false);
  const [nomBase, setNomBase] = useState<number>(50000);
  const [nomBono, setNomBono] = useState<number>(0);
  const [metodoPagoNomina, setMetodoPagoNomina] = useState<string>('Efectivo');

  const totalesTurno = useMemo(() => {
    let ventasEfectivo = 0;
    let ventasOtros = 0;
    let egresos = 0;

    for (const m of movimientos) {
      const monto = Number(m.monto || 0);
      if (m.tipo === 'egreso') {
        egresos += monto;
      } else {
        const cLower = (m.concepto || '').toLowerCase();
        if (cLower.includes('tarjeta') || cLower.includes('transf')) {
          ventasOtros += monto;
        } else {
          ventasEfectivo += monto;
        }
      }
    }

    const efectivoEstimado = baseInicial + ventasEfectivo - egresos;
    return {
      baseInicial,
      ventasEfectivo,
      ventasOtros,
      egresos,
      efectivoEstimado: Math.max(0, efectivoEstimado),
    };
  }, [baseInicial, movimientos]);

  const esDuenoOAdmin = useMemo(() => {
    const r = (usuario?.rol || '').toLowerCase();
    return r.includes('due') || r.includes('admin');
  }, [usuario?.rol]);

  // Estados de Cajas Físicas / Personalización
  const [cajas, setCajas] = useState<TipoCaja[]>([]);
  const [cajaActivaId, setCajaActivaId] = useState<number>(() => {
    try {
      const guardada = localStorage.getItem('sabor_caja_id');
      return guardada ? Number(guardada) : 1;
    } catch {
      return 1;
    }
  });
  const [modalGestionCajas, setModalGestionCajas] = useState<boolean>(false);
  const [nuevaCajaNombre, setNuevaCajaNombre] = useState<string>('');
  const [cajaEditandoId, setCajaEditandoId] = useState<number | null>(null);
  const [cajaEditandoNombre, setCajaEditandoNombre] = useState<string>('');
  const [guardandoCaja, setGuardandoCaja] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'ventas' | 'cobrar' | 'historialMesas' | 'movimientos' | 'nomina'>('ventas');

  // Estados para Historial Mesas (Cuentas y Auditoría de eventos)
  const [historialMesas, setHistorialMesas] = useState<HistorialMesaItem[]>([]);
  const [eventosMesas, setEventosMesas] = useState<EventoHistorialMesa[]>([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState<string>('');
  const [filtroTipoHistorial, setFiltroTipoHistorial] = useState<'todos' | 'mesas' | 'directa'>('todos');
  const [filtroSeccionHistorial, setFiltroSeccionHistorial] = useState<string>('Todas');
  const [vistaHistorial, setVistaHistorial] = useState<'cuentas' | 'eventos'>('cuentas');
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);
  const [mesaDetalleModal, setMesaDetalleModal] = useState<HistorialMesaItem | null>(null);

  useEffect(() => {
    if (ticketAImprimir) {
      const timer = setTimeout(() => {
        window.print();
        setTicketAImprimir(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [ticketAImprimir]);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const idCajaConsulta = Number(localStorage.getItem('sabor_caja_id')) || cajaActivaId || 1;
      const [
        mesasData, 
        prodsData, 
        cajasData,
        turno, 
        movs, 
        facturas, 
        negData, 
        factData, 
        usuariosData, 
        nominasData, 
        impData,
        historialEventosData
      ] = await Promise.all([
        MesaServicio.listarMesas().catch(() => []),
        ProductoServicio.listar().catch(() => []),
        CajaServicio.listarCajas().catch(() => []),
        CajaServicio.obtenerTurnoActual(idCajaConsulta).catch(() => null),
        CajaServicio.listarMovimientos().catch(() => []),
        CajaServicio.listarFacturas().catch(() => []),
        ConfiguracionServicio.obtenerNegocio().catch(() => null),
        ConfiguracionServicio.obtenerFacturacion().catch(() => null),
        UsuarioServicio.listar().catch(() => []),
        NominaServicio.listar().catch(() => []),
        ConfiguracionServicio.listarImpresoras().catch(() => []),
        MesaServicio.obtenerHistorial().catch(() => []),
      ]);

      if (cajasData && cajasData.length > 0) {
        setCajas(cajasData);
        if (!cajasData.some(c => c.id === idCajaConsulta)) {
          const primera = cajasData.find(c => c.activo) || cajasData[0];
          setCajaActivaId(primera.id);
          try { localStorage.setItem('sabor_caja_id', String(primera.id)); } catch {}
        }
      }

      if (negData) setNegocioConfig(negData);
      if (factData) setFacturacionConfig(factData);
      if (nominasData) setNominas(nominasData);
      if (impData) setImpresorasConfig(impData);

      if (usuariosData && usuariosData.length > 0) {
        const empList: EmpleadoNomina[] = (usuariosData as any[])
          .filter((u: any) => u.activo !== false)
          .map((u: any) => ({
            idUsuario: Number(u.idUsuario || u.id_usuario || u.id),
            nombre: u.nombre || 'Empleado',
            cedula: u.cedula || 'S/N',
            telefono: u.telefono || '',
            cargo: u.rol || 'Empleado',
          }));
        setEmpleados(empList);
        setEmpleadoSeleccionado((prev) => prev || (empList.length > 0 ? empList[0] : null));
      }

      if (mesasData && mesasData.length > 0) {
        setMesasRaw(mesasData);
      }

      if (prodsData && prodsData.length > 0) {
        setProductosDisponibles(prodsData.map(p => ({
          id: String(p.id_producto),
          idCategoria: (p as any).id_categoria ?? undefined,
          nombre: p.nombre,
          precio: p.precio_venta,
          categoria: p.descripcion?.toLowerCase().includes('bebida') || p.nombre.toLowerCase().includes('jugo') || p.nombre.toLowerCase().includes('cerveza')
            ? 'Bebidas'
            : p.descripcion?.toLowerCase().includes('postre')
            ? 'Adicionales'
            : 'Comidas'
        })));
      }

      if (turno && turno.estado === 'Abierto') {
        setTurnoActual(turno);
        setTurnoAbierto(true);
        setBaseInicial(turno.montoInicial);
        try { localStorage.setItem('sabor_turno_abierto', 'true'); } catch {}
      } else {
        setTurnoActual(null);
        setTurnoAbierto(false);
        try { localStorage.setItem('sabor_turno_abierto', 'false'); } catch {}
      }

      setMovimientos((movs || []).map(m => ({
        id: String(m.id),
        tipo: m.tipoPago.toLowerCase().includes('egreso') ? 'egreso' : 'ingreso',
        concepto: m.descripcion || `Movimiento #${m.id} (${m.metodoPago})`,
        monto: m.monto,
        hora: new Date(m.fechaMovimiento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));

      const mesaPorId = new Map((mesasData || []).map(m => [m.id, m]));
      const usuarioPorId = new Map((usuariosData || []).map((u: any) => [Number(u.idUsuario || u.id_usuario || u.id), u.nombre]));

      // 1. Mapear Eventos de Mesas desde /api/historial-mesas
      const eventosMapeados: EventoHistorialMesa[] = (historialEventosData || []).map((ev: any) => {
        const mesaInfo = mesaPorId.get(ev.idMesa);
        const numeroMesa = mesaInfo?.numero ?? ev.idMesa;
        const nombreSeccion = mesaInfo?.seccionNombre || 'Salón';
        const nombreUsuario = usuarioPorId.get(ev.idUsuario) || (ev.idUsuario ? `Usuario #${ev.idUsuario}` : 'Sistema');
        const fechaObj = ev.fechaAccion ? new Date(ev.fechaAccion) : new Date();
        return {
          id: ev.id,
          idMesa: ev.idMesa,
          mesa: `Mesa ${numeroMesa}`,
          seccion: nombreSeccion,
          idVenta: ev.idVenta,
          idUsuario: ev.idUsuario,
          usuario: nombreUsuario,
          estado: ev.estado || 'Actualización',
          monto: ev.monto ?? null,
          motivo: ev.motivo || 'Movimiento de mesa',
          fecha: isNaN(fechaObj.getTime()) ? String(ev.fechaAccion) : fechaObj.toLocaleString('es-CO', {
            dateStyle: 'short',
            timeStyle: 'medium'
          })
        };
      });
      setEventosMesas(eventosMapeados);

      // 2. Mapear Cuentas / Cobros de Mesas y Ventas Directas
      setHistorialMesas((facturas || []).map(f => {
        const mesaInfo = f.idMesa != null ? mesaPorId.get(f.idMesa) : undefined;
        const numeroMesa = f.mesaNumero ?? (mesaInfo ? mesaInfo.numero : undefined);
        const nombreSeccion = f.seccionNombre || mesaInfo?.seccionNombre || (numeroMesa != null ? 'Salón' : '');
        const nombreMesero = f.usuarioNombre || (f.idUsuario ? usuarioPorId.get(f.idUsuario) : undefined) || 'Caja';
        const fecha = f.fechaEmision ? new Date(f.fechaEmision) : new Date();
        const items = Array.isArray(f.detalles) && f.detalles.length > 0
          ? f.detalles.map((d: any) => ({
              nombre: d.nombre || d.producto?.nombre || `Producto #${d.idProducto}`,
              cantidad: Number(d.cantidad) || 1,
              precio: Number(d.precioUnitario ?? d.precio_unitario) || 0,
            }))
          : [];
        return {
          id: `F-${f.id}`,
          idFactura: f.id,
          mesa: numeroMesa != null ? `Mesa ${numeroMesa}` : 'Venta directa',
          seccion: nombreSeccion,
          cliente: f.cliente || 'Cliente General',
          monto: f.totalPagar,
          mesero: nombreMesero,
          metodoPago: String(f.metodoPago || 'Efectivo'),
          estado: 'Pagada' as const,
          fechaApertura: isNaN(fecha.getTime()) ? String(f.fechaEmision) : fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' }),
          fechaCierre: isNaN(fecha.getTime()) ? String(f.fechaEmision) : fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' }),
          items,
        };
      }));
    } catch (e: any) {
      console.warn('Error al cargar datos en Caja:', e);
      alert('Error al cargar datos de caja: ' + (e?.message || 'Error desconocido'));
    } finally {
      setCargando(false);
      setVerificandoTurno(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const cambiarCajaActiva = useCallback(async (id: number) => {
    if (turnoAbierto && id !== cajaActivaId) {
      const cajaActual = cajas.find(c => c.id === cajaActivaId)?.nombre || `Caja #${cajaActivaId}`;
      const deseaCerrar = window.confirm(
        `Solo puedes operar una caja a la vez.\n` +
        `Actualmente tienes el turno abierto en "${cajaActual}".\n\n` +
        `¿Deseas cerrar el turno de "${cajaActual}" primero para poder operar la otra caja?`
      );
      if (deseaCerrar) {
        setMontoCierre(totalesTurno.efectivoEstimado);
        setModalTurno(true);
      }
      return;
    }
    setCajaActivaId(id);
    try { localStorage.setItem('sabor_caja_id', String(id)); } catch {}
    setVerificandoTurno(true);
    try {
      const [turno, movs] = await Promise.all([
        CajaServicio.obtenerTurnoActual(id).catch(() => null),
        CajaServicio.listarMovimientos().catch(() => []),
      ]);
      if (turno && turno.estado === 'Abierto') {
        setTurnoActual(turno);
        setTurnoAbierto(true);
        setBaseInicial(turno.montoInicial);
        try { localStorage.setItem('sabor_turno_abierto', 'true'); } catch {}
      } else {
        setTurnoActual(null);
        setTurnoAbierto(false);
        try { localStorage.setItem('sabor_turno_abierto', 'false'); } catch {}
      }
      setMovimientos((movs || []).map(m => ({
        id: String(m.id),
        tipo: m.tipoPago.toLowerCase().includes('egreso') ? 'egreso' : 'ingreso',
        concepto: m.descripcion || `Movimiento #${m.id} (${m.metodoPago})`,
        monto: m.monto,
        hora: new Date(m.fechaMovimiento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } finally {
      setVerificandoTurno(false);
    }
  }, [turnoAbierto, cajaActivaId, cajas, totalesTurno]);

  // Funciones de personalización de cajas (Dueño / Admin)
  const crearCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = nuevaCajaNombre.trim();
    if (!nombre) {
      alert('Por favor ingresa un nombre para la caja.');
      return;
    }
    setGuardandoCaja(true);
    try {
      const creada = await CajaServicio.crearCaja({ nombre });
      setCajas(prev => [...prev, creada]);
      setNuevaCajaNombre('');
      alert(`✓ Caja "${creada.nombre}" creada con éxito.`);
    } catch (err: any) {
      alert('Error al crear la caja: ' + (err?.message || 'Error desconocido'));
    } finally {
      setGuardandoCaja(false);
    }
  };

  const guardarEdicionCaja = async (id: number) => {
    const nombre = cajaEditandoNombre.trim();
    if (!nombre) {
      alert('El nombre no puede estar vacío.');
      return;
    }
    setGuardandoCaja(true);
    try {
      const actualizada = await CajaServicio.actualizarCaja(id, { nombre });
      setCajas(prev => prev.map(c => c.id === id ? actualizada : c));
      setCajaEditandoId(null);
      setCajaEditandoNombre('');
    } catch (err: any) {
      alert('Error al actualizar caja: ' + (err?.message || 'Error desconocido'));
    } finally {
      setGuardandoCaja(false);
    }
  };

  const alternarEstadoCaja = async (caja: TipoCaja) => {
    setGuardandoCaja(true);
    try {
      const actualizada = await CajaServicio.actualizarCaja(caja.id, { activo: !caja.activo });
      setCajas(prev => prev.map(c => c.id === caja.id ? actualizada : c));
    } catch (err: any) {
      alert('Error al cambiar estado: ' + (err?.message || 'Error desconocido'));
    } finally {
      setGuardandoCaja(false);
    }
  };

  const eliminarCaja = async (caja: TipoCaja) => {
    if (cajas.length <= 1) {
      alert('No puedes eliminar la única caja del sistema.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar "${caja.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setGuardandoCaja(true);
    try {
      await CajaServicio.eliminarCaja(caja.id);
      setCajas(prev => prev.filter(c => c.id !== caja.id));
      if (cajaActivaId === caja.id) {
        const restante = cajas.find(c => c.id !== caja.id);
        if (restante) {
          void cambiarCajaActiva(restante.id);
        }
      }
      alert('✓ Caja eliminada con éxito.');
    } catch (err: any) {
      alert('Error al eliminar la caja: ' + (err?.message || 'Es posible que tenga turnos o movimientos asociados.'));
    } finally {
      setGuardandoCaja(false);
    }
  };

  const categoriasDisponibles = useMemo(() => {
    const cats = Array.from(new Set(productosDisponibles.map(p => p.categoria)));
    return ['Todas', ...cats];
  }, [productosDisponibles]);

  // Estados Venta Directa
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');
  const [busquedaProductoVenta, setBusquedaProductoVenta] = useState<string>('');
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);
  const [nombreCliente, setNombreCliente] = useState<string>('');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const productosFiltradosVenta = useMemo(() => {
    const q = busquedaProductoVenta.trim().toLowerCase();
    return productosDisponibles.filter(p => {
      const matchCat = categoriaSeleccionada === 'Todas' || p.categoria === categoriaSeleccionada;
      const matchQuery = !q || p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [productosDisponibles, categoriaSeleccionada, busquedaProductoVenta]);
  
  // Modal de Cobro Venta Directa
  const [modalCobroVenta, setModalCobroVenta] = useState<boolean>(false);
  const [metodoPagoVenta, setMetodoPagoVenta] = useState<MetodoPago>('efectivo');
  const [montoRecibidoVenta, setMontoRecibidoVenta] = useState<number>(0);
  const [montoEfectivoVenta, setMontoEfectivoVenta] = useState<number>(0);
  const [montoDigitalVenta, setMontoDigitalVenta] = useState<number>(0);

  // Estados Cobrar Mesas
  const mesasActivas = useMemo<MesaActiva[]>(() => {
    if (mesasRaw.length === 0) return [];

    const activas: MesaActiva[] = [];

    mesasRaw.forEach(m => {
      const coms = comandas.filter(
        c => (c.idMesa === m.id || c.mesa === m.numero) && c.estado !== 'Cerrado'
      );

      if (coms.length > 0) {
        const mapaVentas = new Map<string, { id: string; comandaId?: number; idVenta?: number; cliente: string; total: number; items: { idProducto?: number; nombre: string; cantidad: number; precio: number }[] }>();

        coms.forEach(c => {
          const clienteKey = (c.cliente || 'Cliente General').trim();
          const itemsMapeados = c.items.map(it => ({
            idProducto: it.idProducto,
            nombre: it.producto,
            cantidad: it.cantidad,
            precio: it.precio || 0
          }));
          const totalC = c.total || itemsMapeados.reduce((sum, it) => sum + it.precio * it.cantidad, 0);

          if (!mapaVentas.has(clienteKey)) {
            mapaVentas.set(clienteKey, {
              id: String(c.id),
              comandaId: c.id,
              idVenta: c.idVenta,
              cliente: clienteKey,
              total: totalC,
              items: [...itemsMapeados]
            });
          } else {
            const vExistente = mapaVentas.get(clienteKey)!;
            vExistente.total += totalC;
            vExistente.items.push(...itemsMapeados);
          }
        });

        activas.push({
          id: String(m.id),
          idBackend: m.id,
          nombre: `Mesa ${m.numero}`,
          seccion: m.seccionNombre || 'Salón Principal',
          mesero: coms[0]?.mesero || 'Mesero',
          ventas: Array.from(mapaVentas.values())
        });
      }
    });

    return activas.length > 0 ? activas : [];
  }, [mesasRaw, comandas]);
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

  const seccionesHistorial = useMemo(() => {
    const setSec = new Set<string>();
    historialMesas.forEach(h => { if (h.seccion) setSec.add(h.seccion); });
    eventosMesas.forEach(e => { if (e.seccion) setSec.add(e.seccion); });
    return ['Todas', ...Array.from(setSec)];
  }, [historialMesas, eventosMesas]);

  const historialMesasFiltrado = useMemo(() => {
    const q = busquedaHistorial.trim().toLowerCase();
    return historialMesas.filter((item) => {
      const esMesa = item.mesa.toLowerCase().includes('mesa');
      if (filtroTipoHistorial === 'mesas' && !esMesa) return false;
      if (filtroTipoHistorial === 'directa' && esMesa) return false;
      if (filtroSeccionHistorial !== 'Todas' && item.seccion !== filtroSeccionHistorial) return false;

      if (!q) return true;
      return (
        item.mesa.toLowerCase().includes(q) ||
        item.cliente.toLowerCase().includes(q) ||
        item.mesero.toLowerCase().includes(q) ||
        item.seccion.toLowerCase().includes(q) ||
        item.metodoPago.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [historialMesas, busquedaHistorial, filtroTipoHistorial, filtroSeccionHistorial]);

  const eventosMesasFiltrados = useMemo(() => {
    const q = busquedaHistorial.trim().toLowerCase();
    return eventosMesas.filter((ev) => {
      if (filtroSeccionHistorial !== 'Todas' && ev.seccion !== filtroSeccionHistorial) return false;
      if (!q) return true;
      return (
        ev.mesa.toLowerCase().includes(q) ||
        ev.seccion.toLowerCase().includes(q) ||
        ev.usuario.toLowerCase().includes(q) ||
        ev.estado.toLowerCase().includes(q) ||
        ev.motivo.toLowerCase().includes(q) ||
        String(ev.id).includes(q)
      );
    });
  }, [eventosMesas, busquedaHistorial, filtroSeccionHistorial]);

  const totalRecaudadoHistorial = useMemo(() => {
    return historialMesasFiltrado.reduce((acc, it) => acc + (it.monto || 0), 0);
  }, [historialMesasFiltrado]);

  const recargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const [facturas, evs, mesas, usuarios] = await Promise.all([
        CajaServicio.listarFacturas().catch(() => []),
        MesaServicio.obtenerHistorial().catch(() => []),
        MesaServicio.listarMesas().catch(() => []),
        UsuarioServicio.listar().catch(() => []),
      ]);
      if (mesas && mesas.length > 0) setMesasRaw(mesas);
      const mesaPorId = new Map((mesas || []).map(m => [m.id, m]));
      const usuarioPorId = new Map((usuarios || []).map((u: any) => [Number(u.idUsuario || u.id_usuario || u.id), u.nombre]));

      setEventosMesas((evs || []).map((ev: any) => {
        const mesaInfo = mesaPorId.get(ev.idMesa);
        const numeroMesa = mesaInfo?.numero ?? ev.idMesa;
        const nombreSeccion = mesaInfo?.seccionNombre || mesaInfo?.seccion?.nombre || 'Salón';
        const nombreUsuario = usuarioPorId.get(ev.idUsuario) || (ev.idUsuario ? `Usuario #${ev.idUsuario}` : 'Sistema');
        const fechaObj = ev.fechaAccion ? new Date(ev.fechaAccion) : new Date();
        return {
          id: ev.id,
          idMesa: ev.idMesa,
          mesa: `Mesa ${numeroMesa}`,
          seccion: nombreSeccion,
          idVenta: ev.idVenta,
          idUsuario: ev.idUsuario,
          usuario: nombreUsuario,
          estado: ev.estado || 'Actualización',
          monto: ev.monto ?? null,
          motivo: ev.motivo || 'Movimiento de mesa',
          fecha: isNaN(fechaObj.getTime()) ? String(ev.fechaAccion) : fechaObj.toLocaleString('es-CO', {
            dateStyle: 'short',
            timeStyle: 'medium'
          })
        };
      }));

      setHistorialMesas((facturas || []).map(f => {
        const mesaInfo = f.idMesa != null ? mesaPorId.get(f.idMesa) : undefined;
        const numeroMesa = f.mesaNumero ?? (mesaInfo ? mesaInfo.numero : undefined);
        const nombreSeccion = f.seccionNombre || mesaInfo?.seccion?.nombre || (numeroMesa != null ? 'Salón' : '');
        const nombreMesero = f.usuarioNombre || (f.idUsuario ? usuarioPorId.get(f.idUsuario) : undefined) || 'Caja';
        const fecha = f.fechaEmision ? new Date(f.fechaEmision) : new Date();
        const items = Array.isArray(f.detalles) && f.detalles.length > 0
          ? f.detalles.map((d: any) => ({
              nombre: d.nombre || d.producto?.nombre || `Producto #${d.idProducto}`,
              cantidad: Number(d.cantidad) || 1,
              precio: Number(d.precioUnitario ?? d.precio_unitario) || 0,
            }))
          : [];
        return {
          id: `F-${f.id}`,
          idFactura: f.id,
          mesa: numeroMesa != null ? `Mesa ${numeroMesa}` : 'Venta directa',
          seccion: nombreSeccion,
          cliente: f.cliente || 'Cliente General',
          monto: f.totalPagar,
          mesero: nombreMesero,
          metodoPago: String(f.metodoPago || 'Efectivo'),
          estado: 'Pagada' as const,
          fechaApertura: isNaN(fecha.getTime()) ? String(f.fechaEmision) : fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' }),
          fechaCierre: isNaN(fecha.getTime()) ? String(f.fechaEmision) : fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' }),
          items,
        };
      }));
    } finally {
      setCargandoHistorial(false);
    }
  };

  const agregarAlCarrito = (prod: Producto) => {
    if (!turnoAbierto) {
      alert('🔒 La caja está cerrada. Debes abrir un turno para agregar productos y realizar ventas.');
      setModalTurno(true);
      return;
    }
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
    if (!turnoAbierto) return;
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

  const cobrarComandaRapida = async () => {
    if (cobrandoVentaDirecta) return;
    if (carrito.length === 0) return;
    if (!turnoAbierto) {
      setModalTurno(true);
      alert('Debes abrir el turno de caja antes de registrar un cobro.');
      return;
    }
    if (isPagoIncompletoVenta) {
      alert('El monto ingresado es menor al total a pagar. Por favor verifica.');
      return;
    }

    setCobrandoVentaDirecta(true);
    try {
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const clienteStr = nombreCliente.trim() || 'Venta Rápida (Sin Mesa)';
      
      let detalleExtra = '';
      if (metodoPagoVenta === 'mixto') {
        const totalMixto = montoEfectivoVenta + montoDigitalVenta;
        const vueltoMixto = Math.max(0, totalMixto - totalCarrito);
        detalleExtra = ` (Ef: $${montoEfectivoVenta} / Dig: $${montoDigitalVenta})${vueltoMixto > 0 ? ` [Cambio: $${vueltoMixto}]` : ''}`;
      } else if ((metodoPagoVenta === 'efectivo' || metodoPagoVenta === 'transferencia') && montoRecibidoVenta > 0) {
        detalleExtra = ` (Recibido: $${montoRecibidoVenta} / Cambio: $${cambioVenta})`;
      }

      const idUsuarioActual = Number((usuario as any)?.id_usuario || (usuario as any)?.idUsuario || 1);

      // 1. Enviar el pedido y cobrarlo como factura en Backend
      const comandaCreada = await crear({
        mesa: null,
        idMesa: null,
        idUsuario: Number.isFinite(idUsuarioActual) ? idUsuarioActual : null,
        cliente: clienteStr,
        personas: 1,
        nota: `Venta Directa Caja (${metodoPagoVenta.toUpperCase()})`,
        mesero: usuario?.nombre?.trim() || 'Cajero',
        items: carrito.map(it => ({
          idProducto: Number(it.producto.id.replace(/\D/g, '')) || undefined,
          producto: it.producto.nombre,
          cantidad: it.cantidad,
          precio: it.producto.precio,
          categoria: it.producto.categoria
        }))
      });

      // Despachar automáticamente a impresoras de cocina/barra por socket directo de red
      try {
        let imps = impresorasConfig.filter((i) => i.activa);
        if (imps.length === 0) {
          try {
            const frescas = await ConfiguracionServicio.listarImpresoras();
            imps = (frescas || []).filter((i) => i.activa);
          } catch {}
        }

        for (const imp of imps) {
          const itemsFiltrados = carrito.filter((it) => {
            if (!imp.categoriasIds || imp.categoriasIds.length === 0) return true;
            const catId = it.producto.idCategoria;
            return catId ? imp.categoriasIds.includes(catId) : true;
          });

          if (itemsFiltrados.length === 0) continue;

          await ConfiguracionServicio.imprimirComandaDirecta(imp.id, {
            mesa: 'Venta Directa',
            cliente: clienteStr,
            mesero: usuario?.nombre?.trim() || 'Cajero',
            items: itemsFiltrados.map((it) => ({
              nombre: it.producto.nombre,
              cantidad: it.cantidad,
            })),
          }).catch(() => {});
        }
      } catch {}

      await CajaServicio.crearFactura({
        idMesa: null,
        idUsuario: idUsuarioActual,
        subtotal: totalCarrito,
        propina: 0,
        cliente: clienteStr,
        metodoPago: metodoPagoVenta,
        montoEfectivo: metodoPagoVenta === 'mixto' ? montoEfectivoVenta : undefined,
        montoTarjeta: metodoPagoVenta === 'mixto' ? montoDigitalVenta : undefined,
        idTurnoCaja: turnoActual?.id,
        idVenta: comandaCreada.idVenta ?? null,
        idsComandas: [comandaCreada.id],
        cerrarComandas: false,
        cerrarVenta: true,
        detalles: carrito
          .map((it) => ({
            idProducto: Number(it.producto.id.replace(/\D/g, '')),
            cantidad: it.cantidad,
            precioUnitario: it.producto.precio,
          }))
          .filter((it) => it.idProducto > 0),
      });

      const nuevoMov: Movimiento = {
        id: Date.now().toString(),
        tipo: 'ingreso',
        concepto: `Venta comanda rápida (${clienteStr}) - ${metodoPagoVenta.toUpperCase()}${detalleExtra}`,
        monto: totalCarrito,
        hora: horaActual
      };
      setMovimientos(prev => [nuevoMov, ...prev]);
      
      const itemsComprados = carrito.map(it => ({ nombre: it.producto.nombre, cantidad: it.cantidad, precio: it.producto.precio }));
      
      const nuevoHistorial: HistorialMesaItem = {
        id: `VD-${Date.now()}`,
        mesa: 'Venta directa',
        seccion: '',
        cliente: clienteStr,
        monto: totalCarrito,
        mesero: usuario?.nombre?.trim() || 'Caja',
        metodoPago: metodoPagoVenta.toUpperCase(),
        estado: 'Pagada',
        fechaApertura: new Date().toLocaleString(),
        fechaCierre: new Date().toLocaleString(),
        items: itemsComprados,
      };
      setHistorialMesas(prev => [nuevoHistorial, ...prev]);

      setCarrito([]);
      setNombreCliente('');
      setMetodoPagoVenta('efectivo');
      setMontoRecibidoVenta(0);
      setMontoEfectivoVenta(0);
      setMontoDigitalVenta(0);
      setModalCobroVenta(false);

      if (window.confirm('Venta procesada exitosamente. ¿Deseas imprimir la factura / recibo de venta?')) {
        setTicketAImprimir({
          titulo: 'Factura / Venta Directa',
          cliente: clienteStr,
          items: itemsComprados,
          subtotal: totalCarrito,
          total: totalCarrito,
          metodoPago: metodoPagoVenta.toUpperCase(),
          fecha: new Date().toLocaleDateString('es-CO'),
        });
      }

      void recargar();
    } catch (err: any) {
      alert('Error al procesar comanda rápida: ' + (err?.message || 'Error desconocido'));
    } finally {
      setCobrandoVentaDirecta(false);
    }
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
    if (!turnoAbierto) {
      alert('🔒 La caja está cerrada. Debes abrir un turno para cobrar mesas.');
      setModalTurno(true);
      return;
    }
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

  const cobrarVentaMesa = async () => {
    if (cobrandoMesa) return;
    if (!mesaACobrar || !ventaSeleccionada) return;
    if (!turnoAbierto) {
      setModalTurno(true);
      alert('Debes abrir el turno de caja antes de registrar un cobro.');
      return;
    }
    if (isPagoIncompletoMesa) {
      alert('El monto ingresado es menor al total a pagar. Por favor verifica.');
      return;
    }

    setCobrandoMesa(true);
    try {
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
      if (descuentoAplicado > 0) {
        detalleExtra += ` [Desc: -$${descuentoAplicado}]`;
      }

      // 1. Crear la factura: cierra comandas/venta y registra el pago en caja
      const comsACerrar = comandas.filter(
        c => (c.idMesa === mesaACobrar.idBackend || c.mesa === Number(mesaACobrar.nombre.replace(/\D/g, ''))) &&
             (c.cliente || 'Cliente General').trim().toLowerCase() === ventaSeleccionada.cliente.trim().toLowerCase() &&
             c.estado !== 'Cerrado'
      );

      const idsComandas = Array.from(new Set([
        ...comsACerrar.map((com) => com.id),
        ...(ventaSeleccionada.comandaId ? [ventaSeleccionada.comandaId] : []),
      ]));
      const idVenta = ventaSeleccionada.idVenta ?? comsACerrar.find((com) => com.idVenta)?.idVenta ?? null;

      const detallesFactura = Array.from(
        ventaSeleccionada.items.reduce((mapa, item) => {
          if (!item.idProducto || item.cantidad <= 0) return mapa;
          const clave = `${item.idProducto}-${item.precio}`;
          const actual = mapa.get(clave) || { idProducto: item.idProducto, cantidad: 0, precioUnitario: item.precio };
          actual.cantidad += item.cantidad;
          mapa.set(clave, actual);
          return mapa;
        }, new Map<string, { idProducto: number; cantidad: number; precioUnitario: number }>()).values()
      );

      const idUsuarioActual = Number((usuario as any)?.id_usuario || (usuario as any)?.idUsuario || 1);
      await CajaServicio.crearFactura({
        idMesa: mesaACobrar.idBackend ?? null,
        idUsuario: idUsuarioActual,
        subtotal: ventaSeleccionada.total,
        descuento: descuentoAplicado,
        propina: Number(propina) || 0,
        cliente: ventaSeleccionada.cliente,
        metodoPago,
        montoEfectivo: metodoPago === 'mixto' ? montoEfectivo : undefined,
        montoTarjeta: metodoPago === 'mixto' ? montoDigital : undefined,
        idTurnoCaja: turnoActual?.id,
        idVenta,
        idsComandas,
        detalles: detallesFactura,
      });

      // Actualizaciones concurrentes de estado local / remoto
      const tareasActualizacion: Promise<unknown>[] = [];
      if (idsComandas.length > 0) {
        tareasActualizacion.push(...idsComandas.map((idCmd) => {
          if (typeof cambiarEstado === 'function') {
            return cambiarEstado(idCmd, 'Cerrado').catch(() => {});
          }
          return ComandaServicio.cambiarEstado(idCmd, 'Cerrado').catch(() => {});
        }));
      }
      if (mesaACobrar.idBackend) {
        tareasActualizacion.push(MesaServicio.actualizarMesa(mesaACobrar.idBackend, { estado: 'Libre' }).catch(() => {}));
      }
      if (tareasActualizacion.length > 0) {
        await Promise.all(tareasActualizacion);
      }

      // 4. Agregar a historial local de mesas
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

      const nuevoMov: Movimiento = {
        id: Date.now().toString(),
        tipo: 'ingreso',
        concepto: `Cobro ${mesaACobrar.nombre} - ${ventaSeleccionada.cliente} - ${metodoPago.toUpperCase()}${detalleExtra}`,
        monto: totalCobroMesa,
        hora: horaActual
      };
      setMovimientos(prev => [nuevoMov, ...prev]);

      // Refrescar mesas, comandas e historial concurrentemente
      await Promise.all([
        recargar().catch(() => {}),
        MesaServicio.listarMesas().then(setMesasRaw).catch(() => {}),
        MesaServicio.obtenerHistorial().then((evs) => {
          if (evs && evs.length > 0) {
            const mesaMap = new Map((mesasRaw || []).map(m => [m.id, m]));
            const userMap = new Map(empleados.map(e => [e.idUsuario, e.nombre]));
            setEventosMesas(evs.map((ev: any) => {
              const mesaInfo = mesaMap.get(ev.idMesa);
              const numMesa = mesaInfo?.numero ?? ev.idMesa;
              const secNom = mesaInfo?.seccionNombre || (mesaInfo as any)?.seccion?.nombre || 'Salón';
              const usrNom = userMap.get(ev.idUsuario) || (ev.idUsuario ? `Usuario #${ev.idUsuario}` : 'Sistema');
              const fObj = ev.fechaAccion ? new Date(ev.fechaAccion) : new Date();
              return {
                id: ev.id,
                idMesa: ev.idMesa,
                mesa: `Mesa ${numMesa}`,
                seccion: secNom,
                idVenta: ev.idVenta,
                idUsuario: ev.idUsuario,
                usuario: usrNom,
                estado: ev.estado || 'Actualización',
                monto: ev.monto ?? null,
                motivo: ev.motivo || 'Movimiento de mesa',
                fecha: isNaN(fObj.getTime()) ? String(ev.fechaAccion) : fObj.toLocaleString('es-CO', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                })
              };
            }));
          }
        }).catch(() => {})
      ]);

      const datosTicket = {
        titulo: 'Factura / Comprobante de Pago',
        cliente: ventaSeleccionada.cliente,
        mesa: mesaACobrar.nombre,
        seccion: mesaACobrar.seccion,
        items: ventaSeleccionada.items.map(it => ({ nombre: it.nombre, cantidad: it.cantidad, precio: it.precio })),
        subtotal: ventaSeleccionada.total,
        descuento: descuentoAplicado,
        propina: Number(propina) || 0,
        total: totalCobroMesa,
        metodoPago: metodoPago.toUpperCase(),
        fecha: fechaActual,
      };

      // Limpiar montos y modal
      setMesaACobrar(null);
      setVentaSeleccionada(null);
      setMontoEfectivo(0);
      setMontoDigital(0);
      setPropina(0);
      setDescuento(0);
      setMontoRecibidoSimple(0);
      setMetodoPago('efectivo');

      if (window.confirm(`Cobro de ${datosTicket.mesa} realizado con éxito. ¿Deseas imprimir la factura de venta?`)) {
        setTicketAImprimir(datosTicket);
      }
    } catch (err: any) {
      alert('Error al cobrar la venta: ' + (err?.message || 'Error desconocido'));
    } finally {
      setCobrandoMesa(false);
    }
  };

  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoAbierto || !turnoActual?.id) {
      alert('🔒 La caja está cerrada. Debes abrir un turno para registrar movimientos de dinero.');
      setModalTurno(true);
      return;
    }
    if (!nuevoMovConcepto.trim() || !nuevoMovMonto || parseFloat(nuevoMovMonto) <= 0) return;
    const montoNum = parseFloat(nuevoMovMonto);
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const idUsuarioActual = (usuario as any)?.id_usuario || (usuario as any)?.idUsuario || 1;
      const idTurno = turnoActual?.id;
      if (!idTurno) {
        alert('No hay un turno de caja abierto. Abre el turno para registrar movimientos.');
        return;
      }
      await CajaServicio.registrarMovimiento({
        idTurnoCaja: idTurno,
        idUsuario: idUsuarioActual,
        monto: montoNum,
        metodoPago: 'Efectivo',
        tipoPago: nuevoMovTipo === 'egreso' ? 'Egreso' : 'Ingreso',
        descripcion: nuevoMovConcepto.trim()
      });

      const nuevo: Movimiento = {
        id: Date.now().toString(),
        tipo: nuevoMovTipo,
        concepto: nuevoMovConcepto.trim(),
        monto: montoNum,
        hora: horaActual
      };
      setMovimientos(prev => [nuevo, ...prev]);
      setNuevoMovConcepto('');
      setNuevoMovMonto('');
    } catch (err: any) {
      alert('Error al registrar movimiento: ' + (err?.message || 'Error desconocido'));
    }
  };

  const abrirTurnoOperacional = async (monto: number, idCajaObjetivo?: number) => {
    try {
      const idCajaApertura = idCajaObjetivo ?? cajaActivaId ?? 1;
      const idUsuarioActual = Number((usuario as any)?.id_usuario || (usuario as any)?.idUsuario || 1);
      const nuevoTurno = await CajaServicio.abrirTurno(monto, idCajaApertura, idUsuarioActual);
      setCajaActivaId(idCajaApertura);
      try { localStorage.setItem('sabor_caja_id', String(idCajaApertura)); } catch {}
      setTurnoActual(nuevoTurno);
      setTurnoAbierto(true);
      setBaseInicial(monto);
      setModalTurno(false);
      try { localStorage.setItem('sabor_turno_abierto', 'true'); } catch {}
      const nombreCajaApertura = cajas.find(c => c.id === idCajaApertura)?.nombre || `Caja #${idCajaApertura}`;
      const nuevoMov: Movimiento = {
        id: Date.now().toString(),
        tipo: 'ingreso',
        concepto: `Base inicial (${nombreCajaApertura})`,
        monto: monto,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMovimientos(prev => [nuevoMov, ...prev]);
    } catch (err: any) {
      alert('Error al abrir turno: ' + (err?.message || 'Error desconocido'));
    }
  };


  const cerrarTurnoOperacional = async (montoFinalVal: number) => {
    try {
      const idUsuarioActual = Number((usuario as any)?.id_usuario || (usuario as any)?.idUsuario || 1);
      const idTurno = turnoActual?.id;
      if (!idTurno) {
        alert('No hay un turno activo registrado para cerrar.');
        return;
      }
      await CajaServicio.cerrarTurno(idTurno, montoFinalVal, idUsuarioActual);
      setTurnoActual(null);
      setTurnoAbierto(false);
      setModalTurno(false);
      setMontoCierre(0);
      try { localStorage.setItem('sabor_turno_abierto', 'false'); } catch {}
      await cargarDatos();
      alert('✓ Turno de caja cerrado con éxito. Se ha registrado el arqueo final.');
    } catch (err: any) {
      alert('Error al cerrar turno: ' + (err?.message || 'Error desconocido'));
    }
  };

  const registrarNomina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoAbierto) {
      alert('🔒 La caja está cerrada. Debes abrir un turno para pagar nómina desde la caja.');
      setModalTurno(true);
      return;
    }
    if (!empleadoSeleccionado) {
      alert('Por favor selecciona un empleado para registrar la nómina.');
      return;
    }
    const total = Number(nomBase) + Number(nomBono);
    if (!(total > 0)) {
      alert('El monto de la nómina debe ser mayor a 0.');
      return;
    }
    try {
      const idUsuarioActual = Number((usuario as any)?.id_usuario || (usuario as any)?.idUsuario || 1);
      const res = await NominaServicio.crear({
        idUsuario: Number(empleadoSeleccionado.idUsuario),
        idTurnoCaja: turnoActual?.id ?? null,
        montoBase: Number(nomBase),
        bono: Number(nomBono),
        metodoPago: metodoPagoNomina,
        fecha: new Date().toISOString(),
        registrarEgresoCaja: true,
        idUsuarioOperador: idUsuarioActual,
      });

      setNominas(prev => [res, ...prev.filter(n => n.id !== res.id)]);

      if (turnoActual?.id) {
        const egresoNomina: Movimiento = {
          id: Date.now().toString(),
          tipo: 'egreso',
          concepto: `Pago Nómina a ${empleadoSeleccionado.nombre} (${empleadoSeleccionado.cargo}) - ${metodoPagoNomina}`,
          monto: total,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMovimientos(prev => [egresoNomina, ...prev]);
      }

      setNomBono(0);
      setBusquedaEmpleado('');
      alert(`✓ Pago de nómina por $${total.toLocaleString()} registrado con éxito para ${empleadoSeleccionado.nombre}.`);
    } catch (err: any) {
      alert('Error al registrar pago de nómina: ' + (err?.message || 'Error desconocido'));
    }
  };

  const eliminarPagoNomina = async (id: number | string) => {
    if (!window.confirm('¿Deseas eliminar este registro de nómina?')) return;
    try {
      await NominaServicio.eliminar(id);
      setNominas(prev => prev.filter(n => String(n.id) !== String(id)));
    } catch (err: any) {
      alert('Error al eliminar nómina: ' + (err?.message || 'Error desconocido'));
    }
  };

  const imprimirComprobanteNomina = (pago: PagoNomina) => {
    setTicketAImprimir({
      titulo: 'COMPROBANTE DE PAGO DE NOMINA',
      cliente: `${pago.empleado} (${pago.cargo}) - CC: ${pago.cedula}`,
      seccion: `Metodo: ${pago.metodo}`,
      items: [
        { nombre: 'Sueldo Base', cantidad: 1, precio: pago.montoBase },
        ...(pago.bono > 0 ? [{ nombre: 'Bono / Incentivo', cantidad: 1, precio: pago.bono }] : [])
      ],
      subtotal: pago.montoTotal,
      total: pago.montoTotal,
      metodoPago: pago.metodo,
      fecha: pago.fecha,
      mensajePie: 'Comprobante de entrega de nómina y liquidación.',
    });
  };

  const empleadosFiltrados = empleados.filter(emp => 
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Caja Activa */}
          <div className="flex items-center gap-1.5 bg-[#1C2541] px-2 py-0.5 rounded-lg border border-[#3A506B] h-7">
            <Store size={13} className="text-[#5BC0DE] shrink-0" />
            <select
              value={cajaActivaId}
              onChange={(e) => void cambiarCajaActiva(Number(e.target.value))}
              className="bg-transparent text-[#F4D6B0] text-[11px] font-bold focus:outline-none cursor-pointer pr-1"
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

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-24 sm:pb-2">
            
            {activeTab === 'ventas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:h-full">
                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-[#5BC0DE]" />
                      <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0]">Menú Rápido por Categorías</h3>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5BC0DE]" size={13} />
                      <input
                        type="text"
                        placeholder="Buscar producto o comida..."
                        value={busquedaProductoVenta}
                        onChange={(e) => setBusquedaProductoVenta(e.target.value)}
                        className="w-full bg-[#0B132B] border border-[#3A506B] pl-8 pr-7 py-1 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE] placeholder:text-[#5BC0DE]/40"
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
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2.5 border-b border-[#3A506B] shrink-0 scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {categoriasDisponibles.map((cat) => (
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
                  <div className="flex-1 overflow-y-auto pr-1 max-h-[50vh] lg:max-h-none">
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
                    )}
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
                        disabled={!turnoAbierto || carrito.length === 0} 
                        onClick={() => {
                          if (!turnoAbierto) {
                            alert('🔒 La caja está cerrada. Debes abrir un turno para operar.');
                            setModalTurno(true);
                            return;
                          }
                          setModalCobroVenta(true);
                        }} 
                        className="flex-1 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 text-[#0B132B] font-bold py-2 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        {!turnoAbierto ? <Lock size={12} /> : null}
                        {!turnoAbierto ? 'Caja Cerrada (Abrir Turno)' : 'Cobrar Comanda Rápida'}
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
                                <span className="block text-[9px] text-[#5BC0DE] truncate">{m.seccion} • {(m.mesero || 'Mesero').split(' ')[0]}</span>
                              </div>
                              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[#D97706]/15 text-[#D97706] text-[9px] font-semibold">{m.ventas.length} Ventas</span>
                            </div>

                            {/* Preview de productos consumidos */}
                            <div className="my-1 space-y-0.5 max-h-14 overflow-y-auto scrollbar-none bg-[#1C2541]/70 p-1.5 rounded-lg border border-[#3A506B]/50 text-[10px]">
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

                            <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-[#3A506B] text-[10px]">
                              <span className="text-[#5BC0DE]">Total Mesa:</span>
                              <span className="font-bold text-[#D97706] text-sm">${totalMesa.toLocaleString()}</span>
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
                              className="w-full mt-2 py-1 bg-[#5BC0DE]/10 text-[#5BC0DE] border border-[#5BC0DE]/30 rounded-lg text-[10px] font-bold hover:bg-[#5BC0DE]/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              {!turnoAbierto ? <Lock size={10} /> : null}
                              {!turnoAbierto ? 'Abrir Turno para Cobrar' : 'Gestionar Cobro'}
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
              <div className="bg-[#1C2541] p-3 sm:p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0">
                {/* Header de la sección de Historial */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#3A506B] shrink-0">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0] flex items-center gap-1.5">
                      <Clock className="text-[#5BC0DE]" size={16} /> Historial y Trazabilidad de Mesas
                    </h3>
                    <p className="text-[11px] text-[#5BC0DE]">
                      Registro de cobros facturados, detalles de pedidos y auditoría de cambios de estado en mesas.
                    </p>
                  </div>

                  {/* Switcher de Vistas & Botón Recargar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-[#0B132B] p-0.5 rounded-xl border border-[#3A506B]">
                      <button
                        type="button"
                        onClick={() => setVistaHistorial('cuentas')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          vistaHistorial === 'cuentas'
                            ? 'bg-[#5BC0DE] text-[#0B132B] shadow-sm'
                            : 'text-[#5BC0DE]/70 hover:text-[#F4D6B0]'
                        }`}
                      >
                        <Receipt size={13} /> Cuentas Cobradas ({historialMesasFiltrado.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setVistaHistorial('eventos')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          vistaHistorial === 'eventos'
                            ? 'bg-[#5BC0DE] text-[#0B132B] shadow-sm'
                            : 'text-[#5BC0DE]/70 hover:text-[#F4D6B0]'
                        }`}
                      >
                        <RotateCw size={13} /> Auditoría Estados ({eventosMesasFiltrados.length})
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={cargandoHistorial}
                      onClick={() => void recargarHistorial()}
                      title="Refrescar historial de mesas"
                      className="px-2.5 py-1 bg-[#0B132B] hover:bg-[#3A506B] text-[#5BC0DE] border border-[#3A506B] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCw size={13} className={cargandoHistorial ? 'animate-spin text-[#5BC0DE]' : ''} />
                      <span className="hidden sm:inline">Refrescar</span>
                    </button>
                  </div>
                </div>

                {/* Filtros, Buscador y Métricas */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3 shrink-0">
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    {/* Buscador */}
                    <div className="relative flex-1 min-w-[190px] sm:max-w-xs">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5BC0DE]" size={13} />
                      <input
                        type="text"
                        placeholder={vistaHistorial === 'cuentas' ? "Buscar mesa, cliente, mesero..." : "Buscar mesa, estado, motivo..."}
                        value={busquedaHistorial}
                        onChange={(e) => setBusquedaHistorial(e.target.value)}
                        className="w-full bg-[#0B132B] border border-[#3A506B] pl-8 pr-7 py-1 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE] placeholder:text-[#5BC0DE]/40"
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

                    {/* Filtro por Sección */}
                    {seccionesHistorial.length > 2 && (
                      <select
                        value={filtroSeccionHistorial}
                        onChange={(e) => setFiltroSeccionHistorial(e.target.value)}
                        className="bg-[#0B132B] border border-[#3A506B] px-2.5 py-1 rounded-xl text-xs text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                      >
                        {seccionesHistorial.map(s => (
                          <option key={s} value={s}>{s === 'Todas' ? 'Todas las secciones' : s}</option>
                        ))}
                      </select>
                    )}

                    {/* Filtro de Tipo si está en cuentas */}
                    {vistaHistorial === 'cuentas' && (
                      <div className="flex gap-1 overflow-x-auto scrollbar-none">
                        {(['todos', 'mesas', 'directa'] as const).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFiltroTipoHistorial(f)}
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                              filtroTipoHistorial === f
                                ? 'bg-[#5BC0DE]/20 text-[#5BC0DE] border border-[#5BC0DE]'
                                : 'bg-[#0B132B] text-[#5BC0DE]/60 border border-[#3A506B] hover:text-[#F4D6B0]'
                            }`}
                          >
                            {f === 'todos' ? 'Todos' : f === 'mesas' ? 'Solo Mesas' : 'Venta Directa'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Badges de Métricas */}
                  <div className="flex items-center gap-2 shrink-0">
                    {vistaHistorial === 'cuentas' && (
                      <div className="bg-[#0B132B] px-2.5 py-1 rounded-xl border border-[#3A506B] text-[11px] flex items-center gap-1.5">
                        <span className="text-[#5BC0DE]">Recaudado:</span>
                        <span className="font-bold text-emerald-400">${totalRecaudadoHistorial.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="bg-[#0B132B] px-2.5 py-1 rounded-xl border border-[#3A506B] text-[11px] text-[#5BC0DE]">
                      <span>Registros: <strong className="text-[#F4D6B0]">{vistaHistorial === 'cuentas' ? historialMesasFiltrado.length : eventosMesasFiltrados.length}</strong></span>
                    </div>
                  </div>
                </div>

                {/* VISTA 1: TABLA DE CUENTAS COBRADAS */}
                {vistaHistorial === 'cuentas' && (
                  <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#3A506B] rounded-xl bg-[#0B132B] min-h-0 max-h-[65vh] lg:max-h-none scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                      <thead className="sticky top-0 bg-[#1C2541] border-b border-[#3A506B] text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-2.5 px-3">Mesa / Origen</th>
                          <th className="py-2.5 px-3">Cliente</th>
                          <th className="py-2.5 px-3">Productos Consumidos</th>
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
                              <p>No se encontraron cuentas registradas con los filtros aplicados.</p>
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
                                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[#3A506B]/50 text-[#5BC0DE]">
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
                              <td className="py-2.5 px-3 text-right font-bold text-[#5BC0DE] text-sm">
                                ${hm.monto.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setMesaDetalleModal(hm)}
                                    title="Ver detalle del pedido consumido"
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
                                    title="Reimprimir ticket térmico"
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

                {/* VISTA 2: TABLA DE EVENTOS Y AUDITORÍA DE MESAS (/api/historial-mesas) */}
                {vistaHistorial === 'eventos' && (
                  <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#3A506B] rounded-xl bg-[#0B132B] min-h-0 max-h-[65vh] lg:max-h-none scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                      <thead className="sticky top-0 bg-[#1C2541] border-b border-[#3A506B] text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-2.5 px-3">Mesa / Sección</th>
                          <th className="py-2.5 px-3">Estado Registrado</th>
                          <th className="py-2.5 px-3">Motivo / Acción</th>
                          <th className="py-2.5 px-3">Usuario Responsable</th>
                          <th className="py-2.5 px-3 text-right">Monto</th>
                          <th className="py-2.5 px-3">Fecha y Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3A506B]/60 text-xs text-[#F4D6B0]">
                        {eventosMesasFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-[#5BC0DE]/60 text-xs">
                              <RotateCw size={24} className="mx-auto mb-2 text-[#5BC0DE]/30" />
                              <p>No se encontraron eventos de mesas registrados con los filtros aplicados.</p>
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
                                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[#3A506B]/50 text-[#5BC0DE]">
                                      {ev.seccion}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeColor}`}>
                                    {ev.estado}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-[#F4D6B0]">
                                  {ev.motivo}
                                </td>
                                <td className="py-2.5 px-3 text-[#5BC0DE]">
                                  {ev.usuario}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-[#5BC0DE]">
                                  {ev.monto != null ? `$${ev.monto.toLocaleString()}` : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-[#5BC0DE] text-[11px] whitespace-nowrap">
                                  {ev.fecha}
                                </td>
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
                    <button 
                      type="submit" 
                      disabled={!turnoAbierto}
                      className="w-full bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 text-[#0B132B] font-bold py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      {!turnoAbierto ? <Lock size={13} /> : null}
                      {!turnoAbierto ? 'Turno Cerrado (Abrir para registrar)' : 'Guardar Movimiento'}
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
                            placeholder="Buscar por nombre, C.C o cargo..."
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
                        <div className="bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B] space-y-0.5 text-[#F4D6B0]">
                          <p className="flex items-center gap-1 font-bold text-[#5BC0DE] text-xs">
                            <UserCheck size={13} /> {empleadoSeleccionado.nombre}
                          </p>
                          <p className="text-[11px] text-[#5BC0DE]">Cédula: <span className="text-[#F4D6B0]">{empleadoSeleccionado.cedula}</span></p>
                          <p className="text-[11px] text-[#5BC0DE]">Cargo: <span className="text-[#F4D6B0]">{empleadoSeleccionado.cargo}</span></p>
                        </div>
                      ) : (
                        <div className="bg-[#0B132B]/60 p-2.5 rounded-xl border border-dashed border-[#3A506B] text-center text-[#5BC0DE]/60 text-[11px]">
                          Selecciona un empleado de la lista
                        </div>
                      )}

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

                      <div>
                        <label className="text-[#5BC0DE] mb-1 block text-[11px]">Método de Pago</label>
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
                      <div className="p-2 bg-[#5BC0DE]/15 border border-[#5BC0DE]/30 rounded-xl flex justify-between items-center font-bold text-[#5BC0DE] text-xs">
                        <span>Total Pago:</span>
                        <span>${(Number(nomBase) + Number(nomBono)).toLocaleString()}</span>
                      </div>
                      <button 
                        type="submit" 
                        disabled={!turnoAbierto || !empleadoSeleccionado}
                        className="w-full bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 text-[#0B132B] font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        {!turnoAbierto ? <Lock size={14} /> : <Plus size={15} />}
                        {!turnoAbierto ? 'Turno Cerrado (Abrir para pagar)' : 'Registrar Pago Nómina'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-[#1C2541] p-3.5 rounded-2xl border border-[#3A506B] flex flex-col lg:h-full lg:min-h-0">
                  <div className="flex justify-between items-center mb-2.5 shrink-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#F4D6B0]">Pagos de Personal Registrados</h3>
                    <span className="text-[11px] text-[#5BC0DE] font-semibold">{nominas.length} registros</span>
                  </div>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[55vh] lg:max-h-none scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                    {nominas.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#5BC0DE]/70">
                        No hay pagos de nómina registrados en el sistema.
                      </div>
                    ) : (
                      nominas.map((n) => (
                        <div key={n.id} className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 p-2.5 rounded-xl bg-[#0B132B] border border-[#3A506B] text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-xl bg-[#5BC0DE]/15 text-[#5BC0DE] shrink-0">
                              <Users size={15} />
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
                            <span className="font-bold text-[#5BC0DE] text-xs sm:text-sm">
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
              <button disabled={cobrandoVentaDirecta} onClick={() => setModalCobroVenta(false)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 disabled:opacity-40 text-[#F4D6B0] font-bold py-2.5 rounded-xl text-xs transition-all">
                Cancelar
              </button>
              <button disabled={isPagoIncompletoVenta || cobrandoVentaDirecta} onClick={cobrarComandaRapida} className="flex-1 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B132B] font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5">
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
              <button disabled={cobrandoMesa} onClick={() => setMesaACobrar(null)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 disabled:opacity-40 text-[#F4D6B0] font-bold py-2.5 rounded-xl text-xs transition-all">
                Cancelar
              </button>
              <button disabled={isPagoIncompletoMesa || cobrandoMesa} onClick={cobrarVentaMesa} className="flex-1 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B132B] font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5">
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl max-w-sm w-full p-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-[#3A506B]">
              <div>
                <h3 className="font-bold text-[#F4D6B0] text-sm flex items-center gap-1.5">
                  <Receipt size={15} className="text-[#5BC0DE]" /> {mesaDetalleModal.mesa}
                </h3>
                {mesaDetalleModal.seccion && (
                  <span className="text-[10px] text-[#5BC0DE]">{mesaDetalleModal.seccion}</span>
                )}
              </div>
              <button onClick={() => setMesaDetalleModal(null)} className="text-[#5BC0DE] hover:text-[#F4D6B0] font-bold p-1"><X size={16} /></button>
            </div>
            
            <div className="bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B] mb-2.5 space-y-1 text-[11px]">
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
                <span className="text-emerald-400 font-semibold">{mesaDetalleModal.metodoPago}</span>
              </div>
            </div>

            <div className="mb-2.5">
              <span className="text-[10px] text-[#5BC0DE] font-bold uppercase tracking-wider block mb-1">
                Productos Consumidos ({mesaDetalleModal.items.length})
              </span>
              <div className="space-y-1 bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B] max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent">
                {mesaDetalleModal.items.length === 0 ? (
                  <p className="text-center py-2 text-[#5BC0DE]/50 text-xs">Sin detalle de productos individuales</p>
                ) : (
                  mesaDetalleModal.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[#F4D6B0] pb-1 border-b border-[#3A506B]/40 last:border-0 text-[11px]">
                      <div>
                        <span className="text-white font-medium">{it.cantidad}x </span>
                        <span>{it.nombre}</span>
                      </div>
                      <span className="font-semibold text-[#5BC0DE]">${(it.precio * it.cantidad).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center font-bold text-sm bg-[#0B132B] px-3 py-2 rounded-xl border border-[#3A506B] mb-3">
              <span className="text-[#F4D6B0]">Total Pagado:</span>
              <span className="text-emerald-400">${mesaDetalleModal.monto.toLocaleString()}</span>
            </div>

            <div className="flex gap-2">
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
                className="flex-1 bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] py-2 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer size={14} /> Reimprimir Ticket
              </button>
              <button onClick={() => setMesaDetalleModal(null)} className="px-3 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] py-2 rounded-xl font-bold transition-all text-xs">
                Cerrar
              </button>
            </div>
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
                ? 'Al cerrar el turno, los ingresos acumulados quedarán registrados para el arqueo final. Ingresa el monto en caja al cierre:' 
                : 'Ingresa el monto de base para aperturar la caja.'}
            </p>
            {turnoAbierto ? (
              <div className="space-y-2 mb-3">
                <div className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-2.5 text-[11px] space-y-1">
                  <div className="flex justify-between text-[#5BC0DE]">
                    <span>Base inicial:</span>
                    <span className="font-semibold text-[#F4D6B0]">${totalesTurno.baseInicial.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#5BC0DE]">
                    <span>Ventas en efectivo:</span>
                    <span className="font-semibold text-[#5BC0DE]">+${totalesTurno.ventasEfectivo.toLocaleString()}</span>
                  </div>
                  {totalesTurno.ventasOtros > 0 && (
                    <div className="flex justify-between text-[#5BC0DE]/70 text-[10px]">
                      <span>Ventas tarjeta/transf:</span>
                      <span>${totalesTurno.ventasOtros.toLocaleString()}</span>
                    </div>
                  )}
                  {totalesTurno.egresos > 0 && (
                    <div className="flex justify-between text-[#D97706]">
                      <span>Egresos registrados:</span>
                      <span className="font-semibold">-${totalesTurno.egresos.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#3A506B] pt-1 text-xs font-bold text-[#F4D6B0]">
                    <span>Efectivo esperado:</span>
                    <span className="text-[#5BC0DE]">${totalesTurno.efectivoEstimado.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#5BC0DE] text-[11px]">Efectivo contado físico ($)</label>
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
                    className="w-full bg-[#0B132B] border border-[#3A506B] px-2.5 py-1.5 rounded-xl text-[#F4D6B0] text-xs font-bold focus:outline-none focus:border-[#5BC0DE]" 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-3">
                {/* 1. Selector de Caja */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[#5BC0DE] text-[11px] font-semibold flex items-center gap-1">
                      <Store size={13} /> 1. Selecciona la Caja a Aperturar:
                    </label>
                    {esDuenoOAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalTurno(false);
                          setModalGestionCajas(true);
                        }}
                        className="text-[10px] text-[#5BC0DE] hover:text-[#F4D6B0] flex items-center gap-1 underline font-medium"
                      >
                        <Settings size={11} /> Personalizar Cajas
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
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
                          <span className="text-[10px] font-bold text-[#5BC0DE] bg-[#5BC0DE]/20 px-1.5 py-0.2 rounded border border-[#5BC0DE]/40">
                            Elegida
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Base Inicial */}
                <div>
                  <label className="text-[#5BC0DE] block mb-1 text-[11px] font-semibold">
                    2. Monto Base Inicial en Efectivo ($)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={baseInicial} 
                    onChange={(e) => setBaseInicial(Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    className="w-full bg-[#0B132B] border border-[#3A506B] px-3 py-1.5 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-[#5BC0DE]" 
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {[50000, 100000, 150000, 200000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBaseInicial(val)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
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

            <div className="flex gap-2">
              <button onClick={() => setModalTurno(false)} className="flex-1 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] py-2 rounded-xl font-bold text-xs">
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
                className={`flex-1 font-bold py-2 rounded-xl text-xs transition-all shadow-md ${
                  turnoAbierto ? 'bg-[#D97706] hover:bg-[#B45309] text-white' : 'bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B]'
                }`}
              >
                {turnoAbierto ? 'Cerrar Turno' : `Abrir ${cajas.find(c => c.id === cajaActivaId)?.nombre || 'Caja'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZAR CAJAS (DUEÑO / ADMINISTRADOR) */}
      {modalGestionCajas && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            {/* Cabecera */}
            <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[#3A506B]">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-[#5BC0DE]" />
                <div>
                  <h3 className="font-bold text-[#F4D6B0] text-sm">Personalizar Cajas Registradoras</h3>
                  <p className="text-[11px] text-[#5BC0DE]">Configuración exclusiva para el Dueño o Administrador.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setModalGestionCajas(false);
                  setCajaEditandoId(null);
                  setCajaEditandoNombre('');
                }} 
                className="text-[#5BC0DE] hover:text-[#F4D6B0] p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario Agregar Nueva Caja */}
            <form onSubmit={crearCaja} className="mb-4 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
              <label className="text-[11px] text-[#5BC0DE] font-semibold block mb-1.5">
                Nueva Caja / Punto de Cobro:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: Caja Barra, Caja Terraza, Caja #2..."
                  value={nuevaCajaNombre}
                  onChange={(e) => setNuevaCajaNombre(e.target.value)}
                  className="flex-1 bg-[#1C2541] border border-[#3A506B] px-3 py-1.5 rounded-xl text-white text-xs focus:outline-none focus:border-[#5BC0DE] placeholder:text-[#5BC0DE]/40"
                />
                <button
                  type="submit"
                  disabled={guardandoCaja || !nuevaCajaNombre.trim()}
                  className="px-3 py-1.5 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 disabled:opacity-40 text-[#0B132B] font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Plus size={14} /> Crear Caja
                </button>
              </div>
            </form>

            {/* Listado de Cajas Existentes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider">
                  Cajas Registradas ({cajas.length})
                </span>
                <span className="text-[10px] text-[#5BC0DE]/60">
                  Puedes editar nombres, activarlas o desactivarlas.
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={cajaEditandoNombre}
                            onChange={(e) => setCajaEditandoNombre(e.target.value)}
                            className="flex-1 bg-[#1C2541] border border-[#5BC0DE] px-2.5 py-1 rounded-lg text-white text-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => void guardarEdicionCaja(c.id)}
                            disabled={guardandoCaja || !cajaEditandoNombre.trim()}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCajaEditandoId(null);
                              setCajaEditandoNombre('');
                            }}
                            className="px-2.5 py-1 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] rounded-lg text-xs"
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
                                  <span className="text-[9px] bg-[#5BC0DE]/20 text-[#5BC0DE] border border-[#5BC0DE]/40 px-1.5 py-0.2 rounded font-semibold">
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
                            {/* Editar nombre */}
                            <button
                              type="button"
                              onClick={() => {
                                setCajaEditandoId(c.id);
                                setCajaEditandoNombre(c.nombre);
                              }}
                              title="Editar nombre de la caja"
                              className="p-1.5 bg-[#1C2541] hover:bg-[#3A506B] text-[#5BC0DE] rounded-lg transition-all"
                            >
                              <Edit2 size={13} />
                            </button>

                            {/* Alternar activo/inactivo */}
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

                            {/* Eliminar caja */}
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

            {/* Pie del modal */}
            <div className="mt-4 pt-3 border-t border-[#3A506B] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalGestionCajas(false);
                  setCajaEditandoId(null);
                  setCajaEditandoNombre('');
                }}
                className="px-4 py-2 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] font-bold rounded-xl text-xs transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLANTILLA DE IMPRESIÓN DE FACTURA / TICKET (80mm ESC/POS) */}
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