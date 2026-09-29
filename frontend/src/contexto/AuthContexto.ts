import {createContext,createElement,useState,useContext,  type ReactNode} from 'react';
import type{Usuario} from '../tipos/Usuario';

interface AuthContextType{
    usuario:Usuario|null;
    token:string| null;
    estaAutenticado:boolean;
    iniciarSesion:(usuario:Usuario,token:string)=>void;
    cerrarSesion:()=>void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvier ({children}:{children:ReactNode}){
    const [usuario,setUsuario]=useState<Usuario|null>(()=>{
        const guardado= localStorage.getItem('usuario');
        return guardado? JSON.parse(guardado):null;
    })

    const [token,setToken]=useState<string | null>(()=> localStorage.getItem('token'));

    function iniciarSesion(usuario:Usuario,token:string){
        setUsuario(usuario);
        setToken(token);
        localStorage.setItem('usuario',JSON.stringify(usuario));
        localStorage.setItem('token',token);
    }

    function cerrarSesion(){
        setUsuario(null);
        setToken(null);
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
    }

    return createElement(
        AuthContext.Provider,
        {value:{usuario,token,estaAutenticado:!!token,iniciarSesion,cerrarSesion}},
        children,
    );
}

export function useAuth(){
    const contexto = useContext(AuthContext);
    if(!contexto) throw new Error('useAuth debe usarse dentro de <authProvider>');
    return contexto;
}