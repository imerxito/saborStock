import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useComandas } from "../../../contexto/ComandasContexto";
import { useAuth } from "../../../contexto/AuthContexto";
import { type CategoriaPlato, type Comanda } from "../../../tipos/Comanda";
import { formatoHora, minutosDesde } from "../../../utilidades/Fechas";
import { ConfiguracionServicio, type ConfiguracionNegocio } from "../../../servicios/ConfiguracionServicio";

export type Sonido = "rasgar" | "click" | "restaurar";
export type FiltroCategoria = "TODOS" | CategoriaPlato;

export interface Bloque {
    inicio: number;
    comandas: Comanda[];
}

const LS_ELIMINADAS = "cocina_eliminadas_ids";

export function useAhora(cadaMs = 30_000) {
    const [ahora, setAhora] = useState(() => Date.now());
    useEffect(() => {
        const t = window.setInterval(() => setAhora(Date.now()), cadaMs);
        return () => window.clearInterval(t);
    }, [cadaMs]);
    return ahora;
}

export function useSonido(activo: boolean) {
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

export function calcularBloques(cola: Comanda[], intervaloMin: number): Bloque[] {
    const blockMs = Math.max(1, intervaloMin) * 60 * 1000;
    const mapa = new Map<number, Comanda[]>();
    cola.forEach((c) => {
        const t = typeof c.creada === "number" && !isNaN(c.creada) && c.creada > 0 ? c.creada : Date.now();
        const inicio = Math.floor(t / blockMs) * blockMs;
        const lista = mapa.get(inicio) ?? [];
        lista.push({ ...c, creada: t });
        mapa.set(inicio, lista);
    });
    return [...mapa.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([inicio, lista]) => ({
            inicio,
            comandas: lista.sort((a, b) => (a.creada || 0) - (b.creada || 0)),
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

export function useCocina() {
    const { comandas, cambiarEstado, conectadoBackend, recargar, eliminar } = useComandas();
    const { usuario } = useAuth();
    const ahora = useAhora();

    const rol = String(usuario?.rol ?? "").toLowerCase();
    const esGerente = rol.includes("due") || rol.includes("admin");
    const esCocina = rol.includes("coc") || rol.includes("chef");
    const puedeOperar = esGerente || esCocina ;
    const puedeConfigurar = esGerente;

    const [configAbierta, setConfigAbierta] = useState(false);
    const [intervaloMin, setIntervaloMin] = useState(60);
    const [corteCola, setCorteCola] = useState(0);
    const [corteHistorial, setCorteHistorial] = useState(0);
    const [eliminadas, setEliminadas] = useState<Set<number>>(() => leerEliminadas());

    useEffect(() => {
        try {
            localStorage.setItem(LS_ELIMINADAS, JSON.stringify([...eliminadas]));
        } catch { /* storage lleno */ }
    }, [eliminadas]);

    const [bloqueSel, setBloqueSel] = useState<number | "TODOS">("TODOS");
    const [sonido, setSonido] = useState(true);
    const [resumenAbierto, setResumenAbierto] = useState(false);
    const [historialAbierto, setHistorialAbierto] = useState(false);
    const [busquedaHistorial, setBusquedaHistorial] = useState("");
    const [filtroEstadoHistorial, setFiltroEstadoHistorial] = useState<"TODOS" | "DESPACHADAS" | "CERRADAS">("TODOS");
    const [restaurandoId, setRestaurandoId] = useState<number | null>(null);
    const [mensajeFeedback, setMensajeFeedback] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
    const [comandaAImprimir, setComandaAImprimir] = useState<Comanda | null>(null);
    const [negocioConfig, setNegocioConfig] = useState<ConfiguracionNegocio | null>(null);
    const [categoria, setCategoria] = useState<FiltroCategoria>("TODOS");
    const sonar = useSonido(sonido);

    useEffect(() => {
        ConfiguracionServicio.obtenerNegocio().then(setNegocioConfig).catch(() => {});
    }, []);

    useEffect(() => {
        if (comandaAImprimir) {
            const timer = setTimeout(() => {
                window.print();
                setComandaAImprimir(null);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [comandaAImprimir]);

    const despacharImpresionFisica = async (c: Comanda) => {
        try {
            const imps = await ConfiguracionServicio.listarImpresoras();
            const activas = (imps || []).filter((i) => i.activa);
            let enviadaDirecta = false;
            for (const imp of activas) {
                const res = await ConfiguracionServicio.imprimirComandaDirecta(imp.id, {
                    mesa: c.mesa > 0 ? c.mesa : "Venta Directa",
                    cliente: c.cliente,
                    mesero: c.mesero,
                    items: c.items.map((it) => ({
                        nombre: it.producto,
                        cantidad: it.cantidad,
                        nota: it.nota,
                    })),
                });
                if (res.success) enviadaDirecta = true;
            }
            if (enviadaDirecta) {
                alert("✓ Comanda enviada exitosamente a la impresora física conectada.");
                return;
            }
        } catch {}
        setComandaAImprimir(c);
    };

    const cola = useMemo(
        () =>
            comandas
                .filter((c) =>
                    c.estado === "Pendiente" ||
                    c.estado === "En preparación" ||
                    c.estado === "Abierto" ||
                    c.estado === "Enviado"
                )
                .filter((c) => !eliminadas.has(c.id) || c.estado === "Pendiente" || c.estado === "En preparación")
                .filter((c) => !corteCola || (c.creada || 0) >= corteCola)
                .sort((a, b) => (a.creada || 0) - (b.creada || 0)),
        [comandas, corteCola, eliminadas]
    );

    const historial = useMemo(
        () =>
            comandas
                .filter((c) => !eliminadas.has(c.id))
                .filter(
                    (c) =>
                        c.estado !== "Pendiente" &&
                        c.estado !== "En preparación" &&
                        c.estado !== "Abierto" &&
                        c.estado !== "Enviado" &&
                        (c.estado === "Lista" || c.estado === "Entregada" || c.estado === "Cerrado") &&
                        (!corteHistorial || (c.despachadaEn ?? c.creada ?? 0) >= corteHistorial)
                )
                .sort((a, b) => (b.despachadaEn ?? b.creada ?? 0) - (a.despachadaEn ?? a.creada ?? 0)),
        [comandas, corteHistorial, eliminadas]
    );

    const historialFiltrado = useMemo(() => {
        let lista = historial;
        if (filtroEstadoHistorial === "DESPACHADAS") {
            lista = lista.filter((c) => c.estado === "Lista" || c.estado === "Entregada");
        } else if (filtroEstadoHistorial === "CERRADAS") {
            lista = lista.filter((c) => c.estado === "Cerrado");
        }

        const q = busquedaHistorial.trim().toLowerCase();
        if (!q) return lista;
        return lista.filter((c) =>
            (c.mesa > 0 ? `mesa ${c.mesa}` : "caja").includes(q) ||
            (c.mesero || "").toLowerCase().includes(q) ||
            (c.cliente || "").toLowerCase().includes(q) ||
            String(c.id).includes(q) ||
            c.items.some((it) => it.producto.toLowerCase().includes(q) || (it.nota || "").toLowerCase().includes(q))
        );
    }, [historial, busquedaHistorial, filtroEstadoHistorial]);

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

    const ejecutarCambioEstado = async (id: number, estado: "En preparación" | "Lista" | "Pendiente", sonidoTipo: Sonido) => {
        if (!puedeOperar) return;
        sonar(sonidoTipo);
        try {
            setEliminadas((prev) => {
                if (prev.has(id)) {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                }
                return prev;
            });
            await cambiarEstado(id, estado);
        } catch (err) {
            alert('Error al actualizar la comanda: ' + (err instanceof Error ? err.message : 'Error desconocido'));
        }
    };

    const empezar = (id: number) => { void ejecutarCambioEstado(id, "En preparación", "click"); };
    const despachar = (id: number) => { void ejecutarCambioEstado(id, "Lista", "rasgar"); };

    const restaurar = async (id: number) => {
        if (!puedeOperar || restaurandoId !== null) return;
        setRestaurandoId(id);
        setMensajeFeedback(null);
        try {
            setEliminadas((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            await cambiarEstado(id, "Pendiente");
            sonar("restaurar");
            setMensajeFeedback({
                tipo: "exito",
                texto: `Comanda #${id} restaurada exitosamente a la cola de preparación.`,
            });
            setTimeout(() => {
                setMensajeFeedback((actual) => (actual?.texto.includes(`#${id}`) ? null : actual));
            }, 4000);
        } catch (err) {
            console.error("Error al restaurar comanda:", err);
            const msg = err instanceof Error ? err.message : "Error desconocido al restaurar";
            setMensajeFeedback({ tipo: "error", texto: `No se pudo restaurar comanda #${id}: ${msg}` });
        } finally {
            setRestaurandoId(null);
        }
    };

    const limpiarFiltroEliminadas = () => {
        setEliminadas(new Set());
        try {
            localStorage.removeItem(LS_ELIMINADAS);
        } catch {}
    };

    const eliminarComandaHistorial = async (id: number) => {
        if (!puedeOperar) return;
        if (!window.confirm("¿Eliminar esta comanda del historial?\n\nSe eliminará definitivamente.")) return;
        sonar("click");
        setEliminadas((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        try {
            await eliminar(id);
        } catch (e) {
            console.warn("No se pudo eliminar en backend:", e);
        }
    };

    const eliminarHistorialCompleto = async () => {
        if (!puedeOperar || historial.length === 0) return;
        if (!window.confirm(`¿Eliminar definitivamente las ${historial.length} comandas del historial?\n\nNo volverán a aparecer.`)) return;
        sonar("restaurar");
        const ids = historial.map((c) => c.id);
        setEliminadas((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.add(id));
            return next;
        });
        try {
            await Promise.all(ids.map((id) => eliminar(id)));
        } catch (e) {
            console.warn("Fallo parcial al eliminar historial en backend:", e);
        }
    };

    const resetearVista = () => {
        if (!window.confirm("¿Reiniciar la vista de cocina?\n\nTodas las comandas actuales dejarán de mostrarse.")) return;
        setCorteCola(Date.now());
        setCorteHistorial(Date.now());
        setBloqueSel("TODOS");
        setConfigAbierta(false);
    };

    const limpiarHistorial = () => {
        eliminarHistorialCompleto();
        setConfigAbierta(false);
    };

    const hayCorteActivo = corteCola > 0 || corteHistorial > 0;

    return {
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
        // Utilidades exportadas
        formatoHora,
        minutosDesde,
    };
}
