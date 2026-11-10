import { useMemo, useState, ChangeEvent, FormEvent } from "react";
import { Mail, Phone, CalendarDays, ShieldCheck, UserMinus, UserCheck, Lock, X, Plus, UserPlus, Save, Eye, EyeOff } from 'lucide-react'; // NUEVOS ICONOS: Eye, EyeOff

// --- DEFINICIONES DE TIPOS ---

export type RolUsuario = "Dueño" | "Administrador" | "Cocina" | "Mesero" | "Caja";

export interface Usuario {
    id: string;
    nombre: string;
    correo: string;
    cedula: string;
    telefono: string;
    contrasena: string;
    rol: RolUsuario;
    fechaRegistro: string;
    activo: boolean;
}

const ROLES: RolUsuario[] = ["Dueño", "Administrador", "Cocina", "Mesero", "Caja"];

// Simulación del usuario que está logueado actualmente (ej: un Dueño)
const usuarioLogueadoActual = {
    rol: 'Dueño' as RolUsuario
};

// --- DATOS DE PRUEBA INICIALES (MOCK DATA) ---
const PERSONAL_INICIAL: Usuario[] = [
    { id: '1', nombre: 'Carlos Mendoza', correo: 'carlos@ejemplo.com', cedula: '111', telefono: '313-222-7879', contrasena: 'admin123', rol: 'Dueño', fechaRegistro: '2023-01-15', activo: true },
    { id: '2', nombre: 'Laura Gómez', correo: 'laura@ejemplo.com', cedula: '222', telefono: '913-225-2787', contrasena: 'laura2023', rol: 'Administrador', fechaRegistro: '2023-01-20', activo: true },
    { id: '3', nombre: 'Pedro Ramírez', correo: 'pedro@ejemplo.com', cedula: '333', telefono: '313-222-7879', contrasena: 'chef123', rol: 'Cocina', fechaRegistro: '2023-03-10', activo: true },
    { id: '4', nombre: 'Ana Torres', correo: 'ana@ejemplo.com', cedula: '444', telefono: '913-225-2787', contrasena: 'mesera123', rol: 'Mesero', fechaRegistro: '2023-05-01', activo: true },
    { id: '5', nombre: 'Julián Castro', correo: 'julian@ejemplo.com', cedula: '555', telefono: '313-222-7879', contrasena: 'caja123', rol: 'Caja', fechaRegistro: '2023-06-15', activo: false },
];

// Estado inicial para un nuevo usuario en el formulario
const usuarioFormInicial: Omit<Usuario, 'id' | 'fechaRegistro'> = {
    nombre: '',
    correo: '',
    cedula: '',
    telefono: '',
    contrasena: '',
    rol: 'Mesero',
    activo: true,
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

    // NUEVO ESTADO: Para mostrar u ocultar la contraseña
    const [mostrarContrasena, setMostrarContrasena] = useState(false);

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

    const esUltimoDueno = (p: Usuario) =>
        p.rol === "Dueño" &&
        p.activo &&
        totalDuenosActivos === 1;

    function alternarActivo(id: string) {
        const persona = personal.find((p) => p.id === id);
        if (!persona) return;

        if (esUltimoDueno(persona) && persona.activo) {
            setAviso("No puedes desactivar al único Dueño activo.");
            return;
        }

        setAviso("");
        setPersonal((prev) => prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)));
    }

    function cambiarRolDirecto(id: string, nuevoRol: RolUsuario) {
        const persona = personal.find((p) => p.id === id);
        if (!persona) return;

        if (esUltimoDueno(persona) && nuevoRol !== 'Dueño') {
            setAviso("Debe quedar al menos un Dueño activo. No puedes cambiar el rol.");
            return;
        }

        setAviso("");
        setPersonal((prev) => prev.map((p) => (p.id === id ? { ...p, rol: nuevoRol } : p)));
    }

    // --- GESTIÓN DEL MODAL Y FORMULARIO ---

    const abrirModalCrear = () => {
        setFormUsuario(usuarioFormInicial);
        setModalConfig({ estado: 'creando' });
        setAviso("");
        setMostrarContrasena(false); // Resetear visibilidad
    };

    const abrirModalEditar = (usuario: Usuario) => {
        const { id, fechaRegistro, ...datosForm } = usuario;
        setFormUsuario(datosForm);
        setModalConfig({ estado: 'editando', usuarioId: usuario.id });
        setAviso("");
        setMostrarContrasena(false); // Resetear visibilidad
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
                : value
        }));
    };

    const manejarEnvioForm = (e: FormEvent) => {
        e.preventDefault();
        setAviso("");

        if (!formUsuario.nombre || !formUsuario.correo || !formUsuario.cedula || !formUsuario.telefono || !formUsuario.contrasena) {
            setAviso("Por favor, completa todos los campos obligatorios (incluyendo la contraseña).");
            return;
        }

        if (modalConfig.estado === 'creando') {
            const nuevoUsuario: Usuario = {
                ...formUsuario,
                id: Date.now().toString(),
                fechaRegistro: new Date().toISOString().split('T')[0],
            };
            setPersonal(prev => [...prev, nuevoUsuario]);
        } else if (modalConfig.estado === 'editando' && modalConfig.usuarioId) {
            const usuarioExistente = personal.find(p => p.id === modalConfig.usuarioId);
            if (!usuarioExistente) return;

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
        <div className="h-[100dvh] sm:h-full w-full bg-[#0B132B] text-[#F4D6B0] font-sans antialiased flex flex-col overflow-hidden">
            
            {/* HEADER FIJO SUPERIOR CON EL NOMBRE */}
            <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B] pt-[max(0.5rem,env(safe-area-inset-top))]">
                <header className="bg-[#1C2541] border-b border-[#3A506B] px-3 sm:px-4 lg:px-6 py-2">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                            <div className="p-2 rounded-xl bg-[#3A506B]/40 border border-[#5BC0DE]/30 text-[#5BC0DE]">
                                <ShieldCheck className="w-5 h-5" strokeWidth={1.8} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F4D6B0]">Gestión de Personal</h2>
                                    <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#3A506B]/40 text-[#5BC0DE] border border-[#5BC0DE]/30 font-mono font-medium">
                                        Equipo & Roles
                                    </span>
                                </div>
                                <p className="hidden sm:block text-[11px] text-[#5BC0DE]/80">Control de accesos, roles y personal del restaurante</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
                            <button 
                                onClick={abrirModalCrear}
                                className="w-full md:w-auto justify-center bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] px-3 py-2 md:py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <UserPlus size={15} strokeWidth={2.5} />
                                Nuevo Empleado
                            </button>
                        </div>
                    </div>
                </header>

                {/* BARRA DE FILTROS Y BÚSQUEDA */}
                <div className="bg-[#1C2541] px-3 sm:px-4 lg:px-6 py-2.5 border-b border-[#3A506B] space-y-2.5">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#5BC0DE]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-[#F4D6B0] placeholder-[#5BC0DE]/50 focus:outline-none focus:border-[#5BC0DE]"
                            />
                        </div>
                        <div className="text-xs text-[#5BC0DE] font-medium shrink-0 self-end sm:self-auto">
                            Registros: <span className="text-[#F4D6B0] font-bold">{visibles.length}</span>
                        </div>
                    </div>

                    {/* Filtros de Rol (Píldoras) */}
                    <div className="max-w-7xl mx-auto relative group">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <span className="text-[10px] sm:text-[11px] font-bold text-[#5BC0DE] uppercase shrink-0 flex items-center gap-1 mr-1">
                                Roles:
                            </span>
                            {['Todos', ...ROLES].map(rol => (
                                <button
                                    key={rol}
                                    onClick={() => setFiltroRol(rol as RolUsuario | 'Todos')}
                                    className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 
                                        ${filtroRol === rol 
                                            ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow' 
                                            : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                                        }`}
                                >
                                    {rol}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AVISOS DE REGLA DE NEGOCIO */}
            {aviso && modalConfig.estado === 'cerrado' && (
                <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 mt-3">
                    <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium flex items-center gap-2" role="alert">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p>{aviso}</p>
                    </div>
                </div>
            )}

            {/* CONTENIDO PRINCIPAL CON SCROLL */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col">
                <section className="bg-[#1C2541] border border-[#3A506B] rounded-xl sm:rounded-2xl shadow-xl flex-1 flex flex-col">
                    
                    {/* VISTA ESCRITORIO: TABLA */}
                    <div className="hidden md:block overflow-x-auto relative flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="sticky top-0 z-30 bg-[#1C2541] shadow-md border-b-2 border-[#5BC0DE]">
                                <tr className="text-[#5BC0DE] text-xs font-semibold uppercase tracking-wider">
                                    <th className="py-3 px-4 bg-[#1C2541]">Empleado</th>
                                    <th className="py-3 px-4 bg-[#1C2541]">Contacto</th>
                                    <th className="py-3 px-4 bg-[#1C2541]">Cédula (Privado)</th>
                                    <th className="py-3 px-4 bg-[#1C2541]">Registro</th>
                                    <th className="py-3 px-4 text-center bg-[#1C2541]">Rol (Interactivo)</th>
                                    <th className="py-3 px-4 text-center bg-[#1C2541]">Estado</th>
                                    <th className="py-3 px-4 text-right bg-[#1C2541]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3A506B]/50 text-sm">
                                {visibles.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-[#5BC0DE]/60 text-xs">
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
                                                className="hover:bg-[#3A506B]/20 transition cursor-pointer"
                                                onClick={(e) => {
                                                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
                                                    abrirModalEditar(persona);
                                                }}
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[#0B132B] flex items-center justify-center font-bold text-[#5BC0DE] border border-[#3A506B] flex-shrink-0 text-xs">
                                                            {persona.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                        </div>
                                                        <span className="font-semibold text-[#F4D6B0] text-xs md:text-sm">{persona.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 space-y-1 text-xs text-[#5BC0DE]">
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail size={13} className="text-[#5BC0DE] shrink-0"/>
                                                        <span className="truncate max-w-[180px]">{persona.correo}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone size={13} className="text-[#5BC0DE] shrink-0"/>
                                                        <span>{persona.telefono}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-xs font-mono text-[#F4D6B0]">
                                                    <span className="bg-[#0B132B] border border-[#3A506B] px-2 py-1 rounded-lg">
                                                        ••••{persona.cedula.slice(-3)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs font-mono text-[#F4D6B0]">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarDays size={13} className="text-[#5BC0DE] shrink-0"/>
                                                        <span>{persona.fechaRegistro}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {editable ? (
                                                        <select
                                                            value={persona.rol}
                                                            onChange={(e) => cambiarRolDirecto(persona.id, e.target.value as RolUsuario)}
                                                            className="bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] rounded-xl px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-[#5BC0DE] cursor-pointer"
                                                        >
                                                            {ROLES.map((r) => (
                                                                <option key={r} value={r} className="bg-[#0B132B] text-[#F4D6B0]">
                                                                    {r}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-amber-950/85 text-amber-300 border-amber-800/60">
                                                            {persona.rol}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${persona.activo ? 'bg-emerald-950/85 text-emerald-300 border-emerald-800/60' : 'bg-red-950/85 text-red-300 border-red-800/60'}`}>
                                                        {persona.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {!editable && esUsuarioDueño && (
                                                            <div className="flex items-center gap-1 bg-[#0B132B] text-[#5BC0DE] px-2 py-1 rounded-lg text-[10px] border border-[#3A506B]" title="Rol protegido">
                                                                <Lock size={12} />
                                                            </div>
                                                        )}
                                                        <button 
                                                            onClick={() => alternarActivo(persona.id)}
                                                            className={`p-1.5 rounded-lg transition border ${persona.activo ? 'bg-[#0B132B] border-[#3A506B] text-emerald-400 hover:bg-[#3A506B]' : 'bg-red-950/30 border-red-800/60 text-red-400 hover:bg-red-950/50'}`}
                                                            title={persona.activo ? "Desactivar empleado" : "Activar empleado"}
                                                        >
                                                            {persona.activo ? <UserCheck size={15} /> : <UserMinus size={15} />}
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

                    {/* VISTA MÓVIL: TARJETAS */}
                    <div className="md:hidden p-2 space-y-2">
                        {visibles.length === 0 ? (
                            <div className="py-12 text-center text-xs text-[#5BC0DE]/60">
                                No se encontraron empleados.
                            </div>
                        ) : (
                            visibles.map(persona => {
                                const esDueñoActual = usuarioLogueadoActual.rol === 'Dueño';
                                const esUsuarioDueño = persona.rol === 'Dueño';
                                const editable = esDueñoActual && !esUsuarioDueño; 

                                return (
                                    <div 
                                        key={persona.id} 
                                        className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-2 shadow-sm active:scale-[0.99] transition-transform"
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
                                            abrirModalEditar(persona);
                                        }}
                                    >
                                        {/* Cabecera Tarjeta */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-[#1C2541] flex items-center justify-center font-bold text-[#5BC0DE] border border-[#3A506B] shrink-0 text-xs">
                                                    {persona.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[#F4D6B0] text-sm truncate leading-tight">{persona.nombre}</p>
                                                    <p className="text-[10px] text-[#5BC0DE] mt-0.5">C.C: ••••{persona.cedula.slice(-3)}</p>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold ${persona.activo ? 'bg-emerald-950/85 text-emerald-300 border-emerald-800/60' : 'bg-red-950/85 text-red-300 border-red-800/60'}`}>
                                                {persona.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>

                                        {/* Contacto */}
                                        <div className="mt-1 space-y-1">
                                            <p className="text-[10px] text-[#F4D6B0] flex items-center gap-1.5 truncate"><Mail size={12} className="text-[#5BC0DE] shrink-0" /> {persona.correo}</p>
                                            <p className="text-[10px] text-[#F4D6B0] flex items-center gap-1.5 truncate"><Phone size={12} className="text-[#5BC0DE] shrink-0" /> {persona.telefono}</p>
                                            <p className="text-[10px] text-[#F4D6B0] flex items-center gap-1.5 truncate"><CalendarDays size={12} className="text-[#5BC0DE] shrink-0" /> Ingreso: {persona.fechaRegistro}</p>
                                        </div>

                                        {/* Rol y Acciones */}
                                        <div className="flex items-center justify-between border-t border-[#3A506B]/50 pt-2 mt-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-[#5BC0DE] font-semibold">Rol:</span>
                                                {editable ? (
                                                    <select
                                                        value={persona.rol}
                                                        onChange={(e) => cambiarRolDirecto(persona.id, e.target.value as RolUsuario)}
                                                        className="bg-[#1C2541] border border-[#3A506B] text-[#5BC0DE] rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none focus:border-[#5BC0DE]"
                                                    >
                                                        {ROLES.map((r) => (
                                                            <option key={r} value={r} className="bg-[#0B132B] text-[#F4D6B0]">
                                                                {r}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-950/85 text-amber-300 border border-amber-800/60">
                                                        {persona.rol}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {!editable && esUsuarioDueño && (
                                                    <div className="p-1.5 bg-[#1C2541] text-[#5BC0DE] rounded-lg border border-[#3A506B]" title="Rol protegido">
                                                        <Lock size={14} />
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={() => alternarActivo(persona.id)}
                                                    className={`p-2 rounded-lg transition border ${persona.activo ? 'bg-[#1C2541] border-[#3A506B] text-emerald-400 active:scale-95' : 'bg-red-950/30 border-red-800/60 text-red-400 active:scale-95'}`}
                                                >
                                                    {persona.activo ? <UserCheck size={16} /> : <UserMinus size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </section>
            </main>

            {/* --- MODAL DE AGREGAR / EDITAR EMPLEADO --- */}
            {modalConfig.estado !== 'cerrado' && (
                <div className="fixed inset-0 z-[1000] flex items-center sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 pointer-events-auto">
                    <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden h-[80dvh] sm:h-auto sm:max-h-[92dvh]">
                        
                        <div className="bg-[#0B132B] px-4 sm:px-6 py-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-3 border-b border-[#3A506B] flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                                {modalConfig.estado === 'creando' ? 'Registrar Nuevo Empleado' : 'Editar Empleado'}
                            </h3>
                            <button 
                                onClick={cerrarModal}
                                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={manejarEnvioForm} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
                                {aviso && (
                                    <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium">
                                        {aviso}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                                        <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Nombre Completo *</label>
                                        <input 
                                            type="text" 
                                            name="nombre" 
                                            value={formUsuario.nombre} 
                                            onChange={manejarCambioForm} 
                                            required 
                                            className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" 
                                            placeholder="Ej: Juan Pérez" 
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Correo Electrónico *</label>
                                        <input 
                                            type="email" 
                                            name="correo" 
                                            value={formUsuario.correo} 
                                            onChange={manejarCambioForm} 
                                            required 
                                            className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" 
                                            placeholder="juan@ejemplo.com" 
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Teléfono *</label>
                                        <input 
                                            type="tel" 
                                            name="telefono" 
                                            value={formUsuario.telefono} 
                                            onChange={manejarCambioForm} 
                                            required 
                                            className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" 
                                            placeholder="300 123 4567" 
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Cédula / Documento *</label>
                                        <input 
                                            type="text" 
                                            name="cedula" 
                                            value={formUsuario.cedula} 
                                            onChange={manejarCambioForm} 
                                            required 
                                            className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono" 
                                            placeholder="12345678" 
                                        />
                                    </div>

                                    {/* CAMPO DE CONTRASEÑA CON VISIBILIDAD */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Contraseña de Acceso *</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                                            <input 
                                                type={mostrarContrasena ? "text" : "password"} 
                                                name="contrasena" 
                                                value={formUsuario.contrasena} 
                                                onChange={manejarCambioForm} 
                                                required 
                                                className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl pl-9 pr-10 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" 
                                                placeholder="••••••••" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5BC0DE] hover:text-[#F4D6B0] focus:outline-none"
                                                title={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            >
                                                {mostrarContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Rol / Posición *</label>
                                        <select 
                                            name="rol" 
                                            value={formUsuario.rol} 
                                            onChange={manejarCambioForm} 
                                            required 
                                            className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                                        >
                                            {ROLES.map(r => (
                                                <option key={r} value={r} className="bg-[#0B132B] text-[#F4D6B0]">{r}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                                        <input 
                                            type="checkbox" 
                                            name="activo" 
                                            id="activo" 
                                            checked={formUsuario.activo} 
                                            onChange={(e) => setFormUsuario(prev => ({...prev, activo: e.target.checked}))} 
                                            className="w-5 h-5 accent-[#5BC0DE] cursor-pointer" 
                                        />
                                        <label htmlFor="activo" className="text-sm sm:text-xs font-semibold text-[#F4D6B0] cursor-pointer">Cuenta de empleado activa</label>
                                    </div>
                                </div>
                            </div>

                            {/* BOTONES FIJOS AL FONDO */}
                            <div className="shrink-0 px-4 sm:px-6 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#1C2541] border-t border-[#3A506B] flex justify-end gap-3 z-10">
                                <button 
                                    type="button" 
                                    onClick={cerrarModal} 
                                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium border border-[#3A506B]"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {modalConfig.estado === 'creando' ? <Plus size={15} strokeWidth={2.5}/> : <Save size={15}/>}
                                    {modalConfig.estado === 'creando' ? 'Crear Empleado' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Personal;