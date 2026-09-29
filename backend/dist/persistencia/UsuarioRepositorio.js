// persistencia/UsuarioRepositorio.ts
import { supabase } from "../configuracion/Supabase.js";
import { RolUsuario } from "../modelos/RolUsuario.js";
function mapaearUsuarioRow(row) {
    return {
        id: row.auth_id,
        nombre: row.nombre,
        cedula: row.cedula,
        correo: row.correo,
        telefono: row.telefono ?? "",
        rol: row.rol,
        activo: row.activo,
        fechaRegistro: new Date(row.fecha_inicio),
    };
}
export class UsuarioRepositorio {
    async listar() {
        const { data, error } = await supabase
            .from("usuario")
            .select("*");
        if (error)
            throw new Error(`Error al listar usuarios: ${error.message}`);
        return data.map(mapaearUsuarioRow);
    }
    // authId = el auth_id del token (req.user.id), no el id_usuario interno
    async obtenerPorId(authId) {
        const { data, error } = await supabase
            .from("usuario")
            .select("*")
            .eq("auth_id", authId)
            .single();
        if (error) {
            if (error.code === "PGRST116")
                return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data);
    }
    async obtenerPorCedula(cedula) {
        const { data, error } = await supabase
            .from("usuario")
            .select("*")
            .eq("cedula", cedula)
            .single();
        if (error) {
            if (error.code === "PGRST116")
                return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data);
    }
    async obtenerPorCorreo(correo) {
        const { data, error } = await supabase
            .from("usuario")
            .select("*")
            .eq("correo", correo)
            .single();
        if (error) {
            if (error.code === "PGRST116")
                return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data);
    }
    // recibe el auth_id ya creado en Auth
    async crearUsuario(datos, authId) {
        const { data, error } = await supabase
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
        return mapaearUsuarioRow(data);
    }
    async actualizarUsuario(authId, cambios) {
        const campos = {};
        if (cambios.nombre !== undefined)
            campos.nombre = cambios.nombre;
        if (cambios.rol !== undefined)
            campos.rol = cambios.rol;
        if (cambios.activo !== undefined)
            campos.activo = cambios.activo;
        if (Object.keys(campos).length === 0)
            return;
        const { error } = await supabase
            .from("usuario").update(campos).eq("auth_id", authId);
        if (error)
            throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
    async contarDuenos() {
        const { count, error } = await supabase
            .from("usuario")
            .select("id_usuario", { count: "exact", head: true })
            .eq("rol", RolUsuario.Dueno)
            .eq("activo", true);
        if (error)
            throw new Error(`Error en el contador: ${error.message}`);
        return count ?? 0;
    }
}
