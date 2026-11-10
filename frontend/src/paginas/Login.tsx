import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn as LogInIcon, AlertCircle, Loader2 } from "lucide-react";
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
        <div className="flex flex-col w-full">
            <div className="mb-4 sm:mb-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#5BC0DE] bg-[#5BC0DE]/10 px-2.5 py-1 rounded-full border border-[#5BC0DE]/20 mb-2">
                    Acceso de Personal
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#F4D6B0] tracking-tight">Bienvenido de nuevo</h3>
                <p className="text-xs font-semibold text-[#3A506B] mt-0.5">Ingresa tus datos corporativos para abrir turno</p>
            </div>

            <form onSubmit={manejarSubmit} className="flex flex-col gap-3 [@media(max-height:700px)]:gap-2.5">
                <div className="flex flex-col gap-1 w-full">
                    <label htmlFor="correo" className="text-xs font-bold text-[#F4D6B0]">
                        Correo electrónico
                    </label>
                    <div className="relative flex items-center w-full">
                        <Mail className="absolute left-3.5 text-[#5BC0DE] pointer-events-none" size={17} />
                        <input
                            id="correo"
                            name="correo"
                            type="email"
                            placeholder="nombre@restaurante.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            autoComplete="email"
                            required
                            className="w-full h-10 [@media(max-height:700px)]:h-9 pl-10 pr-4 text-xs font-semibold text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-xl outline-none transition-all focus:border-[#5BC0DE] focus:ring-4 focus:ring-[#5BC0DE]/15 placeholder-[#3A506B]"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1 w-full">
                    <label htmlFor="password" className="text-xs font-bold text-[#F4D6B0]">
                        Contraseña
                    </label>
                    <div className="relative flex items-center w-full">
                        <Lock className="absolute left-3.5 text-[#5BC0DE] pointer-events-none" size={17} />
                        <input
                            id="password"
                            name="password"
                            type={mostrarPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            className="w-full h-10 [@media(max-height:700px)]:h-9 pl-10 pr-10 text-xs font-semibold text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-xl outline-none transition-all focus:border-[#5BC0DE] focus:ring-4 focus:ring-[#5BC0DE]/15 placeholder-[#3A506B]"
                        />
                        <button
                            type="button"
                            className="absolute right-3.5 text-[#5BC0DE] hover:text-[#F4D6B0] p-1 rounded-lg transition-colors cursor-pointer"
                            onClick={() => setMostrarPassword((prev) => !prev)}
                            aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                            tabIndex={-1}
                        >
                            {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2.5 p-2.5 text-xs font-semibold text-[#E57373] bg-[#E57373]/10 border border-[#E57373]/30 rounded-xl">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    className="flex items-center justify-center gap-2 w-full h-10 [@media(max-height:700px)]:h-9 mt-1 text-xs font-bold text-[#0B132B] bg-[#5BC0DE] hover:bg-[#4CA8C4] active:scale-[0.99] rounded-xl shadow-md shadow-[#5BC0DE]/20 transition-all disabled:opacity-60 cursor-pointer"
                    type="submit"
                    disabled={cargando}
                >
                    {cargando ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Verificando...</span>
                        </>
                    ) : (
                        <>
                            <LogInIcon size={16} />
                            <span>Ingresar al Sistema</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-4 sm:mt-5 text-center text-xs font-medium text-[#3A506B]">
                <p>
                    ¿No tienes una cuenta activa?{" "}
                    <Link className="text-[#5BC0DE] font-bold hover:underline ml-1" to="/registro">
                        Regístrate
                    </Link>
                </p>
            </div>
        </div>
    );
}