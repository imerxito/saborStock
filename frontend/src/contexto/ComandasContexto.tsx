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

    // Polling silencioso en segundo plano cada 6 segundos
    useEffect(() => {
        void recargar();

        pollingRef.current = window.setInterval(async () => {
            try {
                const data = await ComandaServicio.obtenerComandas();
                setComandas(data);
                setConectadoBackend(true);
            } catch {
                setConectadoBackend(false);
            }
        }, 6000);

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
        setComandas((prev) =>
            prev.map((c) => {
                if (c.id !== id) return c;
                const despachadaEn =
                    nuevoEstado === "Lista" || nuevoEstado === "Entregada"
                        ? Date.now()
                        : c.despachadaEn;
                return { ...c, estado: nuevoEstado, despachadaEn };
            })
        );
    }, []);

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
