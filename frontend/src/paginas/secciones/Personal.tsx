import { useMemo, useState, ChangeEvent, FormEvent } from "react";
import { Mail, Phone, CalendarDays, ShieldCheck, UserMinus, UserCheck, Lock, X, Plus, UserPlus, Save } from 'lucide-react';

// --- DEFINICIONES DE TIPOS ---

export type RolUsuario = "Dueño" | "Administrador" | "Cocina" | "Mesero" | "Caja";

export interface Usuario {
    id: string;
    nombre: string;
    correo: string;
    cedula: string;
    telefono: string;
    rol: RolUsuario;
    fechaRegistro: string;
    activo: boolean;
    // Campos extra para la demo visual de "Datos Extensibles"
    salario?: number; 
    turno?: string;
}

const ROLES: RolUsuario[] = ["Dueño", "Administrador", "Cocina", "Mesero", "Caja"];

// Simulación del usuario que está logueado actualmente (ej: un Dueño)
const usuarioLogueadoActual = {
    rol: 'Dueño' as RolUsuario
};

// --- DATOS DE PRUEBA INICIALES (MOCK DATA) ---
const PERSONAL_INICIAL: Usuario[] = [
    { id: '1', nombre: 'Carlos Mendoza', correo: 'carlos@ejemplo.com', cedula: '111', telefono: '313-222-7879', rol: 'Dueño', fechaRegistro: '2023-01-15', activo: true, salario: 5000, turno: 'N/A' },
    { id: '2', nombre: 'Laura Gómez', correo: 'laura@ejemplo.com', cedula: '222', telefono: '913-225-2787', rol: 'Administrador', fechaRegistro: '2023-01-20', activo: true, salario: 4800, turno: 'Mañana' },
    { id: '3', nombre: 'Pedro Ramírez', correo: 'pedro@ejemplo.com', cedula: '333', telefono: '313-222-7879', rol: 'Cocina', fechaRegistro: '2023-03-10', activo: true, salario: 2500, turno: 'Tarde' },
    { id: '4', nombre: 'Ana Torres', correo: 'ana@ejemplo.com', cedula: '444', telefono: '913-225-2787', rol: 'Mesero', fechaRegistro: '2023-05-01', activo: true, salario: 1200, turno: 'Noche' },
    { id: '5', nombre: 'Julián Castro', correo: 'julian@ejemplo.com', cedula: '555', telefono: '313-222-7879', rol: 'Caja', fechaRegistro: '2023-06-15', activo: false, salario: 1500, turno: 'Mañana' },
];

// Estado inicial para un nuevo usuario en el formulario
const usuarioFormInicial: Omit<Usuario, 'id' | 'fechaRegistro'> = {
    nombre: '',
    correo: '',
    cedula: '',
    telefono: '',
    rol: 'Mesero',
    activo: true,
    salario: 0,
    turno: '',
};

// --- COMPONENTE PRINCIPAL ---

function Personal() {
    const [personal, setPersonal] = useState<Usuario[]>(PERSONAL_INICIAL);
    const [busqueda, setBusqueda] = useState("");
    const [filtroRol, setFiltroRol] = useState<RolUsuario | "Todos">("Todos");
    const [aviso, setAviso] = useState("");

    // Estado para el Modal de Agregar/Editar
    const [modalConfig, setModalConfig] = useState<{
        estado: 'cerrado' | 'creando' | 'editando';
        usuarioId?: string;
    }>({ estado: 'cerrado' });

    const [formUsuario, setFormUsuario] = useState(usuarioFormInicial);

    // --- LÓGICA DE FILTRADO Y CÁLCULOS (useMemo para rendimiento) ---

    const totalDuenosActivos = useMemo(() => {
        return personal.filter((p) => p.rol === "Dueño" && p.activo).length;
    }, [personal]);

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return personal.filter(
            (p) =>
                (p.nombre.toLowerCase().includes(texto) || p.correo.toLowerCase().includes(texto)) &&
                (filtroRol === "Todos" || p.rol === filtroRol)
        );
    }, [personal, busqueda, filtroRol]);

    // --- FUNCIONES DE ACCIÓN CON LÓGICA DE NEGOCIO ---

    // Regla: siempre debe quedar un Dueño activo
    const esUltimoDueno = (p: Usuario) =>
        p.rol === "Dueño" &&
        p.activo &&
        totalDuenosActivos === 1;

    function alternarActivo(id: string) {
        const persona = personal.find((p) => p.id === id);
        if (!persona) return;

        // Validar regla de negocio (desactivar Dueño)
        if (esUltimoDueno(persona) && persona.activo) {
            setAviso("No puedes desactivar al único Dueño activo.");
            return;
        }

        setAviso("");
        setPersonal((prev) => prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)));
    }

    // --- GESTIÓN DEL MODAL Y FORMULARIO ---

    const abrirModalCrear = () => {
        setFormUsuario(usuarioFormInicial);
        setModalConfig({ estado: 'creando' });
        setAviso("");
    };

    const abrirModalEditar = (usuario: Usuario) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, fechaRegistro, ...datosForm } = usuario;
        setFormUsuario(datosForm);
        setModalConfig({ estado: 'editando', usuarioId: usuario.id });
        setAviso("");
    };

    const cerrarModal = () => {
        setModalConfig({ estado: 'cerrado' });
    };

    const manejarCambioForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        setFormUsuario(prev => ({
            ...prev,
            [name]: type === 'checkbox' 
                ? (e.target as HTMLInputElement).checked 
                : type === 'number' 
                    ? parseFloat(value) || 0 
                    : value
        }));
    };

    const manejarEnvioForm = (e: FormEvent) => {
        e.preventDefault();
        setAviso("");

        // Validaciones básicas
        if (!formUsuario.nombre || !formUsuario.correo || !formUsuario.cedula || !formUsuario.telefono) {
            setAviso("Por favor, completa todos los campos obligatorios.");
            return;
        }

        if (modalConfig.estado === 'creando') {
            // Lógica para Crear
            const nuevoUsuario: Usuario = {
                ...formUsuario,
                id: Date.now().toString(), // Generación de ID simple
                fechaRegistro: new Date().toISOString().split('T')[0], // Fecha actual YYYY-MM-DD
            };
            setPersonal(prev => [...prev, nuevoUsuario]);
        } else if (modalConfig.estado === 'editando' && modalConfig.usuarioId) {
            // Lógica para Editar
            const usuarioExistente = personal.find(p => p.id === modalConfig.usuarioId);
            if (!usuarioExistente) return;

            // Validar regla de negocio si se intenta cambiar rol/activo del único dueño
            if (esUltimoDueno(usuarioExistente)) {
                if (formUsuario.rol !== 'Dueño') {
                    setAviso("Debe quedar al menos un Dueño activo. No puedes cambiar el rol.");
                    return;
                }
                if (!formUsuario.activo) {
                    setAviso("No puedes desactivar al único Dueño activo.");
                    return;
                }
            }

            setPersonal(prev => prev.map(p => 
                p.id === modalConfig.usuarioId 
                    ? { ...p, ...formUsuario } 
                    : p
            ));
        }

        cerrarModal();
    };

    // --- RENDERIZADO DE LA INTERFAZ ---

    return (
        // Contenedor principal del panel
        <div className="flex-1 bg-[#0b1c24] p-4 md:p-8 text-[#e0f2f1] font-sans relative min-h-screen">
            
            {/* CABECERA DEL PANEL */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1a3a4a] flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#132f3c] rounded-xl text-[#00bfa5]">
                        <ShieldCheck size={28} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-semibold">Gestión de Personal</h1>
                </div>
                <button 
                    onClick={abrirModalCrear}
                    className="flex items-center gap-2.5 bg-[#00bfa5] hover:bg-[#009688] text-[#0b1c24] px-6 py-3 rounded-xl font-bold transition-colors shadow-md text-sm md:text-base"
                >
                    <UserPlus size={22} />
                    Nuevo Empleado
                </button>
            </div>

            {/* BARRA DE FILTROS Y BÚSQUEDA */}
            <div className="bg-[#132f3c] p-5 rounded-2xl mb-8 flex items-center justify-between gap-6 shadow-lg border border-[#1a3a4a] flex-wrap md:flex-nowrap">
                
                {/* Filtros de Rol (Píldoras) */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 w-full md:w-auto">
                    {['Todos', ...ROLES].map(rol => (
                        <button
                            key={rol}
                            onClick={() => setFiltroRol(rol as RolUsuario | 'Todos')}
                            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all 
                                ${filtroRol === rol 
                                    ? 'bg-[#00bfa5] text-[#0b1c24] shadow-md' 
                                    : 'bg-[#1a3a4a] text-[#a0b0b9] hover:bg-[#254a5e] hover:text-[#e0f2f1]'
                                }`}
                        >
                            {rol}
                        </button>
                    ))}
                </div>

                {/* Barra de Búsqueda */}
                <div className="relative w-full max-w-sm">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a0b0b9]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full bg-[#1a3a4a] text-[#e0f2f1] pl-12 pr-4 py-3 rounded-xl border border-transparent focus:border-[#00bfa5] focus:ring-1 focus:ring-[#00bfa5] outline-none transition-all placeholder:text-[#6a808c] text-sm md:text-base"
                    />
                </div>
            </div>

            {/* AVISOS DE REGLA DE NEGOCIO (Fuera del modal) */}
            {aviso && modalConfig.estado === 'cerrado' && (
                <div className="bg-red-950 border border-red-700 text-red-300 p-4 rounded-xl mb-6 flex items-center gap-3" role="alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="font-medium">{aviso}</p>
                </div>
            )}

            {/* LISTA DE PERSONAL MODO TABLA (Centrado y Alineado perfectamente) */}
            <div className="bg-[#132f3c] rounded-2xl shadow-xl border border-[#1a3a4a] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="border-b border-[#1a3a4a]">
                        <tr>
                            <th className="p-5 text-sm font-medium text-[#a0b0b9]">Empleado</th>
                            <th className="p-5 text-sm font-medium text-[#a0b0b9]">Contacto</th>
                            <th className="p-5 text-sm font-medium text-[#a0b0b9]">Documentos</th>
                            <th className="p-5 text-sm font-medium text-[#a0b0b9]">Laboral</th>
                            <th className="p-5 text-sm font-medium text-[#a0b0b9]">Registro</th>
                            <th className="p-5 text-sm font-medium text-[#a0b0b9] text-center">Rol</th>
                            <th className="p-5 text-sm font-medium text-[#a0b0b9] text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a3a4a]/50">
                        {visibles.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-[#6a808c]">
                                    No se encontraron empleados que coincidan con los criterios.
                                </td>
                            </tr>
                        ) : (
                            visibles.map(persona => {
                                const esDueñoActual = usuarioLogueadoActual.rol === 'Dueño';
                                const esUsuarioDueño = persona.rol === 'Dueño';
                                const editable = esDueñoActual && !esUsuarioDueño; 

                                return (
                                    <tr 
                                        key={persona.id} 
                                        className="hover:bg-[#1a3a4a]/30 transition-colors cursor-pointer"
                                        onClick={(e) => {
                                            // Evitar abrir modal si se hace clic en botones de acción
                                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
                                            abrirModalEditar(persona);
                                        }}
                                    >
                                        {/* Columna Empleado (Avatar + Nombre) */}
                                        <td className="p-5 vertical-align-middle">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-[#1a3a4a] flex items-center justify-center text-2xl font-bold text-[#00bfa5] shadow-inner border border-[#254a5e] flex-shrink-0">
                                                    {persona.nombre.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <p className="text-lg font-semibold text-[#e0f2f1]">{persona.nombre}</p>
                                            </div>
                                        </td>

                                        {/* Columna Contacto (Correo + Teléfono) */}
                                        <td className="p-5 vertical-align-middle space-y-1.5 text-sm text-[#a0b0b9]">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-[#00bfa5] flex-shrink-0"/>
                                                <span className="truncate">{persona.correo}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-[#00bfa5] flex-shrink-0"/>
                                                <span>{persona.telefono}</span>
                                            </div>
                                        </td>

                                        {/* Columna Documentos (Cédula) */}
                                        <td className="p-5 vertical-align-middle text-sm text-[#a0b0b9]">
                                            <p><span className="font-medium text-[#c0d0d9]">Cédula:</span> {persona.cedula}</p>
                                        </td>

                                        {/* Columna Laboral (Turno + Salario) */}
                                        <td className="p-5 vertical-align-middle space-y-1.5 text-sm text-[#a0b0b9]">
                                            <p><span className="font-medium text-[#c0d0d9]">Turno:</span> {persona.turno || 'N/A'}</p>
                                            <p><span className="font-medium text-[#c0d0d9]">Salario:</span> ${persona.salario?.toLocaleString('es-CO') || '0'}</p>
                                        </td>

                                        {/* Columna Registro (Fecha) */}
                                        <td className="p-5 vertical-align-middle text-sm text-[#a0b0b9]">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays size={16} className="text-[#00bfa5] flex-shrink-0"/>
                                                <span>{persona.fechaRegistro}</span>
                                            </div>
                                        </td>

                                        {/* Columna Rol (Etiqueta Centrada) */}
                                        <td className="p-5 vertical-align-middle text-center">
                                            <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap 
                                                ${esUsuarioDueño 
                                                    ? 'border-2 border-dashed border-[#eab308] text-[#eab308] bg-[#eab308]/10' 
                                                    : 'bg-[#1a3a4a] text-[#a0b0b9]'}`}
                                            >
                                                {persona.rol}
                                            </div>
                                        </td>

                                        {/* Columna Acciones (Centrada) */}
                                        <td className="p-5 vertical-align-middle text-center">
                                            <div className="flex items-center gap-2.5 justify-center">
                                                {!editable && esUsuarioDueño && (
                                                    <div className="flex items-center gap-2 bg-[#0b1c24] text-[#6a808c] px-3 py-2 rounded-lg text-xs border border-[#1a3a4a]" title="Rol protegido">
                                                        <Lock size={16} />
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={() => alternarActivo(persona.id)}
                                                    className={`p-2.5 rounded-lg transition-colors flex-shrink-0
                                                        ${persona.activo 
                                                            ? 'bg-[#1a3a4a] text-[#00bfa5] hover:bg-[#254a5e]' 
                                                            : 'bg-red-950/50 text-red-400 hover:bg-red-950' 
                                                        }`}
                                                    title={persona.activo ? "Desactivar empleado" : "Activar empleado"}
                                                >
                                                    {persona.activo ? <UserCheck size={18} /> : <UserMinus size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL DE AGREGAR / EDITAR EMPLEADO --- */}
            {modalConfig.estado !== 'cerrado' && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <form 
                        onSubmit={manejarEnvioForm}
                        className="bg-[#132f3c] p-6 md:p-8 rounded-2xl shadow-2xl border border-[#1a3a4a] w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6"
                    >
                        {/* Cabecera Modal */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#1a3a4a]">
                            <h2 className="text-2xl font-semibold flex items-center gap-3">
                                {modalConfig.estado === 'creando' ? <UserPlus className="text-[#00bfa5]"/> : <ShieldCheck className="text-[#eab308]"/>}
                                {modalConfig.estado === 'creando' ? 'Nuevo Empleado' : 'Editar Empleado'}
                            </h2>
                            <button type="button" onClick={cerrarModal} className="text-[#a0b0b9] hover:text-[#e0f2f1] transition-colors p-1">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Avisos dentro del Modal */}
                        {aviso && (
                            <div className="bg-red-950 border border-red-700 text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                {aviso}
                            </div>
                        )}

                        {/* Cuerpo del Formulario - Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {/* Nombre */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#a0b0b9] mb-1.5">Nombre Completo *</label>
                                <input type="text" name="nombre" value={formUsuario.nombre} onChange={manejarCambioForm} required className="w-full bg-[#0b1c24] border border-[#1a3a4a] rounded-lg p-3 text-sm focus:border-[#00bfa5] outline-none transition" placeholder="Ej: Juan Pérez" />
                            </div>

                            {/* Correo */}
                            <div>
                                <label className="block text-sm font-medium text-[#a0b0b9] mb-1.5">Correo Electrónico *</label>
                                <input type="email" name="correo" value={formUsuario.correo} onChange={manejarCambioForm} required className="w-full bg-[#0b1c24] border border-[#1a3a4a] rounded-lg p-3 text-sm focus:border-[#00bfa5] outline-none transition" placeholder="juan@ejemplo.com" />
                            </div>

                            {/* Teléfono */}
                            <div>
                                <label className="block text-sm font-medium text-[#a0b0b9] mb-1.5">Teléfono *</label>
                                <input type="tel" name="telefono" value={formUsuario.telefono} onChange={manejarCambioForm} required className="w-full bg-[#0b1c24] border border-[#1a3a4a] rounded-lg p-3 text-sm focus:border-[#00bfa5] outline-none transition" placeholder="300 123 4567" />
                            </div>

                            {/* Cédula */}
                            <div>
                                <label className="block text-sm font-medium text-[#a0b0b9] mb-1.5">Cédula / Documento *</label>
                                <input type="text" name="cedula" value={formUsuario.cedula} onChange={manejarCambioForm} required className="w-full bg-[#0b1c24] border border-[#1a3a4a] rounded-lg p-3 text-sm focus:border-[#00bfa5] outline-none transition" placeholder="12345678" />
                            </div>

                            {/* Rol */}
                            <div>
                                <label className="block text-sm font-medium text-[#a0b0b9] mb-1.5">Rol / Posición *</label>
                                <select name="rol" value={formUsuario.rol} onChange={manejarCambioForm} required className="w-full bg-[#0b1c24] border border-[#1a3a4a] rounded-lg p-3 text-sm focus:border-[#00bfa5] outline-none transition appearance-none cursor-pointer text-[#e0f2f1]">
                                    {ROLES.map(r => (
                                        <option key={r} value={r} className="bg-[#0b1c24]">{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Salario */}
                            <div>
                                <label className="block text-sm font-medium text-[#a0b0b9] mb-1.5">Salario Base (COP)</label>
                                <input type="number" name="salario" value={formUsuario.salario} onChange={manejarCambioForm} min="0" step="1000" className="w-full bg-[#0b1c24] border border-[#1a3a4a] rounded-lg p-3 text-sm focus:border-[#00bfa5] outline-none transition" placeholder="0" />
                            </div>

                            {/* Turno */}
                            <div>
                                <label className="block text-sm font-medium text-[#a0b0b9] mb-1.5">Turno Laboral</label>
                                <input type="text" name="turno" value={formUsuario.turno} onChange={manejarCambioForm} className="w-full bg-[#0b1c24] border border-[#1a3a4a] rounded-lg p-3 text-sm focus:border-[#00bfa5] outline-none transition" placeholder="Ej: Mañana (6am-2pm)" />
                            </div>

                            {/* Estado Activo */}
                            <div className="md:col-span-2 flex items-center gap-3 pt-2">
                                <input type="checkbox" name="activo" id="activo" checked={formUsuario.activo} onChange={(e) => setFormUsuario(prev => ({...prev, activo: e.target.checked}))} className="w-5 h-5 accent-[#00bfa5] cursor-pointer" />
                                <label htmlFor="activo" className="text-sm font-medium text-[#e0f2f1] cursor-pointer">Cuenta de empleado activa</label>
                            </div>
                        </div>

                        {/* Pie del Modal - Botones de Acción */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#1a3a4a]">
                            <button type="button" onClick={cerrarModal} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#a0b0b9] bg-[#1a3a4a] hover:bg-[#254a5e] hover:text-[#e0f2f1] transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#00bfa5] hover:bg-[#009688] text-[#0b1c24] transition-colors shadow-md">
                                {modalConfig.estado === 'creando' ? <Plus size={18}/> : <Save size={18}/>}
                                {modalConfig.estado === 'creando' ? 'Crear Empleado' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Personal;