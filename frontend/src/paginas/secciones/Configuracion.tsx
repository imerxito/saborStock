import React, { useState } from 'react';
import { 
  Settings, Printer, FileText, CreditCard, Building2, 
  Plus, Edit, Save, X, UploadCloud, ShieldCheck, 
  QrCode, DollarSign, Wallet, ChefHat, Beer, 
  Phone, Mail, MapPin, Key, Upload, CheckCircle, RefreshCw, Trash2
} from 'lucide-react';

type TabConfig = 'impresoras' | 'facturacion' | 'pagos' | 'negocio';

interface Impresora {
  id: string;
  nombre: string;
  tipo: 'USB' | 'Red (IP)' | 'Bluetooth';
  direccion: string;
  activa: boolean;
}

interface RutaImpresion {
  categoria: string;
  idImpresora: string;
}

interface MetodoPagoConfig {
  id: string;
  nombre: string;
  icono: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
  activo: boolean;
  requiereReferencia: boolean;
  cuentaDestino?: string;
}

const IMPRESORAS_MOCK: Impresora[] = [
  { id: 'imp-1', nombre: 'Impresora Cocina Principal', tipo: 'Red (IP)', direccion: '192.168.1.50', activa: true },
  { id: 'imp-2', nombre: 'Impresora Barra / Bebidas', tipo: 'USB', direccion: 'COM3', activa: true },
  { id: 'imp-3', nombre: 'Impresora Caja / Recibos', tipo: 'USB', direccion: 'COM4', activa: true },
];

const RUTAS_MOCK: RutaImpresion[] = [
  { categoria: 'Platos Fuertes', idImpresora: 'imp-1' },
  { categoria: 'Comidas Rápidas', idImpresora: 'imp-1' },
  { categoria: 'Entradas', idImpresora: 'imp-1' },
  { categoria: 'Bebidas', idImpresora: 'imp-2' },
  { categoria: 'Licores', idImpresora: 'imp-2' },
];

const PAGOS_MOCK: MetodoPagoConfig[] = [
  { id: 'p-1', nombre: 'Efectivo', icono: 'efectivo', activo: true, requiereReferencia: false },
  { id: 'p-2', nombre: 'Tarjeta Débito/Crédito', icono: 'tarjeta', activo: true, requiereReferencia: true, cuentaDestino: 'Datáfono Bold' },
  { id: 'p-3', nombre: 'Transferencia Nequi', icono: 'transferencia', activo: true, requiereReferencia: true, cuentaDestino: '300 123 4567' },
  { id: 'p-4', nombre: 'Transferencia Bancolombia', icono: 'transferencia', activo: false, requiereReferencia: true, cuentaDestino: 'Ahorros 123-456789' },
];

const FORM_IMPRESORA_VACIO: Omit<Impresora, 'id'> = {
  nombre: '',
  tipo: 'Red (IP)',
  direccion: '',
  activa: true,
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
  
  // Estados de datos
  const [impresoras, setImpresoras] = useState<Impresora[]>(IMPRESORAS_MOCK);
  const [rutas, setRutas] = useState<RutaImpresion[]>(RUTAS_MOCK);
  const [pagos, setPagos] = useState<MetodoPagoConfig[]>(PAGOS_MOCK);
  const [autoPrint, setAutoPrint] = useState(true);

  // Modal Impresora (Crear / Editar)
  const [modalImpresora, setModalImpresora] = useState<boolean>(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formImpresora, setFormImpresora] = useState<Omit<Impresora, 'id'>>(FORM_IMPRESORA_VACIO);
  const [errorImpresora, setErrorImpresora] = useState('');

  // Modal Pago
  const [modalPago, setModalPago] = useState<boolean>(false);

  // Estados Facturación
  const [facturacion, setFacturacion] = useState({
    habilitada: true,
    entorno: 'pruebas' as 'pruebas' | 'produccion',
    resolucion: '18760000001', 
    prefijo: 'FAC', 
    rangoInicial: '1', 
    rangoFinal: '5000',
    fechaInicio: '2024-01-01',
    fechaFin: '2026-12-31',
    claveTecnica: 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c', 
    softwareId: 'SW-12345',
    apiKey: 'sk_live_51Hxxxx...',
    certificadoCargado: true,
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [negocio, setNegocio] = useState({
    nombre: 'Sabor & Stock Restaurante', nit: '900.123.456-7', direccion: 'Calle 100 # 15-20, Bogotá',
    telefono: '601 123 4567', email: 'contacto@saborystock.com', moneda: 'COP'
  });

  const TABS = [
    { id: 'impresoras', label: 'Impresoras', icon: Printer },
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

  // --- LÓGICA DE IMPRESORAS ---
  const abrirModalCrear = () => {
    setFormImpresora(FORM_IMPRESORA_VACIO);
    setEditandoId(null);
    setErrorImpresora('');
    setModalImpresora(true);
  };

  const abrirModalEditar = (imp: Impresora) => {
    const { id, ...datos } = imp;
    setFormImpresora(datos);
    setEditandoId(id);
    setErrorImpresora('');
    setModalImpresora(true);
  };

  const guardarImpresora = () => {
    if (!formImpresora.nombre.trim()) return setErrorImpresora('El nombre es obligatorio.');
    if (!formImpresora.direccion.trim()) return setErrorImpresora('La dirección/IP es obligatoria.');
    if (impresoras.some(i => i.nombre.toLowerCase() === formImpresora.nombre.toLowerCase() && i.id !== editandoId)) {
      return setErrorImpresora('Ya existe una impresora con ese nombre.');
    }

    if (editandoId) {
      setImpresoras(prev => prev.map(i => i.id === editandoId ? { ...i, ...formImpresora } : i));
    } else {
      const nueva: Impresora = { ...formImpresora, id: `imp-${Date.now()}` };
      setImpresoras(prev => [...prev, nueva]);
    }
    setModalImpresora(false);
  };

  const eliminarImpresora = (id: string) => {
    if (window.confirm('¿Eliminar esta impresora? Las rutas asociadas quedarán sin asignar.')) {
      setImpresoras(prev => prev.filter(i => i.id !== id));
      setRutas(prev => prev.map(r => r.idImpresora === id ? { ...r, idImpresora: '' } : r));
    }
  };

  const toggleActiva = (id: string) => {
    setImpresoras(prev => prev.map(i => i.id === id ? { ...i, activa: !i.activa } : i));
  };

  const probarConexion = () => {
    setTestStatus('loading');
    setTimeout(() => {
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#0B132B] text-[#F4D6B0] font-sans overflow-hidden selection:bg-[#5BC0DE]/40">
      
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
                <p className="hidden sm:block text-[11px] text-[#5BC0DE] uppercase tracking-wider font-semibold">Ajustes del Sistema</p>
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
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-5xl mx-auto p-3 sm:p-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        
        {/* ================= TAB 1: IMPRESORAS ================= */}
        {activeTab === 'impresoras' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Toggle Impresión Automática */}
            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F4D6B0]">Impresión Automática</h3>
                <p className="text-[11px] text-[#5BC0DE] mt-0.5">Enviar comandas a cocina inmediatamente al cobrar</p>
              </div>
              <Toggle checked={autoPrint} onChange={() => setAutoPrint(!autoPrint)} />
            </div>

            {/* Lista de Impresoras */}
            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl overflow-hidden">
              <div className="p-3.5 border-b border-[#3A506B] flex justify-between items-center bg-[#0B132B]/50">
                <div>
                  <h3 className="text-xs font-bold text-[#F4D6B0] uppercase tracking-wider">Dispositivos ({impresoras.length})</h3>
                  <p className="text-[10px] text-[#5BC0DE] mt-0.5">Configura tus impresoras térmicas ESC/POS</p>
                </div>
                <button onClick={abrirModalCrear} className="text-[10px] bg-[#5BC0DE] text-[#0B132B] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-[#4CA8C4] transition-colors">
                  <Plus size={12} /> Añadir
                </button>
              </div>
              <div className="divide-y divide-[#3A506B]/50">
                {impresoras.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#5BC0DE]/60">
                    No hay impresoras configuradas. Presiona "Añadir" para crear la primera.
                  </div>
                ) : (
                  impresoras.map(imp => (
                    <div key={imp.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#0B132B] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE] shrink-0">
                          <Printer size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#F4D6B0] truncate">{imp.nombre}</p>
                          <p className="text-[10px] text-[#5BC0DE]">{imp.tipo} • {imp.direccion}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${imp.activa ? 'bg-[#4ADE80]/15 text-[#4ADE80]' : 'bg-[#E57373]/15 text-[#E57373]'}`}>
                          {imp.activa ? 'Online' : 'Offline'}
                        </span>
                        <button 
                          onClick={() => abrirModalEditar(imp)} 
                          className="p-1.5 text-[#5BC0DE] hover:bg-[#5BC0DE]/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => eliminarImpresora(imp.id)} 
                          className="p-1.5 text-[#E57373] hover:bg-[#E57373]/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rutas por Categoría */}
            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl overflow-hidden">
              <div className="p-3.5 border-b border-[#3A506B] bg-[#0B132B]/50">
                <h3 className="text-xs font-bold text-[#F4D6B0] uppercase tracking-wider">Rutas de Impresión por Categoría</h3>
                <p className="text-[10px] text-[#5BC0DE] mt-0.5">Asigna a qué impresora va cada tipo de plato o bebida.</p>
              </div>
              <div className="p-3.5 space-y-3">
                {['Platos Fuertes', 'Bebidas', 'Licores', 'Postres'].map(cat => {
                  const ruta = rutas.find(r => r.categoria === cat);
                  return (
                    <div key={cat} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3A506B]/30 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        {cat === 'Platos Fuertes' ? <ChefHat size={14} className="text-[#5BC0DE]" /> : <Beer size={14} className="text-[#5BC0DE]" />}
                        <span className="text-xs font-medium text-[#F4D6B0]">{cat}</span>
                      </div>
                      <select 
                        value={ruta?.idImpresora || ''}
                        onChange={(e) => {
                          const nuevoId = e.target.value;
                          setRutas(prev => {
                            const existe = prev.find(r => r.categoria === cat);
                            if (existe) return prev.map(r => r.categoria === cat ? { ...r, idImpresora: nuevoId } : r);
                            return [...prev, { categoria: cat, idImpresora: nuevoId }];
                          });
                        }}
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-2 py-1.5 text-base sm:text-xs focus:outline-none focus:border-[#5BC0DE] w-full sm:w-64"
                      >
                        <option value="">(No imprimir)</option>
                        {impresoras.filter(i => i.activa).map(i => (
                          <option key={i.id} value={i.id}>{i.nombre}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nota Aclaratoria */}
            <div className="bg-[#D97706]/10 border border-[#D97706]/30 rounded-xl p-3 flex gap-2 items-start">
              <span className="text-[#D97706] shrink-0 mt-0.5">ℹ️</span>
              <div>
                <p className="text-[11px] font-bold text-[#D97706]">¿Cómo funciona la impresión?</p>
                <p className="text-[10px] text-[#D97706]/80 mt-0.5">
                  Para comandas automáticas sin diálogo, instala un agente local (QZ Tray o PrintNode) en el equipo de caja. Los recibos usan impresión directa del navegador.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: FACTURACIÓN ================= */}
        {activeTab === 'facturacion' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center text-[#4ADE80]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F4D6B0]">Facturación Electrónica DIAN</h3>
                  <p className="text-[11px] text-[#5BC0DE] mt-0.5">Habilitar generación y envío automático</p>
                </div>
              </div>
              <Toggle checked={facturacion.habilitada} onChange={() => setFacturacion({...facturacion, habilitada: !facturacion.habilitada})} />
            </div>

            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">Entorno</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFacturacion({...facturacion, entorno: 'pruebas'})}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${facturacion.entorno === 'pruebas' ? 'bg-[#D97706]/15 border-[#D97706] text-[#D97706]' : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE] hover:border-[#5BC0DE]'}`}
                >
                  <RefreshCw size={18} />
                  <span className="text-xs font-bold">Habilitación</span>
                  <span className="text-[9px]">Pruebas DIAN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFacturacion({...facturacion, entorno: 'produccion'})}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${facturacion.entorno === 'produccion' ? 'bg-[#4ADE80]/15 border-[#4ADE80] text-[#4ADE80]' : 'bg-[#0B132B] border-[#3A506B] text-[#5BC0DE] hover:border-[#5BC0DE]'}`}
                >
                  <CheckCircle size={18} />
                  <span className="text-xs font-bold">Producción</span>
                  <span className="text-[9px]">Facturas Reales</span>
                </button>
              </div>
            </div>

            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">Resolución y Rangos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Número de Resolución</label>
                  <input type="text" value={facturacion.resolucion} onChange={e => setFacturacion({...facturacion, resolucion: e.target.value})} className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Prefijo</label>
                  <input type="text" value={facturacion.prefijo} onChange={e => setFacturacion({...facturacion, prefijo: e.target.value})} className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Rango Inicial</label>
                  <input type="number" value={facturacion.rangoInicial} onChange={e => setFacturacion({...facturacion, rangoInicial: e.target.value})} className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Rango Final</label>
                  <input type="number" value={facturacion.rangoFinal} onChange={e => setFacturacion({...facturacion, rangoFinal: e.target.value})} className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
                </div>
              </div>
            </div>

            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">Credenciales Proveedor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Software ID</label>
                  <input type="text" value={facturacion.softwareId} onChange={e => setFacturacion({...facturacion, softwareId: e.target.value})} className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">PIN / Clave Técnica</label>
                  <div className="relative">
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                    <input type="password" value={facturacion.claveTecnica} onChange={e => setFacturacion({...facturacion, claveTecnica: e.target.value})} className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg pl-9 pr-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">API Key</label>
                  <input type="password" value={facturacion.apiKey} onChange={e => setFacturacion({...facturacion, apiKey: e.target.value})} className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#3A506B]/50">
                <span className="text-[10px] text-[#5BC0DE]">Verifica la conexión con la DIAN</span>
                <button 
                  onClick={probarConexion}
                  disabled={testStatus === 'loading' || testStatus === 'success'}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
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

            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">Certificado Digital</h3>
              <div className="bg-[#0B132B] border border-[#3A506B] border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                <Upload size={24} className="text-[#5BC0DE]" />
                <div>
                  <p className="text-xs font-bold text-[#F4D6B0]">{facturacion.certificadoCargado ? 'certificado_2024.p12' : 'Subir Certificado'}</p>
                  <p className="text-[10px] text-[#5BC0DE] mt-0.5">{facturacion.certificadoCargado ? 'Vence el: 31/12/2024' : 'Archivo .p12 o .pfx'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#5BC0DE] font-semibold">Contraseña del Certificado</label>
                <input type="password" placeholder="••••••••" className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
              </div>
            </div>

            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 flex justify-end">
              <button className="w-full sm:w-auto bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg">
                <Save size={16} /> Guardar Configuración
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MÉTODOS DE PAGO ================= */}
        {activeTab === 'pagos' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-[#F4D6B0]">Métodos de Pago</h3>
                <p className="text-[11px] text-[#5BC0DE]">Configura cómo recibes el dinero.</p>
              </div>
              <button onClick={() => setModalPago(true)} className="text-[10px] bg-[#5BC0DE] text-[#0B132B] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-[#4CA8C4]">
                <Plus size={12} /> Añadir
              </button>
            </div>

            <div className="space-y-2">
              {pagos.map((pago) => (
                <div key={pago.id} className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#0B132B] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE] shrink-0">
                      {getIconoPago(pago.icono)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#F4D6B0]">{pago.nombre}</p>
                      {pago.cuentaDestino && <p className="text-[10px] text-[#5BC0DE] mt-0.5 truncate">Destino: {pago.cuentaDestino}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 border-t sm:border-t-0 border-[#3A506B]/50 pt-2 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#5BC0DE] font-medium hidden sm:inline">Requiere Ref.</span>
                      <Toggle checked={pago.requiereReferencia} onChange={() => {}} />
                    </div>
                    <div className="h-6 w-px bg-[#3A506B] hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#5BC0DE] font-medium">Activo</span>
                      <Toggle checked={pago.activo} onChange={() => {
                        setPagos(prev => prev.map(p => p.id === pago.id ? { ...p, activo: !p.activo } : p));
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: NEGOCIO ================= */}
        {activeTab === 'negocio' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 border-dashed border-2">
              <div className="w-16 h-16 rounded-full bg-[#0B132B] border border-[#3A506B] flex items-center justify-center text-[#5BC0DE]">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F4D6B0]">Logotipo del Restaurante</p>
                <p className="text-[10px] text-[#5BC0DE]">PNG o JPG. Máx 2MB.</p>
              </div>
              <button className="mt-1 text-[10px] bg-[#0B132B] text-[#5BC0DE] border border-[#3A506B] px-3 py-1.5 rounded-lg font-bold hover:bg-[#3A506B]/50">
                Subir Imagen
              </button>
            </div>

            <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">Información de la Empresa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Nombre del Establecimiento</label>
                  <input type="text" value={negocio.nombre} onChange={e => setNegocio({...negocio, nombre: e.target.value})} className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">NIT / RUT</label>
                  <input type="text" value={negocio.nit} onChange={e => setNegocio({...negocio, nit: e.target.value})} className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Teléfono</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                    <input type="tel" value={negocio.telefono} onChange={e => setNegocio({...negocio, telefono: e.target.value})} className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg pl-9 pr-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Dirección</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                    <input type="text" value={negocio.direccion} onChange={e => setNegocio({...negocio, direccion: e.target.value})} className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg pl-9 pr-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] text-[#5BC0DE] font-semibold">Correo</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                    <input type="email" value={negocio.email} onChange={e => setNegocio({...negocio, email: e.target.value})} className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg pl-9 pr-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" />
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-[#3A506B] flex justify-end">
                <button className="w-full sm:w-auto bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5">
                  <Save size={14} /> Guardar Datos
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL IMPRESORA (CREAR / EDITAR) ================= */}
      <FixedModal 
        isOpen={modalImpresora} 
        onClose={() => setModalImpresora(false)} 
        title={editandoId ? 'Editar Impresora' : 'Añadir Impresora'}
      >
        <div className="space-y-3 text-sm">
          {errorImpresora && (
            <div className="bg-[#E57373]/15 border border-[#E57373]/40 text-[#E57373] text-xs p-3 rounded-xl font-medium">
              {errorImpresora}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#5BC0DE] font-semibold">Nombre de la Impresora *</label>
            <input 
              type="text" 
              value={formImpresora.nombre}
              onChange={(e) => setFormImpresora({ ...formImpresora, nombre: e.target.value })}
              placeholder="Ej: Impresora Cocina 2" 
              className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#5BC0DE] font-semibold">Tipo de Conexión</label>
              <select 
                value={formImpresora.tipo}
                onChange={(e) => setFormImpresora({ ...formImpresora, tipo: e.target.value as Impresora['tipo'] })}
                className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
              >
                <option value="Red (IP)">Red (IP)</option>
                <option value="USB">USB</option>
                <option value="Bluetooth">Bluetooth</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#5BC0DE] font-semibold">
                {formImpresora.tipo === 'Red (IP)' ? 'Dirección IP *' : formImpresora.tipo === 'USB' ? 'Puerto (COM) *' : 'MAC *'}
              </label>
              <input 
                type="text" 
                value={formImpresora.direccion}
                onChange={(e) => setFormImpresora({ ...formImpresora, direccion: e.target.value })}
                placeholder={formImpresora.tipo === 'Red (IP)' ? '192.168.1.X' : formImpresora.tipo === 'USB' ? 'COM3' : '00:11:22:33:44:55'}
                className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
            <div>
              <p className="text-xs font-bold text-[#F4D6B0]">Estado de la Impresora</p>
              <p className="text-[10px] text-[#5BC0DE]">Marcar como activa (Online)</p>
            </div>
            <Toggle 
              checked={formImpresora.activa} 
              onChange={() => setFormImpresora({ ...formImpresora, activa: !formImpresora.activa })} 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#3A506B] flex justify-end gap-2">
          <button 
            onClick={() => setModalImpresora(false)} 
            className="px-4 py-2 rounded-xl bg-[#0B132B] text-[#5BC0DE] text-xs font-medium border border-[#3A506B] hover:bg-[#3A506B]/30"
          >
            Cancelar
          </button>
          <button 
            onClick={guardarImpresora}
            className="px-4 py-2 rounded-xl bg-[#5BC0DE] text-[#0B132B] text-xs font-bold hover:bg-[#4CA8C4] flex items-center gap-1.5"
          >
            <Save size={14} />
            {editandoId ? 'Guardar Cambios' : 'Crear Impresora'}
          </button>
        </div>
      </FixedModal>

      {/* ================= MODAL PAGO ================= */}
      <FixedModal isOpen={modalPago} onClose={() => setModalPago(false)} title="Añadir Método de Pago">
        <div className="space-y-3 text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#5BC0DE] font-semibold">Nombre del Método</label>
            <input type="text" placeholder="Ej: Daviplata" className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#5BC0DE] font-semibold">Tipo de Pago</label>
            <select className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]">
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia / QR</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#5BC0DE] font-semibold">Cuenta Destino (Opcional)</label>
            <input type="text" placeholder="Número de cuenta o teléfono" className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" />
          </div>
        </div>
        <div className="pt-4 border-t border-[#3A506B] flex justify-end gap-2">
          <button onClick={() => setModalPago(false)} className="px-4 py-2 rounded-xl bg-[#0B132B] text-[#5BC0DE] text-xs font-medium border border-[#3A506B]">Cancelar</button>
          <button onClick={() => setModalPago(false)} className="px-4 py-2 rounded-xl bg-[#5BC0DE] text-[#0B132B] text-xs font-bold">Guardar</button>
        </div>
      </FixedModal>

    </div>
  );
}