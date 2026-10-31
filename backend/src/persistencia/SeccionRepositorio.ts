import {supabase} from "../configuracion/Supabase.js";
import {Seccion,CrearSeccion,ActualizarSeccion} from "../modelos/Seccion.js";

const Tabla = "seccion";

function filaSeccion(fila:any):Seccion{
    return {
        id: fila.id_seccion ?? fila.id,
        nombre: fila.nombre
    };
}

export class SeccionRepositorio{
    async listar():Promise<Seccion[]>{
        const {data,error} = await supabase
        .from(Tabla)
        .select("*")
        .order("nombre");
        if(error){
            throw new Error(`Error al listar secciones: ${error.message}`);
        }
        return (data || []).map(filaSeccion);
    }

    async obtenerPorId(id:string):Promise<Seccion|null>{
        const {data,error} = await supabase
        .from(Tabla)
        .select("*")
        .eq("id_seccion",id)
        .maybeSingle();
        if(error){
            throw new Error(`Error al obtener sección por ID: ${error.message}`);
        }
        return data ? filaSeccion(data) : null;
    }

    async buscarPorNombre(nombre:string):Promise<Seccion|null>{
        const {data,error} = await supabase
        .from(Tabla)
        .select("*")
        .eq("nombre",nombre)
        .maybeSingle();
        if(error){
            throw new Error(`Error al buscar sección por nombre: ${error.message}`);
        }
        return data ? filaSeccion(data) : null;
    }

    async crear(params: CrearSeccion):Promise<Seccion>{
        const {data,error} = await supabase
        .from(Tabla)
        .insert({
            nombre: params.nombre
        })
        .select()
        .single();
        if(error){
            throw new Error(`Error al crear sección: ${error.message}`);
        }
        return filaSeccion(data);
    }

    async actualizar(id:string,params:ActualizarSeccion):Promise<Seccion>{
        const {data,error} = await supabase
        .from(Tabla)
        .update({
            nombre: params.nombre
        })
        .eq("id_seccion",id)
        .select()
        .single();
        if(error){
            throw new Error(`Error al actualizar sección: ${error.message}`);
        }
        return filaSeccion(data);
    }

    async eliminar(id:string):Promise<void>{
        const {error} = await supabase
        .from(Tabla)
        .delete()
        .eq("id_seccion",id);
        if(error){
            throw new Error(`Error al eliminar sección: ${error.message}`);
        }
    }
}
