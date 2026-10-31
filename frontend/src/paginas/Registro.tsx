import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    CreditCard,
    Phone,
    UserPlus,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { registrar } from "../servicios/AuthServicio";
import type { DatosRegistrados } from "../tipos/Usuario";

const FORM_INICIAL: DatosRegistrados = {
    nombre: "",
    correo: "",
    contrasena: "",
    cedula: "",
    telefono: "",
};

export function Registro() {
    const [form, setForm] = useState<DatosRegistrados>(FORM_INICIAL);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const navegar = useNavigate();

    function manejarCambio(e: ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function manejarSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setCargando(true);

        try {
            await registrar({
                nombre: form.nombre.trim(),
                correo: form.correo.trim(),
                contrasena: form.contrasena,
                cedula: form.cedula.trim(),
                telefono: form.telefono,
            });
            setForm(FORM_INICIAL);
            navegar("/login");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo completar el registro. Revisa los datos."
            );
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="auth-form-wrapper">
            <div className="auth-form-header">
                <h2>Crea tu cuenta</h2>
            </div>

            <form onSubmit={manejarSubmit} className="auth-form">
                {/* 2 columnas en pantallas medianas; 1 columna en móvil */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="auth-input-group">
                        <label htmlFor="reg-nombre">Nombre</label>
                        <div className="auth-input-container">
                            <User className="auth-input-icon" size={18} />
                            <input
                                id="reg-nombre"
                                name="nombre"
                                type="text"
                                placeholder="Juan Pérez"
                                autoComplete="name"
                                value={String(form.nombre)}
                                onChange={manejarCambio}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label htmlFor="reg-correo">Correo</label>
                        <div className="auth-input-container">
                            <Mail className="auth-input-icon" size={18} />
                            <input
                                id="reg-correo"
                                name="correo"
                                type="email"
                                placeholder="nombre@correo.com"
                                autoComplete="email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                inputMode="email"
                                value={String(form.correo)}
                                onChange={manejarCambio}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label htmlFor="reg-cedula">Cédula</label>
                        <div className="auth-input-container">
                            <CreditCard className="auth-input-icon" size={18} />
                            <input
                                id="reg-cedula"
                                name="cedula"
                                type="text"
                                inputMode="numeric"
                                placeholder="123456789"
                                value={String(form.cedula)}
                                onChange={manejarCambio}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label htmlFor="reg-telefono">Teléfono</label>
                        <div className="auth-input-container">
                            <Phone className="auth-input-icon" size={18} />
                            <input
                                id="reg-telefono"
                                name="telefono"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="300 123 4567"
                                value={String(form.telefono)}
                                onChange={manejarCambio}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-input-group sm:col-span-2">
                        <label htmlFor="reg-contrasena">Contraseña</label>
                        <div className="auth-input-container">
                            <Lock className="auth-input-icon" size={18} />
                            <input
                                id="reg-contrasena"
                                name="contrasena"
                                type={mostrarPassword ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                autoComplete="new-password"
                                value={String(form.contrasena)}
                                onChange={manejarCambio}
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
                            <span>Creando...</span>
                        </>
                    ) : (
                        <>
                            <UserPlus size={18} />
                            <span>Crear cuenta</span>
                        </>
                    )}
                </button>
            </form>

            <div className="auth-form-footer">
                <p>
                    ¿Ya tienes cuenta?
                    <Link className="auth-link" to="/login">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}