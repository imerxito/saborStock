import { useMemo, useState } from "react";
import { LogOut, Lock, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import logo from "../assets/SaborYStock (1).png";
import { useAuth } from "../contexto/AuthContexto";
import { modulosPorRol } from "./secciones/Modulos";
import "../estilos/Dashboard.css";

function iniciales(nombre?: string) {
    if (!nombre) return "?";
    return nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

function Dashboard() {
    const { usuario, cerrarSesion } = useAuth();

    const modulos = useMemo(
        () => (usuario ? modulosPorRol(usuario.rol) : []),
        [usuario]
    );

    const [idActivo, setIdActivo] = useState<string | null>(null);
    const [colapsado, setColapsado] = useState(() => window.innerWidth < 820);

    // Si aún no eligió ninguno (o el elegido ya no le corresponde), muestra el primero
    const activo = modulos.find((m) => m.id === idActivo) ?? modulos[0];
    const Contenido = activo?.componente;

    // Nombre real; si la sesión es antigua y no lo trae, usa lo que va antes del @ del correo
    const nombreVisible =
        usuario?.nombre?.trim() || usuario?.correo?.split("@")[0] || "Usuario";

    return (
        <div className={`Contenedor ${colapsado ? "colapsado" : ""}`}>
            <nav className="navegador">
                <div className="navegador__izq">
                    <button
                        type="button"
                        className="btn-colapsar"
                        onClick={() => setColapsado((c) => !c)}
                        aria-label={colapsado ? "Expandir menú" : "Contraer menú"}
                        title={colapsado ? "Expandir menú" : "Contraer menú"}
                    >
                        {colapsado ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                    <div className="logo logo--marco">
                        <img src={logo} alt="SaborYStock" />
                    </div>
                </div>

                <div className="usuario-chip">
                    <div className="usuario-chip__texto">
                        <strong>{nombreVisible}</strong>
                    </div>
                    <div className="avatar" aria-hidden="true">
                        {iniciales(nombreVisible)}
                    </div>
                </div>
            </nav>

            <aside aria-label="Módulos">
                <div className="aside__lista">
                    {modulos.map((m) => {
                        const Icono = m.icono;
                        const esActivo = m.id === activo?.id;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                className={`modulo-btn ${esActivo ? "activo" : ""}`}
                                onClick={() => setIdActivo(m.id)}
                                title={m.descripcion}
                                aria-label={m.titulo}
                                aria-current={esActivo ? "page" : undefined}
                            >
                                <Icono size={19} />
                                <span>{m.titulo}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="modulo-btn modulo-btn--salir"
                    onClick={cerrarSesion}
                    title="Cerrar sesión"
                >
                    <LogOut size={19} />
                    <span>Cerrar sesión</span>
                </button>
            </aside>

            <main>
                {activo && Contenido ? (
                    <section
                        key={activo.id}
                        className={`contenido-modulo${activo ? " contenido-modulo--completo" : ""}`}
                        aria-label={activo.titulo}
                    >
                        <Contenido />
                    </section>
                ) : (
                    <div className="estado-vacio">
                        <Lock size={32} />
                        <h2>Sin módulos disponibles</h2>
                        <p>Tu rol todavía no tiene funciones asignadas. Pídele acceso al administrador.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;