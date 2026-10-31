import { useMemo, useState } from "react";
import type { RolUsuario } from "../../tipos/Usuario";

interface Persona {
    id: string;
    nombre: string;
    correo: string;
    rol: RolUsuario;
    activo: boolean;
}

const ROLES: RolUsuario[] = ["Dueno", "Administrador", "Cocinero", "Mesero", "Caja"];

// Datos de ejemplo: luego vendrán de /api/usuarios
const PERSONAL_INICIAL: Persona[] = [
    { id: "1", nombre: "Carlos Mendoza", correo: "carlos@ejemplo.com", rol: "Dueno", activo: true },
    { id: "2", nombre: "Laura Gómez", correo: "laura@ejemplo.com", rol: "Administrador", activo: true },
    { id: "3", nombre: "Pedro Ramírez", correo: "pedro@ejemplo.com", rol: "Cocinero", activo: true },
    { id: "4", nombre: "Ana Torres", correo: "ana@ejemplo.com", rol: "Mesero", activo: true },
    { id: "5", nombre: "Julián Castro", correo: "julian@ejemplo.com", rol: "Caja", activo: false },
];

function Personal() {
    const [personal, setPersonal] = useState<Persona[]>(PERSONAL_INICIAL);
    const [busqueda, setBusqueda] = useState("");
    const [filtroRol, setFiltroRol] = useState<RolUsuario | "Todos">("Todos");
    const [aviso, setAviso] = useState("");

    const activos = personal.filter((p) => p.activo).length;

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return personal.filter(
            (p) =>
                (p.nombre.toLowerCase().includes(texto) || p.correo.toLowerCase().includes(texto)) &&
                (filtroRol === "Todos" || p.rol === filtroRol)
        );
    }, [personal, busqueda, filtroRol]);

    // Regla del backend (contarDuenos): siempre debe quedar un Dueño activo
    const esUltimoDueno = (p: Persona) =>
        p.rol === "Dueno" &&
        p.activo &&
        personal.filter((x) => x.rol === "Dueno" && x.activo).length === 1;

    function cambiarRol(id: string, rol: RolUsuario) {
        const persona = personal.find((p) => p.id === id);
        if (!persona) return;
        if (esUltimoDueno(persona) && rol !== "Dueno") {
            setAviso("Debe quedar al menos un Dueño activo.");
            return;
        }
        setAviso("");
        setPersonal((prev) => prev.map((p) => (p.id === id ? { ...p, rol } : p)));
    }

    function alternarActivo(id: string) {
        const persona = personal.find((p) => p.id === id);
        if (!persona) return;
        if (esUltimoDueno(persona)) {
            setAviso("No puedes desactivar al único Dueño activo.");
            return;
        }
        setAviso("");
        setPersonal((prev) => prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)));
    }

    return (
        <>
            <div className="grid-tarjetas seccion">
                <div className="tarjeta">
                    <p className="tarjeta__titulo">Equipo</p>
                    <p className="tarjeta__valor">{personal.length}</p>
                </div>
                <div className="tarjeta tarjeta--ok">
                    <p className="tarjeta__titulo">Activos</p>
                    <p className="tarjeta__valor">{activos}</p>
                </div>
                <div className="tarjeta tarjeta--alerta">
                    <p className="tarjeta__titulo">Inactivos</p>
                    <p className="tarjeta__valor">{personal.length - activos}</p>
                </div>
            </div>

            <div className="barra-herramientas">
                <div className="filtros">
                    <input
                        className="buscador"
                        placeholder="Buscar por nombre o correo..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    <select
                        className="buscador"
                        value={filtroRol}
                        onChange={(e) => setFiltroRol(e.target.value as RolUsuario | "Todos")}
                        aria-label="Filtrar por rol"
                    >
                        <option value="Todos">Todos los roles</option>
                        {ROLES.map((r) => (
                            <option key={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>

            <p className="texto-suave seccion">
                Las cuentas nuevas se crean desde la pantalla de registro; aquí se ajusta el rol y si
                la persona está activa.
            </p>

            {aviso && (
                <p className="aviso" role="alert">
                    {aviso}
                </p>
            )}

            <div className="tabla-contenedor">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="vacio">
                                    No se encontró personal con esos filtros.
                                </td>
                            </tr>
                        ) : (
                            visibles.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.nombre}</td>
                                    <td>{p.correo}</td>
                                    <td>
                                        <select
                                            className="select-mini"
                                            value={p.rol}
                                            onChange={(e) => cambiarRol(p.id, e.target.value as RolUsuario)}
                                            aria-label={`Rol de ${p.nombre}`}
                                        >
                                            {ROLES.map((r) => (
                                                <option key={r}>{r}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`estado ${p.activo ? "estado--ok" : "estado--error"}`}
                                            onClick={() => alternarActivo(p.id)}
                                            title="Activar o desactivar"
                                        >
                                            {p.activo ? "Activo" : "Inactivo"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default Personal;