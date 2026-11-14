import {supabase} from '../configuracion/Supabase.js';
import {UnidadMedida,CrearUnidadMedidaDTO,ActualizarUnidadMedidaDTO} from '../modelos/UnidadMedida.js';

const Tabla='unidad_medida';

function filaUnidadMedida(fila:any):UnidadMedida{
    return {
        id: String(fila.id_unidad ?? fila.id),
        nombre: fila.nombre,
        abreviatura: fila.abreviatura,
        descripcion: fila.descripcion ?? null,
        activo: fila.activo ?? true
    };
}

function mensajeError(accion:string,error:{code?:string;message?:string}){
    if(error.code==='23505') return 'ya existe esta unidad de medida';
    return `Error al ${accion}:${error.message??'Error desconocido'}`;
}

export class UnidadMedidaRepositorio{
    async listar():Promise<UnidadMedida[]>{
        const {data,error} = await supabase
        .from(Tabla)
        .select('*')
        .order('nombre');

        if (error) throw new Error(mensajeError('listar',error));
        return data.map(filaUnidadMedida);
    }

    async obtenerPorId(id:string):Promise<UnidadMedida|null>{
        const {data,error} = await supabase
        .from(Tabla)
        .select('*')
        .eq('id_unidad',id)
        .single();

        if (error) throw new Error(mensajeError('obtenerPorId',error));
        return data ? filaUnidadMedida(data) : null;
    }

    async buscarPorNombre(nombre:string):Promise<UnidadMedida|null>{
        const {data,error} = await supabase
        .from(Tabla)
        .select('*')
        .eq('nombre',nombre)
        .maybeSingle();

        if(error) throw new Error(mensajeError('buscarPorNombre',error));
        return data ? filaUnidadMedida(data) : null;
    }

    async buscarPorAbreviatura(abreviatura:string):Promise<UnidadMedida| null>{
        const {data,error} = await supabase
        .from(Tabla)
        .select('*')
        .eq('abreviatura',abreviatura)
        .maybeSingle();


        if(error) throw new Error(mensajeError('buscarPorAbreviatura',error));
        return data ? filaUnidadMedida(data) : null;
    }

    async crear(params:{
        nombre:string;
        abreviatura:string;
        descripcion?:string|null;
    }):Promise<UnidadMedida>{
        const {data,error} = await supabase
        .from(Tabla)
        .insert({
            nombre:params.nombre,
            abreviatura:params.abreviatura,
            descripcion:params.descripcion??null,
            activo:true
        })
        .select('*')
        .single();
        if (error) throw new Error(mensajeError('crear',error));
        return filaUnidadMedida(data);
    }

    async actualizar(id:string,params:ActualizarUnidadMedidaDTO):Promise<UnidadMedida>{
        const {data,error} = await supabase
        .from(Tabla)
        .update({
            nombre:params.nombre,
            abreviatura:params.abreviatura,
            descripcion:params.descripcion??null
        })
        .eq('id_unidad',id)
        .select('*')
        .single();

        if (error) throw new Error(mensajeError('actualizar',error));
        return filaUnidadMedida(data);
    }

    async cambiarEstado(id:string,activo:boolean):Promise<void>{
        const {error} = await supabase
        .from(Tabla)
        .update({activo})
        .eq('id_unidad',id);
        if (error) throw new Error(mensajeError('cambiarEstado',error));
    }
}