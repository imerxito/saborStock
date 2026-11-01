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
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#07191D] bg-[radial-gradient(circle_at_15%_15%,rgba(44,105,111,0.18)_0%,transparent_50%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.08)_0%,transparent_50%)]">
      <h1 className="sr-only">Sabor&amp;Stock — Gestión Gastronómica</h1>

      {/* Tarjeta Principal con diseño elegante */}
      <div className="relative w-full max-w-[1000px] min-h-[600px] bg-white border border-[#E2D9C5] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-2">

        {/* ── MÓVIL: CABECERA Y SELECTOR DE PESTAÑAS ── */}
        <div className="md:hidden flex flex-col p-5 border-b border-[#E2D9C5] bg-[#FAF8F2]">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center p-2 bg-white border border-[#E2D9C5] rounded-2xl shadow-xs">
              <img src={logo} alt="Sabor &amp; Stock" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <span className="text-lg font-black text-[#07191D] tracking-tight">
                Sabor<span className="text-[#2C696F]">&</span>Stock
              </span>
              <p className="text-[10px] font-bold text-[#4F7F87] uppercase tracking-wider">
                Gestión Gastronómica
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 bg-[#EFE9DB] p-1 rounded-xl gap-1">
            <button
              type="button"
              className={`py-2.5 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                !esRegistro ? "bg-[#2C696F] text-white shadow-sm" : "text-[#4F7F87]"
              }`}
              onClick={() => cambiar("login")}
            >
              <LogIn size={15} />
              <span>Iniciar sesión</span>
            </button>
            <button
              type="button"
              className={`py-2.5 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                esRegistro ? "bg-[#2C696F] text-white shadow-sm" : "text-[#4F7F87]"
              }`}
              onClick={() => cambiar("registro")}
            >
              <UserPlus size={15} />
              <span>Registrarse</span>
            </button>
          </div>
        </div>

        {/* ── PANEL IZQUIERDO (LOGIN) ── */}
        <div
          ref={loginRef}
          className={`p-6 sm:p-10 flex-col justify-center bg-white w-full ${
            esRegistro ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center p-2.5 bg-[#FAF8F2] border border-[#E2D9C5] rounded-2xl shadow-xs">
              <img src={logo} alt="Sabor &amp; Stock" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <span className="text-xl font-black text-[#07191D] tracking-tight">
                Sabor<span className="text-[#2C696F]">&</span>Stock
              </span>
              <p className="text-[10px] font-bold text-[#4F7F87] uppercase tracking-wider">
                Gestión Gastronómica
              </p>
            </div>
          </div>
          <Login />
        </div>

        {/* ── PANEL DERECHO (REGISTRO) ── */}
        <div
          ref={registroRef}
          className={`p-6 sm:p-10 flex-col justify-center bg-white w-full ${
            !esRegistro ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="hidden md:flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center p-2.5 bg-[#FAF8F2] border border-[#E2D9C5] rounded-2xl shadow-xs">
              <img src={logo} alt="Sabor &amp; Stock" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <span className="text-xl font-black text-[#07191D] tracking-tight">
                Sabor<span className="text-[#2C696F]">&</span>Stock
              </span>
              <p className="text-[10px] font-bold text-[#4F7F87] uppercase tracking-wider">
                Gestión Gastronómica
              </p>
            </div>
          </div>
          <Registro />
        </div>

        {/* ── PANEL DESLIZANTE CREATIVO (ESCRITORIO) ── */}
        <div
          className={`hidden md:flex absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-[#07191D] via-[#0C2B31] to-[#16383F] border-l border-[#E2D9C5]/20 p-12 flex-col justify-between text-white transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] z-20 ${
            esRegistro ? "translate-x-0 left-0 border-l-0 border-r border-[#E2D9C5]/20" : "translate-x-full left-0"
          }`}
        >
          {/* Elementos de brillo decorativos */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#2C696F]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Contenido cuando está en Login */}
          {!esRegistro ? (
            <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
              <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl shadow-lg mb-6 text-[#2C696F]">
                <UtensilsCrossed size={36} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-3">
                ¿Nuevo por aquí?
              </h2>
              <p className="text-sm font-medium text-[#A3C1C4] max-w-sm mb-8 leading-relaxed">
                Optimiza el flujo de tu restaurante. Controla mesas, comandas y inventarios en tiempo real con precisión.
              </p>
              <button
                type="button"
                onClick={() => cambiar("registro")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-[#07191D] bg-[#F7F5EB] hover:bg-white active:scale-95 shadow-lg transition-all cursor-pointer"
              >
                <UserPlus size={18} />
                <span>Crear cuenta corporativa</span>
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
              <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl shadow-lg mb-6 text-[#10B981]">
                <ShieldCheck size={36} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-3">
                ¿Ya tienes acceso?
              </h2>
              <p className="text-sm font-medium text-[#A3C1C4] max-w-sm mb-8 leading-relaxed">
                Vuelve al panel principal para continuar gestionando las operaciones y turnos de tu local.
              </p>
              <button
                type="button"
                onClick={() => cambiar("login")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-[#07191D] bg-[#F7F5EB] hover:bg-white active:scale-95 shadow-lg transition-all cursor-pointer"
              >
                <LogIn size={18} />
                <span>Iniciar sesión</span>
              </button>
            </div>
          )}

          <div className="relative z-10 text-center text-xs font-semibold text-[#8CBCC4]/70">
            Sabor&Stock &copy; {new Date().getFullYear()} — Sistema Gastronómico Profesional
          </div>
        </div>

      </div>
    </main>
  );
}