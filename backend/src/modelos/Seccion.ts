export interface Seccion {
  id: number;
  nombre: string;
  orden: number;
  limiteMesas: number;
  numeroInicio: number;
}

export interface CrearSeccion{
    nombre: string;
    orden?: number;
    limiteMesas?: number;
    numeroInicio?: number;
}

export interface ActualizarSeccion{
    nombre?: string;
    orden?: number;
    limiteMesas?: number;
    numeroInicio?: number;
}