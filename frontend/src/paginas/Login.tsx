import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { login } from "../servicios/AuthServicio";
import { useAuth } from "../contexto/AuthContexto";

export function Login() {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);
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
                correo: correo.trim(),
                contrasena: password,
            });

            iniciarSesion(usuario, token);
            navegar("/inicio");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Credenciales incorrectas o error de conexión."
            );
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="auth-form-wrapper">
            <div className="auth-form-header">
                <h2>Bienvenido de nuevo</h2>
            </div>

            <form onSubmit={manejarSubmit} className="auth-form">
                <div className="auth-input-group">
                    <label htmlFor="correo">Correo</label>
                    <div className="auth-input-container">
                        <Mail className="auth-input-icon" size={18} />
                        <input
                            id="correo"
                            name="correo"
                            type="email"
                            placeholder="nombre@restaurante.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            inputMode="email"
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label htmlFor="password">Contraseña</label>
                    <div className="auth-input-container">
                        <Lock className="auth-input-icon" size={18} />
                        <input
                            id="password"
                            name="password"
                            type={mostrarPassword ? "text" : "password"}
                            placeholder="Tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className="auth-btn-toggle-eye"
                            onClick={() => setMostrarPassword((prev) => !prev)}
                            aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                            tabIndex={-1}
                        >
                            {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="auth-alert-error" role="alert">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button className="auth-btn-primary" type="submit" disabled={cargando}>
                    {cargando ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Entrando...</span>
                        </>
                    ) : (
                        <>
                            <LogIn size={18} />
                            <span>Entrar</span>
                        </>
                    )}
                </button>
            </form>

            <div className="auth-form-footer">
                <p>
                    ¿No tienes cuenta?
                    <Link className="auth-link" to="/registro">
                        Regístrate
                    </Link>
                </p>
            </div>
        </div>
    );
}