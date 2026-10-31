/**
 * Capa utilidades: funciones puras reutilizables (sin React, sin datos).
 */

export function formatoHora(ms: number, conSegundos = false) {
    return new Date(ms).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        ...(conSegundos ? { second: "2-digit" } : {}),
    });
}

/** Inicio (ms) del bloque de media hora al que pertenece una marca de tiempo */
export function inicioBloque(ms: number) {
    const d = new Date(ms);
    d.setMinutes(d.getMinutes() >= 30 ? 30 : 0, 0, 0);
    return d.getTime();
}

export function minutosDesde(ms: number, ahora = Date.now()) {
    return Math.max(0, Math.floor((ahora - ms) / 60_000));
}