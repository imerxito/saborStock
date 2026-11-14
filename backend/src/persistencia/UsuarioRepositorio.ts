// persistencia/UsuarioRepositorio.ts
import { supabase, supabaseAdmin } from "../configuracion/Supabase.js"; // 👈 AÑADIDO supabaseAdmin
import { RolUsuario } from "../modelos/RolUsuario.js";
import { Usuario, CrearUsuario, ActualizarUsuario, UsuarioRow } from "../modelos/Usuario.js";

function mapaearUsuarioRow(row: UsuarioRow): Usuario {
    const fechaString = row.fecha_registro ?? row.fecha_inicio ?? new Date().toISOString();
    return {
        id: row.auth_id,
        idUsuario: row.id_usuario,
        nombre: row.nombre,
        cedula: row.cedula,
        correo: row.correo,
        telefono: row.telefono ?? "",
        rol: row.rol,
        activo: row.activo,
        fechaRegistro: new Date(fechaString),
    };
}

export class UsuarioRepositorio {
    async listar(): Promise<Usuario[]> {
        const { data, error } = await supabase.from("usuario").select("*");
        if (error) throw new Error(`Error al listar usuarios: ${error.message}`);
        return (data as UsuarioRow[]).map(mapaearUsuarioRow);
    }

    async obtenerPorId(authId: string): Promise<Usuario | null> {
        const { data, error } = await supabase
            .from("usuario").select("*").eq("auth_id", authId).single();
        if (error) {
            if (error.code === "PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async obtenerPorCedula(cedula: string): Promise<Usuario | null> {
        const { data, error } = await supabase
            .from("usuario").select("*").eq("cedula", cedula).single();
        if (error) {
            if (error.code === "PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async obtenerPorCorreo(correo: string): Promise<Usuario | null> {
        const { data, error } = await supabase
            .from("usuario").select("*").eq("correo", correo).single();
        if (error) {
            if (error.code === "PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async crearUsuario(datos: CrearUsuario, authId: string): Promise<Usuario> {
        // 👇 CAMBIO: supabaseAdmin en lugar de supabase (omite RLS)
        const { data, error } = await supabaseAdmin
            .from("usuario")
            .insert({
                auth_id: authId,
                nombre: datos.nombre,
                correo: datos.correo,
                telefono: datos.telefono ?? null,
                rol: datos.rol ?? RolUsuario.MESERO,
                cedula: datos.cedula,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505")
                throw new Error("Ya existe un usuario con ese correo o cedula");
            throw new Error(`Error al crear usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async actualizarUsuario(authId: string, cambios: ActualizarUsuario): Promise<void> {
        const campos: Record<string, unknown> = {};
        if (cambios.nombre !== undefined) campos.nombre = cambios.nombre;
        if (cambios.rol !== undefined) campos.rol = cambios.rol;
        if (cambios.activo !== undefined) campos.activo = cambios.activo;

        if (Object.keys(campos).length === 0) return;

        const { error } = await supabase
            .from("usuario").update(campos).eq("auth_id", authId);
        if (error) throw new Error(`Error al actualizar usuario: ${error.message}`);
    }

    async contarDuenos(): Promise<number> {
        const { count, error } = await supabase
            .from("usuario")
            .select("id_usuario", { count: "exact", head: true })
            .eq("rol", RolUsuario.Dueno)
            .eq("activo", true);
        if (error) throw new Error(`Error en el contador: ${error.message}`);
        return count ?? 0;
    }
}