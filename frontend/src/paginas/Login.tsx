import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../servicios/AuthServicio";
import { useAuth } from "../contexto/AuthContexto";

export function Login() {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const { iniciarSesion } = useAuth();
    const navegar = useNavigate();

    async function manejarSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setCargando(true);

        try {
            const { usuario, token } = await login({
                correo,
                contrasena: password,
            });

            iniciarSesion(usuario, token);
            navegar("/inicio");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo iniciar sesión"
            );
        } finally {
            setCargando(false);
        }
    }

    // Sin <main>, tarjeta ni logo: ahora los pone Auth.tsx
    return (
        <>
            <header className="auth-encabezado">
                <h2>¡Qué bueno tenerte de vuelta!</h2>
                <p>Ingresa tus datos para acceder a tu cuenta.</p>
            </header>

            <form onSubmit={manejarSubmit}>
                <div className="auth-campo">
                    <label htmlFor="correo">Correo electrónico</label>
                    <input
                        id="correo"
                        name="correo"
                        type="email"
                        placeholder="nombre@correo.com"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="auth-campo">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}

                <button className="auth-boton" type="submit" disabled={cargando}>
                    {cargando ? "Ingresando..." : "Iniciar sesión"}
                </button>
            </form>

            {/* Solo visible en móvil; en escritorio cambia el botón del panel de color */}
            <p className="auth-pie">
                ¿Todavía no tienes una cuenta?{" "}
                <Link className="auth-enlace" to="/registro">
                    Regístrate
                </Link>
            </p>
        </>
    );
}