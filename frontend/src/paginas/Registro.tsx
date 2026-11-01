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
        <div className="flex flex-col w-full">
            <div className="mb-3.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2C696F] bg-[#2C696F]/10 px-2.5 py-1 rounded-full border border-[#2C696F]/20 mb-1.5">
                    Registro de Cuenta
                </span>
                {/* TÍTULO CON COLOR OSCURO #07191D (Cero blanco invisible) */}
                <h3 className="text-2xl font-black text-[#07191D] tracking-tight">Crea tu cuenta</h3>
                <p className="text-xs font-semibold text-[#4F7F87] mt-0.5">Registra los datos del administrador del local</p>
            </div>

            <form onSubmit={manejarSubmit} className="flex flex-col gap-2.5">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-nombre" className="text-xs font-bold text-[#07191D]">
                            Nombre completo
                        </label>
                        <div className="relative flex items-center w-full">
                            <User className="absolute left-3 text-[#4F7F87] pointer-events-none" size={15} />
                            <input
                                id="reg-nombre"
                                name="nombre"
                                type="text"
                                placeholder="Juan Pérez"
                                autoComplete="name"
                                value={String(form.nombre)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 pl-9 pr-3 text-xs font-semibold text-[#07191D] bg-[#FAF8F2]/60 border border-[#D5CDBC] rounded-xl outline-none transition-all focus:border-[#2C696F] focus:bg-white focus:ring-4 focus:ring-[#2C696F]/15 hover:border-[#B8AF9C] placeholder-[#9EA9AB]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-correo" className="text-xs font-bold text-[#07191D]">
                            Correo
                        </label>
                        <div className="relative flex items-center w-full">
                            <Mail className="absolute left-3 text-[#4F7F87] pointer-events-none" size={15} />
                            <input
                                id="reg-correo"
                                name="correo"
                                type="email"
                                placeholder="nombre@correo.com"
                                autoComplete="email"
                                value={String(form.correo)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 pl-9 pr-3 text-xs font-semibold text-[#07191D] bg-[#FAF8F2]/60 border border-[#D5CDBC] rounded-xl outline-none transition-all focus:border-[#2C696F] focus:bg-white focus:ring-4 focus:ring-[#2C696F]/15 hover:border-[#B8AF9C] placeholder-[#9EA9AB]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-cedula" className="text-xs font-bold text-[#07191D]">
                            Cédula / ID
                        </label>
                        <div className="relative flex items-center w-full">
                            <CreditCard className="absolute left-3 text-[#4F7F87] pointer-events-none" size={15} />
                            <input
                                id="reg-cedula"
                                name="cedula"
                                type="text"
                                inputMode="numeric"
                                placeholder="123456789"
                                value={String(form.cedula)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 pl-9 pr-3 text-xs font-semibold text-[#07191D] bg-[#FAF8F2]/60 border border-[#D5CDBC] rounded-xl outline-none transition-all focus:border-[#2C696F] focus:bg-white focus:ring-4 focus:ring-[#2C696F]/15 hover:border-[#B8AF9C] placeholder-[#9EA9AB]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-telefono" className="text-xs font-bold text-[#07191D]">
                            Teléfono
                        </label>
                        <div className="relative flex items-center w-full">
                            <Phone className="absolute left-3 text-[#4F7F87] pointer-events-none" size={15} />
                            <input
                                id="reg-telefono"
                                name="telefono"
                                type="tel"
                                inputMode="tel"
                                placeholder="300 123 4567"
                                value={String(form.telefono)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 pl-9 pr-3 text-xs font-semibold text-[#07191D] bg-[#FAF8F2]/60 border border-[#D5CDBC] rounded-xl outline-none transition-all focus:border-[#2C696F] focus:bg-white focus:ring-4 focus:ring-[#2C696F]/15 hover:border-[#B8AF9C] placeholder-[#9EA9AB]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                        <label htmlFor="reg-contrasena" className="text-xs font-bold text-[#07191D]">
                            Contraseña segura
                        </label>
                        <div className="relative flex items-center w-full">
                            <Lock className="absolute left-3 text-[#4F7F87] pointer-events-none" size={15} />
                            <input
                                id="reg-contrasena"
                                name="contrasena"
                                type={mostrarPassword ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                autoComplete="new-password"
                                value={String(form.contrasena)}
                                onChange={manejarCambio}
                                required
                                className="w-full h-10 pl-9 pr-10 text-xs font-semibold text-[#07191D] bg-[#FAF8F2]/60 border border-[#D5CDBC] rounded-xl outline-none transition-all focus:border-[#2C696F] focus:bg-white focus:ring-4 focus:ring-[#2C696F]/15 hover:border-[#B8AF9C] placeholder-[#9EA9AB]"
                            />
                            <button
                                type="button"
                                className="absolute right-3 text-[#4F7F87] hover:text-[#07191D] p-1 rounded-lg transition-colors cursor-pointer"
                                onClick={() => setMostrarPassword((prev) => !prev)}
                                aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                tabIndex={-1}
                            >
                                {mostrarPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-2.5 text-xs font-semibold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    className="flex items-center justify-center gap-2 w-full h-10 mt-1 text-xs font-bold text-white bg-[#2C696F] hover:bg-[#204F54] active:scale-[0.99] rounded-xl shadow-md shadow-[#2C696F]/20 transition-all disabled:opacity-60 cursor-pointer"
                    type="submit"
                    disabled={cargando}
                >
                    {cargando ? (
                        <>
                            <Loader2 className="animate-spin" size={15} />
                            <span>Registrando...</span>
                        </>
                    ) : (
                        <>
                            <UserPlus size={15} />
                            <span>Registrar Administrador</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-3.5 text-center text-xs font-medium text-[#4F7F87]">
                <p>
                    ¿Ya posees cuenta?{" "}
                    <Link className="text-[#2C696F] font-bold hover:underline ml-1" to="/login">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}