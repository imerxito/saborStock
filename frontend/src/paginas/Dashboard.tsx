import { useMemo, useState, Suspense } from "react";
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
    const [colapsado, setColapsado] = useState(true);

    const activo = modulos.find((m) => m.id === idActivo) ?? modulos[0];
    const Contenido = activo?.componente;

    const nombreVisible =
        usuario?.nombre?.trim() || usuario?.correo?.split("@")[0] || "Usuario";

    return (
        <div 
            className={`Contenedor ${colapsado ? "colapsado" : ""}`} 
            style={{ 
                backgroundColor: '#0B132B',
                display: 'grid',
                gridTemplateRows: 'auto 1fr', // Header arriba, contenido abajo
                gridTemplateColumns: colapsado ? '0px 1fr' : '64px 1fr',
                transition: 'grid-template-columns 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '100vh', // Fuerza a que ocupe exactamente la pantalla
                width: '100vw',  // Evita desbordamiento horizontal
                overflow: 'hidden' // Evita que aparezca el scrollbar global
            }}
        >
            
            {/* NAVBAR SUPERIOR */}
            <nav className="navegador" style={{ backgroundColor: '#1C2541', borderBottom: '1px solid #3A506B', gridColumn: '1 / -1' }}>
                <div className="navegador__izq">
                    <button
                        type="button"
                        className="btn-colapsar"
                        onClick={() => setColapsado((c) => !c)}
                        aria-label={colapsado ? "Expandir menú" : "Contraer menú"}
                        title={colapsado ? "Expandir menú" : "Contraer menú"}
                        style={{ color: '#F4D6B0' }}
                    >
                        {colapsado ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                    <div className="logo logo--marco" style={{ backgroundColor: '#0B132B', borderColor: '#3A506B' }}>
                        <img src={logo} alt="SaborYStock" />
                    </div>
                </div>

                <div className="usuario-chip" style={{ backgroundColor: '#0B132B', borderColor: '#3A506B' }}>
                    <div className="usuario-chip__texto" style={{ color: '#F4D6B0' }}>
                        <strong>{nombreVisible}</strong>
                    </div>
                    <div className="avatar" aria-hidden="true" style={{ backgroundColor: '#5BC0DE', color: '#0B132B' }}>
                        {iniciales(nombreVisible)}
                    </div>
                </div>
            </nav>

            {/* SIDEBAR (MENÚ LATERAL) */}
            <aside 
                aria-label="Módulos" 
                style={{ 
                    backgroundColor: '#1C2541', 
                    borderRight: '1px solid #3A506B',
                    width: colapsado ? '0px' : '64px',
                    overflow: 'visible',
                    display: colapsado ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: colapsado ? '0' : '16px 0',
                    position: 'relative',
                    zIndex: 50,
                    height: '100%' // El menú ocupa el alto disponible sin desbordar
                }}
            >
                <div className="aside__lista" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', overflow: 'visible' }}>
                    {modulos.map((m) => {
                        const Icono = m.icono;
                        const esActivo = m.id === activo?.id;
                        
                        return (
                            <div key={m.id} className="relative group flex items-center justify-center w-full" style={{ overflow: 'visible' }}>
                                <button
                                    type="button"
                                    className="relative flex items-center justify-center h-[40px] w-[40px] rounded-full cursor-pointer transition-all duration-200 ease-out"
                                    onClick={() => setIdActivo(m.id)}
                                    aria-current={esActivo ? "page" : undefined}
                                    style={{ 
                                        backgroundColor: '#1C2541',
                                        border: esActivo ? '1.5px solid #5BC0DE' : '1px solid rgba(58, 80, 107, 0.4)',
                                        boxShadow: esActivo ? '0 0 10px rgba(91, 192, 222, 0.25)' : 'none',
                                        zIndex: 10
                                    }}
                                >
                                    <Icono size={18} style={{ color: esActivo ? '#5BC0DE' : '#F4D6B0', opacity: 1, position: 'relative', zIndex: 2 }} />

                                    {/* Burbuja flotante */}
                                    <div 
                                        className="absolute left-0 top-1/2 -translate-y-1/2 h-[40px] pl-[46px] pr-4 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 ease-out whitespace-nowrap text-[11px] font-medium tracking-wide flex items-center shadow-2xl"
                                        style={{ 
                                            backgroundColor: '#1C2541', 
                                            border: esActivo ? '1.5px solid #5BC0DE' : '1px solid #3A506B', 
                                            color: esActivo ? '#5BC0DE' : '#F4D6B0',
                                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                                            zIndex: 1 
                                        }}
                                    >
                                        {m.titulo}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="relative group flex items-center justify-center w-full" style={{ overflow: 'visible' }}>
                    <button
                        type="button"
                        className="relative flex items-center justify-center h-[40px] w-[40px] rounded-full cursor-pointer transition-all duration-200 ease-out"
                        onClick={cerrarSesion}
                        style={{ 
                            backgroundColor: '#1C2541',
                            border: '1px solid rgba(229, 115, 115, 0.3)',
                            zIndex: 10
                        }}
                    >
                        <LogOut size={18} style={{ color: '#E57373', opacity: 1, position: 'relative', zIndex: 2 }} />

                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-[40px] pl-[46px] pr-4 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 ease-out whitespace-nowrap text-[11px] font-medium tracking-wide flex items-center shadow-2xl"
                            style={{ 
                                backgroundColor: '#1C2541', 
                                border: '1px solid #E57373', 
                                color: '#E57373',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                                zIndex: 1 
                            }}
                        >
                            Cerrar sesión
                        </div>
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL CON SCROLL INTERNO */}
            <main 
                style={{ 
                    gridColumn: colapsado ? '1 / -1' : 'auto',
                    height: '100%', 
                    overflowY: 'auto', // El scroll vertical se genera AQUÍ
                    overflowX: 'hidden', // Evita scroll horizontal no deseado
                    position: 'relative'
                }}
            >
                {activo && Contenido ? (
                    <Suspense 
                        fallback={
                            <div className="flex h-full w-full items-center justify-center text-[#5BC0DE] font-sans">
                                Cargando módulo...
                            </div>
                        }
                    >
                        <section
                            key={activo.id}
                            className={`contenido-modulo${activo ? " contenido-modulo--completo" : ""}`}
                            aria-label={activo.titulo}
                        >
                            <Contenido />
                        </section>
                    </Suspense>
                ) : (
                    <div className="estado-vacio" style={{ color: '#F4D6B0' }}>
                        <Lock size={32} />
                        <h2>Sin módulos disponibles</h2>
                        <p style={{ color: '#5BC0DE' }}>Tu rol todavía no tiene funciones asignadas. Pídele acceso al administrador.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;