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
    Layers,
    Play,
    RotateCcw,
    ShoppingBag,
    Table as TableIcon,
    Volume2,
    VolumeX,
    X,
} from "lucide-react";
import { useComandas } from "../../contexto/ComandasContexto";
import { CATEGORIAS, type CategoriaPlato, type Comanda } from "../../tipos/Comanda";
import { formatoHora, inicioBloque, minutosDesde } from "../../utilidades/Fechas";

type Sonido = "rasgar" | "click" | "restaurar";
type FiltroCategoria = "TODOS" | CategoriaPlato;

interface MesaEnCola {
    mesa: number;
    comandas: Comanda[];
}

interface Bloque {
    inicio: number;
    mesas: MesaEnCola[];
}

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
                const Ctx =
                    window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext })
                        .webkitAudioContext;
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
            } catch {
                // Sin audio
            }
        },
        [activo]
    );
}

function Cocina() {
    const { comandas, cambiarEstado } = useComandas();
    const ahora = useAhora();

    const [bloqueSel, setBloqueSel] = useState<number | "TODOS">("TODOS");
    const [abiertas, setAbiertas] = useState<Record<string, number>>({});
    const [sonido, setSonido] = useState(true);
    const [resumenAbierto, setResumenAbierto] = useState(false);
    const [historialAbierto, setHistorialAbierto] = useState(false);
    const [categoria, setCategoria] = useState<FiltroCategoria>("TODOS");
    const sonar = useSonido(sonido);

    const cola = useMemo(
        () =>
            comandas
                .filter((c) => c.estado === "Pendiente" || c.estado === "En preparación")
                .sort((a, b) => a.creada - b.creada),
        [comandas]
    );

    const historial = useMemo(
        () =>
            comandas
                .filter((c) => c.estado === "Lista" || c.estado === "Entregada")
                .sort((a, b) => (b.despachadaEn ?? 0) - (a.despachadaEn ?? 0)),
        [comandas]
    );

    const bloques = useMemo<Bloque[]>(() => {
        const mapa = new Map<number, Map<number, Comanda[]>>();
        cola.forEach((c) => {
            const inicio = inicioBloque(c.creada);
            const mesas = mapa.get(inicio) ?? new Map<number, Comanda[]>();
            mesas.set(c.mesa, [...(mesas.get(c.mesa) ?? []), c]);
            mapa.set(inicio, mesas);
        });
        return [...mapa.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([inicio, mesas]) => ({
                inicio,
                mesas: [...mesas.entries()]
                    .sort((a, b) => a[0] - b[0])
                    .map(([mesa, lista]) => ({ mesa, comandas: lista })),
            }));
    }, [cola]);

    const seleccion = bloqueSel !== "TODOS" && bloques.some((b) => b.inicio === bloqueSel) ? bloqueSel : "TODOS";

    const visibles = useMemo(
        () => (seleccion === "TODOS" ? bloques : bloques.filter((b) => b.inicio === seleccion)),
        [bloques, seleccion]
    );

    const itemsVisibles = useMemo(
        () => visibles.flatMap((b) => b.mesas).flatMap((m) => m.comandas).flatMap((c) => c.items),
        [visibles]
    );

    const totalPlatos = itemsVisibles.reduce((t, i) => t + i.cantidad, 0);
    const totalMesas = bloques.reduce((t, b) => t + b.mesas.length, 0);

    const resumen = useMemo(() => {
        const mapa = new Map<string, { cantidad: number; categoria: CategoriaPlato; notas: string[] }>();
        itemsVisibles.forEach((it) => {
            if (categoria !== "TODOS" && it.categoria !== categoria) return;

            const categoriaItem: CategoriaPlato = (it.categoria ?? "Cocina") as CategoriaPlato;
            const actual = mapa.get(it.producto) ?? {
                cantidad: 0,
                categoria: categoriaItem,
                notas: [] as string[],
            };

            actual.cantidad += it.cantidad;
            if (it.nota && !actual.notas.includes(it.nota)) actual.notas.push(it.nota);
            mapa.set(it.producto, actual);
        });
        return [...mapa.entries()];
    }, [itemsVisibles, categoria]);

    const elegir = (clave: string, id: number) => {
        sonar("click");
        setAbiertas((prev) => ({ ...prev, [clave]: id }));
    };
    const empezar = (id: number) => {
        sonar("click");
        cambiarEstado(id, "En preparación");
    };
    const despachar = (id: number) => {
        sonar("rasgar");
        cambiarEstado(id, "Lista");
    };
    const restaurar = (id: number) => {
        sonar("restaurar");
        cambiarEstado(id, "Pendiente");
    };

    return (
        <div className="relative min-h-screen flex flex-col font-sans text-[#F4D6B0] bg-[#0B132B]">
            {/* ---------- Barra superior ---------- */}
            <header className="sticky top-0 z-40 border-b border-[#3A506B] bg-[#1C2541] px-3 py-3 shadow-xl sm:px-6">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight sm:text-xl">
                            <ChefHat className="h-5 w-5 text-[#5BC0DE]" />
                            Cocina
                        </h2>
                        <p className="flex items-center gap-1 text-[11px] text-[#4ADE80]">
                            <Clock className="h-3 w-3" />
                            En vivo · {cola.length} {cola.length === 1 ? "comanda" : "comandas"} en cola
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                sonar("click");
                                setHistorialAbierto(true);
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-[#3A506B] bg-[#0B132B] px-3 py-1.5 text-xs transition hover:bg-[#1C2541] hover:border-[#5BC0DE] sm:text-sm"
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
                            className={`rounded-xl border p-2 transition ${
                                sonido
                                    ? "border-[#3A506B] bg-[#0B132B] hover:bg-[#1C2541] hover:border-[#5BC0DE] text-[#F4D6B0]"
                                    : "border-[#E57373]/50 bg-[#E57373]/10 text-[#E57373]"
                            }`}
                            title={sonido ? "Sonido activado" : "Sonido silenciado"}
                            aria-label={sonido ? "Silenciar sonido" : "Activar sonido"}
                        >
                            {sonido ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Bloques horarios */}
                <div className="mt-2.5 flex items-center gap-2 overflow-x-auto border-t border-[#3A506B] pb-1 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-[#5BC0DE]">
                        <Clock className="h-3.5 w-3.5" />
                        Horarios:
                    </span>

                    <button
                        type="button"
                        onClick={() => setBloqueSel("TODOS")}
                        className={`whitespace-nowrap rounded-xl border px-3 py-1 text-xs font-bold transition ${
                            seleccion === "TODOS"
                                ? "border-[#5BC0DE] bg-[#5BC0DE] text-[#0B132B]"
                                : "border-[#3A506B] bg-[#0B132B] text-[#F4D6B0] hover:bg-[#3A506B]/50"
                        }`}
                    >
                        Todos ({totalMesas} {totalMesas === 1 ? "mesa" : "mesas"})
                    </button>

                    {bloques.map((b) => {
                        const activo = seleccion === b.inicio;
                        const total = b.mesas.reduce((t, m) => t + m.comandas.length, 0);
                        return (
                            <button
                                key={b.inicio}
                                type="button"
                                onClick={() => setBloqueSel(b.inicio)}
                                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1 text-xs font-bold transition ${
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
                                    {total}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* ---------- Tablero ---------- */}
            <section className="flex-1 p-3 pb-36 sm:p-5 sm:pb-36 bg-[#0B132B]">
                {bloques.length === 0 ? (
                    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#3A506B] bg-[#1C2541]/40 p-6 text-center">
                        <CheckCircle2 className="mb-4 h-16 w-16 text-[#4ADE80]" />
                        <h3 className="text-xl font-bold text-[#F4D6B0]">¡Comandas al día!</h3>
                        <p className="mt-1 max-w-xs text-sm text-[#5BC0DE]">
                            No hay pedidos pendientes. Cuando un mesero envíe una comanda, aparece aquí.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {visibles.map((b) => (
                            <div key={b.inicio} className="space-y-3">
                                <div className="flex items-center gap-2.5 rounded-r-xl border-y border-l-4 border-r border-[#3A506B] border-l-[#5BC0DE] bg-[#1C2541] px-4 py-2 shadow-sm">
                                    <Clock className="h-5 w-5 text-[#5BC0DE]" />
                                    <h3 className="text-base font-black tracking-wide sm:text-lg text-[#F4D6B0]">
                                        Bloque de las {formatoHora(b.inicio)}
                                    </h3>
                                    <span className="rounded-full border border-[#3A506B] bg-[#0B132B] px-2.5 py-0.5 text-xs font-semibold text-[#5BC0DE]">
                                        {b.mesas.length} {b.mesas.length === 1 ? "mesa" : "mesas"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {b.mesas.map((m) => {
                                        const clave = `${b.inicio}-${m.mesa}`;
                                        return (
                                            <TarjetaMesa
                                                key={clave}
                                                mesa={m.mesa}
                                                comandas={m.comandas}
                                                idAbierta={abiertas[clave]}
                                                ahora={ahora}
                                                onElegir={(id) => elegir(clave, id)}
                                                onEmpezar={empezar}
                                                onDespachar={despachar}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ---------- Resumen flotante ANCLADO AL FLUJO INFERIOR DERECHO (Se desplaza con el scroll de la página) ---------- */}
            <div className="sticky bottom-6 ml-auto mr-6 z-[100] flex flex-col items-end pointer-events-auto pb-6 w-fit">
                <AnimatePresence>
                    {resumenAbierto && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="mb-3 flex max-h-[70vh] w-[92vw] flex-col rounded-2xl border-2 border-[#3A506B] bg-[#1C2541] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] sm:w-[460px]"
                        >
                            <div className="flex items-center justify-between border-b border-[#3A506B] pb-3">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-[#5BC0DE]" />
                                    <h3 className="text-sm font-bold sm:text-base text-[#F4D6B0]">Comidas acumuladas</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setResumenAbierto(false)}
                                    className="rounded-lg p-1 text-[#5BC0DE] hover:bg-[#3A506B] hover:text-[#F4D6B0]"
                                    aria-label="Cerrar resumen"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Contenedor con barra de desplazamiento horizontal agarrable para ver todas las categorías */}
                            <div className="my-2 flex items-center gap-1.5 overflow-x-auto border-b border-[#3A506B] py-2 px-1 cursor-grab active:cursor-grabbing [scrollbar-width:thin] [scrollbar-color:#3A506B_#0B132B] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-[#3A506B] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0B132B]">
                                {(["TODOS", ...CATEGORIAS] as FiltroCategoria[]).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategoria(cat)}
                                        className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold transition shrink-0 ${
                                            categoria === cat
                                                ? "bg-[#5BC0DE] text-[#0B132B]"
                                                : "bg-[#0B132B] text-[#F4D6B0] hover:bg-[#3A506B]"
                                        }`}
                                    >
                                        {cat === "TODOS" ? "Todos" : cat}
                                    </button>
                                ))}
                            </div>

                            {/* Contenedor con barra de desplazamiento vertical agarrable para la lista de platos */}
                            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-2 pt-2 cursor-grab active:cursor-grabbing [scrollbar-width:thin] [scrollbar-color:#3A506B_#0B132B] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[#3A506B] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0B132B]">
                                {resumen.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-[#5BC0DE]">
                                        No hay platos pendientes en esta categoría.
                                    </p>
                                ) : (
                                    resumen.map(([nombre, datos]) => (
                                        <div
                                            key={nombre}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-[#3A506B] bg-[#0B132B] p-2.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-xs font-bold sm:text-sm text-[#F4D6B0]">{nombre}</p>
                                                    <span className="rounded border border-[#3A506B] bg-[#1C2541] px-1.5 text-[9px] text-[#5BC0DE]">
                                                        {datos.categoria}
                                                    </span>
                                                </div>
                                                {datos.notas.length > 0 && (
                                                    <p className="mt-0.5 truncate text-[10px] text-[#FBBF24]">
                                                        Nota: {datos.notas.join(" | ")}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="rounded-lg border border-[#5BC0DE] bg-[#5BC0DE]/20 px-2.5 py-1 text-sm font-black text-[#5BC0DE]">
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
                    className="flex items-center gap-2 rounded-full border-2 border-[#5BC0DE] bg-[#1C2541] px-4 py-3 text-sm font-black shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition hover:bg-[#3A506B] active:scale-95 text-[#F4D6B0]"
                >
                    <ChefHat className="h-5 w-5 text-[#5BC0DE]" />
                    <span>Resumen de comidas</span>
                    <span className="rounded-full border border-[#3A506B] bg-[#0B132B] px-2 py-0.5 text-xs font-black text-[#5BC0DE]">
                        {totalPlatos}
                    </span>
                    {resumenAbierto ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
            </div>

            {/* ---------- Historial lateral ---------- */}
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
                            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#3A506B] bg-[#1C2541] p-4 shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-[#3A506B] pb-3">
                                <div className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-[#5BC0DE]" />
                                    <h3 className="text-base font-bold text-[#F4D6B0]">Historial de despachadas</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHistorialAbierto(false)}
                                    className="rounded-lg p-1 text-[#5BC0DE] hover:bg-[#3A506B] hover:text-[#F4D6B0]"
                                    aria-label="Cerrar historial"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto py-3 pr-1">
                                {historial.length === 0 ? (
                                    <p className="py-12 text-center text-xs text-[#5BC0DE]">
                                        Aún no se ha despachado ninguna comanda.
                                    </p>
                                ) : (
                                    historial.slice(0, 50).map((c) => (
                                        <div
                                            key={c.id}
                                            className="space-y-2 rounded-xl border border-[#3A506B] bg-[#0B132B] p-3"
                                        >
                                            <div className="flex items-center justify-between border-b border-[#3A506B] pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-[#F4D6B0]">CMD #{c.id}</span>
                                                    <span className="text-xs font-bold text-[#5BC0DE]">Mesa {c.mesa}</span>
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
                                                <button
                                                    type="button"
                                                    onClick={() => restaurar(c.id)}
                                                    className="flex items-center gap-1 rounded-lg border border-[#5BC0DE] bg-[#5BC0DE]/20 px-2.5 py-1 text-xs font-bold text-[#5BC0DE] transition hover:bg-[#5BC0DE]/40"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                    Restaurar
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] text-[#5BC0DE]">
                                                <span>Creada: {formatoHora(c.creada)}</span>
                                                <span>Despachada: {formatoHora(c.despachadaEn ?? c.creada, true)}</span>
                                            </div>

                                            <div className="space-y-1 pt-1">
                                                {c.items.map((i) => (
                                                    <div
                                                        key={`${i.producto}-${i.nota ?? ""}`}
                                                        className="flex justify-between text-xs text-[#F4D6B0]"
                                                    >
                                                        <span>• {i.producto}</span>
                                                        <span className="font-bold text-[#5BC0DE]">x{i.cantidad}</span>
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
        </div>
    );
}

function TarjetaMesa({
    mesa,
    comandas,
    idAbierta,
    ahora,
    onElegir,
    onEmpezar,
    onDespachar,
}: {
    mesa: number;
    comandas: Comanda[];
    idAbierta: number | undefined;
    ahora: number;
    onElegir: (id: number) => void;
    onEmpezar: (id: number) => void;
    onDespachar: (id: number) => void;
}) {
    const abierta = comandas.some((c) => c.id === idAbierta) ? idAbierta : comandas[0].id;

    return (
        <div className="rounded-2xl border border-[#3A506B] bg-[#1C2541] p-3.5 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b border-[#3A506B] pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="rounded-xl border border-[#3A506B] bg-[#0B132B] p-2 text-[#5BC0DE]">
                        <TableIcon className="h-4 w-4" />
                    </div>
                    <h4 className="text-base font-black tracking-wide text-[#F4D6B0]">Mesa {mesa}</h4>
                </div>
                <span className="rounded-lg border border-[#3A506B] bg-[#0B132B] px-2.5 py-1 text-xs font-extrabold text-[#F4D6B0]">
                    {comandas.length} {comandas.length === 1 ? "comanda" : "comandas"}
                </span>
            </div>

            <div className="flex flex-col pb-4">
                {comandas.map((c, idx) => {
                    const activa = c.id === abierta;
                    const anteriorActiva = idx > 0 && comandas[idx - 1].id === abierta;
                    const margen = idx === 0 ? 0 : activa ? 8 : anteriorActiva ? 18 : -10;

                    return (
                        <motion.div
                            key={c.id}
                            layout="position"
                            style={{ marginTop: margen, zIndex: activa ? 15 : idx + 1 }}
                            className="relative"
                        >
                            <Ticket
                                comanda={c}
                                activa={activa}
                                ahora={ahora}
                                onElegir={() => onElegir(c.id)}
                                onEmpezar={() => onEmpezar(c.id)}
                                onDespachar={() => onDespachar(c.id)}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function Ticket({
    comanda,
    activa,
    ahora,
    onElegir,
    onEmpezar,
    onDespachar,
}: {
    comanda: Comanda;
    activa: boolean;
    ahora: number;
    onElegir: () => void;
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
        if (rasgando) return;
        setRasgando(true);
        window.setTimeout(onDespachar, 450);
    };

    if (!activa) {
        return (
            <button
                type="button"
                onClick={onElegir}
                className="flex w-full items-center justify-between rounded-xl border border-[#F4D6B0] bg-[#FFF8E7] p-2.5 text-left text-xs font-bold text-[#0B132B] shadow-md transition hover:bg-[#F0EBDC]"
            >
                <span className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-[#5BC0DE]" />
                    <span className="font-extrabold text-[#0B132B]">CMD #{comanda.id}</span>
                    <span className="text-[10px] font-normal text-[#3A506B]">
                        ({comanda.items.length} {comanda.items.length === 1 ? "ítem" : "ítems"})
                    </span>
                </span>
                <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#3A506B]">{formatoHora(comanda.creada)}</span>
                    <span className="rounded bg-[#5BC0DE] px-2 py-0.5 text-[10px] font-black text-[#0B132B]">
                        Abrir
                    </span>
                </span>
            </button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={
                rasgando
                    ? { y: 180, rotate: 12, opacity: 0, scale: 0.9 }
                    : { y: 0, rotate: 0, opacity: 1, scale: 1 }
            }
            transition={{ duration: rasgando ? 0.45 : 0.25, ease: "easeIn" }}
            className="relative flex select-none flex-col justify-between rounded-t-md border-t-4 border-[#5BC0DE] bg-[#FFF8E7] p-3.5 font-mono text-xs text-[#0B132B] shadow-xl"
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

            <div>
                <div className="mb-2 flex items-center justify-between border-b border-dashed border-[#C5BFA9] pb-2">
                    <div>
                        <span className="block text-sm font-black text-[#0B132B]">CMD #{comanda.id}</span>
                        <span className="text-[10px] text-[#3A506B]">
                            {formatoHora(comanda.creada)} • Mesero: {comanda.mesero}
                        </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${insignia}`}>
                            {minutos} min
                        </span>
                        {comanda.estado === "En preparación" && (
                            <span className="rounded-full bg-[#5BC0DE] px-2 py-0.5 font-sans text-[10px] font-bold text-[#0B132B]">
                                En preparación
                            </span>
                        )}
                    </div>
                </div>

                {comanda.nota && (
                    <div className="mb-2.5 flex items-start gap-1 rounded border-l-2 border-[#FBBF24] bg-[#EAE4D2] p-1.5 font-sans text-[11px] font-semibold">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FBBF24]" />
                        <span className="text-[#0B132B]">{comanda.nota}</span>
                    </div>
                )}

                <div className="mb-3 space-y-2">
                    {comanda.items.map((it) => (
                        <div
                            key={`${it.producto}-${it.nota ?? ""}`}
                            className="border-b border-[#EAE4D2] pb-1.5 last:border-none"
                        >
                            <div className="flex items-start justify-between font-sans">
                                <span className="flex-1 text-xs font-bold leading-tight text-[#0B132B] sm:text-sm">
                                    {it.producto}
                                </span>
                                <span className="ml-2 rounded bg-[#0B132B] px-1.5 py-0.5 text-xs font-black text-[#FFF8E7]">
                                    x{it.cantidad}
                                </span>
                            </div>
                            {it.nota && (
                                <p className="mt-0.5 pl-1 font-sans text-[10px] font-bold text-[#E57373]">
                                    * {it.nota}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-dashed border-[#C5BFA9] pt-2">
                {comanda.estado === "Pendiente" && (
                    <button
                        type="button"
                        onClick={onEmpezar}
                        disabled={rasgando}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#5BC0DE] px-3 py-2 font-sans text-xs font-bold text-[#0B132B] transition hover:bg-[#5BC0DE]/10 disabled:opacity-50"
                    >
                        <Play className="h-3.5 w-3.5 text-[#5BC0DE]" />
                        Empezar a preparar
                    </button>
                )}
                <button
                    type="button"
                    onClick={rasgar}
                    disabled={rasgando}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0B132B] px-3 py-2 font-sans text-xs font-bold text-[#F4D6B0] shadow transition hover:bg-[#1C2541] active:scale-95 disabled:opacity-70"
                >
                    <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
                    Rasgar / Despachar
                </button>
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