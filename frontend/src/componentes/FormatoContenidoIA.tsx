import React, { useMemo } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2, 
  Utensils, 
  Wallet, 
  Package,
  Layers,
  ChevronRight,
  Users,
  HandCoins,
  ClipboardList,
  Store,
} from "lucide-react";

interface FormatoContenidoIAProps {
  contenido: string;
  className?: string;
}

/**
 * Resalta texto en negrita, código inline y cantidades monetarias en un fragmento de texto
 */
function formatearTextoInline(texto: string): React.ReactNode {
  // Dividir por negritas (**texto**), código (`texto`) y destacar monedas ($XX.XXX)
  const partes: React.ReactNode[] = [];
  
  // Expresión regular para tokens inline
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\$\s?[\d.,]+(?:\s?COP)?|\b\d+%(?:\s?de)?)/g;
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto)) !== null) {
    // Texto antes del match
    if (match.index > ultimoIndice) {
      partes.push(texto.substring(ultimoIndice, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      const contenidoBold = token.slice(2, -2);
      partes.push(
        <strong key={match.index} className="font-bold text-[#F4D6B0]">
          {contenidoBold}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      const contenidoCode = token.slice(1, -1);
      partes.push(
        <code 
          key={match.index} 
          className="px-1.5 py-0.5 rounded bg-[#0B132B] border border-[#3A506B] text-[#5BC0DE] font-mono text-[11px]"
        >
          {contenidoCode}
        </code>
      );
    } else if (token.startsWith("$")) {
      partes.push(
        <span 
          key={match.index} 
          className="font-bold text-[#4ADE80] bg-[#4ADE80]/10 px-1 py-0.2 rounded border border-[#4ADE80]/30 font-mono tracking-tight"
        >
          {token}
        </span>
      );
    } else if (token.includes("%")) {
      partes.push(
        <span 
          key={match.index} 
          className="font-bold text-[#FBBF24] bg-[#FBBF24]/10 px-1 py-0.2 rounded border border-[#FBBF24]/30 font-mono"
        >
          {token}
        </span>
      );
    }

    ultimoIndice = match.index + token.length;
  }

  if (ultimoIndice < texto.length) {
    partes.push(texto.substring(ultimoIndice));
  }

  return partes.length > 0 ? partes : texto;
}

/**
 * Selecciona un icono contextual según el título de la sección
 */
function obtenerIconoSeccion(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes("venta") || t.includes("ingreso") || t.includes("financ") || t.includes("caja") || t.includes("balance") || t.includes("resumen")) {
    return <Wallet className="w-4 h-4 text-[#5BC0DE] shrink-0" />;
  }
  if (t.includes("propina") || t.includes("tip")) {
    return <HandCoins className="w-4 h-4 text-[#FBBF24] shrink-0" />;
  }
  if (t.includes("mesero") || t.includes("personal") || t.includes("empleado") || t.includes("usuario")) {
    return <Users className="w-4 h-4 text-[#A78BFA] shrink-0" />;
  }
  if (t.includes("plato") || t.includes("menú") || t.includes("comida") || t.includes("producto") || t.includes("categor")) {
    return <Utensils className="w-4 h-4 text-[#FBBF24] shrink-0" />;
  }
  if (t.includes("inventario") || t.includes("stock") || t.includes("insumo")) {
    return <Package className="w-4 h-4 text-[#E57373] shrink-0" />;
  }
  if (t.includes("recomenda") || t.includes("estrateg") || t.includes("accion") || t.includes("consejo") || t.includes("paso") || t.includes("cómo")) {
    return <Lightbulb className="w-4 h-4 text-[#4ADE80] shrink-0" />;
  }
  if (t.includes("alerta") || t.includes("diagnóst") || t.includes("atención")) {
    return <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0" />;
  }
  if (t.includes("nomina") || t.includes("nómina") || t.includes("pago") || t.includes("salario")) {
    return <ClipboardList className="w-4 h-4 text-[#34D399] shrink-0" />;
  }
  if (t.includes("mesa") || t.includes("salon") || t.includes("sabor") || t.includes("stock ia")) {
    return <Store className="w-4 h-4 text-[#5BC0DE] shrink-0" />;
  }
  return <Sparkles className="w-4 h-4 text-[#5BC0DE] shrink-0" />;
}

export default function FormatoContenidoIA({ contenido, className = "" }: FormatoContenidoIAProps) {
  const bloques = useMemo(() => {
    if (!contenido) return [];
    
    const lineas = contenido.split("\n");
    const resultado: React.ReactNode[] = [];
    let i = 0;

    while (i < lineas.length) {
      const linea = lineas[i];
      const lineaTrim = linea.trim();

      // Línea vacía
      if (!lineaTrim) {
        i++;
        continue;
      }

      // 1. TÍTULOS (###, ##, #)
      if (lineaTrim.startsWith("#")) {
        const nivel = lineaTrim.match(/^#+/)?.[0].length || 1;
        const textoTitulo = lineaTrim.replace(/^#+\s*/, "");
        const icono = obtenerIconoSeccion(textoTitulo);

        if (nivel <= 2) {
          resultado.push(
            <div 
              key={`h-${i}`} 
              className="flex items-center gap-2 pt-3 pb-1 border-b border-[#3A506B]/80 my-2"
            >
              <div className="p-1.5 rounded-lg bg-[#5BC0DE]/15 border border-[#5BC0DE]/30">
                {icono}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#F4D6B0] tracking-wide">
                {formatearTextoInline(textoTitulo)}
              </h3>
            </div>
          );
        } else {
          resultado.push(
            <div 
              key={`h-${i}`} 
              className="flex items-center gap-2 pt-2 pb-1 my-1.5"
            >
              <div className="p-1 rounded-md bg-[#1C2541] border border-[#3A506B]">
                {icono}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-[#5BC0DE]">
                {formatearTextoInline(textoTitulo)}
              </h4>
            </div>
          );
        }
        i++;
        continue;
      }

      // 2. TABLAS (| col | col |)
      if (lineaTrim.startsWith("|") && lineaTrim.endsWith("|")) {
        const tablaLineas: string[] = [];
        while (i < lineas.length && lineas[i].trim().startsWith("|") && lineas[i].trim().endsWith("|")) {
          tablaLineas.push(lineas[i].trim());
          i++;
        }

        if (tablaLineas.length >= 2) {
          const encabezados = tablaLineas[0]
            .split("|")
            .slice(1, -1)
            .map(c => c.trim());
          
          // Ignorar fila divisoria |---|---|
          const filasDatos = tablaLineas.slice(tablaLineas[1].includes("---") ? 2 : 1).map(fila =>
            fila
              .split("|")
              .slice(1, -1)
              .map(c => c.trim())
          );

          resultado.push(
            <div key={`table-${i}`} className="my-2.5 overflow-x-auto rounded-xl border border-[#3A506B] bg-[#0B132B]/80">
              <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                <thead>
                  <tr className="bg-[#1C2541] border-b border-[#3A506B] text-[#5BC0DE] uppercase font-bold tracking-wider">
                    {encabezados.map((th, thIdx) => (
                      <th key={thIdx} className="py-2 px-3">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A506B]/40 text-[#F4D6B0]">
                  {filasDatos.map((fila, fIdx) => (
                    <tr key={fIdx} className="hover:bg-[#1C2541]/40 transition-colors">
                      {fila.map((celda, cIdx) => (
                        <td key={cIdx} className="py-2 px-3">
                          {formatearTextoInline(celda)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 3. CITAS O ALERTAS (> Texto)
      if (lineaTrim.startsWith(">")) {
        const citaTexto = lineaTrim.replace(/^>\s*/, "");
        resultado.push(
          <div 
            key={`quote-${i}`} 
            className="my-2 p-3 rounded-xl border-l-4 border-l-[#FBBF24] bg-[#FBBF24]/10 border border-[#3A506B]/50 flex items-start gap-2.5 text-xs text-[#F4D6B0]"
          >
            <Lightbulb size={16} className="text-[#FBBF24] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {formatearTextoInline(citaTexto)}
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 4. LISTAS NUMERADAS (1. , 2. )
      const matchNum = lineaTrim.match(/^(\d+)\.\s+(.*)/);
      if (matchNum) {
        const numero = matchNum[1];
        const contenidoLista = matchNum[2];
        resultado.push(
          <div key={`num-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1">
            <span className="grid place-items-center w-5 h-5 rounded-full bg-gradient-to-br from-[#5BC0DE] to-[#3A506B] text-[#0B132B] font-bold text-[10px] shrink-0 mt-0.5 shadow-sm">
              {numero}
            </span>
            <div className="flex-1 text-xs sm:text-sm text-[#F4D6B0] leading-relaxed">
              {formatearTextoInline(contenidoLista)}
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 5. LISTAS DE VIÑETAS (- o *)
      if (lineaTrim.startsWith("- ") || lineaTrim.startsWith("* ")) {
        const textoItem = lineaTrim.substring(2);
        resultado.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5BC0DE] shrink-0 mt-2 shadow-[0_0_6px_#5BC0DE]" />
            <div className="flex-1 text-xs sm:text-sm text-[#F4D6B0] leading-relaxed">
              {formatearTextoInline(textoItem)}
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 6. PÁRRAFO REGULAR
      resultado.push(
        <p key={`p-${i}`} className="text-xs sm:text-sm text-[#F4D6B0] leading-relaxed my-1">
          {formatearTextoInline(lineaTrim)}
        </p>
      );
      i++;
    }

    return resultado;
  }, [contenido]);

  return (
    <div className={`space-y-1 ${className}`}>
      {bloques}
    </div>
  );
}
