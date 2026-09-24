import { promises } from "node:dns";
import{supabase} from "../configuracion/Supabase.js";
import {RolUsuario} from "../modelos/RolUsuario.js";
import {Usuario, CrearUsuario, ActualizarUsuario, UsuarioRow} from "../modelos/Usuario.js";

//mapear 
function mapaearUsuarioRow(row:UsuarioRow):Usuario{
     return{
        id:row.id,
        nombre:row.nombre,
        cedula:row.cedula,
        correo:row.correo,
        telefono:row.telefono,
        rol:row.rol,
        activo:row.activo,
        fechaRegistro:row.fechaRegistro
     };
}

export class UsuarioRepositorio{
    async listar():Promise<Usuario[]>{
        const{data,error}=await supabase
        .from("usuarios")
        .select("*");

        if(error){
            throw new Error(`Error al listar usuarios: ${error.message}`);
        }

        return data.map(mapaearUsuarioRow);
    }

    async obtenerPorId(id:string): Promise<Usuario| null>{
        const {data,error}=await supabase
        .from("usuarios")
        .select("*")
        .eq("id",id)
        .single();
        
        if(error){
            if(error.code=="PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async obtenerPorCedula(cedula:string): Promise<Usuario| null>{
        const {data,error}=await supabase
        .from("usuarios")
        .select("*")
        .eq("cedula",cedula)
        .single();
        
        if(error){
            if(error.code=="PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async obtenerPorCorreo(correo:string): Promise<Usuario| null>{
        const {data,error}=await supabase
        .from("usuarios")
        .select("*")
        .eq("correo",correo)
        .single();
        
        if(error){
            if(error.code=="PGRST116") return null;
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async crearUsuario(datos:CrearUsuario):Promise<Usuario>{
        const{data,error} = await supabase
        .from("usuarios")
        .insert({
            nombre:datos.nombre,
            correo:datos.correo,
            telefono:datos.telefono,
            rol:datos.rol ?? RolUsuario.MESERO,
            cedula:datos.cedula,
            fechaRegistro:datos.fechaRegistro
        })
        .select()
        .single()

        if(error){
            if(error.code=="23505") throw new Error("ya existe un usuario con el correo");
            throw new Error(`Error al crear usuario ${error.message}`);
        }
        return mapaearUsuarioRow(data as UsuarioRow);
    }

    async actualizarUsuario(id:string, cambios:ActualizarUsuario):Promise<void>{
        const campos:Record <string,unknown>={};
        if(cambios.nombre !== undefined) campos.nombre=cambios.nombre;
        if(cambios.rol !== undefined) campos.rol=cambios.rol;
        if(cambios.activo !== undefined)campos.activo=cambios.activo;

        if(Object.keys(campos).length===0) return;

        const {error} = await supabase
        .from("usuarios")
        .update(id)
        .eq("id",id)
        if(error) throw new Error(`Error al actualizar usuario${error.message}`)
    }

    async ContarAdmin():Promise<Number>{
        const {count,error} = await supabase
        .from("usuarios")
        .select("id",{count:"exact",head:true})
        .eq("rol",RolUsuario.ADMIN)
        .eq("activo",true);

        if(error) throw new Error(`Error en el contador:${error.message}`);
        return count ?? 0;
    }

}