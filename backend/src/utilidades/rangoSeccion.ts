import { Seccion } from "../modelos/Seccion.js";

export function completarRangos(secciones: Seccion[]): Seccion[] {
    const ordenadas = [...secciones].sort((a, b) => {
        if (a.orden !== b.orden) return a.orden - b.orden;
        return a.id - b.id;
    });

    let cursor = 1;
    return ordenadas.map((s) => {
        const limite = s.limiteMesas >= 1 ? s.limiteMesas : 20;
        const inicio = s.numeroInicio > 0 ? s.numeroInicio : cursor;
        const fin = inicio + limite - 1;
        cursor = Math.max(cursor, fin + 1);
        return { ...s, limiteMesas: limite, numeroInicio: inicio };
    });
}

export function numeroFin(seccion: Pick<Seccion, "numeroInicio" | "limiteMesas">): number {
    const limite = seccion.limiteMesas >= 1 ? seccion.limiteMesas : 20;
    const inicio = seccion.numeroInicio > 0 ? seccion.numeroInicio : 1;
    return inicio + limite - 1;
}

export function siguienteNumeroInicio(secciones: Seccion[]): number {
    const conRango = completarRangos(secciones);
    if (conRango.length === 0) return 1;
    return Math.max(...conRango.map((s) => numeroFin(s))) + 1;
}

export function numerosLibresEnRango(
    seccion: Pick<Seccion, "numeroInicio" | "limiteMesas">,
    usados: Iterable<number>,
): number[] {
    const ocupados = new Set(usados);
    const inicio = seccion.numeroInicio > 0 ? seccion.numeroInicio : 1;
    const fin = numeroFin(seccion);
    const libres: number[] = [];
    for (let n = inicio; n <= fin; n++) {
        if (!ocupados.has(n)) libres.push(n);
    }
    return libres;
}
