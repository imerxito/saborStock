import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from '../servicios/AuthServicio';
import { useAuth } from '../contexto/AuthContexto';
import '../estilos/principal.css';

export function Login() {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const { iniciarSesion } = useAuth();
    const navegar = useNavigate();          // ← faltaba esta línea

    async function manejarSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const { usuario, token } = await login({ correo, contrasena: password });
            iniciarSesion(usuario, token);
            navegar('/inicio');              // ← faltaba esta línea
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion');
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="auth-contenedor">
            <div className="auth-tarjeta">
                <h2>Iniciar sesión</h2>
                <form onSubmit={manejarSubmit}>
                    <div className="auth-campo">
                        <label>Correo</label>
                        <input type="email" value={correo}
                            onChange={(e) => setCorreo(e.target.value)} required />
                    </div>
                    <div className="auth-campo">
                        <label>Contraseña</label>
                        <input type="password" value={password}
                            onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button className="auth-boton" type="submit" disabled={cargando}>
                        {cargando ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
                <a className="auth-enlace" href="/registro">¿No tienes cuenta? Regístrate</a>
            </div>
        </div>
    );
}