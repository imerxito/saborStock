export const API_URL =
    import.meta.env.VITE_API_URL ?? `http://${window.location.hostname || "localhost"}:3000`;

export function authHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    const usuarioRaw = localStorage.getItem("usuario");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    if (usuarioRaw) {
        try {
            const u = JSON.parse(usuarioRaw);
            if (u.rol) headers["X-User-Role"] = u.rol;
            if (u.id || u.idUsuario) headers["X-User-Id"] = String(u.id || u.idUsuario);
        } catch {}
    }
    return headers;
}

export async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
    const opts: RequestInit = {
        ...options,
        headers: {
            ...authHeaders(),
            ...(options.headers || {}),
        },
    };

    const respuesta = await fetch(url, opts);
    if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
    }
    if (respuesta.status === 204) return undefined as T;
    const texto = await respuesta.text();
    return texto ? (JSON.parse(texto) as T) : (undefined as T);
}
