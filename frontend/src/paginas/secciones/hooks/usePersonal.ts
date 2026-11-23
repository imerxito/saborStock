import { useMemo, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { UsuarioServicio } from "../../../servicios/UsuarioServicio";
import { useAuth } from "../../../contexto/AuthContexto";
import type { EmpleadoPersonal, RolUsuarioUI } from "../Personal";

export const ROLES_UI: { id: "Dueno" | "Administrador" | "Cocinero" | "Caja" | "Mesero"; label: RolUsuarioUI }[] = [
    { id: "Dueno", label: "Dueño" },
    { id: "Administrador", label: "Administrador" },
    { id: "Cocinero", label: "Cocina" },
    { id: "Mesero", label: "Mesero" },
    { id: "Caja", label: "Caja" },
];

export function etiquetaRol(rol: string): RolUsuarioUI {
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

export function usePersonal() {
    const { usuario: usuarioLogueado } = useAuth();
    const [personal, setPersonal] = useState<EmpleadoPersonal[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroRol, setFiltroRol] = useState<RolUsuarioUI | "Todos">("Todos");
    const [aviso, setAviso] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

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

    const rolActual = usuarioLogueado?.rol || "Dueno";
    const soyDueno = rolActual === "Dueno" || (rolActual as any) === "Dueño";
    const soyAdmin = rolActual === "Administrador";
    const esAdminODueno = soyDueno || soyAdmin;

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

    const rolesDisponibles = useMemo(() => {
        return soyDueno ? ROLES_UI : ROLES_UI.filter(r => r.id !== 'Dueno');
    }, [soyDueno]);

    async function alternarActivo(id: string) {
        const persona = personal.find((p) => p.id === id);
        if (!persona) return;

        const esDueño = persona.rol === "Dueno" || (persona.rol as any) === "Dueño";

        if (soyAdmin && esDueño) {
            setAviso("Los administradores no tienen permisos para mover o desactivar a un Dueño.");
            return;
        }

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

        if (soyAdmin && esDueño) {
            setAviso("Los administradores no tienen permisos para modificar el rol de un Dueño.");
            return;
        }

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

    const abrirModalCrear = () => {
        setFormUsuario(formInicial);
        setModalConfig({ estado: 'creando' });
        setAviso("");
        setMostrarContrasena(false);
    };

    const abrirModalEditar = (usuario: EmpleadoPersonal) => {
        const esDueño = usuario.rol === "Dueno" || (usuario.rol as any) === "Dueño";

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

                if (soyAdmin && esDueño) {
                    setAviso("Los administradores no tienen permisos para modificar a un Dueño.");
                    setGuardando(false);
                    return;
                }

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

    return {
        // Estado
        personal,
        cargando,
        guardando,
        busqueda,
        filtroRol,
        aviso,
        mensajeExito,
        modalConfig,
        formUsuario,
        mostrarContrasena,
        // Derivados
        visibles,
        rolesDisponibles,
        esAdminODueno,
        soyAdmin,
        esModalUsuarioProtegido,
        // Setters simples
        setBusqueda,
        setFiltroRol,
        setMostrarContrasena,
        setAviso,
        setFormUsuario,
        // Handlers
        cargarPersonal,
        alternarActivo,
        cambiarRolDirecto,
        abrirModalCrear,
        abrirModalEditar,
        cerrarModal,
        manejarCambioForm,
        manejarEnvioForm,
        esDuenoProtegido,
        etiquetaRol,
    };
}
