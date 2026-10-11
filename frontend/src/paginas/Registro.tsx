import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrar } from '../servicios/AuthServicio';
import type { DatosRegistrados } from '../tipos/Usuario';
import '../estilos/principal.css';
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
        navegar('/login');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
        setCargando(false);
    }
    }
return (
<div className="auth-contenedor">
<div className="auth-tarjeta">
<h2>Crear cuenta</h2>
<form onSubmit={manejarSubmit}>
<div className="auth-campo">
<label>Nombre</label>
<input name="nombre" value={String(form.nombre)} onChange={manejarCambio} required />
</div>
<div className="auth-campo">
<label>Correo</label>
<input name="correo" type="email" value={String(form.correo)} onChange={manejarCambio}
required />
</div>
<div className="auth-campo">
<label>Contraseña</label>
<input name="contrasena" type="password" value={String(form.contrasena)}
onChange={manejarCambio} required />
</div>
<div className="auth-campo">
<label>Cédula</label>
<input name="cedula" value={String(form.cedula)} onChange={manejarCambio} required />
</div>
<div className="auth-campo">
<label>Teléfono</label>
<input name="telefono" value={String(form.telefono)} onChange={manejarCambio} required /></div>
{error && <p className="auth-error">{error}</p>}
<button className="auth-boton" type="submit" disabled={cargando}>
{cargando ? 'Creando...' : 'Registrarme'}
</button>
</form>
<a className="auth-enlace" href="/login">¿Ya tienes cuenta? Inicia sesión</a>
</div>
</div>
);
}