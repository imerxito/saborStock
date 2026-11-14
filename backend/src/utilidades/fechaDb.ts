// Las columnas TIMESTAMP de Supabase se guardan en UTC pero PostgREST las
// devuelve sin zona horaria ("2026-11-13T03:20:15"). Sin el sufijo "Z",
// JavaScript las interpreta como hora local y las desplaza.
export function parseFechaDb(valor: unknown): Date | null {
    if (valor == null || valor === "") return null;
    if (valor instanceof Date) return valor;
    const s = String(valor);
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
    const iso = s.includes("T") ? s : s.replace(" ", "T");
    return new Date(`${iso}Z`);
}
