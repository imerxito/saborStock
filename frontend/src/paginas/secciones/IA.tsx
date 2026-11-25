import { useEffect, useRef, useState } from "react";
import {
    Sparkles,
    Send,
    Paperclip,
    Upload,
    X,
    FileSpreadsheet,
    Image as ImageIcon,
    MessageSquare,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Plus,
    Download,
    Trash2,
    Copy,
    Check,
    User,
} from "lucide-react";
import { IaServicio, type ConversacionIA, type FilaExcelPreview } from "../../servicios/IaServicio";
import { useAuth } from "../../contexto/AuthContexto";
import FormatoContenidoIA from "../../componentes/FormatoContenidoIA";

/* ============================================================
   TIPOS
   ============================================================ */
type TabIA = "chat" | "excel";

type RolMensajeIA = "user" | "assistant" | "system";

interface MensajeIA {
    id: string;
    rol: RolMensajeIA;
    contenido: string;
    fecha: Date;
}

interface ProductoMenu {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen?: string;
    tipo: "cocina" | "directo" | "paquete";
}

/* ============================================================
   HELPERS
   ============================================================ */
const formatoCOP = (valor: number) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(valor);

const generarId = () => Math.random().toString(36).slice(2, 10);

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
export default function AsistenteIA() {
    const [tab, setTab] = useState<TabIA>("chat");

    return (
        <div className="h-[100dvh] sm:h-full w-full flex flex-col bg-[#0B132B] overflow-hidden text-[#F4D6B0] font-sans antialiased selection:bg-[#5BC0DE]/40">
            
            {/* CABECERA FIJA CON TABS (z-10 para no tapar el nav lateral) */}
            <div className="shrink-0 w-full flex flex-col z-10 bg-[#0B132B]">
                <header className="bg-[#1C2541] border-b border-[#3A506B] px-3 sm:px-4 md:px-6 py-2">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2.5 mb-3 mt-1 sm:mt-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#5BC0DE]/10 flex items-center justify-center border border-[#5BC0DE]/30 shrink-0">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#5BC0DE]" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-xl font-bold tracking-tight text-[#F4D6B0]">Asistente IA</h2>
                                <p className="hidden sm:block text-[11px] text-[#5BC0DE] uppercase tracking-wider font-semibold">
                                    Gemini 3.5 Flash-Lite • Solo gerencia
                                </p>
                            </div>
                        </div>

                        {/* TABS con scroll horizontal */}
                        <nav className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <TabBoton
                                activo={tab === "chat"}
                                onClick={() => setTab("chat")}
                                icono={<MessageSquare size={14} />}
                                texto="Chat Operativo"
                            />
                            <TabBoton
                                activo={tab === "excel"}
                                onClick={() => setTab("excel")}
                                icono={<FileSpreadsheet size={14} />}
                                texto="Carga Masiva"
                            />
                        </nav>
                    </div>
                </header>
            </div>

            {/* CONTENIDO PRINCIPAL (Ocupa el resto de la pantalla) */}
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {tab === "chat" && <SeccionChat />}
                {tab === "excel" && (
                    <div className="flex-1 overflow-y-auto w-full pb-[calc(5rem+env(safe-area-inset-bottom))] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <SeccionExcel />
                    </div>
                )}
            </main>
        </div>
    );
}

/* ============================================================
   BOTÓN DE TAB
   ============================================================ */
function TabBoton({
    activo,
    onClick,
    icono,
    texto,
}: {
    activo: boolean;
    onClick: () => void;
    icono: React.ReactNode;
    texto: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-sm font-semibold whitespace-nowrap shrink-0 border transition-all",
                activo
                    ? "bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-sm"
                    : "bg-transparent text-[#F4D6B0] border-transparent hover:bg-[#3A506B]/50",
            ].join(" ")}
        >
            {icono}
            {texto}
        </button>
    );
}

/* ============================================================
   SECCIÓN 1: CHAT
   ============================================================ */
function SeccionChat() {
    const { usuario } = useAuth();
    const idUsuarioActual = (() => {
        const id = Number((usuario as any)?.idUsuario ?? (usuario as any)?.id_usuario);
        return Number.isFinite(id) && id > 0 ? id : null;
    })();

    const mensajeBienvenida = (): MensajeIA => ({
        id: "welcome",
        rol: "assistant",
        contenido:
            "Hola 👋 Soy tu asistente inteligente de **SaborStock**. Puedo analizar ventas, propinas por mesero, stock crítico, nómina y guiarte en cualquier módulo de la app. ¿Qué necesitas consultar hoy?\n\n> **Tip:** Puedo mostrarte tablas con propinas por mesero, elegir porcentaje de propina, ver las categorías más vendidas y mucho más. ¡Pregúntame con detalle!",
        fecha: new Date(),
    });

    const [conversaciones, setConversaciones] = useState<ConversacionIA[]>([]);
    const [conversacionId, setConversacionId] = useState<number | null>(null);
    const [cargandoConversaciones, setCargandoConversaciones] = useState(false);
    const [cargandoMensajes, setCargandoMensajes] = useState(false);
    const [mensajes, setMensajes] = useState<MensajeIA[]>([mensajeBienvenida()]);
    const [texto, setTexto] = useState("");
    const [enviando, setEnviando] = useState(false);
    const finRef = useRef<HTMLDivElement>(null);

    const cargarConversaciones = async () => {
        setCargandoConversaciones(true);
        try {
            const data = await IaServicio.listarConversaciones(idUsuarioActual);
            setConversaciones(data || []);
        } catch (error) {
            console.warn("No se pudieron cargar las conversaciones IA:", error);
            setConversaciones([]);
        } finally {
            setCargandoConversaciones(false);
        }
    };

    useEffect(() => {
        void cargarConversaciones();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idUsuarioActual]);

    useEffect(() => {
        finRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes, enviando]);

    const seleccionarConversacion = async (id: number | null) => {
        setConversacionId(id);
        if (id == null) {
            setMensajes([mensajeBienvenida()]);
            return;
        }
        setCargandoMensajes(true);
        try {
            const data = await IaServicio.obtenerConversacion(id);
            const historial = (data.mensajes || []).map((m) => ({
                id: String(m.id),
                rol: m.rol,
                contenido: m.contenido,
                fecha: new Date(m.fecha),
            }));
            setMensajes(historial.length > 0 ? historial : [mensajeBienvenida()]);
        } catch (error: any) {
            alert(`No se pudo cargar la conversación: ${error?.message || "error desconocido"}`);
            setConversacionId(null);
            setMensajes([mensajeBienvenida()]);
        } finally {
            setCargandoMensajes(false);
        }
    };

    const eliminarConversacion = async () => {
        if (conversacionId == null) return;
        if (!window.confirm("¿Eliminar esta conversación del asistente? Esta acción no se puede deshacer.")) return;
        try {
            await IaServicio.eliminarConversacion(conversacionId);
            await seleccionarConversacion(null);
            await cargarConversaciones();
        } catch (error: any) {
            alert(`No se pudo eliminar la conversación: ${error?.message || "error desconocido"}`);
        }
    };

    const enviar = async (consultaDirecta?: string) => {
        const limpio = (consultaDirecta ?? texto).trim();
        if (!limpio || enviando) return;

        const nuevo: MensajeIA = {
            id: generarId(),
            rol: "user",
            contenido: limpio,
            fecha: new Date(),
        };
        setMensajes((prev) => [...prev, nuevo]);
        if (!consultaDirecta) setTexto("");
        setEnviando(true);

        try {
            const resultado = await IaServicio.chat(limpio, {
                conversacionId,
                idUsuario: idUsuarioActual,
            });
            setConversacionId(resultado.conversacionId);
            setMensajes((prev) => [
                ...prev,
                {
                    id: generarId(),
                    rol: "assistant",
                    contenido: resultado.respuesta,
                    fecha: new Date(),
                },
            ]);
            void cargarConversaciones();
        } catch (error: any) {
            setMensajes((prev) => [
                ...prev,
                {
                    id: generarId(),
                    rol: "assistant",
                    contenido: `No pude consultar el asistente: ${error?.message || "error desconocido"}. Verifica que el backend esté activo.`,
                    fecha: new Date(),
                },
            ]);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            {/* Barra superior de conversaciones */}
            <div className="shrink-0 bg-[#0B132B] p-3 sm:p-4 flex items-center gap-2 border-b border-[#3A506B]/50">
                <select
                    value={conversacionId ?? ""}
                    onChange={(e) => void seleccionarConversacion(e.target.value ? Number(e.target.value) : null)}
                    disabled={cargandoConversaciones || cargandoMensajes}
                    className="flex-1 min-w-0 bg-[#1C2541] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-sm focus:outline-none focus:border-[#5BC0DE] disabled:opacity-60 transition-colors"
                >
                    <option value="">+ Nueva conversación</option>
                    {conversaciones.map((c) => (
                        <option key={c.id} value={c.id}>{c.titulo}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={() => void seleccionarConversacion(null)}
                    className="grid place-items-center w-[42px] h-[42px] shrink-0 bg-[#1C2541] border border-[#3A506B] rounded-xl text-[#5BC0DE] hover:bg-[#3A506B]/50 transition-colors"
                    title="Nueva conversación"
                >
                    <Plus size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => void eliminarConversacion()}
                    disabled={conversacionId == null}
                    className="grid place-items-center w-[42px] h-[42px] shrink-0 bg-[#1C2541] border border-[#3A506B] rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                    title="Eliminar conversación"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Indicador de carga */}
            {(cargandoConversaciones || cargandoMensajes) && (
                <div className="px-3 pt-2 flex items-center gap-2 text-[#5BC0DE] text-xs shrink-0">
                    <Loader2 size={14} className="animate-spin" />
                    {cargandoMensajes ? "Cargando mensajes..." : "Cargando conversaciones..."}
                </div>
            )}

            {/* Área scrolleable de mensajes */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                
                {/* Sugerencias rápidas (solo al inicio) */}
                {mensajes.length <= 1 && (
                    <div className="mb-4">
                        <p className="text-[11px] text-[#5BC0DE] font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles size={13} className="text-[#FBBF24]" /> Consultas recomendadas:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                "📊 ¿Cuáles son los platos más vendidos de hoy?",
                                "💵 Muéstrame la tabla de propinas por mesero del último mes",
                                "💡 Calcula la propina al 10% sobre las ventas de hoy",
                                "⚠️ ¿Qué insumos tienen stock bajo o crítico?",
                                "💰 Resumen de balance neto e ingresos de los últimos 30 días",
                                "📋 ¿Cómo registro una venta y genero una factura?",
                                "👤 ¿Qué mesero tiene más propinas este mes?",
                                "🏪 ¿Cómo abro un turno de caja?",
                            ].map((sugerencia, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => void enviar(sugerencia)}
                                    disabled={enviando}
                                    className="text-left text-xs bg-[#1C2541] hover:bg-[#3A506B] text-[#F4D6B0] border border-[#3A506B] px-3 py-2 rounded-xl transition-all shadow-sm"
                                >
                                    {sugerencia}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de mensajes */}
                {mensajes.map((m) => (
                    <BurbujaMensaje key={m.id} mensaje={m} />
                ))}

                {/* Indicador de "Escribiendo..." */}
                {enviando && (
                    <div className="flex items-center gap-2.5 bg-[#1C2541] border border-[#3A506B] rounded-2xl p-3 w-fit text-[#5BC0DE] text-xs shadow-sm">
                        <Loader2 size={16} className="animate-spin text-[#5BC0DE]" />
                        <span>Analizando datos y preparando respuesta…</span>
                    </div>
                )}
                <div ref={finRef} className="h-2" />
            </div>

            {/* Barra de entrada fija */}
            <div className="shrink-0 bg-[#0B132B] border-t border-[#3A506B] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    <label
                        className="cursor-pointer grid place-items-center w-[42px] h-[42px] shrink-0 bg-[#1C2541] border border-[#3A506B] rounded-xl text-[#5BC0DE] hover:bg-[#3A506B]/50 transition-colors"
                        title="Adjuntar archivo"
                    >
                        <Paperclip size={18} />
                        <input type="file" className="hidden" accept="image/*,.pdf,.txt,.csv,.xlsx" />
                    </label>
                    <textarea
                        rows={1}
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void enviar();
                            }
                        }}
                        placeholder="Pregunta sobre propinas, ventas, stock, meseros, o cómo usar la app…"
                        className="flex-1 w-full bg-[#1C2541] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-sm placeholder:text-[#5BC0DE]/40 focus:outline-none focus:border-[#5BC0DE] resize-none min-h-[42px] max-h-32 transition-colors"
                    />
                    <button
                        type="button"
                        onClick={() => void enviar()}
                        disabled={!texto.trim() || enviando}
                        className="grid place-items-center w-[42px] h-[42px] shrink-0 bg-[#5BC0DE] text-[#0B132B] rounded-xl font-bold hover:bg-[#4CA8C4] transition-colors disabled:opacity-40 shadow-sm"
                        title="Enviar"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function BurbujaMensaje({ mensaje }: { mensaje: MensajeIA }) {
    const esUsuario = mensaje.rol === "user";
    const [copiado, setCopiado] = useState(false);

    const copiarTexto = () => {
        void navigator.clipboard.writeText(mensaje.contenido);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    const horaFormateada = mensaje.fecha
        ? new Date(mensaje.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";

    if (esUsuario) {
        return (
            <div className="flex justify-end gap-2.5 items-end">
                <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm bg-[#5BC0DE]/15 text-[#F4D6B0] border border-[#5BC0DE]/40 shadow-sm">
                    <p className="leading-relaxed whitespace-pre-wrap">{mensaje.contenido}</p>
                    <span className="text-[10px] text-[#5BC0DE]/70 block text-right mt-1 font-mono">
                        {horaFormateada}
                    </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#5BC0DE] text-[#0B132B] font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                    <User size={15} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start gap-2.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-[#5BC0DE]/15 border border-[#5BC0DE]/30 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Sparkles size={16} className="text-[#5BC0DE]" />
            </div>
            <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-sm bg-[#1C2541] border border-[#3A506B] shadow-md overflow-hidden">
                <div className="px-4 py-2 bg-[#0B132B]/60 border-b border-[#3A506B]/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#F4D6B0]">Sabor & Stock IA</span>
                        <span className="text-[9px] bg-[#5BC0DE]/15 text-[#5BC0DE] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-[#5BC0DE]/30">
                            Asistente
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#5BC0DE]/60 font-mono">{horaFormateada}</span>
                        <button
                            type="button"
                            onClick={copiarTexto}
                            className="p-1 rounded-md text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B]/50 transition-colors"
                            title="Copiar respuesta"
                        >
                            {copiado ? <Check size={13} className="text-[#4ADE80]" /> : <Copy size={13} />}
                        </button>
                    </div>
                </div>
                <div className="p-4 text-xs sm:text-sm text-[#F4D6B0] leading-relaxed">
                    <FormatoContenidoIA contenido={mensaje.contenido} />
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   SECCIÓN 2: CARGA MASIVA DESDE EXCEL
   ============================================================ */
function SeccionExcel() {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [procesando, setProcesando] = useState(false);
    const [preview, setPreview] = useState<FilaExcelPreview[] | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const onSeleccionar = (f: File | null) => {
        if (!f) return;
        setArchivo(f);
        setPreview(null);
    };

    const procesar = async () => {
        if (!archivo || procesando) return;
        setProcesando(true);

        try {
            const resultado = await IaServicio.procesarExcel(archivo);
            setPreview(resultado.preview);
            if (resultado.resumen) {
                console.info(resultado.resumen, resultado.usandoIA ? "(Gemini)" : "(validación local)");
            }
        } catch (error: any) {
            alert(`No se pudo procesar el archivo: ${error?.message || "error desconocido"}`);
        } finally {
            setProcesando(false);
        }
    };

    const reiniciar = () => {
        setArchivo(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const confirmar = async () => {
        if (!preview || validos === 0) return;
        setProcesando(true);

        try {
            const resultado = await IaServicio.confirmarExcel(preview);
            const fallos = resultado.errores.length > 0
                ? `\n\nNo se guardaron ${resultado.errores.length}: ${resultado.errores[0].error}`
                : "";
            alert(`Guardado completo: ${resultado.insertados} nuevos y ${resultado.actualizados} actualizados.${fallos}`);
            reiniciar();
        } catch (error: any) {
            alert(`No se pudo confirmar la carga: ${error?.message || "error desconocido"}`);
        } finally {
            setProcesando(false);
        }
    };

    const validos = preview?.filter((f) => f.estado !== "error").length ?? 0;
    const errores = preview?.filter((f) => f.estado === "error").length ?? 0;

    return (
        <div className="p-3 sm:p-5 space-y-4 max-w-5xl mx-auto">
            {/* Panel Superior: Carga de Archivo */}
            <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4 sm:p-5 shadow-sm">
                <h2 className="text-[#F4D6B0] font-bold text-sm flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-[#5BC0DE]" />
                    Cargar productos e insumos
                </h2>
                <p className="text-[#5BC0DE]/80 text-[11px] sm:text-xs mt-1 leading-relaxed">
                    Sube un archivo <span className="text-[#5BC0DE] font-bold">.xlsx</span> o <span className="text-[#5BC0DE] font-bold">.csv</span> con las columnas: <em>nombre, tipo, categoría, precio, stock</em>. La IA extraerá los datos y los validará antes de insertarlos.
                </p>

                {!archivo ? (
                    <label className="mt-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#3A506B] hover:border-[#5BC0DE] hover:bg-[#5BC0DE]/5 rounded-xl py-10 px-4 cursor-pointer transition-all active:scale-[0.99]">
                        <Upload size={32} className="text-[#5BC0DE]" />
                        <span className="text-[#F4D6B0] text-sm font-bold mt-1">Toca para seleccionar un archivo</span>
                        <span className="text-[#5BC0DE]/60 text-[11px]">o arrástralo aquí</span>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => onSeleccionar(e.target.files?.[0] ?? null)}
                        />
                    </label>
                ) : (
                    <div className="mt-4 flex items-center gap-3 bg-[#0B132B] border border-[#3A506B] rounded-xl p-3">
                        <div className="grid place-items-center w-10 h-10 rounded-xl bg-[#4ADE80]/15 text-[#4ADE80] shrink-0 border border-[#4ADE80]/30">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[#F4D6B0] text-sm font-bold truncate">
                                {archivo.name}
                            </p>
                            <p className="text-[#5BC0DE] text-[11px] font-mono">
                                {(archivo.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={reiniciar}
                            className="grid place-items-center w-8 h-8 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
                            title="Quitar archivo"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    onClick={procesar}
                    disabled={!archivo || procesando}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#5BC0DE] text-[#0B132B] font-bold rounded-xl h-[42px] text-sm hover:bg-[#4CA8C4] transition-colors disabled:opacity-40 shadow-md"
                >
                    {procesando ? (
                        <>
                            <Loader2 size={16} className="animate-spin" /> Procesando con IA…
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} /> Extraer datos con IA
                        </>
                    )}
                </button>
            </div>

            {/* Preview de resultados */}
            {preview && (
                <>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <MiniStat label="Filas" valor={preview.length} color="#F4D6B0" />
                        <MiniStat label="Válidas" valor={validos} color="#4ADE80" />
                        <MiniStat label="Errores" valor={errores} color="#E57373" />
                    </div>

                    {/* Vista móvil: Tarjetas */}
                    <div className="md:hidden space-y-2">
                        {preview.map((f) => (
                            <div key={f.fila} className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[#F4D6B0] font-bold text-sm truncate">
                                            {f.nombre || "—"}
                                        </p>
                                        <p className="text-[#5BC0DE] text-[10px] font-semibold truncate mt-0.5">
                                            {f.categoria} · Fila {f.fila}
                                        </p>
                                    </div>
                                    <EstadoBadge estado={f.estado} />
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-[#3A506B]/50 flex items-center justify-between text-xs font-mono">
                                    <span className="text-[#5BC0DE] font-bold">{formatoCOP(f.precio)}</span>
                                    <span className="text-[#F4D6B0]/70">Stock: {f.stock}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vista desktop: Tabla Flotante */}
                    <div className="hidden md:block overflow-x-auto w-full">
                        <table className="w-full text-left border-separate border-spacing-y-2 min-w-[700px]">
                            <thead className="sticky top-0 z-30">
                                <tr className="text-[#5BC0DE] text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-2 px-4 bg-[#1C2541] first:rounded-l-xl">#</th>
                                    <th className="py-2 px-4 bg-[#1C2541]">Nombre</th>
                                    <th className="py-2 px-4 bg-[#1C2541]">Tipo</th>
                                    <th className="py-2 px-4 bg-[#1C2541]">Categoría</th>
                                    <th className="py-2 px-4 text-right bg-[#1C2541]">Precio</th>
                                    <th className="py-2 px-4 text-right bg-[#1C2541]">Stock</th>
                                    <th className="py-2 px-4 text-center bg-[#1C2541] last:rounded-r-xl">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((f) => (
                                    <tr key={f.fila} className="group">
                                        <td className="py-2.5 px-4 bg-[#0B132B] border-y border-l border-[#3A506B]/60 rounded-l-xl group-hover:bg-[#152036] text-xs font-mono text-[#5BC0DE]/70 transition-colors">
                                            {f.fila}
                                        </td>
                                        <td className="py-2.5 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] text-xs font-bold text-[#F4D6B0] transition-colors">
                                            {f.nombre}
                                        </td>
                                        <td className="py-2.5 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] text-xs text-[#F4D6B0]/70 capitalize transition-colors">
                                            {f.tipo}
                                        </td>
                                        <td className="py-2.5 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] text-xs text-[#F4D6B0]/70 transition-colors">
                                            {f.categoria}
                                        </td>
                                        <td className="py-2.5 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] text-xs text-right font-mono font-bold text-[#5BC0DE] transition-colors">
                                            {formatoCOP(f.precio)}
                                        </td>
                                        <td className="py-2.5 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] text-xs text-right font-mono text-[#F4D6B0]/70 transition-colors">
                                            {f.stock}
                                        </td>
                                        <td className="py-2.5 px-4 bg-[#0B132B] border-y border-r border-[#3A506B]/60 rounded-r-xl group-hover:bg-[#152036] text-center transition-colors">
                                            <EstadoBadge estado={f.estado} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-2 sm:gap-3 pt-2">
                        <button
                            type="button"
                            onClick={reiniciar}
                            className="flex-1 bg-[#1C2541] border border-[#3A506B] text-[#F4D6B0] rounded-xl h-[42px] text-xs font-bold hover:bg-[#3A506B]/50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmar}
                            disabled={validos === 0}
                            className="flex-1 bg-[#4ADE80] text-[#0B132B] rounded-xl h-[42px] text-xs font-bold hover:bg-[#4ADE80]/90 transition-colors disabled:opacity-40 shadow-md"
                        >
                            Insertar {validos} registros
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function MiniStat({ label, valor, color }: { label: string; valor: number; color: string }) {
    return (
        <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-3 text-center shadow-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#5BC0DE]/70 font-bold">{label}</p>
            <p className="font-extrabold text-lg sm:text-xl mt-0.5" style={{ color }}>{valor}</p>
        </div>
    );
}

function EstadoBadge({ estado }: { estado: FilaExcelPreview["estado"] }) {
    if (estado === "valido") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#4ADE80]/15 text-[#4ADE80] text-[10px] font-bold border border-[#4ADE80]/30">
                <CheckCircle2 size={12} /> Válido
            </span>
        );
    }
    if (estado === "advertencia") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D97706]/15 text-[#D97706] text-[10px] font-bold border border-[#D97706]/30">
                <AlertCircle size={12} /> Revisar
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E57373]/15 text-[#E57373] text-[10px] font-bold border border-[#E57373]/30">
            <X size={12} /> Error
        </span>
    );
}

function TarjetaProducto({ producto }: { producto: ProductoMenu }) {
    return (
        <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl overflow-hidden flex flex-col">
            <div className="relative aspect-[16/10] bg-[#0B132B] flex items-center justify-center">
                {producto.imagen ? (
                    <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-[#3A506B]">
                        <ImageIcon size={28} />
                        <span className="text-[10px] text-[#F4D6B0]/40">Sin imagen</span>
                    </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#0B132B]/80 text-[#5BC0DE] text-[10px] font-semibold backdrop-blur-sm capitalize">
                    {producto.tipo}
                </span>
            </div>
            <div className="p-3 flex flex-col gap-1.5 flex-1">
                <h3 className="text-[#F4D6B0] font-bold text-sm truncate">{producto.nombre}</h3>
                <p className="text-[#F4D6B0]/60 text-xs leading-snug line-clamp-2 break-words">
                    {producto.descripcion}
                </p>
                <div className="mt-auto flex items-center justify-between pt-1.5 border-t border-[#3A506B]/50 mt-2">
                    <span className="text-[#5BC0DE] font-bold text-sm">{formatoCOP(producto.precio)}</span>
                    <button type="button" className="grid place-items-center w-8 h-8 rounded-lg bg-[#5BC0DE]/15 text-[#5BC0DE] hover:bg-[#5BC0DE]/25 transition-colors" title="Editar producto">
                        <Download size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}