import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { LogIn, UserPlus, UtensilsCrossed, ShieldCheck } from "lucide-react";
import logo from "../assets/SaborYStock (1).png";
import { Login } from "./Login";
import { Registro } from "./Registro";

type Modo = "login" | "registro";

export default function Auth() {
  const { modo: param } = useParams();
  const navigate = useNavigate();
  const modo: Modo = param === "registro" ? "registro" : "login";
  const esRegistro = modo === "registro";

  const loginRef = useRef<HTMLDivElement>(null);
  const registroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = modo === "login" ? loginRef.current : registroRef.current;
    const t = setTimeout(() => {
      panel?.querySelector("input")?.focus();
    }, 300);
    return () => clearTimeout(t);
  }, [modo]);

  const cambiar = (nuevo: Modo) => navigate(`/${nuevo}`);

  if (param !== "login" && param !== "registro") {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#0B132B] bg-[radial-gradient(circle_at_15%_15%,rgba(91,192,222,0.1)_0%,transparent_50%),radial-gradient(circle_at_85%_85%,rgba(217,119,6,0.05)_0%,transparent_50%)]">
      <h1 className="sr-only">Sabor&Stock — Gestión Gastronómica</h1>

      <div className="relative w-full max-w-[1000px] min-h-[600px] bg-[#1C2541] border border-[#3A506B] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-2">
        {/* MÓVIL */}
        <div className="md:hidden flex flex-col p-5 border-b border-[#3A506B] bg-[#0B132B]">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center p-2 bg-[#1C2541] border border-[#3A506B] rounded-2xl">
              <img src={logo} alt="Sabor & Stock" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <span className="text-lg font-black text-[#F4D6B0] tracking-tight">
                Sabor<span className="text-[#5BC0DE]">&</span>Stock
              </span>
              <p className="text-[10px] font-bold text-[#5BC0DE] uppercase tracking-wider">
                Gestión Gastronómica
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 bg-[#1C2541] p-1 rounded-xl gap-1">
            <button
              type="button"
              className={`py-2.5 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                !esRegistro ? "bg-[#5BC0DE] text-[#0B132B] shadow-sm" : "text-[#F4D6B0] hover:bg-[#3A506B]/50"
              }`}
              onClick={() => cambiar("login")}
            >
              <LogIn size={15} />
              <span>Iniciar sesión</span>
            </button>
            <button
              type="button"
              className={`py-2.5 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                esRegistro ? "bg-[#5BC0DE] text-[#0B132B] shadow-sm" : "text-[#F4D6B0] hover:bg-[#3A506B]/50"
              }`}
              onClick={() => cambiar("registro")}
            >
              <UserPlus size={15} />
              <span>Registrarse</span>
            </button>
          </div>
        </div>

        {/* LOGIN PANEL */}
        <div
          ref={loginRef}
          className={`p-6 sm:p-10 flex-col justify-center bg-[#1C2541] w-full ${
            esRegistro ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center p-2.5 bg-[#0B132B] border border-[#3A506B] rounded-2xl">
              <img src={logo} alt="Sabor & Stock" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <span className="text-xl font-black text-[#F4D6B0] tracking-tight">
                Sabor<span className="text-[#5BC0DE]">&</span>Stock
              </span>
              <p className="text-[10px] font-bold text-[#5BC0DE] uppercase tracking-wider">
                Gestión Gastronómica
              </p>
            </div>
          </div>
          <Login />
        </div>

        {/* REGISTRO PANEL */}
        <div
          ref={registroRef}
          className={`p-6 sm:p-10 flex-col justify-center bg-[#1C2541] w-full ${
            !esRegistro ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="hidden md:flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center p-2.5 bg-[#0B132B] border border-[#3A506B] rounded-2xl">
              <img src={logo} alt="Sabor & Stock" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <span className="text-xl font-black text-[#F4D6B0] tracking-tight">
                Sabor<span className="text-[#5BC0DE]">&</span>Stock
              </span>
              <p className="text-[10px] font-bold text-[#5BC0DE] uppercase tracking-wider">
                Gestión Gastronómica
              </p>
            </div>
          </div>
          <Registro />
        </div>

        {/* PANEL DESLIZANTE */}
        <div
          className={`hidden md:flex absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] border-l border-[#3A506B] p-12 flex-col justify-between text-white transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] z-20 ${
            esRegistro ? "translate-x-0 left-0 border-l-0 border-r border-[#3A506B]" : "translate-x-full left-0"
          }`}
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#5BC0DE]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />

          {!esRegistro ? (
            <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
              <div className="p-4 bg-[#1C2541]/80 backdrop-blur-md border border-[#3A506B] rounded-3xl shadow-lg mb-6 text-[#5BC0DE]">
                <UtensilsCrossed size={36} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[#F4D6B0] mb-3">
                ¿Nuevo por aquí?
              </h2>
              <p className="text-sm font-medium text-[#5BC0DE] max-w-sm mb-8 leading-relaxed">
                Optimiza el flujo de tu restaurante. Controla mesas, comandas y inventarios en tiempo real con precisión.
              </p>
              <button
                type="button"
                onClick={() => cambiar("registro")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-[#0B132B] bg-[#F4D6B0] hover:bg-[#e3c29b] active:scale-95 shadow-lg transition-all cursor-pointer"
              >
                <UserPlus size={18} />
                <span>Crear cuenta corporativa</span>
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
              <div className="p-4 bg-[#1C2541]/80 backdrop-blur-md border border-[#3A506B] rounded-3xl shadow-lg mb-6 text-[#4ADE80]">
                <ShieldCheck size={36} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[#F4D6B0] mb-3">
                ¿Ya tienes acceso?
              </h2>
              <p className="text-sm font-medium text-[#5BC0DE] max-w-sm mb-8 leading-relaxed">
                Vuelve al panel principal para continuar gestionando las operaciones y turnos de tu local.
              </p>
              <button
                type="button"
                onClick={() => cambiar("login")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-[#0B132B] bg-[#F4D6B0] hover:bg-[#e3c29b] active:scale-95 shadow-lg transition-all cursor-pointer"
              >
                <LogIn size={18} />
                <span>Iniciar sesión</span>
              </button>
            </div>
          )}

          <div className="relative z-10 text-center text-xs font-semibold text-[#F4D6B0]">
            Sabor&Stock &copy; {new Date().getFullYear()} — Sistema Gastronómico Profesional
          </div>
        </div>
      </div>
    </main>
  );
}