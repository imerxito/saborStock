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
            navegar("/login", {
                state: { mensaje: "¡Registro completado exitosamente! Inicia sesión para continuar." }
            });
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
        <div className="flex flex-col w-full pb-2">
            <div className="mb-3 sm:mb-4">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#5BC0DE] bg-[#5BC0DE]/10 px-2.5 py-1 rounded-full border border-[#5BC0DE]/20 mb-1.5">
                    Registro de Cuenta
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#F4D6B0] tracking-tight">Crea tu cuenta</h3>
                <p className="text-xs font-semibold text-[#3A506B] mt-0.5">Registra los datos del administrador del local</p>
            </div>

            <form onSubmit={manejarSubmit} className="flex flex-col gap-3">
                {/* @sm:grid-cols-2 responde al ancho real del panel (container query),
                    no al viewport → en paneles angostos del split quedan 1 columna. */}
                <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-nombre" className="text-[11px] font-bold text-[#F4D6B0]">
                            Nombre completo
                        </label>
                        <div className="relative flex items-center w-full">
                            <User className="absolute left-3.5 text-[#5BC0DE] pointer-events-none" size={16} />
                            <input
                                id="reg-nombre"
                                name="nombre"
                                type="text"
                                placeholder="Juan Pérez"
                                autoComplete="name"
                                value={String(form.nombre)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 sm:h-11 pl-10 pr-3 text-xs font-semibold text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-xl outline-none transition-all focus:border-[#5BC0DE] focus:ring-4 focus:ring-[#5BC0DE]/15 placeholder-[#3A506B]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-correo" className="text-[11px] font-bold text-[#F4D6B0]">
                            Correo
                        </label>
                        <div className="relative flex items-center w-full">
                            <Mail className="absolute left-3.5 text-[#5BC0DE] pointer-events-none" size={16} />
                            <input
                                id="reg-correo"
                                name="correo"
                                type="email"
                                placeholder="nombre@correo.com"
                                autoComplete="email"
                                value={String(form.correo)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 sm:h-11 pl-10 pr-3 text-xs font-semibold text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-xl outline-none transition-all focus:border-[#5BC0DE] focus:ring-4 focus:ring-[#5BC0DE]/15 placeholder-[#3A506B]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-cedula" className="text-[11px] font-bold text-[#F4D6B0]">
                            Cédula / ID
                        </label>
                        <div className="relative flex items-center w-full">
                            <CreditCard className="absolute left-3.5 text-[#5BC0DE] pointer-events-none" size={16} />
                            <input
                                id="reg-cedula"
                                name="cedula"
                                type="text"
                                inputMode="numeric"
                                placeholder="123456789"
                                value={String(form.cedula)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 sm:h-11 pl-10 pr-3 text-xs font-semibold text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-xl outline-none transition-all focus:border-[#5BC0DE] focus:ring-4 focus:ring-[#5BC0DE]/15 placeholder-[#3A506B]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-telefono" className="text-[11px] font-bold text-[#F4D6B0]">
                            Teléfono
                        </label>
                        <div className="relative flex items-center w-full">
                            <Phone className="absolute left-3.5 text-[#5BC0DE] pointer-events-none" size={16} />
                            <input
                                id="reg-telefono"
                                name="telefono"
                                type="tel"
                                inputMode="tel"
                                placeholder="300 123 4567"
                                value={String(form.telefono)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 sm:h-11 pl-10 pr-3 text-xs font-semibold text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-xl outline-none transition-all focus:border-[#5BC0DE] focus:ring-4 focus:ring-[#5BC0DE]/15 placeholder-[#3A506B]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 @sm:col-span-2">
                        <label htmlFor="reg-contrasena" className="text-[11px] font-bold text-[#F4D6B0]">
                            Contraseña segura
                        </label>
                        <div className="relative flex items-center w-full">
                            <Lock className="absolute left-3.5 text-[#5BC0DE] pointer-events-none" size={16} />
                            <input
                                id="reg-contrasena"
                                name="contrasena"
                                type={mostrarPassword ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                autoComplete="new-password"
                                value={String(form.contrasena)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 sm:h-11 pl-10 pr-10 text-xs font-semibold text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-xl outline-none transition-all focus:border-[#5BC0DE] focus:ring-4 focus:ring-[#5BC0DE]/15 placeholder-[#3A506B]"
                            />
                            <button
                                type="button"
                                className="absolute right-3.5 text-[#5BC0DE] hover:text-[#F4D6B0] p-1 rounded-lg transition-colors cursor-pointer"
                                onClick={() => setMostrarPassword((prev) => !prev)}
                                aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                tabIndex={-1}
                            >
                                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-2 p-2.5 text-xs font-semibold text-[#E57373] bg-[#E57373]/10 border border-[#E57373]/30 rounded-xl">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span className="break-words leading-relaxed">{error}</span>
                    </div>
                )}

                <button
                    className="flex items-center justify-center gap-2 w-full h-11 mt-1 text-xs font-bold text-[#0B132B] bg-[#5BC0DE] hover:bg-[#4CA8C4] active:scale-[0.99] rounded-xl shadow-md shadow-[#5BC0DE]/20 transition-all disabled:opacity-60 cursor-pointer"
                    type="submit"
                    disabled={cargando}
                >
                    {cargando ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Registrando...</span>
                        </>
                    ) : (
                        <>
                            <UserPlus size={16} />
                            <span>Registrar Usuario</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-4 text-center text-xs font-medium text-[#3A506B]">
                <p>
                    ¿Ya posees cuenta?{" "}
                    <Link className="text-[#5BC0DE] font-bold hover:underline ml-1" to="/login">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}