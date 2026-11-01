import {supabase} from "../configuracion/Supabase.js";
import {Seccion,CrearSeccion,ActualizarSeccion} from "../modelos/Seccion.js";

const Tabla = "seccion";
const LIMITE_POR_DEFECTO = 20;

function filaSeccion(fila:any):Seccion{
    const limiteRaw = fila.limite_mesas;
    const limite = limiteRaw == null || Number(limiteRaw) < 1 ? LIMITE_POR_DEFECTO : Number(limiteRaw);
    return {
        id: fila.id_seccion ?? fila.id,
        nombre: fila.nombre,
        orden: Number(fila.orden ?? 0),
        limiteMesas: limite,
        numeroInicio: Number(fila.numero_inicio ?? 0),
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
        return (data || []).map(filaSeccion).sort((a, b) => {
            if (a.orden !== b.orden) return a.orden - b.orden;
            return a.nombre.localeCompare(b.nombre, "es");
        });
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
        const payload: Record<string, unknown> = {
            nombre: params.nombre,
            orden: params.orden ?? 0,
            limite_mesas: params.limiteMesas ?? LIMITE_POR_DEFECTO,
            numero_inicio: params.numeroInicio ?? 1,
        };

        let {data,error} = await supabase
        .from(Tabla)
        .insert(payload)
        .select()
        .single();

        if(error && /orden|limite_mesas|numero_inicio/i.test(error.message)){
            const reintento = await supabase
            .from(Tabla)
            .insert({ nombre: params.nombre })
            .select()
            .single();
            data = reintento.data;
            error = reintento.error;
        }

        if(error){
            throw new Error(`Error al crear sección: ${error.message}`);
        }
        return filaSeccion(data);
    }

    async actualizar(id:string,params:ActualizarSeccion):Promise<Seccion>{
        const campos: Record<string, unknown> = {};
        if(params.nombre !== undefined) campos.nombre = params.nombre;
        if(params.orden !== undefined) campos.orden = params.orden;
        if(params.limiteMesas !== undefined) campos.limite_mesas = params.limiteMesas;
        if(params.numeroInicio !== undefined) campos.numero_inicio = params.numeroInicio;

        if(Object.keys(campos).length === 0){
            const actual = await this.obtenerPorId(id);
            if(!actual) throw new Error("Error al actualizar sección: sección no encontrada");
            return actual;
        }

        let {data,error} = await supabase
        .from(Tabla)
        .update(campos)
        .eq("id_seccion",id)
        .select()
        .single();

        if(error && /orden|limite_mesas|numero_inicio/i.test(error.message)){
            const soloNombre: Record<string, unknown> = {};
            if(params.nombre !== undefined) soloNombre.nombre = params.nombre;
            if(Object.keys(soloNombre).length === 0){
                const actual = await this.obtenerPorId(id);
                if(!actual) throw new Error("Faltan las columnas orden y limite_mesas en la tabla seccion");
                return {
                    ...actual,
                    orden: params.orden ?? actual.orden,
                    limiteMesas: params.limiteMesas ?? actual.limiteMesas,
                    numeroInicio: params.numeroInicio ?? actual.numeroInicio,
                };
            }
            const reintento = await supabase
            .from(Tabla)
            .update(soloNombre)
            .eq("id_seccion",id)
            .select()
            .single();
            data = reintento.data;
            error = reintento.error;
        }

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
