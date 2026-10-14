import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrar } from '../servicios/AuthServicio';
import type { DatosRegistrados } from '../tipos/Usuario';

const FORM_INICIAL: DatosRegistrados = {
    nombre: '', correo: '', contrasena: '', cedula: '', telefono: '',
};

export function Registro() {
    const [form, setForm] = useState<DatosRegistrados>(FORM_INICIAL);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const navegar = useNavigate();

    function manejarCambio(e: ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function manejarSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            await registrar(form);
            setForm(FORM_INICIAL); // limpia el formulario (el componente sigue montado)
            navegar('/login');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo registrar');
        } finally {
            setCargando(false);
        }
    }

    // Sin tarjeta externa: ahora la pone Auth.tsx
    return (
        <>
            <header className="auth-encabezado">
                <h2>Crear cuenta</h2>
                <p>Completa tus datos para empezar.</p>
            </header>

            <form onSubmit={manejarSubmit}>
                <div className="auth-campo">
                    <label htmlFor="reg-nombre">Nombre</label>
                    <input id="reg-nombre" name="nombre" autoComplete="name"
                        value={String(form.nombre)} onChange={manejarCambio} required />
                </div>

                <div className="auth-campo">
                    <label htmlFor="reg-correo">Correo</label>
                    <input id="reg-correo" name="correo" type="email" autoComplete="email"
                        value={String(form.correo)} onChange={manejarCambio} required />
                </div>

                <div className="auth-campo">
                    <label htmlFor="reg-contrasena">Contraseña</label>
                    <input id="reg-contrasena" name="contrasena" type="password"
                        autoComplete="new-password"
                        value={String(form.contrasena)} onChange={manejarCambio} required />
                </div>

                <div className="auth-fila">
                    <div className="auth-campo">
                        <label htmlFor="reg-cedula">Cédula</label>
                        <input id="reg-cedula" name="cedula" inputMode="numeric"
                            value={String(form.cedula)} onChange={manejarCambio} required />
                    </div>
                    <div className="auth-campo">
                        <label htmlFor="reg-telefono">Teléfono</label>
                        <input id="reg-telefono" name="telefono" type="tel" autoComplete="tel"
                            value={String(form.telefono)} onChange={manejarCambio} required />
                    </div>
                </div>

                {error && <p className="auth-error" role="alert">{error}</p>}

                <button className="auth-boton" type="submit" disabled={cargando}>
                    {cargando ? 'Creando...' : 'Registrarme'}
                </button>
            </form>

            {/* Solo visible en móvil; en escritorio cambia el botón del panel de color */}
            <p className="auth-pie">
                ¿Ya tienes cuenta?{' '}
                <Link className="auth-enlace" to="/login">Inicia sesión</Link>
            </p>
        </>
    );
}