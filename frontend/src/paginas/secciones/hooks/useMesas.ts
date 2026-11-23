import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexto/AuthContexto';
import { useComandas } from '../../../contexto/ComandasContexto';
import { MesaServicio, type SeccionBackend } from '../../../servicios/MesaServicio';
import {
  ConfiguracionServicio,
  type ConfiguracionNegocio,
  type ConfiguracionFacturacion,
  type ImpresoraFrontend,
} from '../../../servicios/ConfiguracionServicio';
import type { MesaBackend } from '../../../tipos/Comanda';
import type {
  CategoriaProducto,
  Producto,
  ItemPedido,
  ComandaTicket,
  VentaMesa,
  TicketAImprimir,
  Mesa,
} from '../Mesas';

// ─── Constantes ────────────────────────────────────────────────────────────────
export const CATEGORIAS: CategoriaProducto[] = [
  'Platos Fuertes',
  'Comidas Rápidas',
  'Entradas',
  'Bebidas',
  'Postres',
];

export const NOTAS_RAPIDAS = [
  'Sin cebolla',
  'Sin picante',
  'Sin hielo',
  'Bien cocido',
  'Para llevar',
];

const ESPERA_INICIAL_MIN = 20;
export const PASO_MIN = 5;
const ESPERA_MAX_MIN = 180;
const MIN5_MS = PASO_MIN * 60000;

// ─── Utilidades puras ──────────────────────────────────────────────────────────
export const redondear5 = (ms: number) => Math.ceil(ms / MIN5_MS) * MIN5_MS;

export const formatearHora = (ms: number) =>
  new Date(ms).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

export const getBordeMesa = (estado: Mesa['estado']) => {
  switch (estado) {
    case 'Disponible':
      return 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)] bg-[#1C2541]';
    case 'Ocupada':
      return 'border-[#D97706] shadow-[0_0_12px_rgba(217,119,6,0.25)] bg-[#1C2541]';
    case 'Pagando':
      return 'border-[#5BC0DE] shadow-[0_0_12px_rgba(91,192,222,0.3)] bg-[#1C2541]';
    case 'Reservada':
      return 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.25)] bg-[#1C2541]';
    default:
      return 'border-[#3A506B] bg-[#1C2541]';
  }
};

// ─── Hook principal ────────────────────────────────────────────────────────────
export function useMesas() {
  const { usuario } = useAuth();
  const { comandas, crear, cambiarEstado, recargar, conectadoBackend } = useComandas();

  // ── Estado backend ──────────────────────────────────────────────────────────
  const [mesasRaw, setMesasRaw] = useState<MesaBackend[]>([]);
  const [seccionesRaw, setSeccionesRaw] = useState<SeccionBackend[]>([]);
  const [productosMenu, setProductosMenu] = useState<Producto[]>([]);

  // ── Estado UI general ───────────────────────────────────────────────────────
  const [seccionFiltro, setSeccionFiltro] = useState<string>('Todas');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [configAbierta, setConfigAbierta] = useState(false);

  // ── Roles ───────────────────────────────────────────────────────────────────
  const rol = String(usuario?.rol ?? '').toLowerCase();
  const esAdminODueno = rol.includes('due') || rol.includes('admin');
  const esCajero = rol.includes('caja');
  const puedeLiberar = esAdminODueno || esCajero;

  // ── Estado modal ────────────────────────────────────────────────────────────
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [pasoModal, setPasoModal] = useState<'lista' | 'info' | 'menu'>('lista');
  const [ventaActivaId, setVentaActivaId] = useState<string | null>(null);
  const [ventaEnEdicion, setVentaEnEdicion] = useState<VentaMesa | null>(null);

  // ── Formulario nueva venta ──────────────────────────────────────────────────
  const [nombreCliente, setNombreCliente] = useState('');
  const [horaEstimada, setHoraEstimada] = useState('09:30 p. m.');
  const [horaBase, setHoraBase] = useState<number>(() => Date.now());
  const [horaObjetivo, setHoraObjetivo] = useState<number>(() =>
    redondear5(Date.now() + ESPERA_INICIAL_MIN * 60000)
  );
  const minutosEspera = Math.max(0, Math.round((horaObjetivo - horaBase) / 60000));
  const horaMinima = redondear5(horaBase);
  const horaMaxima = horaMinima + ESPERA_MAX_MIN * 60000;
  const [personas, setPersonas] = useState(2);
  const [notasMesa, setNotasMesa] = useState('');

  // ── Menú / carrito ──────────────────────────────────────────────────────────
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaProducto>('Platos Fuertes');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);
  const [notaAbiertaId, setNotaAbiertaId] = useState<string | null>(null);

  // ── Impresión / pagos ───────────────────────────────────────────────────────
  const [pedidosPagando, setPedidosPagando] = useState<Set<number>>(new Set());
  const [ticketAImprimir, setTicketAImprimir] = useState<TicketAImprimir | null>(null);
  const [negocioConfig, setNegocioConfig] = useState<ConfiguracionNegocio | null>(null);
  const [facturacionConfig, setFacturacionConfig] = useState<ConfiguracionFacturacion | null>(null);
  const [impresorasConfig, setImpresorasConfig] = useState<ImpresoraFrontend[]>([]);
  const [modalImpresorasMesa, setModalImpresorasMesa] = useState<VentaMesa | null>(null);
  const [rondaSeleccionadaId, setRondaSeleccionadaId] = useState<'ultima' | 'todas' | number>('ultima');

  // ── Scroll de categorías (drag) ─────────────────────────────────────────────
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

  // ── Efecto: imprimir ticket ─────────────────────────────────────────────────
  useEffect(() => {
    if (ticketAImprimir) {
      const timer = setTimeout(() => {
        window.print();
        setTicketAImprimir(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [ticketAImprimir]);

  // ── cargarDatosBackend ──────────────────────────────────────────────────────
  const cargarDatosBackend = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      if (silencioso) {
        const mesasData = await MesaServicio.listarMesas();
        setMesasRaw(mesasData);
        return;
      }

      const [mesasData, prodsData, secsData, negData, factData, impData] = await Promise.all([
        MesaServicio.listarMesas(),
        MesaServicio.obtenerProductos(),
        MesaServicio.obtenerSecciones(),
        ConfiguracionServicio.obtenerNegocio().catch(() => null),
        ConfiguracionServicio.obtenerFacturacion().catch(() => null),
        ConfiguracionServicio.listarImpresoras().catch(() => []),
      ]);

      setMesasRaw(mesasData);
      setSeccionesRaw(secsData);
      if (negData) setNegocioConfig(negData);
      if (factData) setFacturacionConfig(factData);
      if (impData) setImpresorasConfig(impData);

      setProductosMenu(
        prodsData.map((p) => {
          let cat: CategoriaProducto = 'Platos Fuertes';
          const nom = p.nombre.toLowerCase();
          if (nom.includes('hamburguesa') || nom.includes('salchipapa') || nom.includes('perro'))
            cat = 'Comidas Rápidas';
          else if (nom.includes('arepa') || nom.includes('empanada') || nom.includes('patacón'))
            cat = 'Entradas';
          else if (
            nom.includes('jugo') ||
            nom.includes('limonada') ||
            nom.includes('cerveza') ||
            nom.includes('gaseosa')
          )
            cat = 'Bebidas';
          else if (nom.includes('leches') || nom.includes('flan') || nom.includes('postre'))
            cat = 'Postres';
          return {
            id: `p-${p.id_producto}`,
            idProducto: p.id_producto,
            idCategoria: p.id_categoria,
            nombre: p.nombre,
            precio: p.precio_venta,
            categoria: cat,
            descripcion: p.descripcion,
          };
        })
      );
    } catch (e) {
      console.warn('Error al cargar:', e);
      if (!silencioso)
        alert(
          'Error al cargar datos de mesas: ' +
            (e instanceof Error ? e.message : 'Error desconocido')
        );
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatosBackend();
  }, [cargarDatosBackend]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (document.hidden) return;
      void cargarDatosBackend(true);
    }, 5000);
    return () => clearInterval(intervalo);
  }, [cargarDatosBackend]);

  // ── Derivados: secciones ────────────────────────────────────────────────────
  const seccionesDisponibles = useMemo(() => {
    const prioridadZonas: Record<string, number> = {
      Piscina: 1,
      Terraza: 2,
      'Salón Principal': 3,
      Salón: 3,
      Entrada: 4,
      VIP: 5,
    };
    let nombresZonas: string[] =
      seccionesRaw.length > 0
        ? seccionesRaw.map((s) => s.nombre)
        : Array.from(new Set(mesasRaw.map((m) => m.seccionNombre).filter(Boolean) as string[]));
    if (nombresZonas.length === 0)
      nombresZonas = ['Salón', 'Piscina', 'Terraza', 'Entrada'];
    const zonasOrdenadas = [...nombresZonas].sort(
      (a, b) =>
        (prioridadZonas[a] || 99) - (prioridadZonas[b] || 99) || a.localeCompare(b)
    );
    return ['Todas', ...zonasOrdenadas];
  }, [mesasRaw, seccionesRaw]);

  // ── Derivados: mesas (con ventas y tickets) ─────────────────────────────────
  const mesas = useMemo<Mesa[]>(() => {
    return mesasRaw.map((m) => {
      const comandasActivas = comandas.filter(
        (c) => (c.idMesa === m.id || c.mesa === m.numero) && c.estado !== 'Cerrado'
      );

      const mapaVentas = new Map<string, ComandaTicket[]>();
      const infoVentaMap = new Map<
        string,
        { cliente: string; mesero: string; personas: number; hora: string; minTimestamp: number }
      >();

      comandasActivas.forEach((c) => {
        const clienteKey = (c.cliente || 'Cliente General').trim().toLowerCase();
        const ticketTimestamp = new Date(c.creada).getTime();

        if (!mapaVentas.has(clienteKey)) {
          mapaVentas.set(clienteKey, []);
          infoVentaMap.set(clienteKey, {
            cliente: c.cliente || 'Cliente General',
            mesero: c.mesero || 'Sin asignar',
            personas: c.personas || 2,
            hora: formatearHora(ticketTimestamp),
            minTimestamp: ticketTimestamp,
          });
        } else {
          const infoActual = infoVentaMap.get(clienteKey)!;
          if (ticketTimestamp < infoActual.minTimestamp) {
            infoActual.minTimestamp = ticketTimestamp;
            infoActual.hora = formatearHora(ticketTimestamp);
          }
        }

        const itemsComanda: ItemPedido[] = c.items.map((it) => {
          const matchCatalogo = productosMenu.find(
            (p) =>
              p.idProducto === it.idProducto ||
              p.nombre.toLowerCase() === it.producto.toLowerCase()
          );
          const prodCatalogo = matchCatalogo || {
            id: `p-${it.idProducto ?? 0}`,
            idProducto: it.idProducto,
            idCategoria: it.idCategoria ?? undefined,
            nombre: it.producto,
            precio: it.precio || 0,
            categoria: 'Platos Fuertes' as CategoriaProducto,
          };
          return { producto: prodCatalogo, cantidad: it.cantidad, notas: it.nota };
        });

        const isPagando = pedidosPagando.has(c.id);

        mapaVentas.get(clienteKey)!.push({
          id: `CMD-#${c.id}`,
          comandaId: c.id,
          items: itemsComanda,
          total: itemsComanda.reduce(
            (sum, item) => sum + item.producto.precio * item.cantidad,
            0
          ),
          estado: isPagando
            ? 'Pagando'
            : c.estado === 'Lista'
            ? 'Listo'
            : c.estado === 'Entregada'
            ? 'Entregado'
            : 'En preparación',
          mesero: c.mesero || 'Sin asignar',
          hora: formatearHora(ticketTimestamp),
          timestampCreacion: ticketTimestamp,
          notas: c.nota,
        });
      });

      const ventasDesordenadas: VentaMesa[] = Array.from(mapaVentas.entries()).map(
        ([key, tickets]) => {
          const info = infoVentaMap.get(key)!;

          tickets.sort((a, b) => a.timestampCreacion - b.timestampCreacion);

          const mapaConsolidado = new Map<string, ItemPedido>();
          tickets.forEach((ticket) => {
            ticket.items.forEach((it) => {
              const prodId = it.producto.id;
              if (mapaConsolidado.has(prodId)) {
                const existente = mapaConsolidado.get(prodId)!;
                existente.cantidad += it.cantidad;
                if (it.notas && !existente.notas?.includes(it.notas)) {
                  existente.notas = existente.notas
                    ? `${existente.notas}, ${it.notas}`
                    : it.notas;
                }
              } else {
                mapaConsolidado.set(prodId, { ...it });
              }
            });
          });

          const itemsConsolidados = Array.from(mapaConsolidado.values());
          const totalVentaSumado = itemsConsolidados.reduce(
            (acc, item) => acc + item.producto.precio * item.cantidad,
            0
          );

          return {
            id: `VENTA-${m.numero}-${info.minTimestamp}`,
            mesaId: String(m.id),
            numeroMesa: m.numero,
            idSeccion: m.idSeccion,
            seccionNombre: m.seccionNombre || 'Salón Principal',
            cliente: info.cliente,
            meseroPrincipal: info.mesero,
            horaEstimada: info.hora,
            personas: info.personas,
            timestampCreacion: info.minTimestamp,
            comandasTicket: tickets,
            itemsConsolidados,
            totalVentaAcumulado: totalVentaSumado,
          };
        }
      );

      ventasDesordenadas.sort((a, b) => a.timestampCreacion - b.timestampCreacion);

      let estadoMesa: Mesa['estado'] = 'Disponible';
      if (ventasDesordenadas.length > 0) {
        const todasPagando = ventasDesordenadas.every((v) =>
          v.comandasTicket.every((t) => t.estado === 'Pagando')
        );
        estadoMesa = todasPagando ? 'Pagando' : 'Ocupada';
      } else if (m.estado === 'Reservada') {
        estadoMesa = 'Reservada';
      }

      return {
        id: String(m.id),
        idBackend: m.id,
        numero: m.numero,
        seccion: m.seccionNombre || 'Salón Principal',
        idSeccion: m.idSeccion,
        seccionId: m.idSeccion,
        capacidad: m.numero === 5 || m.numero === 8 ? 8 : m.numero % 2 === 0 ? 6 : 4,
        estado: estadoMesa,
        ventasActuales: ventasDesordenadas,
      };
    });
  }, [mesasRaw, comandas, productosMenu, pedidosPagando]);

  // Mantener mesaSeleccionada actualizada cuando cambian las mesas
  useEffect(() => {
    if (mesaSeleccionada) {
      const mesaActualizada = mesas.find((m) => m.id === mesaSeleccionada.id);
      if (mesaActualizada) {
        setMesaSeleccionada(mesaActualizada);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesas]);

  const mesasDeZona = useMemo(
    () => mesas.filter((m) => seccionFiltro === 'Todas' || m.seccion === seccionFiltro),
    [mesas, seccionFiltro]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
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
      return prev.map((item) =>
        item.producto.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item
      );
    });
  };

  const fijarCantidad = (producto: Producto, cantidad: number) => {
    const n = Math.max(0, Math.min(99, Math.floor(cantidad) || 0));
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id);
      if (n <= 0) return prev.filter((item) => item.producto.id !== producto.id);
      if (!existe) return [...prev, { producto, cantidad: n }];
      return prev.map((item) =>
        item.producto.id === producto.id ? { ...item, cantidad: n } : item
      );
    });
  };

  const ajustarMinutos = (delta: number) => {
    const nuevo = Math.max(horaMinima, Math.min(horaMaxima, horaObjetivo + delta * 60000));
    setHoraObjetivo(nuevo);
    setHoraEstimada(formatearHora(nuevo));
  };

  const fijarNota = (producto: Producto, nota: string) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.producto.id === producto.id ? { ...item, notas: nota } : item
      )
    );
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

  const imprimirComandasAutomaticas = async (datos: {
    mesaNumero: number;
    seccionId?: number;
    seccionNombre?: string;
    cliente: string;
    mesero: string;
    comandaId?: number;
    items: ItemPedido[];
  }) => {
    let imps = impresorasConfig.filter((i) => i.activa);
    if (imps.length === 0) {
      try {
        const frescas = await ConfiguracionServicio.listarImpresoras();
        imps = (frescas || []).filter((i) => i.activa);
      } catch {}
    }

    const impresionesPendientes: { impresora: ImpresoraFrontend; items: ItemPedido[] }[] = [];

    for (const imp of imps) {
      if (imp.seccionesIds && imp.seccionesIds.length > 0) {
        if (datos.seccionId && !imp.seccionesIds.includes(datos.seccionId)) continue;
      }

      const itemsFiltrados = datos.items.filter((it) => {
        if (!imp.categoriasIds || imp.categoriasIds.length === 0) return true;
        const catId = it.producto.idCategoria;
        return catId ? imp.categoriasIds.includes(catId) : true;
      });

      if (itemsFiltrados.length > 0) {
        impresionesPendientes.push({ impresora: imp, items: itemsFiltrados });
      }
    }

    if (impresionesPendientes.length === 0 && imps.length > 0) {
      impresionesPendientes.push({ impresora: imps[0], items: datos.items });
    }

    for (const job of impresionesPendientes) {
      try {
        await ConfiguracionServicio.imprimirComandaDirecta(job.impresora.id, {
          mesa: datos.mesaNumero,
          seccion: datos.seccionNombre,
          cliente: datos.cliente,
          mesero: datos.mesero,
          items: job.items.map((it) => ({
            nombre: it.producto.nombre,
            cantidad: it.cantidad,
            nota: it.notas,
          })),
        });
      } catch (err) {
        console.warn(
          `Aviso al enviar comanda directa a impresora ${job.impresora.nombre}:`,
          err
        );
      }
    }
  };

  // MODIFICADO: Ahora marca las comandas como "Pagando" antes de imprimir
  const imprimirPrecuenta = (venta: VentaMesa) => {
    // 1. Cambiar estado a "Pagando" localmente
    setPedidosPagando((prev) => {
      const next = new Set(prev);
      venta.comandasTicket.forEach((ticket) => {
        if (ticket.comandaId) {
          next.add(ticket.comandaId);
        }
      });
      return next;
    });

    // 2. Preparar e imprimir el ticket
    setTicketAImprimir({
      venta,
      esTicketGlobal: true,
      tipo: 'precuenta',
      itemsFiltrados: venta.itemsConsolidados,
      totalTicket: venta.totalVentaAcumulado,
    });
  };

  const imprimirComandaParaImpresora = async (
    venta: VentaMesa,
    impresora: ImpresoraFrontend,
    itemsParaImprimir?: ItemPedido[]
  ) => {
    if (impresora.seccionesIds && impresora.seccionesIds.length > 0) {
      if (venta.idSeccion && !impresora.seccionesIds.includes(venta.idSeccion)) {
        alert(
          `La impresora "${impresora.nombre}" no atiende la sección "${venta.seccionNombre || 'esta sección'}".`
        );
        return;
      }
    }

    let baseItems =
      itemsParaImprimir && itemsParaImprimir.length > 0
        ? itemsParaImprimir
        : venta.itemsConsolidados;
    let items = baseItems;
    if (impresora.categoriasIds && impresora.categoriasIds.length > 0) {
      items = items.filter((it) => {
        const catId = it.producto.idCategoria;
        return catId ? impresora.categoriasIds.includes(catId) : true;
      });
    }

    if (items.length === 0) {
      alert(
        `No hay productos de las categorías asignadas a "${impresora.nombre}" en esta comanda.`
      );
      return;
    }

    try {
      const res = await ConfiguracionServicio.imprimirComandaDirecta(impresora.id, {
        mesa: venta.numeroMesa,
        seccion: venta.seccionNombre,
        cliente: venta.cliente,
        mesero: venta.meseroPrincipal,
        items: items.map((it) => ({
          nombre: it.producto.nombre,
          cantidad: it.cantidad,
          nota: it.notas,
        })),
      });
      if (res.success) {
        alert(`✓ Comanda enviada exitosamente a "${impresora.nombre}".`);
        setModalImpresorasMesa(null);
        return;
      }
    } catch {
      // Continuar con impresión por diálogo del sistema
    }

    setTicketAImprimir({
      venta,
      tipo: 'comanda',
      impresoraNombre: impresora.nombre,
      itemsFiltrados: items,
      totalTicket: items.reduce((sum, it) => sum + it.producto.precio * it.cantidad, 0),
    });
    setModalImpresorasMesa(null);
  };

  const guardarPedido = async () => {
    if (!mesaSeleccionada || carrito.length === 0) return;
    setGuardando(true);
    try {
      const clienteObjetivo =
        nombreCliente.trim() || ventaEnEdicion?.cliente || 'Cliente General';
      const notaComanda = notasMesa.trim();
      const idUsuarioActual = Number(usuario?.idUsuario ?? usuario?.id_usuario) || null;
      const itemsDeEstaTanda = [...carrito];

      const comandaCreada = await crear({
        mesa: mesaSeleccionada.numero,
        idMesa: mesaSeleccionada.idBackend,
        idUsuario: idUsuarioActual,
        items: itemsDeEstaTanda.map((item) => ({
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

      void imprimirComandasAutomaticas({
        mesaNumero: mesaSeleccionada.numero,
        seccionId: mesaSeleccionada.seccionId,
        seccionNombre: mesaSeleccionada.seccion,
        cliente: clienteObjetivo,
        mesero: usuario?.nombre?.trim() || 'Sin asignar',
        comandaId: comandaCreada?.id,
        items: itemsDeEstaTanda,
      });

      if (ventaEnEdicion) {
        const mesaActualizada = mesas.find((m) => m.id === mesaSeleccionada.id);
        const ventaCorrespondiente = mesaActualizada?.ventasActuales.find(
          (v) => v.cliente.toLowerCase() === ventaEnEdicion.cliente.toLowerCase()
        );
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
    if (
      !window.confirm(
        `¿Deseas despachar y cerrar TODA la venta del cliente "${venta.cliente}" (Total: $${venta.totalVentaAcumulado.toLocaleString('es-CO')})?`
      )
    )
      return;

    setGuardando(true);
    try {
      for (const ticket of venta.comandasTicket) {
        if (ticket.comandaId) {
          await cambiarEstado(ticket.comandaId, 'Cerrado');
          setPedidosPagando((prev) => {
            const next = new Set(prev);
            next.delete(ticket.comandaId!);
            return next;
          });
        }
      }
      await recargar();
      await cargarDatosBackend(true);

      const otrasVentas = mesaSeleccionada?.ventasActuales.filter((v) => v.id !== venta.id) || [];
      if (otrasVentas.length === 0 && mesaSeleccionada) {
        await MesaServicio.actualizarMesa(mesaSeleccionada.idBackend, { estado: 'Libre' });
        await cargarDatosBackend(true);
        cerrarModal();
      } else if (otrasVentas.length > 0) {
        setVentaActivaId(otrasVentas[0].id);
      }
    } catch (err) {
      console.error('Error al despachar la venta completa:', err);
      alert(
        'Error al despachar la venta: ' +
          (err instanceof Error ? err.message : 'Error desconocido')
      );
    } finally {
      setGuardando(false);
    }
  };

  const liberarMesaCompleta = async (mesaId: string) => {
    const mesaTarget = mesas.find((m) => m.id === mesaId);
    if (!mesaTarget) return;
    if (
      !window.confirm(
        `¿Deseas liberar y despachar TODAS las cuentas de la Mesa ${mesaTarget.numero}?`
      )
    )
      return;

    setGuardando(true);
    try {
      for (const venta of mesaTarget.ventasActuales) {
        for (const ticket of venta.comandasTicket) {
          if (ticket.comandaId) {
            await cambiarEstado(ticket.comandaId, 'Cerrado');
            setPedidosPagando((prev) => {
              const next = new Set(prev);
              next.delete(ticket.comandaId!);
              return next;
            });
          }
        }
      }
      await MesaServicio.actualizarMesa(mesaTarget.idBackend, { estado: 'Libre' });
      await recargar();
      await cargarDatosBackend(true);
      cerrarModal();
    } catch (err) {
      console.error('Error al liberar mesa:', err);
      alert(
        'Error al liberar la mesa: ' +
          (err instanceof Error ? err.message : 'Error desconocido')
      );
    } finally {
      setGuardando(false);
    }
  };

  // ── Derivados carrito ───────────────────────────────────────────────────────
  const cantidadPorCategoria = useMemo(() => {
    const mapa: Partial<Record<CategoriaProducto, number>> = {};
    carrito.forEach((item) => {
      mapa[item.producto.categoria] = (mapa[item.producto.categoria] || 0) + item.cantidad;
    });
    return mapa;
  }, [carrito]);

  const productosVisibles = productosMenu.filter((p) =>
    busquedaProducto
      ? p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
      : p.categoria === categoriaActiva
  );

  const totalCarrito = useMemo(
    () => carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0),
    [carrito]
  );

  // ── Retorno ─────────────────────────────────────────────────────────────────
  return {
    // Contextos
    usuario,
    conectadoBackend,
    // Rol
    esAdminODueno,
    puedeLiberar,
    // Estado backend
    cargando,
    guardando,
    // Config UI
    configAbierta,
    setConfigAbierta,
    // Secciones y mesas
    seccionFiltro,
    setSeccionFiltro,
    seccionesDisponibles,
    mesas,
    mesasDeZona,
    // Modal
    mesaSeleccionada,
    pasoModal,
    setPasoModal,
    ventaActivaId,
    setVentaActivaId,
    ventaEnEdicion,
    // Formulario
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
    // Menú
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
    // Scroll categorías
    scrollRef,
    isDragging,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
    // Impresión / pagos
    ticketAImprimir,
    negocioConfig,
    facturacionConfig,
    impresorasConfig,
    modalImpresorasMesa,
    setModalImpresorasMesa,
    rondaSeleccionadaId,
    setRondaSeleccionadaId,
    // Acciones
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
  };
}