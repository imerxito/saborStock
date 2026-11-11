export const aFecha = (valor: string): Date => new Date(valor);

export const aFechaNull = (valor: string | null): Date | null => 
  valor ? new Date(valor) : null;

export const aNumero = (valor: number | string): number => 
  typeof valor === 'number' ? valor : parseFloat(valor);

export const aNumeroNull = (valor: number | string | null): number | null => {
  if (valor === null || valor === undefined) return null;
  return typeof valor === 'number' ? valor : parseFloat(valor);
};
