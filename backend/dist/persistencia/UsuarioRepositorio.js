import { supabase } from "../configuracion/Supabase.js";
import { RolUsuario } from "../modelos/RolUsuario.js";
//mapear 
function mapaearUsuarioRow(row) {
    return {
        id: row.id,
        nombre: row.nombre,
        cedula: row.cedula,
        correo: row.correo,
        telefono: row.telefono,
        rol: row.rol,
        activo: row.activo,
        fechaRegistro: row.fechaRegistro
    };
}
export class UsuarioRepositorio {
    async listar() {
        const { data, error } = await supabase
            .from("usuario")
            .select("*");
        if (error) {
            throw new Error(`Error al listar usuarios: ${error.message}`);
        }
        return data.map(mapaearUsuarioRow);
    }
    async obtenerPorId(id) {
        const { data, error } = await supabase
            .from("usuario")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            if (error.code == "PGRST116")
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
            if (error.code == "PGRST116")
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
            if (error.code == "PGRST116")
                return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data);
    }
    async crearUsuario(datos) {
        const { data, error } = await supabase
            .from("usuario")
            .insert({
            nombre: datos.nombre,
            correo: datos.correo,
            telefono: datos.telefono,
            rol: datos.rol ?? RolUsuario.MESERO,
            cedula: datos.cedula,
            fechaRegistro: datos.fechaRegistro
        })
            .select()
            .single();
        if (error) {
            if (error.code == "23505")
                throw new Error("ya existe un usuario con el correo");
            throw new Error(`Error al crear usuario ${error.message}`);
        }
        return mapaearUsuarioRow(data);
    }
    async actualizarUsuario(id, cambios) {
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
            .from("usuario")
            .update(campos)
            .eq("id", id);
        if (error)
            throw new Error(`Error al actualizar usuario${error.message}`);
    }
    async ContarDueno() {
        const { count, error } = await supabase
            .from("usuario")
            .select("id", { count: "exact", head: true })
            .eq("rol", RolUsuario.Dueno)
            .eq("activo", true);
        if (error) {
            console.error("Error Supabase contarDuenos:", error);
            throw new Error(`Error en el contador Dueño 1:${error.message}`);
        }
        return count ?? 0;
    }
}
