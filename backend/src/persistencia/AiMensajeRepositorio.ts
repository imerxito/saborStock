import { supabase } from "../configuracion/Supabase.js";
import {
    AiMensaje,
    AiMensajeRow,
    CrearAiMensajeDTO,
    mapAiMensajeFromRow,
} from "../modelos/AiMensaje.js";

export class AiMensajeRepositorio {
    async listarPorConversacion(idConversacion: number): Promise<AiMensaje[]> {
        const { data, error } = await supabase
            .from("ai_mensaje")
            .select("*")
            .eq("id_conversacion", idConversacion)
            .order("fecha", { ascending: true })
            .order("id_mensaje", { ascending: true });

        if (error) throw new Error(`Error al listar mensajes IA: ${error.message}`);
        return (data as AiMensajeRow[]).map(mapAiMensajeFromRow);
    }

    async crear(datos: CrearAiMensajeDTO): Promise<AiMensaje> {
        const { data, error } = await supabase
            .from("ai_mensaje")
            .insert({
                id_conversacion: datos.idConversacion,
                rol: datos.rol,
                contenido: datos.contenido,
                tokens_entrada: datos.tokensEntrada ?? null,
                tokens_salida: datos.tokensSalida ?? null,
                metadata: datos.metadata ?? {},
            })
            .select()
            .single();

        if (error) throw new Error(`Error al guardar mensaje IA: ${error.message}`);
        return mapAiMensajeFromRow(data as AiMensajeRow);
    }

    async eliminarPorConversacion(idConversacion: number): Promise<void> {
        const { error } = await supabase
            .from("ai_mensaje")
            .delete()
            .eq("id_conversacion", idConversacion);

        if (error) throw new Error(`Error al eliminar mensajes IA: ${error.message}`);
    }
}
