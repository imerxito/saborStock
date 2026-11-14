import { fetchJson } from "./api";

export type EstadoFilaExcel = "valido" | "advertencia" | "error";
export type TipoFilaExcel = "producto" | "insumo";

export interface FilaExcelPreview {
    fila: number;
    nombre: string;
    tipo: TipoFilaExcel;
    categoria: string;
    precio: number;
    stock: number;
    unidad?: string;
    estado: EstadoFilaExcel;
    motivo?: string;
}

export interface ResultadoExcelIA {
    preview: FilaExcelPreview[];
    usandoIA: boolean;
    resumen: string;
}

export interface ResultadoConfirmacionExcel {
    insertados: number;
    actualizados: number;
    errores: Array<{ fila: number; nombre: string; error: string }>;
}

export interface ConversacionIA {
    id: number;
    idUsuario: number | null;
    titulo: string;
    contexto?: string;
    archivada?: boolean;
    fechaCreacion?: string;
    fechaActualizacion?: string;
}

export interface MensajeIA {
    id: number;
    idConversacion: number;
    rol: "user" | "assistant" | "system";
    contenido: string;
    fecha: string;
}

export interface ConversacionConMensajes {
    conversacion: ConversacionIA;
    mensajes: MensajeIA[];
}

function csvDesdeFilas(matriz: unknown[][]): string {
    return matriz
        .map((fila) =>
            (fila || [])
                .map((celda) => {
                    const texto = celda === null || celda === undefined ? "" : String(celda);
                    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
                })
                .join(",")
        )
        .join("\n");
}

async function contenidoComoCsv(archivo: File): Promise<string> {
    const nombre = archivo.name.toLowerCase();

    if (nombre.endsWith(".csv") || nombre.endsWith(".txt")) {
        return await archivo.text();
    }

    if (nombre.endsWith(".xlsx") || nombre.endsWith(".xls")) {
        const { readSheet } = await import("read-excel-file/browser");
        const matriz = await readSheet(archivo);
        return csvDesdeFilas(matriz as unknown[][]);
    }

    throw new Error("Formato no soportado. Usa .xlsx, .xls o .csv");
}

export const IaServicio = {
    async chat(
        mensaje: string,
        opciones: { conversacionId?: number | null; idUsuario?: number | null } = {}
    ): Promise<{ respuesta: string; modo: "gemini" | "local"; conversacionId: number }> {
        return await fetchJson<{ respuesta: string; modo: "gemini" | "local"; conversacionId: number }>("/api/ia/chat", {
            method: "POST",
            body: JSON.stringify({
                mensaje,
                conversacionId: opciones.conversacionId ?? null,
                idUsuario: opciones.idUsuario ?? null,
            }),
        });
    },

    async listarConversaciones(idUsuario?: number | null): Promise<ConversacionIA[]> {
        const query = idUsuario != null ? `?idUsuario=${idUsuario}` : "";
        return await fetchJson<ConversacionIA[]>(`/api/ia/conversaciones${query}`);
    },

    async obtenerConversacion(id: number): Promise<ConversacionConMensajes> {
        return await fetchJson<ConversacionConMensajes>(`/api/ia/conversaciones/${id}`);
    },

    async eliminarConversacion(id: number): Promise<void> {
        await fetchJson<void>(`/api/ia/conversaciones/${id}`, { method: "DELETE" });
    },

    async procesarExcel(archivo: File): Promise<ResultadoExcelIA> {
        const contenido = await contenidoComoCsv(archivo);
        return await fetchJson<ResultadoExcelIA>("/api/ia/excel", {
            method: "POST",
            body: JSON.stringify({
                nombreArchivo: archivo.name,
                contenido,
            }),
        });
    },

    async confirmarExcel(filas: FilaExcelPreview[]): Promise<ResultadoConfirmacionExcel> {
        return await fetchJson<ResultadoConfirmacionExcel>("/api/ia/excel/confirmar", {
            method: "POST",
            body: JSON.stringify({
                filas: filas.filter((fila) => fila.estado !== "error"),
            }),
        });
    },
};
