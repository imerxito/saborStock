import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexto/AuthContexto';
import { useComandas } from '../../../contexto/ComandasContexto';
import { ComandaServicio } from '../../../servicios/ComandaServicio';
import { MesaServicio } from '../../../servicios/MesaServicio';
import { ProductoServicio } from '../../../servicios/ProductoServicio';
import { CajaServicio, type TurnoCajaDTO } from '../../../servicios/CajaServicio';
import type { Caja as TipoCaja } from '../../../tipos/Caja';
import { UsuarioServicio } from '../../../servicios/UsuarioServicio';
import { NominaServicio, type PagoNomina } from '../../../servicios/NominaServicio';
import {
  ConfiguracionServicio,
  type ConfiguracionNegocio,
  type ConfiguracionFacturacion,
  type ImpresoraFrontend
} from '../../../servicios/ConfiguracionServicio';
import type { MesaBackend } from '../../../tipos/Comanda';
import type { TicketCaja, EmpleadoNomina, EventoHistorialMesa } from '../Caja';

// --- Internal types (not exported from hook) ---
type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';

interface Producto { id: string; nombre: string; precio: number; categoria: string; idCategoria?: number; }
interface ItemPedido { producto: Producto; cantidad: number; }
interface Movimiento { id: string; tipo: 'ingreso' | 'egreso'; concepto: string; monto: number; hora: string; }

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

export interface MesaActiva {
  id: string;
  idBackend?: number;
  nombre: string;
  seccion: string;
  mesero: string;
  ventas: SubVenta[];
}

export function useCaja() {
  const { usuario } = useAuth();
  const { comandas, crear, cambiarEstado, recargar } = useComandas();

  const [mesasRaw, setMesasRaw] = useState<MesaBackend[]>([]);
  const [comandasCerradasLocal, setComandasCerradasLocal] = useState<Set<number>>(() => new Set());
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

  // Movimientos, Nómina y Empleados
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

  // Cajas Físicas
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

  // Historial Mesas
  const [historialMesas, setHistorialMesas] = useState<HistorialMesaItem[]>([]);
  const [eventosMesas, setEventosMesas] = useState<EventoHistorialMesa[]>([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState<string>('');
  const [filtroTipoHistorial, setFiltroTipoHistorial] = useState<'todos' | 'mesas' | 'directa'>('todos');
  const [filtroSeccionHistorial, setFiltroSeccionHistorial] = useState<string>('Todas');
  const [vistaHistorial, setVistaHistorial] = useState<'cuentas' | 'eventos'>('cuentas');
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);
  const [mesaDetalleModal, setMesaDetalleModal] = useState<HistorialMesaItem | null>(null);

  // useEffect: print ticket
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

      // Mapear Eventos de Mesas
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

      // Mapear Cuentas / Cobros
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

  // Venta Directa
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

  // Modal Cobro Venta Directa
  const [modalCobroVenta, setModalCobroVenta] = useState<boolean>(false);
  const [metodoPagoVenta, setMetodoPagoVenta] = useState<MetodoPago>('efectivo');
  const [montoRecibidoVenta, setMontoRecibidoVenta] = useState<number>(0);
  const [montoEfectivoVenta, setMontoEfectivoVenta] = useState<number>(0);
  const [montoDigitalVenta, setMontoDigitalVenta] = useState<number>(0);

  // Cobrar Mesas (Indexación O(N + M) + cierre local inmediato)
  const mesasActivas = useMemo<MesaActiva[]>(() => {
    if (mesasRaw.length === 0 || comandas.length === 0) return [];

    const comandasPorIdMesa = new Map<number, typeof comandas>();
    const comandasPorNumMesa = new Map<number, typeof comandas>();

    for (const c of comandas) {
      if (c.estado === 'Cerrado' || comandasCerradasLocal.has(c.id)) continue;
      if (c.idMesa != null) {
        const lista = comandasPorIdMesa.get(c.idMesa);
        if (lista) lista.push(c);
        else comandasPorIdMesa.set(c.idMesa, [c]);
      } else if (c.mesa != null) {
        const lista = comandasPorNumMesa.get(c.mesa);
        if (lista) lista.push(c);
        else comandasPorNumMesa.set(c.mesa, [c]);
      }
    }

    const activas: MesaActiva[] = [];

    for (const m of mesasRaw) {
      const coms = comandasPorIdMesa.get(m.id) || comandasPorNumMesa.get(m.numero);
      if (!coms || coms.length === 0) continue;

      const mapaVentas = new Map<string, SubVenta>();

      for (const c of coms) {
        const clienteKey = (c.cliente || 'Cliente General').trim();
        const itemsMapeados = c.items.map(it => ({
          idProducto: it.idProducto,
          nombre: it.producto,
          cantidad: it.cantidad,
          precio: it.precio || 0
        }));
        const totalC = c.total || itemsMapeados.reduce((sum, it) => sum + it.precio * it.cantidad, 0);

        const vExistente = mapaVentas.get(clienteKey);
        if (!vExistente) {
          mapaVentas.set(clienteKey, {
            id: String(c.id),
            comandaId: c.id,
            idVenta: c.idVenta,
            cliente: clienteKey,
            total: totalC,
            items: itemsMapeados
          });
        } else {
          vExistente.total += totalC;
          vExistente.items.push(...itemsMapeados);
        }
      }

      activas.push({
        id: String(m.id),
        idBackend: m.id,
        nombre: `Mesa ${m.numero}`,
        seccion: m.seccionNombre || 'Salón Principal',
        mesero: coms[0]?.mesero || 'Mesero',
        ventas: Array.from(mapaVentas.values())
      });
    }

    return activas;
  }, [mesasRaw, comandas, comandasCerradasLocal]);

  const [busquedaMesa, setBusquedaMesa] = useState<string>('');
  const [filtroSeccion, setFiltroSeccion] = useState<string>('Todas');

  // Modal de cobro de mesa
  const [mesaACobrar, setMesaACobrar] = useState<MesaActiva | null>(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<SubVenta | null>(null);

  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [montoEfectivo, setMontoEfectivo] = useState<number>(0);
  const [montoDigital, setMontoDigital] = useState<number>(0);
  const [propina, setPropina] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
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

  const recargarHistorial = useCallback(async () => {
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
        const nombreSeccion = mesaInfo?.seccionNombre || (mesaInfo as any)?.seccion?.nombre || 'Salón';
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
        const nombreSeccion = f.seccionNombre || (mesaInfo as any)?.seccion?.nombre || (numeroMesa != null ? 'Salón' : '');
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
  }, []);

  const agregarAlCarrito = useCallback((prod: Producto) => {
    if (!turnoAbierto) {
      alert('🔒 La caja está cerrada. Debes abrir un turno para agregar productos y realizar ventas.');
      setModalTurno(true);
      return;
    }
    setLastAddedId(prod.id);
    setTimeout(() => setLastAddedId(null), 500);

    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === prod.id);
      if (existe) {
        return prev.map(item =>
          item.producto.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { producto: prod, cantidad: 1 }];
    });
  }, [turnoAbierto]);

  const actualizarCantidadItem = useCallback((id: string, nuevaCantidad: number) => {
    if (!turnoAbierto) return;
    if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
      setCarrito(prev => prev.filter(item => item.producto.id !== id));
    } else {
      setCarrito(prev => prev.map(item =>
        item.producto.id === id ? { ...item, cantidad: nuevaCantidad } : item
      ));
    }
  }, [turnoAbierto]);

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

  const cobrarComandaRapida = async (imprimir: boolean = false) => {
    if (cobrandoVentaDirecta || carrito.length === 0) return;
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

      const itemsSnapshot = [...carrito];
      const totalSnapshot = totalCarrito;
      const metodoSnapshot = metodoPagoVenta.toUpperCase();
      const itemsComprados = itemsSnapshot.map(it => ({
        nombre: it.producto.nombre,
        cantidad: it.cantidad,
        precio: it.producto.precio
      }));

      const nuevoMov: Movimiento = {
        id: Date.now().toString(),
        tipo: 'ingreso',
        concepto: `Venta comanda rápida (${clienteStr}) - ${metodoSnapshot}${detalleExtra}`,
        monto: totalSnapshot,
        hora: horaActual
      };
      setMovimientos(prev => [nuevoMov, ...prev]);

      const nuevoHistorial: HistorialMesaItem = {
        id: `VD-${Date.now()}`,
        mesa: 'Venta directa',
        seccion: '',
        cliente: clienteStr,
        monto: totalSnapshot,
        mesero: usuario?.nombre?.trim() || 'Caja',
        metodoPago: metodoSnapshot,
        estado: 'Pagada',
        fechaApertura: new Date().toLocaleString(),
        fechaCierre: new Date().toLocaleString(),
        items: itemsComprados,
      };
      setHistorialMesas(prev => [nuevoHistorial, ...prev]);

      // Cerrar modal y limpiar carrito inmediatamente
      setCarrito([]);
      setNombreCliente('');
      setMetodoPagoVenta('efectivo');
      setMontoRecibidoVenta(0);
      setMontoEfectivoVenta(0);
      setMontoDigitalVenta(0);
      setModalCobroVenta(false);
      setCobrandoVentaDirecta(false);

      if (imprimir) {
        setTicketAImprimir({
          titulo: 'Factura / Venta Directa',
          cliente: clienteStr,
          items: itemsComprados,
          subtotal: totalSnapshot,
          total: totalSnapshot,
          metodoPago: metodoSnapshot,
          fecha: new Date().toLocaleDateString('es-CO'),
        });
      }

      // Despachar a impresoras de cocina/barra y recargar en segundo plano
      void (async () => {
        try {
          let imps = impresorasConfig.filter((i) => i.activa);
          if (imps.length === 0) {
            const frescas = await ConfiguracionServicio.listarImpresoras().catch(() => []);
            imps = (frescas || []).filter((i) => i.activa);
          }

          await Promise.all(
            imps.map(async (imp) => {
              const itemsFiltrados = itemsSnapshot.filter((it) => {
                if (!imp.categoriasIds || imp.categoriasIds.length === 0) return true;
                const catId = it.producto.idCategoria;
                return catId ? imp.categoriasIds.includes(catId) : true;
              });
              if (itemsFiltrados.length === 0) return;

              await ConfiguracionServicio.imprimirComandaDirecta(imp.id, {
                mesa: 'Venta Directa',
                cliente: clienteStr,
                mesero: usuario?.nombre?.trim() || 'Cajero',
                items: itemsFiltrados.map((it) => ({
                  nombre: it.producto.nombre,
                  cantidad: it.cantidad,
                })),
              }).catch(() => {});
            })
          );
          await recargar().catch(() => {});
        } catch {}
      })();
    } catch (err: any) {
      setCobrandoVentaDirecta(false);
      alert('Error al procesar comanda rápida: ' + (err?.message || 'Error desconocido'));
    }
  };

  // Cálculos Cobrar Mesas
  const mesasFiltradas = useMemo(() => {
    const q = busquedaMesa.toLowerCase();
    return mesasActivas.filter(m => {
      const coincideSeccion = filtroSeccion === 'Todas' || m.seccion === filtroSeccion;
      const coincideTexto = !q || m.nombre.toLowerCase().includes(q) || m.mesero.toLowerCase().includes(q);
      return coincideSeccion && coincideTexto;
    });
  }, [mesasActivas, filtroSeccion, busquedaMesa]);

  const abrirCobroMesa = useCallback((mesa: MesaActiva) => {
    if (!turnoAbierto) {
      alert('🔒 La caja está cerrada. Debes abrir un turno para cobrar mesas.');
      setModalTurno(true);
      return;
    }
    setMesaACobrar(mesa);
    setVentaSeleccionada(mesa.ventas[0]);
    setMetodoPago('efectivo');
    setMontoRecibidoSimple(0);
    setPropina(0);
    setDescuento(0);
    setMontoEfectivo(0);
    setMontoDigital(0);
  }, [turnoAbierto]);

  const subtotalMesa = useMemo(() => {
    if (!ventaSeleccionada) return 0;
    return ventaSeleccionada.total;
  }, [ventaSeleccionada]);

  const descuentoAplicado = useMemo(() => {
    return Math.min(Math.max(0, Number(descuento) || 0), subtotalMesa);
  }, [descuento, subtotalMesa]);

  const totalCobroMesa = useMemo(() => {
    if (!ventaSeleccionada) return 0;
    return Math.max(0, subtotalMesa - descuentoAplicado + (Number(propina) || 0));
  }, [ventaSeleccionada, subtotalMesa, descuentoAplicado, propina]);

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

  const cobrarVentaMesa = async (imprimir: boolean = false) => {
    if (cobrandoMesa || !mesaACobrar || !ventaSeleccionada) return;
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
      const ahora = new Date();
      const horaActual = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fechaActual = `${ahora.toLocaleDateString()} - ${horaActual}`;

      const numMesa = Number(mesaACobrar.nombre.replace(/\D/g, ''));
      const clienteTarget = ventaSeleccionada.cliente.trim().toLowerCase();

      const comsACerrar = comandas.filter(
        (c) =>
          (c.idMesa === mesaACobrar.idBackend || c.mesa === numMesa) &&
          (c.cliente || 'Cliente General').trim().toLowerCase() === clienteTarget &&
          c.estado !== 'Cerrado'
      );

      const idsComandas = Array.from(
        new Set([
          ...comsACerrar.map((com) => com.id),
          ...(ventaSeleccionada.comandaId ? [ventaSeleccionada.comandaId] : []),
        ])
      );
      const idVenta = ventaSeleccionada.idVenta ?? comsACerrar.find((com) => com.idVenta)?.idVenta ?? null;

      const mapaDetalles = new Map<string, { idProducto: number; cantidad: number; precioUnitario: number }>();
      for (const item of ventaSeleccionada.items) {
        if (!item.idProducto || item.cantidad <= 0) continue;
        const clave = `${item.idProducto}-${item.precio}`;
        const actual = mapaDetalles.get(clave);
        if (actual) {
          actual.cantidad += item.cantidad;
        } else {
          mapaDetalles.set(clave, {
            idProducto: item.idProducto,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
          });
        }
      }

      const idUsuarioActual = Number((usuario as any)?.id_usuario || (usuario as any)?.idUsuario || 1);

      // Único await bloqueante: registrar la factura en backend
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
        detalles: Array.from(mapaDetalles.values()),
      });

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

      const datosTicket: TicketCaja = {
        titulo: 'Factura / Comprobante de Pago',
        cliente: ventaSeleccionada.cliente,
        mesa: mesaACobrar.nombre,
        seccion: mesaACobrar.seccion,
        items: ventaSeleccionada.items.map((it) => ({
          nombre: it.nombre,
          cantidad: it.cantidad,
          precio: it.precio,
        })),
        subtotal: ventaSeleccionada.total,
        descuento: descuentoAplicado,
        propina: Number(propina) || 0,
        total: totalCobroMesa,
        metodoPago: metodoPago.toUpperCase(),
        fecha: fechaActual,
      };

      const nuevoHistorial: HistorialMesaItem = {
        id: `HM-${Date.now().toString().slice(-3)}`,
        mesa: mesaACobrar.nombre,
        seccion: mesaACobrar.seccion,
        cliente: ventaSeleccionada.cliente,
        monto: totalCobroMesa,
        mesero: mesaACobrar.mesero,
        metodoPago:
          (metodoPago === 'mixto'
            ? `Mixto (Ef: $${montoEfectivo} / Dig: $${montoDigital})${propina > 0 ? ` + Prop: $${propina}` : ''}`
            : metodoPago === 'tarjeta'
              ? `Tarjeta${propina > 0 ? ` (Prop: $${propina})` : ''}`
              : `${metodoPago.toUpperCase()}${montoRecibidoSimple > 0 ? ` (Recibido: $${montoRecibidoSimple})` : ''}${propina > 0 ? ` (Prop: $${propina})` : ''}`) +
          (descuentoAplicado > 0 ? ` (Desc: -$${descuentoAplicado})` : ''),
        estado: 'Pagada',
        fechaApertura: fechaActual,
        fechaCierre: fechaActual,
        items: ventaSeleccionada.items,
      };
      setHistorialMesas((prev) => [nuevoHistorial, ...prev]);

      const nuevoMov: Movimiento = {
        id: Date.now().toString(),
        tipo: 'ingreso',
        concepto: `Cobro ${mesaACobrar.nombre} - ${ventaSeleccionada.cliente} - ${metodoPago.toUpperCase()}${detalleExtra}`,
        monto: totalCobroMesa,
        hora: horaActual,
      };
      setMovimientos((prev) => [nuevoMov, ...prev]);

      // Ocultar comandas cobradas al instante en la vista
      if (idsComandas.length > 0) {
        setComandasCerradasLocal((prev) => {
          const next = new Set(prev);
          idsComandas.forEach((id) => next.add(id));
          return next;
        });
      }

      const idMesaBackend = mesaACobrar.idBackend;

      // Cerrar modal y limpiar estados directamente
      setMesaACobrar(null);
      setVentaSeleccionada(null);
      setMontoEfectivo(0);
      setMontoDigital(0);
      setPropina(0);
      setDescuento(0);
      setMontoRecibidoSimple(0);
      setMetodoPago('efectivo');
      setCobrandoMesa(false);

      // Si presionó el botón Imprimir, dispara la impresión sin preguntar
      if (imprimir) {
        setTicketAImprimir(datosTicket);
      }

      // Sincronización en segundo plano
      void (async () => {
        try {
          const tareasActualizacion: Promise<unknown>[] = idsComandas.map((idCmd) =>
            typeof cambiarEstado === 'function'
              ? cambiarEstado(idCmd, 'Cerrado').catch(() => {})
              : ComandaServicio.cambiarEstado(idCmd, 'Cerrado').catch(() => {})
          );

          if (idMesaBackend) {
            tareasActualizacion.push(
              MesaServicio.actualizarMesa(idMesaBackend, { estado: 'Libre' }).catch(() => {})
            );
          }

          await Promise.all(tareasActualizacion);

          await Promise.all([
            recargar().catch(() => {}),
            MesaServicio.listarMesas().then(setMesasRaw).catch(() => {}),
            MesaServicio.obtenerHistorial()
              .then((evs) => {
                if (evs && evs.length > 0) {
                  const mesaMap = new Map((mesasRaw || []).map((m) => [m.id, m]));
                  const userMap = new Map(empleados.map((e) => [e.idUsuario, e.nombre]));
                  setEventosMesas(
                    evs.map((ev: any) => {
                      const mesaInfo = mesaMap.get(ev.idMesa);
                      const numM = mesaInfo?.numero ?? ev.idMesa;
                      const secNom = mesaInfo?.seccionNombre || (mesaInfo as any)?.seccion?.nombre || 'Salón';
                      const usrNom = userMap.get(ev.idUsuario) || (ev.idUsuario ? `Usuario #${ev.idUsuario}` : 'Sistema');
                      const fObj = ev.fechaAccion ? new Date(ev.fechaAccion) : new Date();
                      return {
                        id: ev.id,
                        idMesa: ev.idMesa,
                        mesa: `Mesa ${numM}`,
                        seccion: secNom,
                        idVenta: ev.idVenta,
                        idUsuario: ev.idUsuario,
                        usuario: usrNom,
                        estado: ev.estado || 'Actualización',
                        monto: ev.monto ?? null,
                        motivo: ev.motivo || 'Movimiento de mesa',
                        fecha: isNaN(fObj.getTime())
                          ? String(ev.fechaAccion)
                          : fObj.toLocaleString('es-CO', {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            }),
                      };
                    })
                  );
                }
              })
              .catch(() => {}),
          ]);
        } catch (bgErr) {
          console.warn('Error sincronizando estado de mesa en segundo plano:', bgErr);
        }
      })();
    } catch (err: any) {
      setCobrandoMesa(false);
      alert('Error al cobrar la venta: ' + (err?.message || 'Error desconocido'));
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

  const empleadosFiltrados = useMemo(() => {
    const q = busquedaEmpleado.toLowerCase();
    if (!q) return empleados;
    return empleados.filter(emp =>
      emp.nombre.toLowerCase().includes(q) ||
      emp.cedula.includes(busquedaEmpleado) ||
      emp.cargo.toLowerCase().includes(q)
    );
  }, [empleados, busquedaEmpleado]);

  return {
    // Auth / Context
    usuario,
    // State - Turno
    turnoActual,
    turnoAbierto,
    verificandoTurno,
    bannerCerradoDescartado, setBannerCerradoDescartado,
    baseInicial, setBaseInicial,
    montoCierre, setMontoCierre,
    modalTurno, setModalTurno,
    cargando,
    // State - Ticket
    ticketAImprimir, setTicketAImprimir,
    negocioConfig,
    facturacionConfig,
    // State - Cobro
    cobrandoMesa,
    cobrandoVentaDirecta,
    // State - Movimientos
    movimientos,
    nuevoMovTipo, setNuevoMovTipo,
    nuevoMovConcepto, setNuevoMovConcepto,
    nuevoMovMonto, setNuevoMovMonto,
    // State - Nómina
    nominas,
    empleados,
    busquedaEmpleado, setBusquedaEmpleado,
    empleadoSeleccionado, setEmpleadoSeleccionado,
    mostrarSugerencias, setMostrarSugerencias,
    nomBase, setNomBase,
    nomBono, setNomBono,
    metodoPagoNomina, setMetodoPagoNomina,
    empleadosFiltrados,
    // State - Cajas
    cajas,
    cajaActivaId, setCajaActivaId,
    modalGestionCajas, setModalGestionCajas,
    nuevaCajaNombre, setNuevaCajaNombre,
    cajaEditandoId, setCajaEditandoId,
    cajaEditandoNombre, setCajaEditandoNombre,
    guardandoCaja,
    // State - Tabs
    activeTab, setActiveTab,
    // State - Historial
    historialMesas,
    eventosMesas,
    busquedaHistorial, setBusquedaHistorial,
    filtroTipoHistorial, setFiltroTipoHistorial,
    filtroSeccionHistorial, setFiltroSeccionHistorial,
    vistaHistorial, setVistaHistorial,
    cargandoHistorial,
    mesaDetalleModal, setMesaDetalleModal,
    // State - Venta Directa
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
    // State - Cobrar Mesa
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
    // Derived / Memos
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
    cargarDatos,
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
  };
}