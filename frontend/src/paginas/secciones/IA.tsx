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
    LayoutGrid,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Plus,
    Download,
    Trash2,
} from "lucide-react";
import { IaServicio, type ConversacionIA, type FilaExcelPreview } from "../../servicios/IaServicio";
import { useAuth } from "../../contexto/AuthContexto";

/* ============================================================
   TIPOS
   ============================================================ */
type TabIA = "chat" | "excel" | "menu";

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

interface CategoriaMenu {
    id: string;
    nombre: string;
    productos: ProductoMenu[];
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
        <div className="h-[100dvh] w-full flex flex-col bg-[#0B132B] overflow-hidden text-[#F4D6B0]">
            {/* CABECERA FIJA CON TABS */}
            <header className="shrink-0 bg-[#1C2541] border-b border-[#3A506B] pt-[max(0.5rem,env(safe-area-inset-top))]">
                <div className="px-4 pt-2 pb-3 flex items-center gap-2">
                    <div className="grid place-items-center w-9 h-9 rounded-xl bg-[#5BC0DE]/15 border border-[#5BC0DE]/30">
                        <Sparkles size={18} className="text-[#5BC0DE]" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[#F4D6B0] text-base font-bold leading-tight">
                            Asistente IA
                        </h1>
                        <p className="text-[#5BC0DE] text-[11px] truncate">
                            Gemini 3.5 Flash-Lite · Solo gerencia
                        </p>
                    </div>
                </div>

                {/* TABS con scroll horizontal */}
                <nav className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2 pb-2 gap-1">
                    <TabBoton
                        activo={tab === "chat"}
                        onClick={() => setTab("chat")}
                        icono={<MessageSquare size={14} />}
                        texto="Chat"
                    />
                    <TabBoton
                        activo={tab === "excel"}
                        onClick={() => setTab("excel")}
                        icono={<FileSpreadsheet size={14} />}
                        texto="Carga masiva"
                    />
                </nav>
            </header>

            {/* CONTENIDO CON SCROLL PROPIO */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))]">
                {tab === "chat" && <SeccionChat />}
                {tab === "excel" && <SeccionExcel />}
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
                "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium",
                "active:scale-95 transition-transform whitespace-nowrap",
                activo
                    ? "bg-[#5BC0DE]/15 text-[#5BC0DE] border border-[#5BC0DE]/40"
                    : "text-[#F4D6B0]/70 border border-transparent hover:bg-[#0B132B]",
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
            "Hola 👋 Soy tu asistente de negocio. Puedo analizar ventas, revisar stock bajo y darte recomendaciones. ¿Qué quieres consultar hoy?",
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

    const enviar = async () => {
        const limpio = texto.trim();
        if (!limpio || enviando) return;

        const nuevo: MensajeIA = {
            id: generarId(),
            rol: "user",
            contenido: limpio,
            fecha: new Date(),
        };
        setMensajes((prev) => [...prev, nuevo]);
        setTexto("");
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
        <div className="flex flex-col min-h-full">
            {/* Conversaciones guardadas */}
            <div className="px-3 pt-3 flex items-center gap-2">
                <select
                    value={conversacionId ?? ""}
                    onChange={(e) => void seleccionarConversacion(e.target.value ? Number(e.target.value) : null)}
                    disabled={cargandoConversaciones || cargandoMensajes}
                    className="flex-1 min-w-0 bg-[#1C2541] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5BC0DE] disabled:opacity-60"
                >
                    <option value="">Nueva conversación</option>
                    {conversaciones.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.titulo}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={() => void seleccionarConversacion(null)}
                    className="grid place-items-center w-10 h-10 shrink-0 bg-[#1C2541] border border-[#3A506B] rounded-xl text-[#5BC0DE] active:scale-95 transition-transform"
                    title="Nueva conversación"
                >
                    <Plus size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => void eliminarConversacion()}
                    disabled={conversacionId == null}
                    className="grid place-items-center w-10 h-10 shrink-0 bg-[#1C2541] border border-[#3A506B] rounded-xl text-[#E57373] active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
                    title="Eliminar conversación"
                >
                    <Trash2 size={18} />
                </button>
            </div>
            {(cargandoConversaciones || cargandoMensajes) && (
                <div className="px-3 pt-2 flex items-center gap-2 text-[#5BC0DE] text-xs">
                    <Loader2 size={14} className="animate-spin" />
                    {cargandoMensajes ? "Cargando mensajes..." : "Cargando conversaciones..."}
                </div>
            )}

            {/* Lista de mensajes */}
            <div className="flex-1 px-3 pt-3 space-y-3">
                {mensajes.map((m) => (
                    <BurbujaMensaje key={m.id} mensaje={m} />
                ))}
                {enviando && (
                    <div className="flex items-center gap-2 text-[#5BC0DE] text-xs px-2">
                        <Loader2 size={14} className="animate-spin" />
                        Pensando...
                    </div>
                )}
                <div ref={finRef} />
            </div>

            {/* Barra de entrada fija al fondo del scroll */}
            <div className="sticky bottom-0 bg-[#0B132B] border-t border-[#3A506B] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-end gap-2">
                    <label
                        className="cursor-pointer grid place-items-center w-11 h-11 shrink-0 bg-[#1C2541] border border-[#3A506B] rounded-xl text-[#F4D6B0] active:scale-95 transition-transform"
                        title="Adjuntar archivo"
                    >
                        <Paperclip size={18} />
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf,.txt,.csv,.xlsx"
                        />
                    </label>
                    <textarea
                        rows={1}
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                enviar();
                            }
                        }}
                        placeholder="Pregunta sobre ventas, stock o sube un archivo…"
                        className="flex-1 w-full bg-[#1C2541] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm placeholder:text-[#F4D6B0]/40 focus:outline-none focus:border-[#5BC0DE] resize-none max-h-32"
                    />
                    <button
                        type="button"
                        onClick={enviar}
                        disabled={!texto.trim() || enviando}
                        className="grid place-items-center w-11 h-11 shrink-0 bg-[#5BC0DE] text-[#0B132B] rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
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
    return (
        <div className={`flex ${esUsuario ? "justify-end" : "justify-start"}`}>
            <div
                className={[
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap",
                    esUsuario
                        ? "bg-[#5BC0DE]/15 text-[#5BC0DE] border border-[#5BC0DE]/30 rounded-br-md"
                        : "bg-[#1C2541] text-[#F4D6B0] border border-[#3A506B] rounded-bl-md",
                ].join(" ")}
            >
                {mensaje.contenido}
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
        <div className="p-3 sm:p-4 space-y-3 max-w-3xl mx-auto">
            <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl p-4">
                <h2 className="text-[#F4D6B0] font-bold text-sm flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-[#5BC0DE]" />
                    Cargar productos e insumos
                </h2>
                <p className="text-[#F4D6B0]/60 text-xs mt-1 leading-relaxed">
                    Sube un archivo <span className="text-[#5BC0DE]">.xlsx</span> o <span className="text-[#5BC0DE]">.csv</span> con las columnas: <em>nombre, tipo, categoría, precio, stock</em>. La IA extraerá los datos y los validará antes de insertarlos.
                </p>

                {!archivo ? (
                    <label className="mt-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#3A506B] hover:border-[#5BC0DE] rounded-xl py-8 px-4 cursor-pointer transition-colors active:scale-[0.99]">
                        <Upload size={28} className="text-[#5BC0DE]" />
                        <span className="text-[#F4D6B0] text-sm font-medium">
                            Toca para seleccionar un archivo
                        </span>
                        <span className="text-[#F4D6B0]/50 text-[11px]">o arrástralo aquí</span>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => onSeleccionar(e.target.files?.[0] ?? null)}
                        />
                    </label>
                ) : (
                    <div className="mt-3 flex items-center gap-3 bg-[#0B132B] border border-[#3A506B] rounded-xl p-3">
                        <div className="grid place-items-center w-10 h-10 rounded-lg bg-[#4ADE80]/15 text-[#4ADE80] shrink-0">
                            <FileSpreadsheet size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[#F4D6B0] text-sm font-medium truncate">
                                {archivo.name}
                            </p>
                            <p className="text-[#F4D6B0]/50 text-[11px]">
                                {(archivo.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={reiniciar}
                            className="grid place-items-center w-8 h-8 rounded-lg text-[#E57373] hover:bg-[#E57373]/15 active:scale-95 transition-transform"
                            title="Quitar archivo"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    onClick={procesar}
                    disabled={!archivo || procesando}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-[#5BC0DE] text-[#0B132B] font-bold rounded-xl py-3 text-sm active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
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
                    <div className="grid grid-cols-3 gap-2">
                        <MiniStat label="Filas" valor={preview.length} color="#F4D6B0" />
                        <MiniStat label="Válidas" valor={validos} color="#4ADE80" />
                        <MiniStat label="Errores" valor={errores} color="#E57373" />
                    </div>

                    {/* Vista móvil: tarjetas */}
                    <div className="md:hidden space-y-2">
                        {preview.map((f) => (
                            <div
                                key={f.fila}
                                className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[#F4D6B0] font-medium text-sm truncate">
                                            {f.nombre || "—"}
                                        </p>
                                        <p className="text-[#F4D6B0]/50 text-[11px] truncate">
                                            {f.categoria} · fila {f.fila}
                                        </p>
                                    </div>
                                    <EstadoBadge estado={f.estado} />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-[#5BC0DE]">{formatoCOP(f.precio)}</span>
                                    <span className="text-[#F4D6B0]/60">Stock: {f.stock}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vista desktop: tabla */}
                    <div className="hidden md:block overflow-x-auto bg-[#1C2541] border border-[#3A506B] rounded-2xl">
                        <table className="min-w-[700px] w-full text-sm">
                            <thead className="bg-[#0B132B] text-[#5BC0DE] text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="text-left px-3 py-2">#</th>
                                    <th className="text-left px-3 py-2">Nombre</th>
                                    <th className="text-left px-3 py-2">Tipo</th>
                                    <th className="text-left px-3 py-2">Categoría</th>
                                    <th className="text-right px-3 py-2">Precio</th>
                                    <th className="text-right px-3 py-2">Stock</th>
                                    <th className="text-center px-3 py-2">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((f) => (
                                    <tr key={f.fila} className="border-t border-[#3A506B]">
                                        <td className="px-3 py-2 text-[#F4D6B0]/60">{f.fila}</td>
                                        <td className="px-3 py-2 text-[#F4D6B0]">{f.nombre}</td>
                                        <td className="px-3 py-2 text-[#F4D6B0]/70 capitalize">{f.tipo}</td>
                                        <td className="px-3 py-2 text-[#F4D6B0]/70">{f.categoria}</td>
                                        <td className="px-3 py-2 text-right text-[#5BC0DE]">{formatoCOP(f.precio)}</td>
                                        <td className="px-3 py-2 text-right text-[#F4D6B0]/70">{f.stock}</td>
                                        <td className="px-3 py-2 text-center">
                                            <EstadoBadge estado={f.estado} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={reiniciar}
                            className="flex-1 bg-[#1C2541] border border-[#3A506B] text-[#F4D6B0] rounded-xl py-2.5 text-sm font-medium active:scale-95 transition-transform"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmar}
                            disabled={validos === 0}
                            className="flex-1 bg-[#4ADE80] text-[#0B132B] rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
                        >
                            Insertar {validos}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function MiniStat({ label, valor, color }: { label: string; valor: number; color: string }) {
    return (
        <div className="bg-[#1C2541] border border-[#3A506B] rounded-xl p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-[#F4D6B0]/50">{label}</p>
            <p className="font-bold text-lg" style={{ color }}>{valor}</p>
        </div>
    );
}

function EstadoBadge({ estado }: { estado: FilaExcelPreview["estado"] }) {
    if (estado === "valido") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] text-[10px] font-semibold">
                <CheckCircle2 size={11} /> Válido
            </span>
        );
    }
    if (estado === "advertencia") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D97706]/15 text-[#D97706] text-[10px] font-semibold">
                <AlertCircle size={11} /> Revisar
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E57373]/15 text-[#E57373] text-[10px] font-semibold">
            <X size={11} /> Error
        </span>
    );
}



function TarjetaProducto({ producto }: { producto: ProductoMenu }) {
    return (
        <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl overflow-hidden flex flex-col">
            {/* Imagen / placeholder */}
            <div className="relative aspect-[16/10] bg-[#0B132B] flex items-center justify-center">
                {producto.imagen ? (
                    <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                    />
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

            {/* Info */}
            <div className="p-3 flex flex-col gap-1.5 flex-1">
                <h3 className="text-[#F4D6B0] font-bold text-sm truncate">
                    {producto.nombre}
                </h3>
                <p className="text-[#F4D6B0]/60 text-xs leading-snug line-clamp-2 break-words">
                    {producto.descripcion}
                </p>
                <div className="mt-auto flex items-center justify-between pt-1.5">
                    <span className="text-[#5BC0DE] font-bold text-sm">
                        {formatoCOP(producto.precio)}
                    </span>
                    <button
                        type="button"
                        className="grid place-items-center w-8 h-8 rounded-lg bg-[#5BC0DE]/15 text-[#5BC0DE] active:scale-95 transition-transform"
                        title="Editar producto"
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}