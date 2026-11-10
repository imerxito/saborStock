import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    ChefHat,
    ChevronDown,
    ChevronUp,
    Clock,
    History,
    Play,
    RotateCcw,
    ShoppingBag,
    Table as TableIcon,
    Volume2,
    VolumeX,
    X,
    Settings,
    Timer,
    Trash2,
    Users,
    RefreshCw,
} from "lucide-react";
import { useComandas } from "../../contexto/ComandasContexto";
import { useAuth } from "../../contexto/AuthContexto";
import { CATEGORIAS, type CategoriaPlato, type Comanda } from "../../tipos/Comanda";
import { formatoHora, minutosDesde } from "../../utilidades/Fechas";

type Sonido = "rasgar" | "click" | "restaurar";
type FiltroCategoria = "TODOS" | CategoriaPlato;

interface Bloque {
    inicio: number;
    comandas: Comanda[];
}

const LS_ELIMINADAS = "cocina_eliminadas_ids";

function useAhora(cadaMs = 30_000) {
    const [ahora, setAhora] = useState(() => Date.now());
    useEffect(() => {
        const t = window.setInterval(() => setAhora(Date.now()), cadaMs);
        return () => window.clearInterval(t);
    }, [cadaMs]);
    return ahora;
}

function useSonido(activo: boolean) {
    const ctxRef = useRef<AudioContext | null>(null);
    return useCallback(
        (tipo: Sonido) => {
            if (!activo) return;
            try {
                const Ctx = window.AudioContext || (window as any).webkitAudioContext;
                if (!ctxRef.current) ctxRef.current = new Ctx();
                const ctx = ctxRef.current;
                if (ctx.state === "suspended") void ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                const t = ctx.currentTime;
                if (tipo === "rasgar") {
                    osc.type = "sawtooth";
                    osc.frequency.setValueAtTime(340, t);
                    osc.frequency.exponentialRampToValueAtTime(80, t + 0.16);
                    gain.gain.setValueAtTime(0.3, t);
                    gain.gain.linearRampToValueAtTime(0.01, t + 0.16);
                    osc.start();
                    osc.stop(t + 0.16);
                } else if (tipo === "click") {
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(600, t);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.linearRampToValueAtTime(0.01, t + 0.05);
                    osc.start();
                    osc.stop(t + 0.05);
                } else {
                    osc.type = "triangle";
                    osc.frequency.setValueAtTime(240, t);
                    osc.frequency.exponentialRampToValueAtTime(540, t + 0.2);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
                    osc.start();
                    osc.stop(t + 0.2);
                }
            } catch { /* sin audio */ }
        },
        [activo]
    );
}

function calcularBloques(cola: Comanda[], intervaloMin: number): Bloque[] {
    const blockMs = Math.max(1, intervaloMin) * 60 * 1000;
    const mapa = new Map<number, Comanda[]>();
    cola.forEach((c) => {
        const inicio = Math.floor(c.creada / blockMs) * blockMs;
        const lista = mapa.get(inicio) ?? [];
        lista.push(c);
        mapa.set(inicio, lista);
    });
    return [...mapa.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([inicio, lista]) => ({
            inicio,
            comandas: lista.sort((a, b) => a.creada - b.creada),
        }));
}

function leerEliminadas(): Set<number> {
    try {
        const raw = localStorage.getItem(LS_ELIMINADAS);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? new Set(arr as number[]) : new Set();
    } catch {
        return new Set();
    }
}

function Cocina() {
    const { comandas, cambiarEstado } = useComandas();
    const { usuario } = useAuth();
    const ahora = useAhora();

    const rol = String(usuario?.rol ?? "").toLowerCase();
    const esGerente = rol.includes("due") || rol.includes("admin");
    const esCocina = rol.includes("coc") || rol.includes("chef");
    const puedeOperar = esGerente || esCocina;
    const puedeConfigurar = esGerente;

    const [configAbierta, setConfigAbierta] = useState(false);
    const [intervaloMin, setIntervaloMin] = useState(60);
    const [corteCola, setCorteCola] = useState(0);
    const [corteHistorial, setCorteHistorial] = useState(0);

    // 🔹 IDs eliminados permanentemente (persisten en localStorage)
    const [eliminadas, setEliminadas] = useState<Set<number>>(() => leerEliminadas());

    useEffect(() => {
        try {
            localStorage.setItem(LS_ELIMINADAS, JSON.stringify([...eliminadas]));
        } catch { /* storage lleno o bloqueado */ }
    }, [eliminadas]);

    const [bloqueSel, setBloqueSel] = useState<number | "TODOS">("TODOS");
    const [sonido, setSonido] = useState(true);
    const [resumenAbierto, setResumenAbierto] = useState(false);
    const [historialAbierto, setHistorialAbierto] = useState(false);
    const [categoria, setCategoria] = useState<FiltroCategoria>("TODOS");
    const sonar = useSonido(sonido);

    const cola = useMemo(
        () =>
            comandas
                .filter((c) => !eliminadas.has(c.id))
                .filter(
                    (c) =>
                        (c.estado === "Pendiente" || c.estado === "En preparación") &&
                        c.creada >= corteCola
                )
                .sort((a, b) => a.creada - b.creada),
        [comandas, corteCola, eliminadas]
    );

    const historial = useMemo(
        () =>
            comandas
                .filter((c) => !eliminadas.has(c.id))
                .filter(
                    (c) =>
                        (c.estado === "Lista" || c.estado === "Entregada") &&
                        (c.despachadaEn ?? 0) >= corteHistorial
                )
                .sort((a, b) => (b.despachadaEn ?? 0) - (a.despachadaEn ?? 0)),
        [comandas, corteHistorial, eliminadas]
    );

    const bloques = useMemo(() => calcularBloques(cola, intervaloMin), [cola, intervaloMin]);

    const seleccion =
        bloqueSel !== "TODOS" && bloques.some((b) => b.inicio === bloqueSel) ? bloqueSel : "TODOS";

    const visibles = useMemo(
        () => (seleccion === "TODOS" ? bloques : bloques.filter((b) => b.inicio === seleccion)),
        [bloques, seleccion]
    );

    const itemsVisibles = useMemo(
        () => visibles.flatMap((b) => b.comandas).flatMap((c) => c.items),
        [visibles]
    );

    const totalPlatos = itemsVisibles.reduce((t, i) => t + i.cantidad, 0);
    const totalMesas = useMemo(
        () => new Set(visibles.flatMap((b) => b.comandas.map((c) => c.mesa))).size,
        [visibles]
    );

    const resumen = useMemo(() => {
        const mapa = new Map<string, { cantidad: number; categoria: CategoriaPlato; notas: string[] }>();
        itemsVisibles.forEach((it) => {
            if (categoria !== "TODOS" && it.categoria !== categoria) return;
            const cat: CategoriaPlato = (it.categoria ?? "Cocina") as CategoriaPlato;
            const actual = mapa.get(it.producto) ?? { cantidad: 0, categoria: cat, notas: [] as string[] };
            actual.cantidad += it.cantidad;
            if (it.nota && !actual.notas.includes(it.nota)) actual.notas.push(it.nota);
            mapa.set(it.producto, actual);
        });
        return [...mapa.entries()];
    }, [itemsVisibles, categoria]);

    const empezar = (id: number) => {
        if (!puedeOperar) return;
        sonar("click");
        cambiarEstado(id, "En preparación");
    };
    const despachar = (id: number) => {
        if (!puedeOperar) return;
        sonar("rasgar");
        cambiarEstado(id, "Lista");
    };
    const restaurar = (id: number) => {
        if (!puedeOperar) return;
        sonar("restaurar");
        cambiarEstado(id, "Pendiente");
    };

    // 🔹 Elimina una comanda del historial (permanente)
    const eliminarComandaHistorial = (id: number) => {
        if (!puedeOperar) return;
        if (!window.confirm("¿Eliminar esta comanda del historial?\n\nNo volverá a aparecer en la vista."))
            return;
        sonar("click");
        setEliminadas((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    // 🔹 Elimina TODO el historial actual (permanente)
    const eliminarHistorialCompleto = () => {
        if (!puedeOperar || historial.length === 0) return;
        if (
            !window.confirm(
                `¿Eliminar permanentemente las ${historial.length} comandas del historial?\n\nNo volverán a aparecer en la vista.`
            )
        )
            return;
        sonar("restaurar");
        setEliminadas((prev) => {
            const next = new Set(prev);
            historial.forEach((c) => next.add(c.id));
            return next;
        });
    };

    const resetearVista = () => {
        if (
            !window.confirm(
                "¿Reiniciar la vista de cocina?\n\nTodas las comandas actuales dejarán de mostrarse. Cuando el backend esté listo, se eliminarán definitivamente."
            )
        )
            return;
        setCorteCola(Date.now());
        setCorteHistorial(Date.now());
        setBloqueSel("TODOS");
        setConfigAbierta(false);
    };

    // "Limpiar Historial" en el modal → ahora elimina permanentemente
    const limpiarHistorial = () => {
        eliminarHistorialCompleto();
        setConfigAbierta(false);
    };

    const hayCorteActivo = corteCola > 0 || corteHistorial > 0;

    return (
        <div className="flex h-full flex-col font-sans text-[#F4D6B0] bg-[#0B132B] overflow-hidden">
            <header className="shrink-0 z-40 border-b border-[#3A506B] bg-[#1C2541] px-3 py-2.5 pt-[max(1rem,env(safe-area-inset-top))] shadow-xl sm:px-6 sm:py-3 sm:pt-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight sm:text-xl">
                            <ChefHat className="h-5 w-5 shrink-0 text-[#5BC0DE]" />
                            Cocina
                        </h2>
                        <p className="flex items-center gap-1 text-[11px] text-[#4ADE80] truncate mt-0.5">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                                En vivo · {cola.length} {cola.length === 1 ? "comanda" : "comandas"} en cola
                                {!puedeOperar && " · Modo lectura"}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {puedeConfigurar && (
                            <button
                                type="button"
                                onClick={() => {
                                    sonar("click");
                                    setConfigAbierta(true);
                                }}
                                className="rounded-xl border border-[#3A506B] bg-[#0B132B] p-2.5 transition hover:bg-[#1C2541] hover:border-[#5BC0DE] text-[#F4D6B0]"
                                title="Configuración de Cocina"
                            >
                                <Settings className="h-4 w-4" />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                sonar("click");
                                setHistorialAbierto(true);
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-[#3A506B] bg-[#0B132B] px-2.5 sm:px-3 py-2 text-xs transition hover:bg-[#1C2541] hover:border-[#5BC0DE] sm:text-sm"
                        >
                            <History className="h-4 w-4 text-[#5BC0DE]" />
                            <span className="hidden md:inline">Historial</span>
                            {historial.length > 0 && (
                                <span className="rounded-full border border-[#5BC0DE] bg-[#5BC0DE]/20 px-1.5 text-[10px] font-black text-[#5BC0DE]">
                                    {historial.length}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setSonido((s) => !s)}
                            className={`rounded-xl border p-2.5 transition ${
                                sonido
                                    ? "border-[#3A506B] bg-[#0B132B] hover:bg-[#1C2541] hover:border-[#5BC0DE] text-[#F4D6B0]"
                                    : "border-[#E57373]/50 bg-[#E57373]/10 text-[#E57373]"
                            }`}
                        >
                            {sonido ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {hayCorteActivo && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#D97706]/40 bg-[#D97706]/10 px-2.5 py-1.5 text-[10px] font-semibold text-[#D97706]">
                        <RefreshCw className="h-3 w-3" />
                        <span>Vista reiniciada · Mostrando solo lo nuevo</span>
                    </div>
                )}

                <div className="mt-2 flex items-center gap-2 overflow-x-auto border-t border-[#3A506B] pb-1 pt-2 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-[#5BC0DE]">
                        <Timer className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Bloques:</span>
                    </span>

                    <button
                        type="button"
                        onClick={() => setBloqueSel("TODOS")}
                        className={`shrink-0 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            seleccion === "TODOS"
                                ? "border-[#5BC0DE] bg-[#5BC0DE] text-[#0B132B]"
                                : "border-[#3A506B] bg-[#0B132B] text-[#F4D6B0] hover:bg-[#3A506B]/50"
                        }`}
                    >
                        Todos ({totalMesas} {totalMesas === 1 ? "mesa" : "mesas"})
                    </button>

                    {bloques.map((b) => {
                        const activo = seleccion === b.inicio;
                        return (
                            <button
                                key={b.inicio}
                                type="button"
                                onClick={() => setBloqueSel(b.inicio)}
                                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                                    activo
                                        ? "border-[#5BC0DE] bg-[#5BC0DE] text-[#0B132B]"
                                        : "border-[#3A506B] bg-[#0B132B] text-[#F4D6B0] hover:bg-[#3A506B]/50"
                                }`}
                            >
                                {formatoHora(b.inicio)}
                                <span
                                    className={`rounded-full px-1.5 text-[10px] font-black ${
                                        activo ? "bg-[#0B132B] text-[#5BC0DE]" : "bg-[#1C2541] text-[#F4D6B0]"
                                    }`}
                                >
                                    {b.comandas.length}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </header>

            <section className="flex-1 overflow-y-auto overscroll-contain p-2.5 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-36 bg-[#0B132B]">
                {bloques.length === 0 ? (
                    <div className="flex min-h-[50dvh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#3A506B] bg-[#1C2541]/40 p-6 text-center">
                        <CheckCircle2 className="mb-4 h-16 w-16 text-[#4ADE80]" />
                        <h3 className="text-xl font-bold text-[#F4D6B0]">¡Comandas al día!</h3>
                        <p className="mt-1 max-w-xs text-sm text-[#5BC0DE]">
                            No hay pedidos pendientes. Cuando un mesero envíe una comanda, aparece aquí.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 sm:space-y-8">
                        {visibles.map((b) => (
                            <div key={b.inicio} className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2 rounded-r-xl border-y border-l-4 border-r border-[#3A506B] border-l-[#5BC0DE] bg-[#1C2541] px-3 py-2 shadow-sm sm:gap-2.5 sm:px-4">
                                    <Clock className="h-4 w-4 shrink-0 text-[#5BC0DE] sm:h-5 sm:w-5" />
                                    <h3 className="text-sm font-black tracking-wide sm:text-lg text-[#F4D6B0]">
                                        Bloque de las {formatoHora(b.inicio)}
                                    </h3>
                                    <span className="rounded-full border border-[#3A506B] bg-[#0B132B] px-2.5 py-0.5 text-xs font-semibold text-[#5BC0DE]">
                                        {b.comandas.length} {b.comandas.length === 1 ? "comanda" : "comandas"}
                                    </span>
                                </div>

                                <div className="flex gap-3 overflow-x-auto pb-6 pt-1 px-1 touch-pan-x snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#3A506B] scrollbar-track-transparent [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[#3A506B] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0B132B]">
                                    {b.comandas.map((c) => (
                                        <div
                                            key={c.id}
                                            className="shrink-0 w-[270px] sm:w-[290px] snap-start"
                                        >
                                            <TicketCocina
                                                comanda={c}
                                                ahora={ahora}
                                                puedeOperar={puedeOperar}
                                                onEmpezar={() => empezar(c.id)}
                                                onDespachar={() => despachar(c.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* RESUMEN FLOTANTE */}
            <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-2 sm:right-6 z-[100] flex flex-col items-end w-full max-w-[calc(100vw-1rem)] sm:max-w-none pointer-events-none">
                <AnimatePresence>
                    {resumenAbierto && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="pointer-events-auto mb-2 sm:mb-3 flex max-h-[calc(100dvh-140px)] w-full sm:w-[460px] flex-col rounded-2xl border-2 border-[#3A506B] bg-[#1C2541] p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                        >
                            <div className="flex shrink-0 items-center justify-between border-b border-[#3A506B] pb-2.5 sm:pb-3">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-[#5BC0DE]" />
                                    <h3 className="text-sm font-bold sm:text-base text-[#F4D6B0]">Comidas acumuladas</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setResumenAbierto(false)}
                                    className="rounded-lg p-1.5 text-[#5BC0DE] hover:bg-[#3A506B] hover:text-[#F4D6B0]"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="my-2 flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[#3A506B] px-1 py-2 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {(["TODOS", ...CATEGORIAS] as FiltroCategoria[]).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategoria(cat)}
                                        className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition shrink-0 ${
                                            categoria === cat
                                                ? "bg-[#5BC0DE] text-[#0B132B]"
                                                : "bg-[#0B132B] text-[#F4D6B0] hover:bg-[#3A506B]"
                                        }`}
                                    >
                                        {cat === "TODOS" ? "Todos" : cat}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1.5 pt-1 touch-pan-y [scrollbar-width:thin] [scrollbar-color:#3A506B_#0B132B]">
                                {resumen.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-[#5BC0DE]">
                                        No hay platos pendientes en esta categoría.
                                    </p>
                                ) : (
                                    resumen.map(([nombre, datos]) => (
                                        <div
                                            key={nombre}
                                            className="flex items-center justify-between gap-2 sm:gap-3 rounded-xl border border-[#3A506B] bg-[#0B132B] p-2.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold leading-tight sm:text-sm text-[#F4D6B0] break-words">{nombre}</p>
                                                <span className="mt-1 inline-block rounded border border-[#3A506B] bg-[#1C2541] px-1.5 text-[9px] text-[#5BC0DE]">
                                                    {datos.categoria}
                                                </span>
                                                {datos.notas.length > 0 && (
                                                    <p className="mt-0.5 break-words text-[10px] text-[#FBBF24]">
                                                        Nota: {datos.notas.join(" | ")}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="shrink-0 rounded-lg border border-[#5BC0DE] bg-[#5BC0DE]/20 px-2.5 py-1 text-sm font-black text-[#5BC0DE]">
                                                x{datos.cantidad}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    type="button"
                    onClick={() => {
                        sonar("click");
                        setResumenAbierto((a) => !a);
                    }}
                    className="pointer-events-auto ml-auto flex items-center gap-2 rounded-full border-2 border-[#5BC0DE] bg-[#1C2541] px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-black shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition hover:bg-[#3A506B] active:scale-95 text-[#F4D6B0]"
                >
                    <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-[#5BC0DE]" />
                    <span className="sm:hidden">Resumen</span>
                    <span className="hidden sm:inline">Resumen de comidas</span>
                    <span className="rounded-full border border-[#3A506B] bg-[#0B132B] px-2 py-0.5 text-xs font-black text-[#5BC0DE]">
                        {totalPlatos}
                    </span>
                    {resumenAbierto ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
            </div>

            {/* HISTORIAL LATERAL */}
            <AnimatePresence>
                {historialAbierto && (
                    <div className="fixed inset-0 z-[900] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setHistorialAbierto(false)}
                            className="absolute inset-0 bg-[#0B132B]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative z-10 flex h-[100dvh] w-full max-w-md flex-col border-l border-[#3A506B] bg-[#1C2541] p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-4 shadow-2xl"
                        >
                            <div className="flex shrink-0 items-center justify-between border-b border-[#3A506B] pb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <History className="h-5 w-5 shrink-0 text-[#5BC0DE]" />
                                    <h3 className="text-base font-bold text-[#F4D6B0] truncate">Historial de despachadas</h3>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {puedeOperar && historial.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={eliminarHistorialCompleto}
                                            className="rounded-lg border border-[#E57373]/50 bg-[#E57373]/10 p-1.5 text-[#E57373] transition hover:bg-[#E57373]/20"
                                            title="Eliminar todo el historial"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setHistorialAbierto(false)}
                                        className="rounded-lg p-1.5 text-[#5BC0DE] hover:bg-[#3A506B] hover:text-[#F4D6B0]"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain py-3 pr-1">
                                {historial.length === 0 ? (
                                    <p className="py-12 text-center text-xs text-[#5BC0DE]">
                                        Aún no se ha despachado ninguna comanda.
                                    </p>
                                ) : (
                                    historial.slice(0, 50).map((c) => (
                                        <div key={c.id} className="space-y-2 rounded-xl border border-[#3A506B] bg-[#0B132B] p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3A506B] pb-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="flex items-center gap-1 text-xs font-black text-[#5BC0DE]">
                                                        <TableIcon className="h-3 w-3" />
                                                        Mesa {c.mesa}
                                                    </span>
                                                    <span className="text-[11px] text-[#F4D6B0]">
                                                        {c.mesero}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            c.estado === "Entregada"
                                                                ? "bg-[#4ADE80]/15 text-[#4ADE80]"
                                                                : "bg-[#FBBF24]/15 text-[#FBBF24]"
                                                        }`}
                                                    >
                                                        {c.estado}
                                                    </span>
                                                </div>
                                                {puedeOperar && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => restaurar(c.id)}
                                                            className="flex items-center gap-1 rounded-lg border border-[#5BC0DE] bg-[#5BC0DE]/20 px-2 py-1 text-[11px] font-bold text-[#5BC0DE] transition hover:bg-[#5BC0DE]/40"
                                                        >
                                                            <RotateCcw className="h-3 w-3" />
                                                            <span className="hidden sm:inline">Restaurar</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarComandaHistorial(c.id)}
                                                            className="rounded-lg border border-[#E57373]/50 bg-[#E57373]/10 p-1 text-[#E57373] transition hover:bg-[#E57373]/20"
                                                            title="Eliminar del historial"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-x-3 text-[10px] text-[#5BC0DE]">
                                                <span>Creada: {formatoHora(c.creada)}</span>
                                                <span>Despachada: {formatoHora(c.despachadaEn ?? c.creada, true)}</span>
                                            </div>

                                            <div className="space-y-1 pt-1">
                                                {c.items.map((i) => (
                                                    <div key={`${i.producto}-${i.nota ?? ""}`} className="flex justify-between gap-2 text-[11px] text-[#F4D6B0]">
                                                        <span className="min-w-0 break-words">• {i.producto}</span>
                                                        <span className="shrink-0 font-bold text-[#5BC0DE]">x{i.cantidad}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL CONFIGURACIÓN */}
            <AnimatePresence>
                {configAbierta && puedeConfigurar && (
                    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4">
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 260 }}
                            className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92dvh] overflow-hidden"
                        >
                            <div className="bg-[#0B132B] px-3 sm:px-6 py-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-3 border-b border-[#3A506B] flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base min-w-0">
                                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#5BC0DE] shrink-0" />
                                    <span className="truncate">Configuración de Cocina</span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setConfigAbierta(false)}
                                    className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B] shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-5 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B] pb-[max(1rem,env(safe-area-inset-bottom))]">
                                {/* SECCIÓN 1: INTERVALO */}
                                <div className="bg-[#0B132B]/50 border border-[#3A506B] rounded-xl p-3 sm:p-4">
                                    <label className="text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                        <Timer className="w-3.5 h-3.5 shrink-0" /> Intervalo de Bloques
                                    </label>
                                    <p className="text-[10px] sm:text-[11px] text-[#5BC0DE]/70 mb-2.5 leading-snug">
                                        Agrupa las comandas en filas según su hora de creación.
                                    </p>
                                    <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-1.5">
                                        {[15, 30, 60, 120].map((min) => (
                                            <button
                                                key={min}
                                                type="button"
                                                onClick={() => setIntervaloMin(min)}
                                                className={`py-2.5 rounded-xl border text-[11px] font-bold transition ${
                                                    intervaloMin === min
                                                        ? "bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE]"
                                                        : "bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]"
                                                }`}
                                            >
                                                {min === 60 ? "1 hr" : min === 120 ? "2 hr" : `${min} min`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* SECCIÓN 2: MANTENIMIENTO */}
                                <div>
                                    <label className="text-[11px] font-bold text-[#5BC0DE] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <Trash2 className="w-3.5 h-3.5 shrink-0" /> Mantenimiento
                                    </label>

                                    <div className="space-y-2">
                                        {/* Eliminar historial */}
                                        <div className="rounded-xl border border-[#E57373]/40 bg-[#E57373]/5 p-3">
                                            <div className="flex items-start gap-2 mb-2">
                                                <Trash2 className="w-4 h-4 text-[#E57373] shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-[#E57373]">Eliminar Historial</p>
                                                    <p className="text-[10px] text-[#E57373]/80 mt-0.5 leading-snug">
                                                        Elimina permanentemente las {historial.length} comandas despachadas. No volverán a aparecer.
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={limpiarHistorial}
                                                disabled={historial.length === 0}
                                                className="w-full bg-[#E57373]/15 hover:bg-[#E57373]/25 disabled:opacity-40 text-[#E57373] font-bold py-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1.5 border border-[#E57373]/30"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Eliminar Historial
                                            </button>
                                        </div>

                                        {/* Reiniciar vista */}
                                        <div className="rounded-xl border border-[#D97706]/40 bg-[#D97706]/5 p-3">
                                            <div className="flex items-start gap-2 mb-2">
                                                <RefreshCw className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-[#D97706]">Reiniciar Vista</p>
                                                    <p className="text-[10px] text-[#D97706]/80 mt-0.5 leading-snug">
                                                        Oculta TODAS las comandas actuales (cola e historial). Úsalo al cambiar de turno.
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={resetearVista}
                                                className="w-full bg-[#D97706]/15 hover:bg-[#D97706]/25 text-[#D97706] font-bold py-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1.5 border border-[#D97706]/30"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" /> Reiniciar Vista
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 3: FILTRO ACTIVO */}
                                {hayCorteActivo && (
                                    <div className="rounded-xl border border-[#4ADE80]/40 bg-[#4ADE80]/10 p-2.5 flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-[#4ADE80]">Filtro de vista activo</p>
                                            <p className="text-[10px] text-[#4ADE80]/80 mt-0.5 break-words">
                                                {corteCola > 0 && `Cola desde ${formatoHora(corteCola)}. `}
                                                {corteHistorial > 0 && `Historial desde ${formatoHora(corteHistorial)}.`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* SECCIÓN 4: NOTA INFORMATIVA */}
                                <div className="rounded-xl bg-[#0B132B]/50 border border-[#3A506B] p-2.5">
                                    <p className="text-[10px] text-[#5BC0DE]/70 leading-relaxed">
                                        <strong className="text-[#5BC0DE]">Nota:</strong> Las comandas eliminadas del historial se guardan localmente en este dispositivo y no volverán a aparecer. Para eliminarlas definitivamente de la base de datos compartida, se requiere implementar el endpoint correspondiente en el backend.
                                    </p>
                                </div>
                            </div>

                            <div className="sm:hidden shrink-0 border-t border-[#3A506B] bg-[#0B132B] px-3 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                                <button
                                    type="button"
                                    onClick={() => setConfigAbierta(false)}
                                    className="w-full bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-bold py-2.5 rounded-xl text-xs transition"
                                >
                                    Listo
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================
// TICKET DE COCINA (con max-h y scroll interno en items)
// ============================================================
function TicketCocina({
    comanda,
    ahora,
    puedeOperar,
    onEmpezar,
    onDespachar,
}: {
    comanda: Comanda;
    ahora: number;
    puedeOperar: boolean;
    onEmpezar: () => void;
    onDespachar: () => void;
}) {
    const [rasgando, setRasgando] = useState(false);
    const minutos = minutosDesde(comanda.creada, ahora);

    const insignia =
        minutos > 20
            ? "bg-[#E57373] text-white animate-pulse"
            : minutos > 10
              ? "bg-[#FBBF24] text-[#0B132B]"
              : "bg-[#1C2541] text-[#F4D6B0] border border-[#3A506B]";

    const rasgar = () => {
        if (rasgando || !puedeOperar) return;
        setRasgando(true);
        window.setTimeout(onDespachar, 450);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={
                rasgando
                    ? { y: 180, rotate: 12, opacity: 0, scale: 0.9 }
                    : { y: 0, rotate: 0, opacity: 1, scale: 1 }
            }
            transition={{ duration: rasgando ? 0.45 : 0.25, ease: "easeIn" }}
            // 🔧 max-h para que los botones no queden fuera de pantalla en móvil
            className="relative flex select-none flex-col rounded-t-md border-t-4 border-[#5BC0DE] bg-[#FFF8E7] p-3 font-mono text-xs text-[#0B132B] shadow-xl h-full max-h-[calc(100dvh-220px)]"
        >
            <AnimatePresence>
                {rasgando && (
                    <motion.div
                        initial={{ scale: 2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 z-30 flex items-center justify-center rounded-t-md bg-[#0B132B]/20 backdrop-blur-[1px]"
                    >
                        <span className="-rotate-12 rounded-lg border-4 border-[#5BC0DE] bg-[#FFF8E7] px-4 py-1.5 text-xl font-black uppercase tracking-wider text-[#5BC0DE] shadow-2xl">
                            Despachado
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contenido scrolleable si hay muchos items */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:#C5BFA9_transparent]">
                <div className="mb-2 border-b border-dashed border-[#C5BFA9] pb-2">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-[#5BC0DE] bg-[#0B132B]">
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[6px] font-bold uppercase text-[#5BC0DE] tracking-wider">Mesa</span>
                                    <span className="text-base font-black text-[#F4D6B0]">{comanda.mesa}</span>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="flex items-center gap-1 text-[10px] font-bold text-[#0B132B] truncate">
                                    <Users className="h-3 w-3 shrink-0 text-[#3A506B]" />
                                    <span className="truncate">{comanda.mesero}</span>
                                </p>
                                <p className="text-[10px] font-mono text-[#3A506B] mt-0.5">
                                    <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                                    {formatoHora(comanda.creada)}
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${insignia}`}>
                                {minutos} min
                            </span>
                            {comanda.estado === "En preparación" && (
                                <span className="whitespace-nowrap rounded-full bg-[#5BC0DE] px-2 py-0.5 font-sans text-[9px] font-bold text-[#0B132B]">
                                    En prep.
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-[9px] font-mono text-[#3A506B]">
                        CMD #{comanda.id}
                    </p>
                </div>

                {comanda.nota && (
                    <div className="mb-2.5 flex items-start gap-1 rounded border-l-2 border-[#FBBF24] bg-[#EAE4D2] p-1.5 font-sans text-[10px] font-semibold">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-[#FBBF24]" />
                        <span className="min-w-0 break-words text-[#0B132B]">{comanda.nota}</span>
                    </div>
                )}

                <div className="mb-3 space-y-1.5">
                    {comanda.items.map((it) => (
                        <div
                            key={`${it.producto}-${it.nota ?? ""}`}
                            className="border-b border-[#EAE4D2] pb-1 last:border-none"
                        >
                            <div className="flex items-start justify-between font-sans gap-2">
                                <span className="min-w-0 flex-1 break-words text-xs font-bold leading-tight text-[#0B132B]">
                                    {it.producto}
                                </span>
                                <span className="shrink-0 rounded bg-[#0B132B] px-1.5 py-0.5 text-[10px] font-black text-[#FFF8E7]">
                                    x{it.cantidad}
                                </span>
                            </div>
                            {it.nota && (
                                <p className="mt-0.5 break-words pl-1 font-sans text-[10px] font-bold text-[#E57373]">
                                    * {it.nota}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Botones fijos al fondo del ticket */}
            <div className="shrink-0 flex flex-col gap-1.5 border-t border-dashed border-[#C5BFA9] pt-2">
                {puedeOperar ? (
                    <>
                        {comanda.estado === "Pendiente" && (
                            <button
                                type="button"
                                onClick={onEmpezar}
                                disabled={rasgando}
                                className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg border border-[#5BC0DE] px-3 py-2 font-sans text-xs font-bold text-[#0B132B] transition hover:bg-[#5BC0DE]/10 disabled:opacity-50"
                            >
                                <Play className="h-3.5 w-3.5 text-[#5BC0DE]" />
                                Empezar a preparar
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={rasgar}
                            disabled={rasgando}
                            className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#0B132B] px-3 py-2 font-sans text-xs font-bold text-[#F4D6B0] shadow transition hover:bg-[#1C2541] active:scale-95 disabled:opacity-70"
                        >
                            <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
                            Rasgar / Despachar
                        </button>
                    </>
                ) : (
                    <div className="flex items-center justify-center gap-1 rounded-lg border border-[#3A506B]/30 bg-[#EAE4D2] px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-wider text-[#3A506B]">
                        <Users className="h-3 w-3" />
                        Solo lectura
                    </div>
                )}
            </div>

            <div className="pointer-events-none absolute -bottom-3 left-0 right-0 h-3 overflow-hidden">
                <svg
                    className="h-full w-full fill-current text-[#FFF8E7]"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 10"
                    aria-hidden="true"
                >
                    <polygon points="0,0 5,10 10,0 15,10 20,0 25,10 30,0 35,10 40,0 45,10 50,0 55,10 60,0 65,10 70,0 75,10 80,0 85,10 90,0 95,10 100,0" />
                </svg>
            </div>
        </motion.div>
    );
}

export default Cocina;