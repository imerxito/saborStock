import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { ComandaServicio } from "../servicios/ComandaServicio";
import type { Comanda, EstadoComanda, NuevaComanda } from "../tipos/Comanda";

interface ComandasValor {
    comandas: Comanda[];
    cargando: boolean;
    conectadoBackend: boolean;
    recargar: () => Promise<void>;
    crear: (nueva: NuevaComanda) => Promise<Comanda>;
    cambiarEstado: (id: number, estado: EstadoComanda) => Promise<void>;
    anular: (id: number) => Promise<void>;
    eliminar: (id: number) => Promise<void>;
}

const ComandasContexto = createContext<ComandasValor | null>(null);

export function ComandasProvider({ children }: { children: ReactNode }) {
    const [comandas, setComandas] = useState<Comanda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [conectadoBackend, setConectadoBackend] = useState(false);
    const pollingRef = useRef<number | null>(null);

    const recargar = useCallback(async () => {
        try {
            const data = await ComandaServicio.obtenerComandas();
            setComandas(data);
            setConectadoBackend(true);
        } catch (err) {
            console.warn("Fallo al sincronizar con backend:", err);
            setConectadoBackend(false);
        } finally {
            setCargando(false);
        }
    }, []);

    // Polling silencioso en segundo plano cada 5 segundos (solo cuando la pestaña está visible)
    useEffect(() => {
        void recargar();

        pollingRef.current = window.setInterval(async () => {
            if (document.hidden) return;
            try {
                const data = await ComandaServicio.obtenerComandas();
                setComandas((prev) => {
                    if (prev.length === data.length) {
                        let igual = true;
                        for (let i = 0; i < prev.length; i++) {
                            if (
                                prev[i].id !== data[i].id ||
                                prev[i].estado !== data[i].estado ||
                                prev[i].despachadaEn !== data[i].despachadaEn ||
                                prev[i].items.length !== data[i].items.length
                            ) {
                                igual = false;
                                break;
                            }
                        }
                        if (igual) return prev;
                    }
                    return data;
                });
                setConectadoBackend(true);
            } catch {
                setConectadoBackend(false);
            }
        }, 5000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [recargar]);

    const crear = useCallback(async (nueva: NuevaComanda): Promise<Comanda> => {
        const comandaCreada = await ComandaServicio.crearComanda(nueva);
        setComandas((prev) => [comandaCreada, ...prev.filter((c) => c.id !== comandaCreada.id)]);
        // Sincronizar en segundo plano
        void recargar();
        return comandaCreada;
    }, [recargar]);

    const cambiarEstado = useCallback(async (id: number, nuevoEstado: EstadoComanda) => {
        await ComandaServicio.cambiarEstado(id, nuevoEstado);
        const ahora = Date.now();
        setComandas((prev) =>
            prev.map((c) => {
                if (c.id !== id) return c;
                const despachadaEn =
                    nuevoEstado === "Lista" || nuevoEstado === "Entregada" || nuevoEstado === "Cerrado"
                        ? ahora
                        : c.despachadaEn;
                return { ...c, estado: nuevoEstado, despachadaEn };
            })
        );
        void recargar();
    }, [recargar]);

    const anular = useCallback(async (id: number) => {
        await ComandaServicio.anularComanda(id);
        setComandas((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const eliminar = useCallback(async (id: number) => {
        await ComandaServicio.eliminarComanda(id);
        setComandas((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const valor = useMemo<ComandasValor>(
        () => ({
            comandas,
            cargando,
            conectadoBackend,
            recargar,
            crear,
            cambiarEstado,
            anular,
            eliminar,
        }),
        [comandas, cargando, conectadoBackend, recargar, crear, cambiarEstado, anular, eliminar]
    );

    return <ComandasContexto.Provider value={valor}>{children}</ComandasContexto.Provider>;
}

export function useComandas(): ComandasValor {
    const ctx = useContext(ComandasContexto);
    if (!ctx) throw new Error("useComandas debe usarse dentro de <ComandasProvider>");
    return ctx;
}
