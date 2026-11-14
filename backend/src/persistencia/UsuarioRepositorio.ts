// persistencia/UsuarioRepositorio.ts
import { supabase, supabaseAdmin } from "../configuracion/Supabase.js";
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
        const { data, error } = await supabase.from("usuario").select("*").order("id_usuario", { ascending: true });
        if (error) throw new Error(`Error al listar usuarios: ${error.message}`);
        return (data as UsuarioRow[]).map(mapaearUsuarioRow);
    }

    async obtenerPorId(id: string): Promise<Usuario | null> {
        let query = supabase.from("usuario").select("*");
        if (id.includes("-")) {
            query = query.eq("auth_id", id);
        } else if (!isNaN(Number(id))) {
            query = query.eq("id_usuario", Number(id));
        } else {
            query = query.eq("auth_id", id);
        }

        const { data, error } = await query.maybeSingle();
        if (error) {
            if (error.code === "PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return data ? mapaearUsuarioRow(data as UsuarioRow) : null;
    }

    async obtenerPorCedula(cedula: string): Promise<Usuario | null> {
        const { data, error } = await supabase
            .from("usuario").select("*").eq("cedula", cedula).maybeSingle();
        if (error) {
            if (error.code === "PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return data ? mapaearUsuarioRow(data as UsuarioRow) : null;
    }

    async obtenerPorCorreo(correo: string): Promise<Usuario | null> {
        const { data, error } = await supabase
            .from("usuario").select("*").eq("correo", correo).maybeSingle();
        if (error) {
            if (error.code === "PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return data ? mapaearUsuarioRow(data as UsuarioRow) : null;
    }

    async crearUsuario(datos: CrearUsuario, authId: string): Promise<Usuario> {
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
                throw new Error("Ya existe un usuario con ese correo o cédula");
            throw new Error(`Error al crear usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async actualizarUsuario(id: string, cambios: ActualizarUsuario): Promise<void> {
        const campos: Record<string, unknown> = {};
        if (cambios.nombre !== undefined) campos.nombre = cambios.nombre;
        if (cambios.rol !== undefined) campos.rol = cambios.rol;
        if (cambios.activo !== undefined) campos.activo = cambios.activo;
        if (cambios.cedula !== undefined) campos.cedula = cambios.cedula;
        if (cambios.telefono !== undefined) campos.telefono = cambios.telefono;
        if (cambios.correo !== undefined) campos.correo = cambios.correo;

        if (Object.keys(campos).length === 0) return;

        let query = supabaseAdmin.from("usuario").update(campos);
        if (id.includes("-")) {
            query = query.eq("auth_id", id);
        } else if (!isNaN(Number(id))) {
            query = query.eq("id_usuario", Number(id));
        } else {
            query = query.eq("auth_id", id);
        }

        const { error } = await query;
        if (error) throw new Error(`Error al actualizar usuario: ${error.message}`);
    }

    async contarDuenos(): Promise<number> {
        const { count, error } = await supabase
            .from("usuario")
            .select("id_usuario", { count: "exact", head: true })
            .in("rol", [RolUsuario.Dueno, "Dueño"])
            .eq("activo", true);
        if (error) throw new Error(`Error en el contador: ${error.message}`);
        return count ?? 0;
    }
}
