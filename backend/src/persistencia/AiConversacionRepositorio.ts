import { supabase } from "../configuracion/Supabase.js";
import {
    AiConversacion,
    AiConversacionRow,
    CrearAiConversacionDTO,
    ActualizarAiConversacionDTO,
    mapAiConversacionFromRow,
} from "../modelos/AiConversacion.js";

export class AiConversacionRepositorio {
    async listar(idUsuario?: number | null): Promise<AiConversacion[]> {
        let query = supabase
            .from("ai_conversacion")
            .select("*")
            .order("fecha_actualizacion", { ascending: false });

        if (idUsuario !== undefined) {
            query = query.eq("id_usuario", idUsuario);
        }

        const { data, error } = await query;
        if (error) throw new Error(`Error al listar conversaciones IA: ${error.message}`);
        return (data as AiConversacionRow[]).map(mapAiConversacionFromRow);
    }

    async obtenerPorId(id: number): Promise<AiConversacion | null> {
        const { data, error } = await supabase
            .from("ai_conversacion")
            .select("*")
            .eq("id_conversacion", id)
            .maybeSingle();

        if (error) throw new Error(`Error al obtener conversación IA: ${error.message}`);
        return data ? mapAiConversacionFromRow(data as AiConversacionRow) : null;
    }

    async crear(datos: CrearAiConversacionDTO): Promise<AiConversacion> {
        const { data, error } = await supabase
            .from("ai_conversacion")
            .insert({
                id_usuario: datos.idUsuario ?? null,
                titulo: datos.titulo?.trim() || "Nueva conversación",
                contexto: datos.contexto ?? "",
                archivada: datos.archivada ?? false,
            })
            .select()
            .single();

        if (error) throw new Error(`Error al crear conversación IA: ${error.message}`);
        return mapAiConversacionFromRow(data as AiConversacionRow);
    }

    async actualizar(id: number, cambios: ActualizarAiConversacionDTO): Promise<void> {
        const campos: Record<string, unknown> = {};
        if (cambios.titulo !== undefined) campos.titulo = cambios.titulo;
        if (cambios.contexto !== undefined) campos.contexto = cambios.contexto;
        if (cambios.archivada !== undefined) campos.archivada = cambios.archivada;
        if (Object.keys(campos).length === 0) return;

        const { error } = await supabase
            .from("ai_conversacion")
            .update(campos)
            .eq("id_conversacion", id);

        if (error) throw new Error(`Error al actualizar conversación IA: ${error.message}`);
    }

    async tocar(id: number): Promise<void> {
        const { error } = await supabase
            .from("ai_conversacion")
            .update({ fecha_actualizacion: new Date().toISOString() })
            .eq("id_conversacion", id);

        if (error) throw new Error(`Error al actualizar conversación IA: ${error.message}`);
    }

    async eliminar(id: number): Promise<void> {
        const { error } = await supabase
            .from("ai_conversacion")
            .delete()
            .eq("id_conversacion", id);

        if (error) throw new Error(`Error al eliminar conversación IA: ${error.message}`);
    }
}
