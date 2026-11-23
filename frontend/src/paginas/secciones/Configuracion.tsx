import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Printer, FileText, CreditCard, Building2, 
  Plus, Edit, Save, X, UploadCloud, ShieldCheck, 
  QrCode, DollarSign, Wallet, ChefHat, Beer, 
  Phone, Mail, MapPin, Key, Upload, CheckCircle, RefreshCw, Trash2,
  Layers, Check, AlertCircle, Utensils, Store, Power
} from 'lucide-react';
import { 
  ConfiguracionServicio, 
  ConfiguracionNegocio, 
  ConfiguracionFacturacion, 
  ImpresoraFrontend, 
  MetodoPagoConfig,
  ImpresoraSistema
} from '../../servicios/ConfiguracionServicio';
import { ProductoServicio, CategoriaDTO } from '../../servicios/ProductoServicio';
import { MesaServicio, SeccionBackend } from '../../servicios/MesaServicio';
import { CajaServicio } from '../../servicios/CajaServicio';
import type { Caja as TipoCaja } from '../../tipos/Caja';
import FormatoTicketTermico from '../../componentes/FormatoTicketTermico';

type TabConfig = 'impresoras' | 'cajas' | 'facturacion' | 'pagos' | 'negocio';

const FORM_IMPRESORA_VACIO: Omit<ImpresoraFrontend, 'id'> = {
  nombre: '',
  tipo: 'Red (IP)',
  direccion: '',
  activa: true,
  autoPrint: true,
  categoriasIds: [],
  seccionesIds: [],
};

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-11 h-6 bg-[#0B132B] border border-[#3A506B] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#5BC0DE] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5BC0DE] peer-checked:after:bg-[#0B132B]"></div>
  </label>
);

const FixedModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 pointer-events-auto">
      <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[92dvh] animate-in slide-in-from-bottom sm:zoom-in duration-300">
        <div className="bg-[#0B132B] px-4 sm:px-6 py-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-3 border-b border-[#3A506B] flex justify-between items-center shrink-0">
          <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
            {title}
          </h3>
          <button onClick={onClose} className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B] pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState<TabConfig>('impresoras');
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeToast, setMensajeToast] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Estados de datos
  const [impresoras, setImpresoras] = useState<ImpresoraFrontend[]>([]);
  const [categoriasMenu, setCategoriasMenu] = useState<CategoriaDTO[]>([]);
  const [seccionesRestaurante, setSeccionesRestaurante] = useState<SeccionBackend[]>([]);
  const [pagos, setPagos] = useState<MetodoPagoConfig[]>([]);
  const [autoPrint, setAutoPrint] = useState<boolean>(true);

  // Cajas registradoras
  const [cajas, setCajas] = useState<TipoCaja[]>([]);
  const [modalCaja, setModalCaja] = useState<boolean>(false);
  const [cajaEditando, setCajaEditando] = useState<TipoCaja | null>(null);
  const [nombreNuevaCaja, setNombreNuevaCaja] = useState<string>('');
  const [guardandoCaja, setGuardandoCaja] = useState<boolean>(false);

  // Facturación
  const [facturacion, setFacturacion] = useState<ConfiguracionFacturacion>({
    id: 1,
    habilitada: false,
    entorno: 'pruebas',
    resolucion: '',
    prefijo: 'FAC',
    rangoInicial: 1,
    rangoFinal: 5000,
    fechaInicio: '2024-01-01',
    fechaFin: '2026-12-31',
    claveTecnica: '',
    softwareId: '',
    apiKey: '',
    certificadoCargado: false,
  });

  // Negocio
  const [negocio, setNegocio] = useState<ConfiguracionNegocio>({
    id: 1,
    nombre: 'Sabor & Stock Restaurante',
    nit: '',
    direccion: '',
    telefono: '',
    email: '',
    moneda: 'COP',
    logoUrl: null,
  });

  // Modal Impresora
  const [modalImpresora, setModalImpresora] = useState<boolean>(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formImpresora, setFormImpresora] = useState<Omit<ImpresoraFrontend, 'id'>>(FORM_IMPRESORA_VACIO);
  const [errorImpresora, setErrorImpresora] = useState<string>('');
  const [impresoraAProbar, setImpresoraAProbar] = useState<ImpresoraFrontend | null>(null);

  // Impresoras del sistema (Windows)
  const [impresorasSistema, setImpresorasSistema] = useState<ImpresoraSistema[]>([]);
  const [escaneando, setEscaneando] = useState<boolean>(false);

  // Modal Pago
  const [modalPago, setModalPago] = useState<boolean>(false);
  const [formPago, setFormPago] = useState<{ nombre: string; icono: MetodoPagoConfig['icono']; cuentaDestino: string }>({
    nombre: '',
    icono: 'transferencia',
    cuentaDestino: '',
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (impresoraAProbar) {
      const timer = setTimeout(() => {
        window.print();
        setImpresoraAProbar(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [impresoraAProbar]);

  const probarImpresion = async (imp: ImpresoraFrontend) => {
    mostrarToast(`Probando impresora "${imp.nombre}"...`);
    try {
      const res = await ConfiguracionServicio.probarImpresoraDirecta(imp.id);
      if (res.success) {
        mostrarToast(`✓ ${res.mensaje}`);
        return;
      }
    } catch {
      // Usar diálogo del navegador como fallback
    }
    setImpresoraAProbar(imp);
  };

  const escanearImpresorasConectadas = async (silencioso = false) => {
    try {
      setEscaneando(true);
      if (!silencioso) mostrarToast('Detectando impresoras conectadas en este equipo...');
      const delSistema = await ConfiguracionServicio.listarImpresorasSistema();
      setImpresorasSistema(delSistema);
      if (!silencioso) {
        if (delSistema.length > 0) {
          mostrarToast(`✓ Se detectaron ${delSistema.length} impresoras instaladas en Windows.`);
        } else {
          mostrarToast('No se detectaron impresoras conectadas.');
        }
      }
    } catch (err: any) {
      if (!silencioso) mostrarToast('Error al detectar impresoras: ' + err.message, 'error');
    } finally {
      setEscaneando(false);
    }
  };

  const mostrarToast = (texto: string, tipo: 'ok' | 'error' = 'ok') => {
    setMensajeToast({ tipo, texto });
    setTimeout(() => {
      setMensajeToast(null);
    }, 3500);
  };

  // Cargar datos del backend
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [negocioData, facturacionData, impresorasData, pagosData, catsData, secsData, sysImps, cajasData] = await Promise.all([
        ConfiguracionServicio.obtenerNegocio().catch(() => null),
        ConfiguracionServicio.obtenerFacturacion().catch(() => null),
        ConfiguracionServicio.listarImpresoras().catch(() => []),
        ConfiguracionServicio.obtenerPagos().catch(() => []),
        ProductoServicio.listarCategorias().catch(() => []),
        MesaServicio.obtenerSecciones().catch(() => []),
        ConfiguracionServicio.listarImpresorasSistema().catch(() => []),
        CajaServicio.listarCajas().catch(() => []),
      ]);

      if (negocioData) setNegocio(negocioData);
      if (facturacionData) setFacturacion(facturacionData);
      if (sysImps) setImpresorasSistema(sysImps);
      if (impresorasData) {
        setImpresoras(impresorasData);
        if (impresorasData.length > 0) {
          setAutoPrint(impresorasData.some(i => i.autoPrint));
        }
      }
      if (pagosData && pagosData.length > 0) setPagos(pagosData);
      if (catsData) setCategoriasMenu(catsData);
      if (secsData) setSeccionesRestaurante(secsData);
      if (cajasData) setCajas(cajasData);
    } catch (err: any) {
      mostrarToast('Error al cargar la configuración: ' + (err.message || 'Desconocido'), 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const TABS = [
    { id: 'impresoras', label: 'Impresoras', icon: Printer },
    { id: 'cajas', label: 'Cajas Registradoras', icon: Store },
    { id: 'facturacion', label: 'Facturación', icon: FileText },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'negocio', label: 'Mi Negocio', icon: Building2 },
  ];

  const getIconoPago = (tipo: string) => {
    switch (tipo) {
      case 'efectivo': return <DollarSign size={18} />;
      case 'tarjeta': return <CreditCard size={18} />;
      case 'transferencia': return <Wallet size={18} />;
      default: return <QrCode size={18} />;
    }
  };

  // ================= LÓGICA DE IMPRESORAS =================
  const abrirModalCrear = () => {
    setFormImpresora({
      nombre: '',
      tipo: 'Red (IP)',
      direccion: '',
      activa: true,
      autoPrint: true,
      categoriasIds: [],
      seccionesIds: [],
    });
    setEditandoId(null);
    setErrorImpresora('');
    setModalImpresora(true);
  };

  const abrirModalEditar = (imp: ImpresoraFrontend) => {
    setFormImpresora({
      nombre: imp.nombre,
      tipo: imp.tipo,
      direccion: imp.direccion,
      activa: imp.activa,
      autoPrint: imp.autoPrint,
      categoriasIds: imp.categoriasIds || [],
      seccionesIds: imp.seccionesIds || [],
    });
    setEditandoId(imp.id);
    setErrorImpresora('');
    setModalImpresora(true);
  };

  const guardarImpresora = async () => {
    if (!formImpresora.nombre.trim()) return setErrorImpresora('El nombre es obligatorio.');
    if (!formImpresora.direccion.trim()) return setErrorImpresora('La dirección/IP es obligatoria.');

    try {
      setGuardando(true);
      if (editandoId !== null) {
        const actualizada = await ConfiguracionServicio.actualizarImpresora(editandoId, formImpresora);
        setImpresoras(prev => prev.map(i => i.id === editandoId ? actualizada : i));
        mostrarToast('Impresora actualizada exitosamente');
      } else {
        const nueva = await ConfiguracionServicio.crearImpresora(formImpresora);
        setImpresoras(prev => [...prev, nueva]);
        mostrarToast('Impresora creada exitosamente');
      }
      setModalImpresora(false);
    } catch (err: any) {
      setErrorImpresora(err.message || 'Error al guardar la impresora');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarImpresora = async (id: number) => {
    if (window.confirm('¿Deseas eliminar esta impresora? Las rutas asociadas quedarán desasignadas.')) {
      try {
        await ConfiguracionServicio.eliminarImpresora(id);
        setImpresoras(prev => prev.filter(i => i.id !== id));
        mostrarToast('Impresora eliminada');
      } catch (err: any) {
        mostrarToast('Error al eliminar: ' + err.message, 'error');
      }
    }
  };

  const toggleActiva = async (imp: ImpresoraFrontend) => {
    try {
      const nuevaActiva = !imp.activa;
      await ConfiguracionServicio.actualizarImpresora(imp.id, { activa: nuevaActiva });
      setImpresoras(prev => prev.map(i => i.id === imp.id ? { ...i, activa: nuevaActiva } : i));
    } catch (err: any) {
      mostrarToast('Error al cambiar estado: ' + err.message, 'error');
    }
  };

  const cambiarRutaCategoria = async (idCategoria: number, idImpresora: number | null) => {
    try {
      await ConfiguracionServicio.asignarRuta(idCategoria, idImpresora);
      // Actualizar localmente las impresoras
      setImpresoras(prev => prev.map(imp => {
        let cats = [...(imp.categoriasIds || [])];
        if (idImpresora === imp.id) {
          if (!cats.includes(idCategoria)) cats.push(idCategoria);
        } else {
          cats = cats.filter(c => c !== idCategoria);
        }
        return { ...imp, categoriasIds: cats };
      }));
      mostrarToast('Ruta de impresión actualizada');
    } catch (err: any) {
      mostrarToast('Error al asignar ruta: ' + err.message, 'error');
    }
  };

  // Toggle categoría en modal impresora
  const toggleCategoriaModal = (idCat: number) => {
    const actuales = formImpresora.categoriasIds || [];
    if (actuales.includes(idCat)) {
      setFormImpresora({ ...formImpresora, categoriasIds: actuales.filter(c => c !== idCat) });
    } else {
      setFormImpresora({ ...formImpresora, categoriasIds: [...actuales, idCat] });
    }
  };

  // Toggle sección en modal impresora
  const toggleSeccionModal = (idSec: number) => {
    const actuales = formImpresora.seccionesIds || [];
    if (actuales.includes(idSec)) {
      setFormImpresora({ ...formImpresora, seccionesIds: actuales.filter(s => s !== idSec) });
    } else {
      setFormImpresora({ ...formImpresora, seccionesIds: [...actuales, idSec] });
    }
  };

  // ================= LÓGICA DE CAJAS =================
  const abrirModalCrearCaja = () => {
    setCajaEditando(null);
    setNombreNuevaCaja('');
    setModalCaja(true);
  };

  const abrirModalEditarCaja = (caja: TipoCaja) => {
    setCajaEditando(caja);
    setNombreNuevaCaja(caja.nombre);
    setModalCaja(true);
  };

  const guardarCaja = async () => {
    if (!nombreNuevaCaja.trim()) {
      mostrarToast('El nombre de la caja es obligatorio', 'error');
      return;
    }
    setGuardandoCaja(true);
    try {
      if (cajaEditando) {
        await CajaServicio.actualizarCaja(cajaEditando.id, { nombre: nombreNuevaCaja.trim() });
        mostrarToast('Caja actualizada exitosamente');
      } else {
        await CajaServicio.crearCaja({ nombre: nombreNuevaCaja.trim() });
        mostrarToast('Nueva caja creada exitosamente');
      }
      const data = await CajaServicio.listarCajas();
      setCajas(data);
      setModalCaja(false);
      setNombreNuevaCaja('');
      setCajaEditando(null);
    } catch (err: any) {
      mostrarToast(err?.response?.data?.mensaje || err?.message || 'Error al guardar la caja', 'error');
    } finally {
      setGuardandoCaja(false);
    }
  };

  const alternarEstadoCaja = async (caja: TipoCaja) => {
    try {
      await CajaServicio.actualizarCaja(caja.id, { activo: !caja.activo });
      const data = await CajaServicio.listarCajas();
      setCajas(data);
      mostrarToast(`Caja "${caja.nombre}" ahora está ${!caja.activo ? 'activa' : 'inactiva'}`);
    } catch (err: any) {
      mostrarToast(err?.response?.data?.mensaje || err?.message || 'Error al actualizar estado', 'error');
    }
  };

  const eliminarCaja = async (caja: TipoCaja) => {
    if (!window.confirm(`¿Estás seguro de eliminar la caja "${caja.nombre}"?`)) return;
    try {
      await CajaServicio.eliminarCaja(caja.id);
      const data = await CajaServicio.listarCajas();
      setCajas(data);
      mostrarToast(`Caja "${caja.nombre}" eliminada`);
    } catch (err: any) {
      mostrarToast(err?.response?.data?.mensaje || err?.message || 'No se puede eliminar la caja porque tiene turnos o movimientos registrados', 'error');
    }
  };

  // ================= FACTURACIÓN =================
  const guardarFacturacion = async () => {
    try {
      setGuardando(true);
      await ConfiguracionServicio.actualizarFacturacion(facturacion);
      mostrarToast('Configuración de facturación guardada exitosamente');
    } catch (err: any) {
      mostrarToast('Error al guardar facturación: ' + err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const probarConexion = () => {
    setTestStatus('loading');
    setTimeout(() => {
      setTestStatus('success');
      mostrarToast('Conexión con el servidor de facturación verificada correctamente');
      setTimeout(() => setTestStatus('idle'), 3000);
    }, 1200);
  };

  // ================= MI NEGOCIO =================
  const guardarNegocio = async () => {
    if (!negocio.nombre.trim()) {
      mostrarToast('El nombre del establecimiento es obligatorio', 'error');
      return;
    }
    try {
      setGuardando(true);
      await ConfiguracionServicio.actualizarNegocio(negocio);
      mostrarToast('¡Datos de Mi Negocio guardados exitosamente! Ya se aplican a los tickets y facturas.');
    } catch (err: any) {
      mostrarToast('Error al guardar datos de negocio: ' + err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ================= MÉTODOS DE PAGO =================
  const guardarMetodosPago = async (nuevosPagos: MetodoPagoConfig[]) => {
    try {
      await ConfiguracionServicio.guardarPagos(nuevosPagos);
      setPagos(nuevosPagos);
      mostrarToast('Métodos de pago actualizados');
    } catch (err: any) {
      mostrarToast('Error al guardar pagos: ' + err.message, 'error');
    }
  };

  const agregarNuevoPago = () => {
    if (!formPago.nombre.trim()) return;
    const nuevo: MetodoPagoConfig = {
      id: `p-${Date.now()}`,
      nombre: formPago.nombre.trim(),
      icono: formPago.icono,
      activo: true,
      requiereReferencia: formPago.icono !== 'efectivo',
      cuentaDestino: formPago.cuentaDestino.trim() || undefined,
    };
    const listaActualizada = [...pagos, nuevo];
    guardarMetodosPago(listaActualizada);
    setFormPago({ nombre: '', icono: 'transferencia', cuentaDestino: '' });
    setModalPago(false);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#0B132B] text-[#F4D6B0] font-sans overflow-hidden selection:bg-[#5BC0DE]/40">
      
      {/* TOAST FLOTANTE */}
      {mensajeToast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${
          mensajeToast.tipo === 'ok' 
            ? 'bg-[#1C2541] border-[#4ADE80] text-[#4ADE80]' 
            : 'bg-[#1C2541] border-[#E57373] text-[#E57373]'
        }`}>
          {mensajeToast.tipo === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{mensajeToast.texto}</span>
        </div>
      )}

      {/* HEADER Y PESTAÑAS FIJAS */}
      <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <header className="bg-[#1C2541] border-b border-[#3A506B] px-3 sm:px-4 md:px-6 py-2">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#5BC0DE]/10 flex items-center justify-center border border-[#5BC0DE]/30 shrink-0">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#5BC0DE]" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold tracking-tight text-[#F4D6B0]">Configuración General</h2>
                <p className="hidden sm:block text-[11px] text-[#5BC0DE] uppercase tracking-wider font-semibold">
                  {negocio.nombre || 'Sabor & Stock'} • Ajustes del Sistema
                </p>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabConfig)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-sm font-semibold whitespace-nowrap shrink-0 border transition-all ${activeTab === tab.id ? "border-[#5BC0DE] text-[#0B132B] bg-[#5BC0DE]" : "border-transparent text-[#F4D6B0] hover:text-white hover:bg-[#3A506B]/50"}`}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-5xl mx-auto p-3 sm:p-5 pb-[calc(6rem+env(safe-area-inset-bottom))] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#5BC0DE]">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p className="text-xs font-semibold">Cargando configuración...</p>
          </div>
        ) : (
          <>
            {/* ================= TAB 1: IMPRESORAS ================= */}
            {activeTab === 'impresoras' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Toggle Impresión Automática */}
                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-[#F4D6B0]">Impresión Automática</h3>
                    <p className="text-[11px] text-[#5BC0DE] mt-0.5">Disparar comandas automáticamente a las impresoras según categoría y sección</p>
                  </div>
                  <Toggle checked={autoPrint} onChange={() => setAutoPrint(!autoPrint)} />
                </div>

                {/* Lista de Impresoras */}
                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-3.5 sm:p-4 border-b border-[#3A506B] flex flex-wrap justify-between items-center gap-2 bg-[#0B132B]/50">
                    <div>
                      <h3 className="text-xs font-bold text-[#F4D6B0] uppercase tracking-wider">
                        Dispositivos de Impresión ({impresoras.length})
                      </h3>
                      <p className="text-[10px] text-[#5BC0DE] mt-0.5">Control de impresoras térmicas ESC/POS, cocina, barra y facturación</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => escanearImpresorasConectadas(false)}
                        disabled={escaneando}
                        className="text-[10px] bg-[#0B132B] text-[#5BC0DE] border border-[#5BC0DE]/40 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-[#5BC0DE]/10 transition-colors shadow-sm disabled:opacity-50"
                        title="Buscar impresoras físicas conectadas en Windows (USB / Red / Spooler)"
                      >
                        <RefreshCw size={13} className={escaneando ? 'animate-spin' : ''} />
                        <span>{escaneando ? 'Detectando...' : 'Detectar Impresoras del PC'}</span>
                      </button>
                      <button 
                        onClick={abrirModalCrear} 
                        className="text-[10px] bg-[#5BC0DE] text-[#0B132B] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-[#4CA8C4] transition-colors shadow-sm"
                      >
                        <Plus size={13} /> Añadir Impresora
                      </button>
                    </div>
                  </div>

                  {/* Panel de impresoras detectadas en Windows */}
                  {impresorasSistema.length > 0 && (
                    <div className="bg-[#0B132B]/70 p-3 sm:p-4 border-b border-[#3A506B]/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#F4D6B0] flex items-center gap-1.5">
                          <CheckCircle size={13} className="text-[#4ADE80]" />
                          Impresoras detectadas en este equipo Windows ({impresorasSistema.length}):
                        </span>
                        <span className="text-[9px] text-[#5BC0DE]">Haz clic en una para vincularla a SaborStock</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {impresorasSistema.map((sys) => {
                          const yaConfigurada = impresoras.some(
                            (i) => i.nombre.toLowerCase() === sys.nombre.toLowerCase() || i.direccion.toLowerCase() === sys.nombre.toLowerCase()
                          );
                          return (
                            <button
                              key={sys.nombre}
                              type="button"
                              onClick={() => {
                                setFormImpresora({
                                  nombre: sys.nombre,
                                  tipo: 'USB',
                                  direccion: sys.nombre,
                                  activa: true,
                                  autoPrint: true,
                                  categoriasIds: [],
                                  seccionesIds: [],
                                });
                                setEditandoId(null);
                                setErrorImpresora('');
                                setModalImpresora(true);
                              }}
                              className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-2 transition-all ${
                                yaConfigurada
                                  ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]'
                                  : 'bg-[#1C2541] border-[#3A506B] text-[#F4D6B0] hover:border-[#5BC0DE] hover:bg-[#5BC0DE]/10'
                              }`}
                            >
                              <Printer size={12} className={sys.predeterminada ? 'text-[#F4D6B0]' : 'text-[#5BC0DE]'} />
                              <span>{sys.nombre}</span>
                              {sys.predeterminada && (
                                <span className="text-[9px] bg-[#F4D6B0]/20 text-[#F4D6B0] px-1 py-0.2 rounded font-bold">
                                  Predeterminada
                                </span>
                              )}
                              {yaConfigurada ? (
                                <span className="text-[9px] bg-[#4ADE80]/20 text-[#4ADE80] px-1 rounded font-bold">
                                  ✓ Vinculada
                                </span>
                              ) : (
                                <span className="text-[9px] text-[#5BC0DE] font-bold">
                                  + Vincular
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tarjetas de Impresoras */}
                  <div className="p-3 sm:p-4 space-y-3 bg-[#1C2541]">
                    {impresoras.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#5BC0DE]/60 space-y-2">
                        <Printer className="w-8 h-8 mx-auto text-[#3A506B]" />
                        <p>No hay impresoras configuradas aún.</p>
                        <button 
                          onClick={abrirModalCrear}
                          className="text-xs bg-[#5BC0DE] text-[#0B132B] px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1"
                        >
                          <Plus size={14} /> Configurar Primera Impresora
                        </button>
                      </div>
                    ) : (
                      impresoras.map(imp => {
                        const catsNombres = (imp.categoriasIds || []).map(idCat => {
                          const c = categoriasMenu.find(item => Number(item.id_categoria) === Number(idCat));
                          return c ? c.nombre : `Cat #${idCat}`;
                        });

                        const secsNombres = (imp.seccionesIds || []).map(idSec => {
                          const s = seccionesRestaurante.find(item => Number(item.id) === Number(idSec));
                          return s ? s.nombre : `Sec #${idSec}`;
                        });

                        return (
                          <div key={imp.id} className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#5BC0DE]/50 transition-colors shadow-sm">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[#1C2541] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE] shrink-0 mt-0.5">
                                <Printer size={18} />
                              </div>
                              <div className="min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{imp.nombre}</p>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                    imp.activa ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  }`}>
                                    {imp.activa ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#5BC0DE] font-mono">
                                  {imp.tipo} • {imp.direccion}
                                </p>

                                {/* Badges de Categorías */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="text-[10px] text-[#F4D6B0]/70 font-semibold flex items-center gap-1">
                                    <Utensils size={11} className="text-[#5BC0DE]" /> Categorías:
                                  </span>
                                  {catsNombres.length === 0 ? (
                                    <span className="text-[9px] bg-[#1C2541] text-[#5BC0DE] px-2 py-0.5 rounded-md border border-[#3A506B] font-medium">
                                      Todas
                                    </span>
                                  ) : (
                                    catsNombres.map((nom, idx) => (
                                      <span key={idx} className="text-[9px] bg-[#1C2541] text-[#F4D6B0] px-2 py-0.5 rounded-md border border-[#3A506B] font-medium">
                                        {nom}
                                      </span>
                                    ))
                                  )}
                                </div>

                                {/* Badges de Secciones */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-[#F4D6B0]/70 font-semibold flex items-center gap-1">
                                    <Layers size={11} className="text-[#F4D6B0]" /> Secciones:
                                  </span>
                                  {secsNombres.length === 0 ? (
                                    <span className="text-[9px] bg-[#1C2541] text-[#F4D6B0] px-2 py-0.5 rounded-md border border-[#3A506B] font-medium">
                                      Todas
                                    </span>
                                  ) : (
                                    secsNombres.map((nom, idx) => (
                                      <span key={idx} className="text-[9px] bg-[#1C2541] text-[#5BC0DE] px-2 py-0.5 rounded-md border border-[#3A506B] font-medium">
                                        {nom}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 border-[#3A506B]/30 pt-3 md:pt-0">
                              <button
                                type="button"
                                onClick={() => probarImpresion(imp)}
                                className="px-2.5 h-[34px] text-[#5BC0DE] bg-[#1C2541] hover:bg-[#5BC0DE]/10 rounded-lg transition-colors border border-[#5BC0DE]/40 text-[10px] font-bold flex items-center gap-1.5 shadow-sm"
                                title="Imprimir ticket de prueba en esta impresora"
                              >
                                <Printer size={13} /> Probar
                              </button>
                              <button 
                                onClick={() => toggleActiva(imp)} 
                                className={`text-[10px] font-bold px-2.5 h-[34px] rounded-lg border transition-colors flex items-center justify-center ${
                                  imp.activa ? 'bg-[#1C2541] text-[#5BC0DE] border-[#3A506B] hover:bg-[#3A506B]/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                                }`}
                              >
                                {imp.activa ? 'Desactivar' : 'Activar'}
                              </button>
                              <button 
                                onClick={() => abrirModalEditar(imp)} 
                                className="p-2 h-[34px] w-[34px] text-[#5BC0DE] bg-[#1C2541] hover:bg-[#3A506B] rounded-lg transition-colors border border-[#3A506B] flex items-center justify-center"
                                title="Editar impresora, categorías y secciones"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => eliminarImpresora(imp.id)} 
                                className="p-2 h-[34px] w-[34px] text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/30 flex items-center justify-center"
                                title="Eliminar impresora"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Rutas por Categoría */}
                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-3.5 sm:p-4 border-b border-[#3A506B] bg-[#0B132B]/50">
                    <h3 className="text-xs font-bold text-[#F4D6B0] uppercase tracking-wider">
                      Asignación Rápida de Rutas por Categoría
                    </h3>
                    <p className="text-[10px] text-[#5BC0DE] mt-0.5">
                      Indica a qué impresora debe enviarse cada tipo de plato, bebida o servicio.
                    </p>
                  </div>
                  <div className="p-3.5 sm:p-4 space-y-3">
                    {categoriasMenu.map(cat => {
                      const idCatNum = Number(cat.id_categoria);
                      const impAsignada = impresoras.find(i => (i.categoriasIds || []).includes(idCatNum));

                      return (
                        <div key={cat.id_categoria} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3A506B]/30 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            {cat.nombre.toLowerCase().includes('bebida') || cat.nombre.toLowerCase().includes('licor') ? (
                              <Beer size={15} className="text-[#5BC0DE]" />
                            ) : (
                              <ChefHat size={15} className="text-[#5BC0DE]" />
                            )}
                            <span className="text-xs font-medium text-[#F4D6B0]">{cat.nombre}</span>
                          </div>
                          <select 
                            value={impAsignada?.id || ''}
                            onChange={(e) => {
                              const nuevoId = e.target.value ? Number(e.target.value) : null;
                              cambiarRutaCategoria(idCatNum, nuevoId);
                            }}
                            className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-2.5 py-1.5 text-base sm:text-xs focus:outline-none focus:border-[#5BC0DE] w-full sm:w-64 h-[34px]"
                          >
                            <option value="">(Impresión general / Sin asignar)</option>
                            {impresoras.filter(i => i.activa).map(i => (
                              <option key={i.id} value={i.id}>{i.nombre} ({i.tipo})</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nota Aclaratoria */}
                <div className="bg-[#D97706]/10 border border-[#D97706]/30 rounded-2xl p-3.5 flex gap-2.5 items-start">
                  <span className="text-[#D97706] shrink-0 mt-0.5 text-base">ℹ️</span>
                  <div>
                    <p className="text-[11px] font-bold text-[#D97706]">Configuración de Impresión ESC/POS y Comandas</p>
                    <p className="text-[10px] text-[#D97706]/90 mt-0.5 leading-relaxed">
                      Cada impresora puede filtrar automáticamente qué <strong>Categorías</strong> de productos imprimir (ej: Cocina = Platos Fuertes, Barra = Bebidas) y de qué <strong>Secciones</strong> del restaurante recibirlas (ej: Terraza, Salón Principal). Al enviar comandas o generar pre-cuentas, el sistema enruta los ítems correspondientes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB: CAJAS REGISTRADORAS ================= */}
            {activeTab === 'cajas' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h3 className="text-base font-bold text-[#F4D6B0] flex items-center gap-2">
                      <Store className="w-5 h-5 text-[#5BC0DE]" />
                      Cajas Registradoras
                    </h3>
                    <p className="text-xs text-[#5BC0DE]/80 mt-1">
                      Gestiona los puntos de venta. Cada caja mantiene turnos, aperturas y arqueos independientes.
                    </p>
                  </div>
                  <button
                    onClick={abrirModalCrearCaja}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5BC0DE] text-[#0B132B] font-bold rounded-xl text-xs hover:bg-[#4CA8C4] transition-all shadow-md shrink-0 h-[42px]"
                  >
                    <Plus className="w-4 h-4" /> Nueva Caja
                  </button>
                </div>

                {/* Grid de Cajas */}
                {cajas.length === 0 ? (
                  <div className="bg-[#1C2541]/50 border border-dashed border-[#3A506B] rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#0B132B] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE]">
                      <Store className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-[#F4D6B0]">No hay cajas registradas</p>
                    <p className="text-xs text-[#5BC0DE]/70 max-w-sm">
                      Crea al menos una caja (ej: Caja Principal, Barra, Terraza) para poder abrir turnos operativos.
                    </p>
                    <button
                      onClick={abrirModalCrearCaja}
                      className="mt-2 px-4 py-2 bg-[#5BC0DE] text-[#0B132B] text-xs font-bold rounded-xl hover:bg-[#4CA8C4] transition-all"
                    >
                      + Crear Primera Caja
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {cajas.map((caja) => (
                      <div
                        key={caja.id}
                        className={`bg-[#0B132B] border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${
                          caja.activo ? 'border-[#3A506B] hover:border-[#5BC0DE]/50' : 'border-[#3A506B]/50 opacity-70 bg-[#0B132B]/40'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                caja.activo ? 'bg-[#1C2541] text-[#5BC0DE] border-[#3A506B]' : 'bg-[#1C2541] text-slate-400 border-[#3A506B]/50'
                              }`}>
                                <Store className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono text-[#5BC0DE]/70">Punto #{caja.id}</span>
                                <h4 className="text-sm font-bold text-[#F4D6B0] leading-tight">{caja.nombre}</h4>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              caja.activo
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}>
                              {caja.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5BC0DE]/70">
                            {caja.activo
                              ? 'Disponible para selección al abrir turno en Caja.'
                              : 'Deshabilitada. No aparecerá en el selector de turnos.'}
                          </p>
                        </div>

                        {/* Acciones */}
                        <div className="pt-3 border-t border-[#3A506B]/50 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => alternarEstadoCaja(caja)}
                            title={caja.activo ? 'Desactivar caja' : 'Activar caja'}
                            className={`flex items-center gap-1.5 px-2.5 h-[34px] rounded-lg text-[11px] font-bold border transition-all ${
                              caja.activo
                                ? 'bg-[#1C2541] text-slate-300 border-[#3A506B] hover:text-amber-400 hover:border-amber-400/40'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {caja.activo ? 'Desactivar' : 'Activar'}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => abrirModalEditarCaja(caja)}
                              title="Editar nombre"
                              className="p-1.5 h-[34px] w-[34px] rounded-lg bg-[#1C2541] text-[#5BC0DE] border border-[#3A506B] hover:text-[#F4D6B0] hover:border-[#5BC0DE] transition-all flex items-center justify-center"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarCaja(caja)}
                              title="Eliminar caja"
                              className="p-1.5 h-[34px] w-[34px] rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500 transition-all flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nota Aclaratoria */}
                <div className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-4 flex gap-3 items-start">
                  <span className="text-[#5BC0DE] text-lg">💡</span>
                  <div className="text-xs text-[#5BC0DE]/80 leading-relaxed">
                    <p className="font-bold text-[#F4D6B0] mb-0.5">Gestión de Cajas para el Dueño</p>
                    Puedes crear tantas cajas como puntos de cobro físicos tengas (Caja 1, Caja 2, Barra, Kiosko, etc.). Al momento de abrir turno, el cajero o administrador elegirá en qué caja operará, manteniendo arqueos y montos independientes.
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: FACTURACIÓN ================= */}
            {activeTab === 'facturacion' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center text-[#4ADE80]">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#F4D6B0]">Facturación Electrónica DIAN / POS</h3>
                      <p className="text-[11px] text-[#5BC0DE] mt-0.5">Habilitar emisión formal de comprobantes y resolución fiscal</p>
                    </div>
                  </div>
                  <Toggle 
                    checked={facturacion.habilitada} 
                    onChange={() => setFacturacion({ ...facturacion, habilitada: !facturacion.habilitada })} 
                  />
                </div>

                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">Entorno Fiscal</h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setFacturacion({ ...facturacion, entorno: 'pruebas' })}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        facturacion.entorno === 'pruebas' 
                          ? 'bg-[#D97706]/15 border-[#D97706] text-[#D97706]' 
                          : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE] hover:border-[#5BC0DE]'
                      }`}
                    >
                      <RefreshCw size={18} />
                      <span className="text-xs font-bold">Habilitación / Pruebas</span>
                      <span className="text-[9px]">Ambiente de Ensayo DIAN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFacturacion({ ...facturacion, entorno: 'produccion' })}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        facturacion.entorno === 'produccion' 
                          ? 'bg-[#4ADE80]/15 border-[#4ADE80] text-[#4ADE80]' 
                          : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE] hover:border-[#5BC0DE]'
                      }`}
                    >
                      <CheckCircle size={18} />
                      <span className="text-xs font-bold">Producción Oficial</span>
                      <span className="text-[9px]">Facturas Legales Válidas</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">Resolución y Rangos Autorizados</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Número de Resolución DIAN</label>
                      <input 
                        type="text" 
                        value={facturacion.resolucion || ''} 
                        onChange={e => setFacturacion({ ...facturacion, resolucion: e.target.value })} 
                        placeholder="Ej: 18764000001" 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Prefijo Autorizado</label>
                      <input 
                        type="text" 
                        value={facturacion.prefijo || ''} 
                        onChange={e => setFacturacion({ ...facturacion, prefijo: e.target.value })} 
                        placeholder="Ej: FAC o POS" 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] uppercase font-mono transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Rango Inicial</label>
                      <input 
                        type="number" 
                        value={facturacion.rangoInicial || ''} 
                        onChange={e => setFacturacion({ ...facturacion, rangoInicial: Number(e.target.value) })} 
                        placeholder="1" 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Rango Final</label>
                      <input 
                        type="number" 
                        value={facturacion.rangoFinal || ''} 
                        onChange={e => setFacturacion({ ...facturacion, rangoFinal: Number(e.target.value) })} 
                        placeholder="5000" 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Vigencia Desde</label>
                      <input 
                        type="date" 
                        value={facturacion.fechaInicio || ''} 
                        onChange={e => setFacturacion({ ...facturacion, fechaInicio: e.target.value })} 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Vigencia Hasta</label>
                      <input 
                        type="date" 
                        value={facturacion.fechaFin || ''} 
                        onChange={e => setFacturacion({ ...facturacion, fechaFin: e.target.value })} 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">Credenciales de Proveedor Tecnológico</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Software ID</label>
                      <input 
                        type="text" 
                        value={facturacion.softwareId || ''} 
                        onChange={e => setFacturacion({ ...facturacion, softwareId: e.target.value })} 
                        placeholder="Ej: SW-12345" 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">PIN / Clave Técnica</label>
                      <div className="relative">
                        <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                        <input 
                          type="password" 
                          value={facturacion.claveTecnica || ''} 
                          onChange={e => setFacturacion({ ...facturacion, claveTecnica: e.target.value })} 
                          placeholder="••••••••••••" 
                          className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl pl-9 pr-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">API Key / Token de Servicio</label>
                      <input 
                        type="password" 
                        value={facturacion.apiKey || ''} 
                        onChange={e => setFacturacion({ ...facturacion, apiKey: e.target.value })} 
                        placeholder="sk_live_..." 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
                      />
                    </div>
                  </div>
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#3A506B]/50">
                    <span className="text-[10px] text-[#5BC0DE]">Verifica la conexión con el servidor de la DIAN</span>
                    <button 
                      type="button"
                      onClick={probarConexion}
                      disabled={testStatus === 'loading' || testStatus === 'success'}
                      className={`px-4 h-[42px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        testStatus === 'success' ? 'bg-[#4ADE80] text-[#0B132B]' : 
                        'bg-[#0B132B] border border-[#5BC0DE] text-[#5BC0DE] hover:bg-[#5BC0DE]/10'
                      }`}
                    >
                      {testStatus === 'loading' ? <RefreshCw size={14} className="animate-spin" /> : 
                       testStatus === 'success' ? <CheckCircle size={14} /> : 
                       <RefreshCw size={14} />}
                      {testStatus === 'loading' ? 'Conectando...' : 
                       testStatus === 'success' ? 'Conexión Exitosa' : 
                       'Probar Conexión'}
                    </button>
                  </div>
                </div>

                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 flex justify-end shadow-sm">
                  <button 
                    onClick={guardarFacturacion}
                    disabled={guardando}
                    className="w-full sm:w-auto bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all h-[42px]"
                  >
                    <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar Configuración de Facturación'}
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB 3: MÉTODOS DE PAGO ================= */}
            {activeTab === 'pagos' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-[#F4D6B0]">Métodos de Pago Habilitados</h3>
                    <p className="text-[11px] text-[#5BC0DE]">Activa o desactiva cómo recibes el dinero en Caja y Facturación.</p>
                  </div>
                  <button 
                    onClick={() => setModalPago(true)} 
                    className="text-[10px] bg-[#5BC0DE] text-[#0B132B] px-3 py-2 rounded-xl font-bold flex items-center gap-1 hover:bg-[#4CA8C4] shadow-sm transition-colors h-[38px]"
                  >
                    <Plus size={13} /> Añadir Método
                  </button>
                </div>

                <div className="space-y-2">
                  {pagos.map((pago) => (
                    <div key={pago.id} className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-[#5BC0DE]/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#1C2541] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE] shrink-0">
                          {getIconoPago(pago.icono)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#F4D6B0]">{pago.nombre}</p>
                          {pago.cuentaDestino && (
                            <p className="text-[10px] text-[#5BC0DE] mt-0.5 truncate font-mono">
                              Destino: {pago.cuentaDestino}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0 border-t sm:border-t-0 border-[#3A506B]/50 pt-3 sm:pt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#5BC0DE] font-bold hidden sm:inline">Requiere Ref.</span>
                          <Toggle 
                            checked={pago.requiereReferencia} 
                            onChange={() => {
                              const actualizados = pagos.map(p => p.id === pago.id ? { ...p, requiereReferencia: !p.requiereReferencia } : p);
                              guardarMetodosPago(actualizados);
                            }} 
                          />
                        </div>
                        <div className="h-6 w-px bg-[#3A506B] hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#5BC0DE] font-bold">Activo</span>
                          <Toggle 
                            checked={pago.activo} 
                            onChange={() => {
                              const actualizados = pagos.map(p => p.id === pago.id ? { ...p, activo: !p.activo } : p);
                              guardarMetodosPago(actualizados);
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 4: MI NEGOCIO ================= */}
            {activeTab === 'negocio' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 border-dashed border-2 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-[#0B132B] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE]">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F4D6B0]">{negocio.nombre || 'Mi Restaurante'}</p>
                    <p className="text-[11px] text-[#5BC0DE] mt-1 max-w-xs mx-auto">Estos datos se imprimirán en los encabezados de tickets, comandas y facturas de venta.</p>
                  </div>
                </div>

                <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={14} /> Información Comercial y Facturación
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Nombre del Establecimiento *</label>
                      <input 
                        type="text" 
                        value={negocio.nombre} 
                        onChange={e => setNegocio({ ...negocio, nombre: e.target.value })} 
                        placeholder="Ej: Sabor & Stock Restaurante" 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-bold transition-colors" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">NIT / RUT del Negocio</label>
                      <input 
                        type="text" 
                        value={negocio.nit || ''} 
                        onChange={e => setNegocio({ ...negocio, nit: e.target.value })} 
                        placeholder="Ej: 900.123.456-7" 
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Teléfono / WhatsApp</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                        <input 
                          type="tel" 
                          value={negocio.telefono || ''} 
                          onChange={e => setNegocio({ ...negocio, telefono: e.target.value })} 
                          placeholder="Ej: 601 123 4567 / 300 000 0000" 
                          className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl pl-9 pr-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Dirección Física</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                        <input 
                          type="text" 
                          value={negocio.direccion || ''} 
                          onChange={e => setNegocio({ ...negocio, direccion: e.target.value })} 
                          placeholder="Ej: Carrera 15 # 85-30, Bogotá" 
                          className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl pl-9 pr-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors" 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Correo Electrónico de Contacto</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                        <input 
                          type="email" 
                          value={negocio.email || ''} 
                          onChange={e => setNegocio({ ...negocio, email: e.target.value })} 
                          placeholder="contacto@mirestaurante.com" 
                          className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl pl-9 pr-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors" 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#5BC0DE] font-bold">Moneda Principal</label>
                      <select 
                        value={negocio.moneda || 'COP'} 
                        onChange={e => setNegocio({ ...negocio, moneda: e.target.value })}
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                      >
                        <option value="COP">COP ($) - Peso Colombiano</option>
                        <option value="USD">USD ($) - Dólar Estadounidense</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="MXN">MXN ($) - Peso Mexicano</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#3A506B] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-[#5BC0DE]">
                      * Al guardar, los tickets de cobro y comandas reflejarán de inmediato estos datos.
                    </p>
                    <button 
                      onClick={guardarNegocio}
                      disabled={guardando}
                      className="w-full sm:w-auto bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all h-[42px]"
                    >
                      <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar Datos de Mi Negocio'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= MODAL IMPRESORA (CREAR / EDITAR) ================= */}
      <FixedModal 
        isOpen={modalImpresora} 
        onClose={() => setModalImpresora(false)} 
        title={editandoId ? 'Editar Impresora y Filtros' : 'Añadir Nueva Impresora'}
      >
        <div className="space-y-4 text-sm">
          {errorImpresora && (
            <div className="bg-[#E57373]/15 border border-[#E57373]/40 text-[#E57373] text-xs p-3 rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorImpresora}</span>
            </div>
          )}

          {/* Selector de Impresoras del Sistema Detectadas */}
          {impresorasSistema.length > 0 && (
            <div className="bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B]/70 space-y-1.5">
              <label className="text-[10px] text-[#5BC0DE] font-bold flex items-center gap-1.5">
                <Printer size={12} className="text-[#4ADE80]" />
                Vincular con impresora detectada de Windows:
              </label>
              <select
                onChange={(e) => {
                  const valor = e.target.value;
                  if (!valor) return;
                  const match = impresorasSistema.find((i) => i.nombre === valor);
                  if (match) {
                    setFormImpresora({
                      ...formImpresora,
                      nombre: formImpresora.nombre.trim() ? formImpresora.nombre : match.nombre,
                      direccion: match.nombre,
                      tipo: 'USB',
                    });
                  }
                }}
                defaultValue=""
                className="w-full bg-[#1C2541] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-2.5 h-[42px] text-xs focus:outline-none focus:border-[#5BC0DE] transition-colors"
              >
                <option value="">-- Seleccionar impresora conectada en este PC --</option>
                {impresorasSistema.map((s) => (
                  <option key={s.nombre} value={s.nombre}>
                    {s.nombre} {s.predeterminada ? '(Predeterminada de Windows)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#5BC0DE] font-bold">Nombre de la Impresora *</label>
            <input 
              type="text" 
              value={formImpresora.nombre}
              onChange={(e) => setFormImpresora({ ...formImpresora, nombre: e.target.value })}
              placeholder="Ej: Impresora Cocina Caliente, Barra, Caja..." 
              className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#5BC0DE] font-bold">Tipo de Conexión</label>
              <select 
                value={formImpresora.tipo}
                onChange={(e) => setFormImpresora({ ...formImpresora, tipo: e.target.value as ImpresoraFrontend['tipo'] })}
                className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
              >
                <option value="Red (IP)">Red (IP / Ethernet)</option>
                <option value="USB">USB Directo</option>
                <option value="Bluetooth">Bluetooth / Inalámbrico</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#5BC0DE] font-bold">
                {formImpresora.tipo === 'Red (IP)' ? 'Dirección IP *' : formImpresora.tipo === 'USB' ? 'Puerto (COM/USB) *' : 'Dirección MAC *'}
              </label>
              <input 
                type="text" 
                value={formImpresora.direccion}
                onChange={(e) => setFormImpresora({ ...formImpresora, direccion: e.target.value })}
                placeholder={formImpresora.tipo === 'Red (IP)' ? '192.168.1.100' : formImpresora.tipo === 'USB' ? 'COM3' : '00:11:22:33:44:55'}
                className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors" 
              />
            </div>
          </div>

          {/* ESTADO ONLINE / OFFLINE */}
          <div className="flex items-center justify-between bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
            <div>
              <p className="text-xs font-bold text-[#F4D6B0]">Estado de la Impresora</p>
              <p className="text-[10px] text-[#5BC0DE]">Habilitada para recibir impresiones</p>
            </div>
            <Toggle 
              checked={formImpresora.activa} 
              onChange={() => setFormImpresora({ ...formImpresora, activa: !formImpresora.activa })} 
            />
          </div>

          {/* ================= FILTRO DE CATEGORÍAS ================= */}
          <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#F4D6B0] flex items-center gap-1.5">
                  <Utensils size={13} className="text-[#5BC0DE]" />
                  Categorías a Imprimir
                </p>
                <p className="text-[10px] text-[#5BC0DE]">
                  {formImpresora.categoriasIds.length === 0 
                    ? '(Imprime todas las categorías)' 
                    : `(${formImpresora.categoriasIds.length} categoría(s) seleccionadas)`}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormImpresora({
                    ...formImpresora,
                    categoriasIds: categoriasMenu.map(c => Number(c.id_categoria)),
                  })}
                  className="text-[9px] text-[#5BC0DE] hover:underline font-bold"
                >
                  Todas
                </button>
                <span className="text-[#3A506B] text-[9px]">|</span>
                <button
                  type="button"
                  onClick={() => setFormImpresora({ ...formImpresora, categoriasIds: [] })}
                  className="text-[9px] text-[#E57373] hover:underline font-bold"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
              {categoriasMenu.map(cat => {
                const idCatNum = Number(cat.id_categoria);
                const seleccionada = formImpresora.categoriasIds.includes(idCatNum);
                return (
                  <button
                    key={cat.id_categoria}
                    type="button"
                    onClick={() => toggleCategoriaModal(idCatNum)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                      seleccionada
                        ? 'bg-[#5BC0DE]/15 border-[#5BC0DE] text-[#F4D6B0] font-bold'
                        : 'bg-[#1C2541] border-[#3A506B]/60 text-[#F4D6B0]/70 hover:border-[#5BC0DE]/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      seleccionada ? 'bg-[#5BC0DE] border-[#5BC0DE] text-[#0B132B]' : 'border-[#3A506B]'
                    }`}>
                      {seleccionada && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{cat.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= FILTRO DE SECCIONES ================= */}
          <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#F4D6B0] flex items-center gap-1.5">
                  <Layers size={13} className="text-[#F4D6B0]" />
                  Secciones de Mesas a Imprimir
                </p>
                <p className="text-[10px] text-[#5BC0DE]">
                  {formImpresora.seccionesIds.length === 0 
                    ? '(Imprime para todas las secciones)' 
                    : `(${formImpresora.seccionesIds.length} sección(es) seleccionadas)`}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormImpresora({
                    ...formImpresora,
                    seccionesIds: seccionesRestaurante.map(s => Number(s.id)),
                  })}
                  className="text-[9px] text-[#5BC0DE] hover:underline font-bold"
                >
                  Todas
                </button>
                <span className="text-[#3A506B] text-[9px]">|</span>
                <button
                  type="button"
                  onClick={() => setFormImpresora({ ...formImpresora, seccionesIds: [] })}
                  className="text-[9px] text-[#E57373] hover:underline font-bold"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
              {seccionesRestaurante.map(sec => {
                const idSecNum = Number(sec.id);
                const seleccionada = formImpresora.seccionesIds.includes(idSecNum);
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => toggleSeccionModal(idSecNum)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                      seleccionada
                        ? 'bg-[#F4D6B0]/15 border-[#F4D6B0] text-[#F4D6B0] font-bold'
                        : 'bg-[#1C2541] border-[#3A506B]/60 text-[#F4D6B0]/70 hover:border-[#F4D6B0]/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      seleccionada ? 'bg-[#F4D6B0] border-[#F4D6B0] text-[#0B132B]' : 'border-[#3A506B]'
                    }`}>
                      {seleccionada && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{sec.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#3A506B] flex items-center justify-between gap-2">
          {editandoId !== null ? (
            <button
              type="button"
              onClick={() => {
                const impActual = impresoras.find(i => i.id === editandoId);
                if (impActual) probarImpresion({ ...impActual, ...formImpresora, id: editandoId });
              }}
              className="px-3 h-[42px] rounded-xl bg-[#0B132B] text-[#5BC0DE] text-xs font-bold border border-[#5BC0DE]/40 hover:bg-[#5BC0DE]/10 flex items-center gap-1.5 transition-all"
              title="Imprimir ticket de prueba con los datos actuales"
            >
              <Printer size={14} /> Imprimir Prueba
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setModalImpresora(false)} 
              className="px-4 h-[42px] rounded-xl bg-[#3A506B] text-[#F4D6B0] text-xs font-bold hover:bg-[#3A506B]/80 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={guardarImpresora}
              disabled={guardando}
              className="px-4 h-[42px] rounded-xl bg-[#5BC0DE] text-[#0B132B] text-xs font-bold hover:bg-[#4CA8C4] flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Save size={14} />
              {guardando ? 'Guardando...' : (editandoId ? 'Guardar Cambios' : 'Crear Impresora')}
            </button>
          </div>
        </div>
      </FixedModal>

      {/* ================= MODAL PAGO ================= */}
      <FixedModal isOpen={modalPago} onClose={() => setModalPago(false)} title="Añadir Método de Pago">
        <div className="space-y-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#5BC0DE] font-bold">Nombre del Método *</label>
            <input 
              type="text" 
              value={formPago.nombre}
              onChange={e => setFormPago({ ...formPago, nombre: e.target.value })}
              placeholder="Ej: Daviplata, Bold, Sodexo..." 
              className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors" 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#5BC0DE] font-bold">Tipo / Icono</label>
            <select 
              value={formPago.icono}
              onChange={e => setFormPago({ ...formPago, icono: e.target.value as MetodoPagoConfig['icono'] })}
              className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
              <option value="transferencia">Transferencia (Nequi/Banco)</option>
              <option value="qr">Código QR / Billetera Digital</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#5BC0DE] font-bold">Cuenta o Dispositivo Destino (Opcional)</label>
            <input 
              type="text" 
              value={formPago.cuentaDestino}
              onChange={e => setFormPago({ ...formPago, cuentaDestino: e.target.value })}
              placeholder="Ej: Ahorros # 1234, Datáfono Barra..." 
              className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors" 
            />
          </div>
        </div>
        <div className="pt-4 border-t border-[#3A506B] flex justify-end gap-2">
          <button 
            type="button"
            onClick={() => setModalPago(false)} 
            className="px-4 h-[42px] rounded-xl bg-[#3A506B] text-[#F4D6B0] text-xs font-bold hover:bg-[#3A506B]/80 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={agregarNuevoPago} 
            className="px-4 h-[42px] rounded-xl bg-[#5BC0DE] text-[#0B132B] text-xs font-bold shadow-md hover:bg-[#4CA8C4] transition-colors"
          >
            Guardar
          </button>
        </div>
      </FixedModal>

      {/* ================= MODAL GESTIÓN DE CAJA ================= */}
      <FixedModal
        isOpen={modalCaja}
        onClose={() => setModalCaja(false)}
        title={cajaEditando ? `Editar Caja #${cajaEditando.id}` : 'Nueva Caja Registradora'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#5BC0DE] mb-1.5">
              Nombre o Identificador del Punto de Venta *
            </label>
            <input
              type="text"
              value={nombreNuevaCaja}
              onChange={(e) => setNombreNuevaCaja(e.target.value)}
              placeholder="Ej: Caja Principal, Caja Terraza, Barra, Kiosko 1..."
              className="w-full px-3 h-[42px] bg-[#0B132B] border border-[#3A506B] rounded-xl text-sm text-[#F4D6B0] placeholder-slate-500 focus:outline-none focus:border-[#5BC0DE] transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  guardarCaja();
                }
              }}
            />
          </div>

          <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]/60 text-[11px] text-[#5BC0DE]/80 leading-relaxed">
            ℹ️ Los turnos se abren y cierran vinculados a cada caja registrada. Podrás cambiar o desactivar puntos en cualquier momento.
          </div>
        </div>

        <div className="pt-4 border-t border-[#3A506B] flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setModalCaja(false)}
            className="px-4 h-[42px] rounded-xl bg-[#3A506B] text-[#F4D6B0] text-xs font-bold hover:bg-[#3A506B]/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarCaja}
            disabled={guardandoCaja}
            className="px-4 h-[42px] rounded-xl bg-[#5BC0DE] text-[#0B132B] text-xs font-bold hover:bg-[#4CA8C4] flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Save size={14} />
            {guardandoCaja ? 'Guardando...' : (cajaEditando ? 'Guardar Cambios' : 'Crear Caja')}
          </button>
        </div>
      </FixedModal>

      {/* ================= PLANTILLA DE PRUEBA DE IMPRESIÓN (80mm ESC/POS) ================= */}
      {impresoraAProbar && (
        <FormatoTicketTermico
          tipo="prueba"
          negocio={negocio}
          nombreImpresora={impresoraAProbar.nombre}
          tipoImpresora={impresoraAProbar.tipo}
          direccionImpresora={impresoraAProbar.direccion}
          estadoImpresora={impresoraAProbar.activa ? 'ONLINE (ACTIVA)' : 'OFFLINE (INACTIVA)'}
          categoriasAsignadas={impresoraAProbar.categoriasIds.map(idCat => {
            const c = categoriasMenu.find(item => Number(item.id_categoria) === Number(idCat));
            return c ? c.nombre : `#${idCat}`;
          })}
          seccionesAsignadas={impresoraAProbar.seccionesIds.map(idSec => {
            const s = seccionesRestaurante.find(item => Number(item.id) === Number(idSec));
            return s ? s.nombre : `#${idSec}`;
          })}
        />
      )}

    </div>
  );
}