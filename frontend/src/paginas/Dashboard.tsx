import { useMemo, useState, Suspense, useRef } from "react";
import { LogOut, Lock, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import logo from "../assets/SaborYStock (1).png";
import { useAuth } from "../contexto/AuthContexto";
import { modulosPorRol } from "./secciones/Modulos";

function iniciales(nombre?: string) {
    if (!nombre) return "?";
    return nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    isDown.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  };

  const onMouseLeave = () => { isDown.current = false; };
  const onMouseUp = () => { isDown.current = false; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  return { ref, props: { onMouseDown, onMouseLeave, onMouseUp, onMouseMove } };
}

function Dashboard() {
    const { usuario, cerrarSesion } = useAuth();

    // Todos los módulos que el rol puede ver (incluye "asistente-ia")
    const modulos = useMemo(
        () => (usuario ? modulosPorRol(usuario.rol) : []),
        [usuario]
    );

    // 🆕 El asistente NO se renderiza en el aside; solo en el navbar
    const modulosSinIA = useMemo(
        () => modulos.filter((m) => m.id !== "asistente-ia"),
        [modulos]
    );

    const [idActivo, setIdActivo] = useState<string | null>(null);
    const [colapsado, setColapsado] = useState(false);
    const sidebarScroll = useDragScroll();

    const [hoveredMod, setHoveredMod] = useState<{ titulo: string; isActive: boolean; top: number; isLogout?: boolean } | null>(null);

    const activo = modulos.find((m) => m.id === idActivo) ?? modulosSinIA[0] ?? modulos[0];
    const Contenido = activo?.componente;

    // 🆕 ¿El rol tiene acceso al asistente? ¿Está activo ahora?
    const tieneIA = modulos.some((m) => m.id === "asistente-ia");
    const esIA = activo?.id === "asistente-ia";

    const nombreVisible =
        usuario?.nombre?.trim() || usuario?.correo?.split("@")[0] || "Usuario";

    return (
        <div 
            className="Contenedor"
            style={{ 
                backgroundColor: '#0B132B',
                color: '#F4D6B0',
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                position: 'relative',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
            }}
        >
            <style>{`
                *, *::before, *::after { box-sizing: border-box; }
                html, body, #root { width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden; }

                @keyframes dash-aparecer {
                    from { opacity: 0; transform: translateY(2px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .contenido-animado { animation: dash-aparecer 0.2s ease-out both; }

                .sidebar-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
                .sidebar-scroll::-webkit-scrollbar { width: 4px; }
                .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
                .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(91, 192, 222, 0.2); border-radius: 9999px; }
                .sidebar-scroll:hover::-webkit-scrollbar-thumb { background: rgba(91, 192, 222, 0.4); }

                /* 🆕 Ocultar textos largos en pantallas muy pequeñas */
                @media (max-width: 420px) {
                    .marca-texto { display: none !important; }
                    .asistente-texto { display: none !important; }
                }
                @media (max-width: 520px) {
                    .usuario-nombre { display: none !important; }
                }
            `}</style>
            
            {/* NAVBAR SUPERIOR FIJO */}
            {/* NAVBAR SUPERIOR FIJO */}
            <nav 
                style={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#1C2541', 
                    borderBottom: '1px solid #3A506B', 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    height: '60px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                    zIndex: 50,
                    width: '100vw',
                    gap: '0.5rem'
                }}
            >
                {/* IZQUIERDA: colapsar + [marca + Asistente juntos] */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                    <button
                        type="button"
                        onClick={() => setColapsado((c) => !c)}
                        aria-label={colapsado ? "Expandir menú" : "Contraer menú"}
                        title={colapsado ? "Expandir menú" : "Contraer menú"}
                        style={{ 
                            display: 'grid',
                            placeItems: 'center',
                            width: '36px',
                            height: '36px',
                            color: '#F4D6B0',
                            background: 'rgba(244, 214, 176, 0.08)',
                            border: '1px solid #3A506B',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        {colapsado ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>

                    {/* 🆕 Marca + Asistente como bloque unido */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                        <span
                            className="marca-texto"
                            style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#F4D6B0', whiteSpace: 'nowrap' }}
                        >
                            Sabor & Stock
                        </span>

                        {tieneIA && (
                            <button
                                type="button"
                                onClick={() => setIdActivo("asistente-ia")}
                                aria-label="Asistente IA"
                                aria-current={esIA ? "page" : undefined}
                                title="Asistente IA"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    padding: '0 9px',
                                    height: '32px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    backgroundColor: esIA ? 'rgba(91, 192, 222, 0.15)' : 'rgba(91, 192, 222, 0.08)',
                                    border: esIA ? '1.5px solid #5BC0DE' : '1px solid #3A506B',
                                    color: esIA ? '#5BC0DE' : '#F4D6B0',
                                    fontWeight: 600,
                                    fontSize: '0.78rem',
                                    transition: 'all 0.2s ease-out',
                                    boxShadow: esIA ? '0 0 12px rgba(91, 192, 222, 0.25)' : 'none',
                                }}
                            >
                                <Sparkles size={15} />
                                <span className="asistente-texto">Asistente</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* DERECHA: solo el perfil */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0B132B', border: '1px solid #3A506B', padding: '4px 10px', borderRadius: '12px', flexShrink: 0 }}>
                    <div
                        className="usuario-nombre"
                        style={{
                            color: '#F4D6B0',
                            fontSize: '0.8rem',
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <strong>{nombreVisible}</strong>
                    </div>
                    <div style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', backgroundColor: '#5BC0DE', color: '#0B132B', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                        {iniciales(nombreVisible)}
                    </div>
                </div>
            </nav>

            {/* MENÚ LATERAL FLOTANTE FIJO (ASIDE) — sin el módulo de IA */}
            <aside 
                aria-label="Módulos" 
                style={{ 
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    bottom: 0,
                    backgroundColor: '#1C2541', 
                    borderRight: colapsado ? 'none' : '1px solid #3A506B',
                    width: colapsado ? '0px' : '64px',
                    display: colapsado ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: colapsado ? '0' : '12px 0',
                    zIndex: 40,
                    overflow: 'hidden',
                    transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <div 
                    ref={sidebarScroll.ref}
                    {...sidebarScroll.props}
                    className="sidebar-scroll" 
                    onScroll={() => setHoveredMod(null)}
                    style={{ 
                        width: '100%', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '10px', 
                        cursor: 'grab',
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        minHeight: 0
                    }}
                >
                    {modulosSinIA.map((m) => {
                        const Icono = m.icono;
                        const esActivo = m.id === activo?.id;
                        
                        return (
                            <div key={m.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flexShrink: 0 }}>
                                <button
                                    type="button"
                                    onClick={() => setIdActivo(m.id)}
                                    aria-current={esActivo ? "page" : undefined}
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredMod({
                                            titulo: m.titulo,
                                            isActive: esActivo,
                                            top: rect.top + rect.height / 2
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredMod(null)}
                                    style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '40px',
                                        width: '40px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-out',
                                        backgroundColor: '#1C2541',
                                        border: esActivo ? '1.5px solid #5BC0DE' : '1px solid rgba(58, 80, 107, 0.4)',
                                        boxShadow: esActivo ? '0 0 10px rgba(91, 192, 222, 0.25)' : 'none',
                                    }}
                                >
                                    <Icono size={18} style={{ color: esActivo ? '#5BC0DE' : '#F4D6B0' }} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flexShrink: '0', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(58, 80, 107, 0.3)' }}>
                    <button
                        type="button"
                        onClick={cerrarSesion}
                        onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredMod({
                                titulo: 'Cerrar sesión',
                                isActive: false,
                                isLogout: true,
                                top: rect.top + rect.height / 2
                            });
                        }}
                        onMouseLeave={() => setHoveredMod(null)}
                        style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '40px',
                            width: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-out',
                            backgroundColor: '#1C2541',
                            border: '1px solid rgba(217, 119, 6, 0.3)'
                        }}
                    >
                        <LogOut size={18} style={{ color: '#D97706' }} />
                    </button>
                </div>
            </aside>

            {/* TOOLTIP DEL SIDEBAR */}
            {hoveredMod && !colapsado && (
                <div 
                    style={{ 
                        position: 'fixed',
                        pointerEvents: 'none',
                        zIndex: 100,
                        height: '40px',
                        padding: '0 16px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        whiteSpace: 'nowrap',
                        top: hoveredMod.top,
                        left: '60px',
                        transform: 'translateY(-50%)',
                        backgroundColor: '#1C2541', 
                        border: hoveredMod.isLogout ? '1px solid #D97706' : (hoveredMod.isActive ? '1.5px solid #5BC0DE' : '1px solid #3A506B'), 
                        color: hoveredMod.isLogout ? '#D97706' : (hoveredMod.isActive ? '#5BC0DE' : '#F4D6B0'),
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {hoveredMod.titulo}
                </div>
            )}

            {/* CONTENEDOR PRINCIPAL */}
            <main 
                style={{ 
                    position: 'absolute',
                    top: '60px',
                    left: colapsado ? '0px' : '64px',
                    right: 0,
                    bottom: 0,
                    height: 'calc(100vh - 60px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    backgroundColor: '#0B132B',
                    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {activo && Contenido ? (
                    <Suspense 
                        fallback={
                            <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', color: '#5BC0DE' }}>
                                Cargando módulo...
                            </div>
                        }
                    >
                        <section
                            key={activo.id}
                            className="contenido-animado"
                            style={{ width: '100%', height: '100%' }}
                            aria-label={activo.titulo}
                        >
                            <Contenido />
                        </section>
                    </Suspense>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center', padding: '20px' }}>
                        <Lock size={32} />
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Sin módulos disponibles</h2>
                        <p style={{ color: '#5BC0DE', fontSize: '0.9rem', margin: 0 }}>Tu rol todavía no tiene funciones asignadas. Pídele acceso al administrador.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;