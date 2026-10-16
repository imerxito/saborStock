import type { DatosLogin,DatosRegistrados,Usuario,RespuestaAuth } from "../tipos/Usuario";

const API_URL =
    import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`;

async function manejarRespuesta<T>(respuesta:Response):Promise<T>{
    if(!respuesta.ok){
        const error= await respuesta.json().catch(()=>({}));
        throw new Error(error.mensaje || 'Ocurrio algo inesperado'); 
    }
    return respuesta.json();
    
}

export async function login(datos:DatosLogin):Promise<RespuestaAuth>{
    const respuesta = await fetch(`${API_URL}/auth/login`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(datos)
    });
    return manejarRespuesta<RespuestaAuth>(respuesta);
}

export async function registrar(datos:DatosRegistrados):Promise<{usuario:Usuario}>{
    const respuesta= await fetch(`${API_URL}/auth/register`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(datos)
    });
    return manejarRespuesta<{usuario:Usuario}>(respuesta);
}