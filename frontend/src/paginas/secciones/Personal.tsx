import { useMemo, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Mail, Phone, CalendarDays, ShieldCheck, UserMinus, UserCheck, Lock, Plus, Save, Eye, EyeOff, RotateCw } from 'lucide-react';
import { UsuarioServicio } from "../../servicios/UsuarioServicio";
import { useAuth } from "../../contexto/AuthContexto";

// --- DEFINICIONES DE TIPOS ---

export type RolUsuarioUI = "Dueño" | "Administrador" | "Cocina" | "Mesero" | "Caja";

export interface EmpleadoPersonal {
    id: string;
    idUsuario?: number;
    nombre: string;
    correo: string;
    cedula: string;
    telefono: string;
    contrasena?: string;
    rol: "Dueno" | "Administrador" | "Cocinero" | "Caja" | "Mesero";
    fechaRegistro: string;
    activo: boolean;
}

const ROLES_UI: { id: "Dueno" | "Administrador" | "Cocinero" | "Caja" | "Mesero"; label: RolUsuarioUI }[] = [
    { id: "Dueno", label: "Dueño" },
    { id: "Administrador", label: "Administrador" },
    { id: "Cocinero", label: "Cocina" },
    { id: "Mesero", label: "Mesero" },
    { id: "Caja", label: "Caja" },
];

function etiquetaRol(rol: string): RolUsuarioUI {
    if (rol === "Dueno" || rol === "Dueño") return "Dueño";
    if (rol === "Cocinero" || rol === "Cocina") return "Cocina";
    if (rol === "Administrador") return "Administrador";
    if (rol === "Caja") return "Caja";
    return "Mesero";
}

const formInicial = {
    nombre: '',
    correo: '',
    cedula: '',
    telefono: '',
    contrasena: '',
    rol: 'Mesero' as "Dueno" | "Administrador" | "Cocinero" | "Caja" | "Mesero",
    activo: true,
};

// --- COMPONENTE PRINCIPAL ---

export default function Personal() {
    const { usuario: usuarioLogueado } = useAuth();
    const [personal, setPersonal] = useState<EmpleadoPersonal[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroRol, setFiltroRol] = useState<RolUsuarioUI | "Todos">("Todos");
    const [aviso, setAviso] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

    // Estado para el Modal de Agregar/Editar
    const [modalConfig, setModalConfig] = useState<{
        estado: 'cerrado' | 'creando' | 'editando';
        usuarioId?: string;
    }>({ estado: 'cerrado' });

    const [formUsuario, setFormUsuario] = useState(formInicial);
    const [mostrarContrasena, setMostrarContrasena] = useState(false);

    const cargarPersonal = async () => {
        setCargando(true);
        setAviso("");
        try {
            const data = await UsuarioServicio.listar();
            const formateados: EmpleadoPersonal[] = (data || []).map((u: any) => ({
                id: String(u.id || u.auth_id || u.id_usuario),
                idUsuario: u.idUsuario || u.id_usuario,
                nombre: u.nombre || "Sin nombre",
                correo: u.correo || "",
                cedula: u.cedula || "",
                telefono: u.telefono || "",
                rol: u.rol || "Mesero",
                fechaRegistro: u.fechaRegistro
                    ? String(u.fechaRegistro).slice(0, 10)
                    : new Date().toISOString().slice(0, 10),
                activo: u.activo !== false,
            }));
            setPersonal(formateados);
        } catch (err: any) {
            setAviso(err?.message || "No se pudo cargar la lista de empleados.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        void cargarPersonal();
    }, []);

    // Identificación del usuario en sesión
    const rolActual = usuarioLogueado?.rol || "Dueno";
    const soyDueno = rolActual === "Dueno" || (rolActual as any) === "Dueño";
    const soyAdmin = rolActual === "Administrador";
    const esAdminODueno = soyDueno || soyAdmin;

    // Identificación de Dueños y del Dueño Protegido (primer dueño del restaurante con menor idUsuario)
    const duenos = useMemo(() => {
        return personal.filter((p) => p.rol === "Dueno" || (p.rol as any) === "Dueño");
    }, [personal]);

    const duenoProtegido = useMemo(() => {
        if (duenos.length === 0) return null;
        return [...duenos].sort((a, b) => Number(a.idUsuario ?? 999999) - Number(b.idUsuario ?? 999999))[0];
    }, [duenos]);

    const esDuenoProtegido = (p: EmpleadoPersonal) => {
        return duenoProtegido ? p.id === duenoProtegido.id : false;
    };

    // Filtros de búsqueda
    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return personal.filter((p) => {
            const matchTexto =
                texto === "" ||
                p.nombre.toLowerCase().includes(texto) ||
                p.correo.toLowerCase().includes(texto) ||
                p.cedula.toLowerCase().includes(texto);
            const rolLabel = etiquetaRol(p.rol);
            const matchRol = filtroRol === "Todos" || rolLabel === filtroRol;
            return matchTexto && matchRol;
        });
    }, [personal, busqueda, filtroRol]);

    // Roles que el usuario conectado puede asignar
    const rolesDisponibles = useMemo(() => {
        return soyDueno ? ROLES_UI : ROLES_UI.filter(r => r.id !== 'Dueno');
    }, [soyDueno]);

    // --- ACCIONES DIRECTAS CON EL BACKEND ---

    async function alternarActivo(id: string) {
        const persona = personal.find((p) => p.id === id);
        if (!persona) return;

        const esDueño = persona.rol === "Dueno" || (persona.rol as any) === "Dueño";

        // Regla 1: Los administradores no pueden mover a los dueños
        if (soyAdmin && esDueño) {
            setAviso("Los administradores no tienen permisos para mover o desactivar a un Dueño.");
            return;
        }

        // Regla 2: El dueño protegido no se puede cambiar ni él mismo
        if (esDuenoProtegido(persona)) {
            setAviso("El Dueño protegido no puede ser desactivado, ni siquiera por él mismo.");
            return;
        }

        setAviso("");
        try {
            const nuevoEstado = !persona.activo;
            await UsuarioServicio.alternarActivo(id, nuevoEstado);
            setPersonal((prev) => prev.map((p) => (p.id === id ? { ...p, activo: nuevoEstado } : p)));
            setMensajeExito(`Empleado ${persona.nombre} ${nuevoEstado ? "activado" : "desactivado"} correctamente.`);
            setTimeout(() => setMensajeExito(""), 4000);
        } catch (err: any) {
            setAviso(err?.message || "Error al actualizar el estado del empleado.");
        }
    }

    async function cambiarRolDirecto(id: string, nuevoRol: "Dueno" | "Administrador" | "Cocinero" | "Caja" | "Mesero") {
        const persona = personal.find((p) => p.id === id);
        if (!persona) return;

        const esDueño = persona.rol === "Dueno" || (persona.rol as any) === "Dueño";

        // Regla 1: Los administradores no pueden mover a los dueños
        if (soyAdmin && esDueño) {
            setAviso("Los administradores no tienen permisos para modificar el rol de un Dueño.");
            return;
        }

        // Regla 2: El dueño protegido no se puede cambiar ni él mismo
        if (esDuenoProtegido(persona)) {
            setAviso("El Dueño protegido no puede cambiar de rol, ni siquiera por él mismo.");
            return;
        }

        setAviso("");
        try {
            await UsuarioServicio.actualizar(id, { rol: nuevoRol });
            setPersonal((prev) => prev.map((p) => (p.id === id ? { ...p, rol: nuevoRol } : p)));
            setMensajeExito(`Rol de ${persona.nombre} actualizado a ${etiquetaRol(nuevoRol)}.`);
            setTimeout(() => setMensajeExito(""), 4000);
        } catch (err: any) {
            setAviso(err?.message || "Error al cambiar el rol.");
        }
    }

    // --- GESTIÓN DEL FORMULARIO Y MODAL ---

    const abrirModalCrear = () => {
        setFormUsuario(formInicial);
        setModalConfig({ estado: 'creando' });
        setAviso("");
        setMostrarContrasena(false);
    };

    const abrirModalEditar = (usuario: EmpleadoPersonal) => {
        const esDueño = usuario.rol === "Dueno" || (usuario.rol as any) === "Dueño";

        // Regla 1: Los administradores no pueden mover a los dueños
        if (soyAdmin && esDueño) {
            setAviso("Los administradores no tienen permisos para modificar a un Dueño.");
            return;
        }

        setFormUsuario({
            nombre: usuario.nombre,
            correo: usuario.correo,
            cedula: usuario.cedula,
            telefono: usuario.telefono,
            contrasena: '',
            rol: usuario.rol,
            activo: usuario.activo,
        });
        setModalConfig({ estado: 'editando', usuarioId: usuario.id });
        setAviso("");
        setMostrarContrasena(false);
    };

    const cerrarModal = () => {
        setModalConfig({ estado: 'cerrado' });
        setAviso("");
    };

    const manejarCambioForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormUsuario(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const manejarEnvioForm = async (e: FormEvent) => {
        e.preventDefault();
        setAviso("");

        if (!formUsuario.nombre.trim() || !formUsuario.correo.trim() || !formUsuario.cedula.trim()) {
            setAviso("Por favor, completa nombre, correo y cédula.");
            return;
        }

        if (modalConfig.estado === 'creando' && !formUsuario.contrasena) {
            setAviso("La contraseña es requerida para registrar un nuevo empleado.");
            return;
        }

        setGuardando(true);
        try {
            if (modalConfig.estado === 'creando') {
                const creado = await UsuarioServicio.crear({
                    nombre: formUsuario.nombre.trim(),
                    correo: formUsuario.correo.trim().toLowerCase(),
                    cedula: formUsuario.cedula.trim(),
                    telefono: formUsuario.telefono.trim(),
                    contrasena: formUsuario.contrasena,
                    rol: formUsuario.rol,
                    activo: formUsuario.activo,
                });

                const nuevo: EmpleadoPersonal = {
                    id: String(creado.id || creado.idUsuario),
                    idUsuario: creado.idUsuario,
                    nombre: creado.nombre,
                    correo: creado.correo,
                    cedula: creado.cedula,
                    telefono: creado.telefono,
                    rol: creado.rol,
                    fechaRegistro: new Date().toISOString().slice(0, 10),
                    activo: creado.activo !== false,
                };
                setPersonal(prev => [...prev, nuevo]);
                setMensajeExito("Empleado registrado exitosamente.");
            } else if (modalConfig.estado === 'editando' && modalConfig.usuarioId) {
                const usuarioExistente = personal.find(p => p.id === modalConfig.usuarioId);
                const esDueño = usuarioExistente && (usuarioExistente.rol === 'Dueno' || (usuarioExistente.rol as any) === 'Dueño');

                // Regla 1: Un administrador no puede editar a un dueño
                if (soyAdmin && esDueño) {
                    setAviso("Los administradores no tienen permisos para modificar a un Dueño.");
                    setGuardando(false);
                    return;
                }

                // Regla 2: El dueño protegido no se puede cambiar ni él mismo
                const esProtegido = usuarioExistente ? esDuenoProtegido(usuarioExistente) : false;
                if (esProtegido) {
                    if (formUsuario.rol !== 'Dueno') {
                        setAviso("El Dueño protegido no puede cambiar de rol, ni siquiera por él mismo.");
                        setGuardando(false);
                        return;
                    }
                    if (!formUsuario.activo) {
                        setAviso("El Dueño protegido no puede ser desactivado, ni siquiera por él mismo.");
                        setGuardando(false);
                        return;
                    }
                }

                const cambios: any = {
                    nombre: formUsuario.nombre.trim(),
                    correo: formUsuario.correo.trim().toLowerCase(),
                    cedula: formUsuario.cedula.trim(),
                    telefono: formUsuario.telefono.trim(),
                    rol: esProtegido ? 'Dueno' : formUsuario.rol,
                    activo: esProtegido ? true : formUsuario.activo,
                };
                if (formUsuario.contrasena && formUsuario.contrasena.trim() !== "") {
                    cambios.contrasena = formUsuario.contrasena.trim();
                }

                await UsuarioServicio.actualizar(modalConfig.usuarioId, cambios);
                setPersonal(prev => prev.map(p =>
                    p.id === modalConfig.usuarioId
                        ? { ...p, ...cambios }
                        : p
                ));
                setMensajeExito("Empleado actualizado exitosamente.");
            }

            setTimeout(() => setMensajeExito(""), 4000);
            cerrarModal();
        } catch (err: any) {
            setAviso(err?.message || "Error al procesar la solicitud.");
        } finally {
            setGuardando(false);
        }
    };

    const usuarioEditandoModal = modalConfig.estado === 'editando' && modalConfig.usuarioId
        ? personal.find(p => p.id === modalConfig.usuarioId)
        : null;
    const esModalUsuarioProtegido = usuarioEditandoModal ? esDuenoProtegido(usuarioEditandoModal) : false;

    return (
        <div className="h-[100dvh] sm:h-full w-full bg-[#0B132B] text-[#F4D6B0] font-sans antialiased flex flex-col overflow-hidden">
            
            {/* HEADER FIJO SUPERIOR */}
            <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B] pt-[max(0.5rem,env(safe-area-inset-top))]">
                <header className="bg-[#1C2541] border-b border-[#3A506B] px-3 sm:px-4 lg:px-6 py-2">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                            <div className="p-2 rounded-xl bg-[#3A506B]/40 border border-[#5BC0DE]/30 text-[#5BC0DE]">
                                <ShieldCheck className="w-5 h-5 text-[#5BC0DE]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F4D6B0]">Gestión de Personal</h2>
                                    <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#3A506B]/40 text-[#5BC0DE] border border-[#5BC0DE]/30 font-mono font-medium">
                                        Acceso & Roles
                                    </span>
                                </div>
                                <p className="hidden sm:block text-[11px] text-[#5BC0DE]/80">Administración de usuarios, control de roles y estados de cuenta</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
                            {esAdminODueno && (
                                <button
                                    type="button"
                                    onClick={abrirModalCrear}
                                    className="w-full md:w-auto justify-center bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] px-3 py-2 md:py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
                                >
                                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                    Nuevo Empleado
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Barra de Búsqueda y Filtros */}
                <div className="bg-[#1C2541] px-3 sm:px-4 lg:px-6 py-2.5 border-b border-[#3A506B] space-y-2.5">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#5BC0DE]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                placeholder="Buscar por nombre, correo o cédula..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-[#F4D6B0] placeholder-[#5BC0DE]/50 focus:outline-none focus:border-[#5BC0DE]"
                            />
                        </div>
                        <div className="text-xs text-[#5BC0DE] font-medium shrink-0 self-end sm:self-auto flex items-center gap-2">
                            <span>Empleados:</span>
                            <span className="text-[#F4D6B0] font-bold bg-[#0B132B] px-2 py-0.5 rounded-lg border border-[#3A506B]">
                                {visibles.length} / {personal.length}
                            </span>
                        </div>
                    </div>

                    {/* Filtros de Rol (Píldoras) */}
                    <div className="max-w-7xl mx-auto relative group">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <span className="text-[10px] sm:text-[11px] font-bold text-[#5BC0DE] uppercase shrink-0 flex items-center gap-1 mr-1">
                                Rol:
                            </span>
                            {(['Todos', 'Dueño', 'Administrador', 'Cocina', 'Mesero', 'Caja'] as const).map(rol => (
                                <button
                                    key={rol}
                                    onClick={() => setFiltroRol(rol)}
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

            {/* BANNERS DE MENSAJE */}
            {aviso && modalConfig.estado === 'cerrado' && (
                <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 mt-3">
                    <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p>{aviso}</p>
                    </div>
                </div>
            )}
            {mensajeExito && modalConfig.estado === 'cerrado' && (
                <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 mt-3">
                    <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
                        <span>✓</span>
                        <p>{mensajeExito}</p>
                    </div>
                </div>
            )}

            {/* CONTENIDO PRINCIPAL CON SCROLL */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col">
                <section className="bg-[#1C2541] border border-[#3A506B] rounded-xl sm:rounded-2xl shadow-xl flex-1 flex flex-col">
                    
                    {cargando ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#5BC0DE]">
                            <RotateCw className="w-7 h-7 animate-spin mb-2" />
                            <p className="text-xs">Cargando personal del restaurante...</p>
                        </div>
                    ) : (
                        <>
                            {/* VISTA ESCRITORIO: TABLA */}
                            <div className="hidden md:block overflow-x-auto relative flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead className="sticky top-0 z-30 bg-[#1C2541] shadow-md border-b-2 border-[#5BC0DE]">
                                        <tr className="text-[#5BC0DE] text-xs font-semibold uppercase tracking-wider">
                                            <th className="py-3 px-4 bg-[#1C2541]">Empleado</th>
                                            <th className="py-3 px-4 bg-[#1C2541]">Contacto</th>
                                            <th className="py-3 px-4 bg-[#1C2541]">Cédula</th>
                                            <th className="py-3 px-4 bg-[#1C2541]">Registro</th>
                                            <th className="py-3 px-4 text-center bg-[#1C2541]">Rol</th>
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
                                                const esUsuarioDueño = persona.rol === 'Dueno' || (persona.rol as any) === 'Dueño';
                                                const esProtegida = esDuenoProtegido(persona);
                                                
                                                // Permisos para el usuario actual:
                                                // 1. Si el usuario actual es Admin, NO puede tocar a ningún Dueño.
                                                // 2. Si la persona es el Dueño Protegido, no puede ser cambiado ni desactivado por nadie (ni por él mismo).
                                                const adminBloqueado = soyAdmin && esUsuarioDueño;
                                                const puedeEditar = esAdminODueno && !adminBloqueado;
                                                const puedeCambiarRol = !esProtegida && (!soyAdmin || !esUsuarioDueño);
                                                const puedeAlternarActivo = !esProtegida && !adminBloqueado;

                                                return (
                                                    <tr 
                                                        key={persona.id} 
                                                        className={`hover:bg-[#3A506B]/20 transition ${puedeEditar ? 'cursor-pointer' : 'cursor-default'}`}
                                                        onClick={(e) => {
                                                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
                                                            if (adminBloqueado) {
                                                                setAviso("Los administradores no tienen permisos para modificar a un Dueño.");
                                                                return;
                                                            }
                                                            if (puedeEditar) abrirModalEditar(persona);
                                                        }}
                                                    >
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 rounded-full bg-[#0B132B] flex items-center justify-center font-bold border flex-shrink-0 text-xs ${esProtegida ? 'text-amber-300 border-amber-500/50' : 'text-[#5BC0DE] border-[#3A506B]'}`}>
                                                                    {persona.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-[#F4D6B0] text-xs md:text-sm block">{persona.nombre}</span>
                                                                        {esProtegida && (
                                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                                                                Principal
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] text-[#5BC0DE]/70 font-mono">ID: {persona.idUsuario || persona.id.slice(0, 8)}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 space-y-1 text-xs text-[#5BC0DE]">
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail size={13} className="text-[#5BC0DE] shrink-0"/>
                                                                <span className="truncate max-w-[180px]">{persona.correo}</span>
                                                            </div>
                                                            {persona.telefono && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Phone size={13} className="text-[#5BC0DE] shrink-0"/>
                                                                    <span>{persona.telefono}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-mono text-[#F4D6B0]">
                                                            <span className="bg-[#0B132B] border border-[#3A506B] px-2 py-1 rounded-lg">
                                                                {persona.cedula}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-mono text-[#F4D6B0]">
                                                            <div className="flex items-center gap-1.5">
                                                                <CalendarDays size={13} className="text-[#5BC0DE] shrink-0"/>
                                                                <span>{persona.fechaRegistro}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {esProtegida ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm" title="Dueño protegido: no se puede cambiar ni por él mismo">
                                                                    <ShieldCheck size={14} className="text-amber-400" />
                                                                    Dueño Protegido
                                                                </span>
                                                            ) : adminBloqueado ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-[#0B132B] text-[#F4D6B0] border-[#3A506B]" title="Los administradores no pueden modificar a un Dueño">
                                                                    <Lock size={12} className="text-[#5BC0DE]" />
                                                                    Dueño
                                                                </span>
                                                            ) : puedeCambiarRol ? (
                                                                <select
                                                                    value={persona.rol}
                                                                    onChange={(e) => cambiarRolDirecto(persona.id, e.target.value as any)}
                                                                    className="bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] rounded-xl px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-[#5BC0DE] cursor-pointer"
                                                                >
                                                                    {rolesDisponibles.map((r) => (
                                                                        <option key={r.id} value={r.id} className="bg-[#0B132B] text-[#F4D6B0]">
                                                                            {r.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-amber-950/85 text-amber-300 border-amber-800/60">
                                                                    {etiquetaRol(persona.rol)}
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
                                                                {esProtegida ? (
                                                                    <div className="flex items-center gap-1 bg-[#0B132B] text-amber-400 px-2 py-1 rounded-lg text-[10px] border border-amber-500/30" title="Dueño protegido: No se puede desactivar ni cambiar de rol, ni siquiera por él mismo">
                                                                        <ShieldCheck size={13} />
                                                                        <span className="font-semibold">Protegido</span>
                                                                    </div>
                                                                ) : adminBloqueado ? (
                                                                    <div className="flex items-center gap-1 bg-[#0B132B] text-[#5BC0DE]/70 px-2 py-1 rounded-lg text-[10px] border border-[#3A506B]" title="Los administradores no pueden mover ni desactivar a los dueños">
                                                                        <Lock size={12} />
                                                                        <span>Bloqueado</span>
                                                                    </div>
                                                                ) : puedeAlternarActivo ? (
                                                                    <button 
                                                                        onClick={() => alternarActivo(persona.id)}
                                                                        className={`p-1.5 rounded-lg transition border ${persona.activo ? 'bg-[#0B132B] border-[#3A506B] text-emerald-400 hover:bg-[#3A506B]' : 'bg-red-950/30 border-red-800/60 text-red-400 hover:bg-red-950/50'}`}
                                                                        title={persona.activo ? "Desactivar empleado" : "Activar empleado"}
                                                                    >
                                                                        {persona.activo ? <UserCheck size={15} /> : <UserMinus size={15} />}
                                                                    </button>
                                                                ) : null}
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
                                        const esUsuarioDueño = persona.rol === 'Dueno' || (persona.rol as any) === 'Dueño';
                                        const esProtegida = esDuenoProtegido(persona);
                                        const adminBloqueado = soyAdmin && esUsuarioDueño;
                                        const puedeEditar = esAdminODueno && !adminBloqueado;
                                        const puedeAlternarActivo = !esProtegida && !adminBloqueado;

                                        return (
                                            <div 
                                                key={persona.id} 
                                                className={`bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-2 shadow-sm transition-transform ${puedeEditar ? 'active:scale-[0.99] cursor-pointer' : ''}`}
                                                onClick={(e) => {
                                                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
                                                    if (adminBloqueado) {
                                                        setAviso("Los administradores no tienen permisos para modificar a un Dueño.");
                                                        return;
                                                    }
                                                    if (puedeEditar) abrirModalEditar(persona);
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-8 h-8 rounded-full bg-[#1C2541] flex items-center justify-center font-bold text-xs border flex-shrink-0 ${esProtegida ? 'text-amber-300 border-amber-500/50' : 'text-[#5BC0DE] border-[#3A506B]'}`}>
                                                            {persona.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-semibold text-xs text-[#F4D6B0] truncate">{persona.nombre}</span>
                                                                {esProtegida && (
                                                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                                                        Protegido
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-[#5BC0DE]/70 font-mono">CC: {persona.cedula}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${persona.activo ? 'bg-emerald-950/85 text-emerald-300 border-emerald-800/60' : 'bg-red-950/85 text-red-300 border-red-800/60'}`}>
                                                        {persona.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>

                                                <div className="mt-1 border-t border-[#3A506B]/50 pt-1.5 text-xs space-y-0.5 text-[#5BC0DE]">
                                                    <p className="truncate text-[11px]">{persona.correo}</p>
                                                    {persona.telefono && <p className="text-[11px] font-mono">{persona.telefono}</p>}
                                                </div>

                                                <div className="flex items-center justify-between border-t border-[#3A506B]/50 pt-2 mt-0.5">
                                                    {esProtegida ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border bg-amber-500/15 text-amber-300 border-amber-500/40">
                                                            <ShieldCheck size={12} className="text-amber-400" />
                                                            Dueño Protegido
                                                        </span>
                                                    ) : adminBloqueado ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md border bg-[#1C2541] text-[#F4D6B0] border-[#3A506B]">
                                                            <Lock size={11} className="text-[#5BC0DE]" />
                                                            Dueño
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C2541] text-[#5BC0DE] border border-[#3A506B]">
                                                            {etiquetaRol(persona.rol)}
                                                        </span>
                                                    )}

                                                    <div className="flex items-center gap-1.5">
                                                        {esProtegida ? (
                                                            <div className="flex items-center gap-1 bg-[#1C2541] text-amber-400 px-2 py-1 rounded-lg text-[9px] border border-amber-500/30">
                                                                <ShieldCheck size={12} />
                                                                <span>Blindado</span>
                                                            </div>
                                                        ) : adminBloqueado ? (
                                                            <div className="flex items-center gap-1 bg-[#1C2541] text-[#5BC0DE]/70 px-2 py-1 rounded-lg text-[9px] border border-[#3A506B]">
                                                                <Lock size={11} />
                                                                <span>Bloqueado</span>
                                                            </div>
                                                        ) : puedeAlternarActivo ? (
                                                            <button 
                                                                onClick={() => alternarActivo(persona.id)}
                                                                className={`p-1.5 rounded-lg border text-xs ${persona.activo ? 'bg-[#1C2541] border-[#3A506B] text-emerald-400' : 'bg-red-950/30 border-red-800/60 text-red-400'}`}
                                                            >
                                                                {persona.activo ? <UserCheck size={14} /> : <UserMinus size={14} />}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}

                </section>
            </main>

            {/* MODAL PARA AGREGAR O EDITAR EMPLEADO */}
            {modalConfig.estado !== 'cerrado' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-3 sm:p-4 pointer-events-auto">
                    <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
                        
                        {/* HEADER DEL MODAL */}
                        <div className="bg-[#0B132B] px-4 sm:px-6 py-3 border-b border-[#3A506B] flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                                <span className={`w-2.5 h-2.5 rounded-full ${esModalUsuarioProtegido ? 'bg-amber-400' : 'bg-[#5BC0DE]'}`}></span>
                                {modalConfig.estado === 'creando' ? 'Registrar Nuevo Empleado' : 'Editar Información de Empleado'}
                            </h3>
                            <button 
                                type="button" 
                                onClick={cerrarModal}
                                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
                            >
                                ✕
                            </button>
                        </div>

                        {/* FORMULARIO */}
                        <form onSubmit={manejarEnvioForm} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
                                
                                {aviso && (
                                    <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium">
                                        {aviso}
                                    </div>
                                )}

                                {/* AVISO ESPECIAL SI ES EL DUEÑO PROTEGIDO */}
                                {esModalUsuarioProtegido && (
                                    <div className="bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs p-3 rounded-xl flex items-start gap-2.5">
                                        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-amber-300">Dueño Protegido por el Sistema</p>
                                            <p className="text-[11px] text-amber-200/80 mt-0.5">
                                                Este usuario es el Dueño principal. Sus datos de contacto y contraseña pueden actualizarse, pero su rol de Dueño y estado activo están blindados y no pueden cambiarse ni por él mismo.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="flex flex-col gap-1.5">
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
                                        <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Teléfono</label>
                                        <input 
                                            type="tel" 
                                            name="telefono" 
                                            value={formUsuario.telefono} 
                                            onChange={manejarCambioForm} 
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

                                    {/* CAMPO DE CONTRASEÑA */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">
                                            {modalConfig.estado === 'creando' ? 'Contraseña *' : 'Cambiar Contraseña (opcional)'}
                                        </label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                                            <input 
                                                type={mostrarContrasena ? "text" : "password"} 
                                                name="contrasena" 
                                                value={formUsuario.contrasena} 
                                                onChange={manejarCambioForm} 
                                                required={modalConfig.estado === 'creando'}
                                                className="w-full bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl pl-9 pr-10 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]" 
                                                placeholder={modalConfig.estado === 'creando' ? "••••••••" : "Dejar en blanco para no cambiar"} 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5BC0DE] hover:text-[#F4D6B0] focus:outline-none"
                                                title={mostrarContrasena ? "Ocultar" : "Mostrar"}
                                            >
                                                {mostrarContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ROL / POSICIÓN */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Rol / Posición *</label>
                                            {esModalUsuarioProtegido && (
                                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                                                    <ShieldCheck size={11} />
                                                    Rol Blindado
                                                </span>
                                            )}
                                        </div>
                                        <select 
                                            name="rol" 
                                            value={formUsuario.rol} 
                                            onChange={manejarCambioForm} 
                                            disabled={esModalUsuarioProtegido}
                                            required 
                                            className={`bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] ${esModalUsuarioProtegido ? 'opacity-60 cursor-not-allowed bg-[#152036]' : ''}`}
                                        >
                                            {rolesDisponibles.map(r => (
                                                <option key={r.id} value={r.id} className="bg-[#0B132B] text-[#F4D6B0]">{r.label}</option>
                                            ))}
                                        </select>
                                        {esModalUsuarioProtegido && (
                                            <span className="text-[10px] text-amber-300/80">
                                                El rol de Dueño protegido no puede ser cambiado, ni siquiera por él mismo.
                                            </span>
                                        )}
                                    </div>

                                    {/* ESTADO ACTIVO */}
                                    <div className="sm:col-span-2 flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                name="activo" 
                                                id="activo" 
                                                checked={formUsuario.activo} 
                                                disabled={esModalUsuarioProtegido}
                                                onChange={(e) => setFormUsuario(prev => ({...prev, activo: e.target.checked}))} 
                                                className={`w-5 h-5 accent-[#5BC0DE] ${esModalUsuarioProtegido ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`} 
                                            />
                                            <label htmlFor="activo" className={`text-sm sm:text-xs font-semibold text-[#F4D6B0] ${esModalUsuarioProtegido ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                Cuenta de empleado activa
                                            </label>
                                        </div>
                                        {esModalUsuarioProtegido && (
                                            <span className="text-[10px] text-amber-300/80 font-medium">
                                                (Protegido: no se puede desactivar)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* BOTONES FIJOS */}
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
                                    disabled={guardando}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {guardando ? (
                                        <RotateCw className="w-4 h-4 animate-spin" />
                                    ) : modalConfig.estado === 'creando' ? (
                                        <Plus size={15} strokeWidth={2.5}/>
                                    ) : (
                                        <Save size={15}/>
                                    )}
                                    {modalConfig.estado === 'creando' ? 'Crear Empleado' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
