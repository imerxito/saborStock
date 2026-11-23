import { useState } from "react";
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
    Printer,
} from "lucide-react";
import { CATEGORIAS, type Comanda } from "../../tipos/Comanda";
import FormatoTicketTermico from "../../componentes/FormatoTicketTermico";
import {
    useCocina,
    type FiltroCategoria,
} from "./hooks/useCocina";

// ============================================================
// TICKET DE COCINA (visual, sin lógica propia)
// ============================================================
function TicketCocina({
    comanda,
    ahora,
    puedeOperar,
    onEmpezar,
    onDespachar,
    onImprimir,
    formatoHora,
    minutosDesde,
}: {
    comanda: Comanda;
    ahora: number;
    puedeOperar: boolean;
    onEmpezar: () => void;
    onDespachar: () => void;
    onImprimir?: () => void;
    formatoHora: (ts: number | null | undefined, corto?: boolean) => string;
    minutosDesde: (ts: number | null | undefined, ahora: number) => number;
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
                                    <span className="text-[6px] font-bold uppercase text-[#5BC0DE] tracking-wider">{comanda.mesa > 0 ? "Mesa" : "Caja"}</span>
                                    <span className="text-base font-black text-[#F4D6B0]">{comanda.mesa > 0 ? comanda.mesa : "Venta"}</span>
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
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] font-mono text-[#3A506B]">
                            CMD #{comanda.id}
                        </p>
                        {onImprimir && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onImprimir(); }}
                                className="flex items-center gap-1 text-[9px] font-bold text-[#0B132B] bg-[#C5BFA9]/30 hover:bg-[#C5BFA9]/60 px-1.5 py-0.5 rounded transition"
                                title="Imprimir comanda térmica"
                            >
                                <Printer className="h-2.5 w-2.5 text-[#0B132B]" />
                                Imprimir
                            </button>
                        )}
                    </div>
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

// ============================================================
// COCINA — solo JSX, toda la lógica viene de useCocina
// ============================================================
function Cocina() {
    const {
        // Estado
        ahora,
        cola,
        historial,
        historialFiltrado,
        bloques,
        visibles,
        seleccion,
        resumen,
        totalPlatos,
        totalMesas,
        configAbierta,
        intervaloMin,
        sonido,
        resumenAbierto,
        historialAbierto,
        busquedaHistorial,
        filtroEstadoHistorial,
        restaurandoId,
        mensajeFeedback,
        comandaAImprimir,
        negocioConfig,
        categoria,
        hayCorteActivo,
        corteCola,
        corteHistorial,
        // Permisos
        puedeOperar,
        puedeConfigurar,
        conectadoBackend,
        // Setters
        setConfigAbierta,
        setIntervaloMin,
        setSonido,
        setResumenAbierto,
        setHistorialAbierto,
        setBusquedaHistorial,
        setFiltroEstadoHistorial,
        setMensajeFeedback,
        setCategoria,
        setBloqueSel,
        // Handlers
        empezar,
        despachar,
        restaurar,
        eliminarComandaHistorial,
        eliminarHistorialCompleto,
        resetearVista,
        limpiarHistorial,
        limpiarFiltroEliminadas,
        despacharImpresionFisica,
        recargar,
        sonar,
        // Utilidades
        formatoHora,
        minutosDesde,
    } = useCocina();

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
                        <p className={`flex items-center gap-1 text-[10px] font-semibold truncate mt-0.5 ${conectadoBackend ? "text-[#4ADE80]" : "text-[#D97706]"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${conectadoBackend ? "bg-[#4ADE80] animate-pulse" : "bg-[#D97706]"}`} />
                            {conectadoBackend ? "Backend conectado" : "Sin conexión al backend"}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => { sonar("click"); void recargar(); }}
                            className="rounded-xl border border-[#3A506B] bg-[#0B132B] p-2.5 transition hover:bg-[#1C2541] hover:border-[#5BC0DE] text-[#F4D6B0]"
                            title="Actualizar comandas ahora"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
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
                                                onImprimir={() => despacharImpresionFisica(c)}
                                                formatoHora={formatoHora}
                                                minutosDesde={minutosDesde}
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
                                    <div>
                                        <h3 className="text-base font-bold text-[#F4D6B0] leading-tight truncate">
                                            Historial de comandas
                                        </h3>
                                        <p className="text-[10px] text-[#5BC0DE]/70">
                                            {historial.length} {historial.length === 1 ? "comanda registrada" : "comandas registradas"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => void recargar()}
                                        className="rounded-lg border border-[#3A506B] bg-[#0B132B] p-1.5 text-[#5BC0DE] transition hover:bg-[#3A506B] hover:text-[#F4D6B0]"
                                        title="Actualizar historial"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </button>
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

                            {/* Banner de feedback si se restaura o elimina */}
                            {mensajeFeedback && (
                                <div className={`mt-2 p-2 rounded-lg text-[11px] flex items-center justify-between gap-2 transition ${
                                    mensajeFeedback.tipo === "exito"
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                }`}>
                                    <span className="font-semibold">{mensajeFeedback.texto}</span>
                                    <button
                                        type="button"
                                        onClick={() => setMensajeFeedback(null)}
                                        className="text-inherit hover:opacity-75"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Filtros de estado rápido */}
                            <div className="pt-2 flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setFiltroEstadoHistorial("TODOS")}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                        filtroEstadoHistorial === "TODOS"
                                            ? "bg-[#5BC0DE] text-[#0B132B]"
                                            : "bg-[#0B132B] text-[#5BC0DE] border border-[#3A506B] hover:bg-[#3A506B]/40"
                                    }`}
                                >
                                    Todas ({historial.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFiltroEstadoHistorial("DESPACHADAS")}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                        filtroEstadoHistorial === "DESPACHADAS"
                                            ? "bg-[#5BC0DE] text-[#0B132B]"
                                            : "bg-[#0B132B] text-[#5BC0DE] border border-[#3A506B] hover:bg-[#3A506B]/40"
                                    }`}
                                >
                                    Despachadas ({historial.filter((c) => c.estado === "Lista" || c.estado === "Entregada").length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFiltroEstadoHistorial("CERRADAS")}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                        filtroEstadoHistorial === "CERRADAS"
                                            ? "bg-[#5BC0DE] text-[#0B132B]"
                                            : "bg-[#0B132B] text-[#5BC0DE] border border-[#3A506B] hover:bg-[#3A506B]/40"
                                    }`}
                                >
                                    Cerradas ({historial.filter((c) => c.estado === "Cerrado").length})
                                </button>
                            </div>

                            {/* Buscador en historial */}
                            <div className="pt-2 relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por #CMD, mesa, cliente, plato..."
                                    value={busquedaHistorial}
                                    onChange={(e) => setBusquedaHistorial(e.target.value)}
                                    className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl pl-3 pr-8 py-1.5 text-xs text-[#F4D6B0] placeholder-[#5BC0DE]/50 focus:outline-none focus:border-[#5BC0DE]"
                                />
                                {busquedaHistorial && (
                                    <button
                                        type="button"
                                        onClick={() => setBusquedaHistorial("")}
                                        className="absolute right-2.5 top-3.5 text-[#5BC0DE] hover:text-[#F4D6B0]"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain py-3 pr-1">
                                {historialFiltrado.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-[#5BC0DE] space-y-2">
                                        <p>
                                            {historial.length === 0
                                                ? "Aún no se ha despachado ninguna comanda en esta sesión."
                                                : "No hay comandas que coincidan con la búsqueda o filtro."}
                                        </p>
                                        {(busquedaHistorial || filtroEstadoHistorial !== "TODOS") && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBusquedaHistorial("");
                                                    setFiltroEstadoHistorial("TODOS");
                                                }}
                                                className="text-xs font-bold text-[#5BC0DE] underline hover:text-[#F4D6B0]"
                                            >
                                                Restablecer filtros
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    historialFiltrado.slice(0, 100).map((c) => {
                                        const estaRestaurando = restaurandoId === c.id;
                                        return (
                                            <div key={c.id} className="space-y-2 rounded-xl border border-[#3A506B] bg-[#0B132B] p-3 transition hover:border-[#5BC0DE]/60">
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3A506B] pb-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[10px] font-mono font-bold text-[#5BC0DE] bg-[#1C2541] px-1.5 py-0.5 rounded border border-[#3A506B]">
                                                            #{c.id}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs font-black text-[#5BC0DE]">
                                                            <TableIcon className="h-3 w-3" />
                                                            {c.mesa > 0 ? `Mesa ${c.mesa}` : "Caja"}
                                                        </span>
                                                        <span className="text-[11px] text-[#F4D6B0]">
                                                            {c.mesero}
                                                        </span>
                                                        {c.cliente && (
                                                            <span className="text-[10px] text-[#F4D6B0]/70 italic truncate max-w-[120px]">
                                                                ({c.cliente})
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                c.estado === "Entregada"
                                                                    ? "bg-[#4ADE80]/15 text-[#4ADE80]"
                                                                    : c.estado === "Cerrado"
                                                                      ? "bg-[#5BC0DE]/20 text-[#5BC0DE]"
                                                                      : "bg-[#FBBF24]/15 text-[#FBBF24]"
                                                            }`}
                                                        >
                                                            {c.estado === "Cerrado" ? "Cerrada / Pagada" : c.estado}
                                                        </span>
                                                    </div>
                                                    {puedeOperar && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => despacharImpresionFisica(c)}
                                                                className="flex items-center gap-1 rounded-lg border border-[#5BC0DE]/40 bg-[#5BC0DE]/10 px-2 py-1 text-[11px] font-bold text-[#5BC0DE] transition hover:bg-[#5BC0DE]/30"
                                                                title="Reimprimir comanda en la impresora conectada"
                                                            >
                                                                <Printer className="h-3 w-3" />
                                                                <span className="hidden sm:inline">Imprimir</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void restaurar(c.id)}
                                                                disabled={restaurandoId !== null}
                                                                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition shadow-sm ${
                                                                    estaRestaurando
                                                                        ? "border-[#5BC0DE] bg-[#5BC0DE]/30 text-[#5BC0DE] cursor-wait opacity-80"
                                                                        : "border-[#5BC0DE] bg-[#5BC0DE]/20 text-[#5BC0DE] hover:bg-[#5BC0DE] hover:text-[#0B132B]"
                                                                }`}
                                                                title="Restaurar comanda a la cola de preparación en cocina"
                                                            >
                                                                {estaRestaurando ? (
                                                                    <>
                                                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                                                        <span>Restaurando...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <RotateCcw className="h-3 w-3" />
                                                                        <span>Restaurar</span>
                                                                    </>
                                                                )}
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

                                                <div className="space-y-1 pt-1 border-t border-[#3A506B]/40">
                                                    {c.items.map((i, idx) => (
                                                        <div key={`${c.id}-${i.producto}-${idx}`} className="flex justify-between gap-2 text-[11px] text-[#F4D6B0]">
                                                            <span className="min-w-0 break-words">• {i.producto} {i.nota ? <span className="text-[#FBBF24] text-[10px] font-semibold italic">({i.nota})</span> : null}</span>
                                                            <span className="shrink-0 font-bold text-[#5BC0DE]">x{i.cantidad}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
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
                                        <strong className="text-[#5BC0DE]">Sincronización:</strong> El historial de comandas y sus estados se sincronizan en tiempo real con la base de datos compartida y con Caja.
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

            {/* FORMATO TÉRMICO ESC/POS (80mm) PARA IMPRESIÓN */}
            {comandaAImprimir && (
                <FormatoTicketTermico
                    tipo="comanda"
                    negocio={negocioConfig}
                    titulo="COMANDA DE COCINA"
                    mesa={comandaAImprimir.mesa > 0 ? comandaAImprimir.mesa : "Venta Directa"}
                    cliente={comandaAImprimir.cliente}
                    mesero={comandaAImprimir.mesero}
                    nombreImpresora="Cocina"
                    items={comandaAImprimir.items.map((it) => ({
                        nombre: it.producto,
                        cantidad: it.cantidad,
                        nota: it.nota,
                    }))}
                />
            )}
        </div>
    );
}

export default Cocina;
