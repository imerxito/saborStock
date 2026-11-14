import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ImpresoraSistema {
  nombre: string;
  puerto: string;
  controlador: string;
  predeterminada: boolean;
}

/**
 * Obtiene todas las impresoras instaladas/conectadas en el sistema operativo Windows
 */
export async function listarImpresorasSistema(): Promise<ImpresoraSistema[]> {
  return new Promise((resolve) => {
    // Si no estamos en Windows, retornar lista vacía
    if (process.platform !== 'win32') {
      return resolve([]);
    }

    const script = `Get-CimInstance Win32_Printer | Select-Object Name, PortName, DriverName, Default | ConvertTo-Json`;

    execFile('powershell.exe', ['-NoProfile', '-Command', script], { timeout: 6000 }, (err, stdout) => {
      if (err || !stdout) {
        console.warn('No se pudieron obtener impresoras de Windows:', err?.message);
        return resolve([]);
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        const arr = Array.isArray(parsed) ? parsed : [parsed];

        const resultado: ImpresoraSistema[] = arr
          .filter((p: any) => p && p.Name)
          .map((p: any) => ({
            nombre: String(p.Name),
            puerto: String(p.PortName || ''),
            controlador: String(p.DriverName || ''),
            predeterminada: Boolean(p.Default),
          }));

        resolve(resultado);
      } catch (parseErr) {
        console.warn('Error al parsear impresoras de Windows:', parseErr);
        resolve([]);
      }
    });
  });
}

/**
 * Imprime un documento de texto directamente a una impresora de Windows instalada
 */
export async function imprimirTextoEnImpresora(
  nombreImpresora: string,
  contenidoTexto: string
): Promise<{ success: boolean; mensaje: string }> {
  return new Promise(async (resolve) => {
    if (process.platform !== 'win32') {
      return resolve({
        success: false,
        mensaje: 'La impresión directa por spooler de sistema solo está disponible en Windows.',
      });
    }

    const impresoras = await listarImpresorasSistema();
    let impDestino = impresoras.find(
      (i) => i.nombre.toLowerCase().trim() === nombreImpresora.toLowerCase().trim()
    );

    // Si no coincide exactamente, buscar si el nombre está contenido o usar la predeterminada
    if (!impDestino) {
      impDestino = impresoras.find((i) =>
        i.nombre.toLowerCase().includes(nombreImpresora.toLowerCase().trim())
      );
    }

    if (!impDestino) {
      impDestino = impresoras.find((i) => i.predeterminada) || impresoras[0];
    }

    if (!impDestino) {
      return resolve({
        success: false,
        mensaje: `No se encontró la impresora "${nombreImpresora}" ni ninguna impresora conectada en el sistema.`,
      });
    }

    const archivoTemp = path.join(os.tmpdir(), `saborstock_print_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);

    try {
      // Escribir archivo con BOM UTF-8 para compatibilidad perfecta con PowerShell
      const bomUtf8 = Buffer.from('\ufeff' + contenidoTexto, 'utf-8');
      fs.writeFileSync(archivoTemp, bomUtf8);

      const script = `Get-Content -LiteralPath '${archivoTemp.replace(/'/g, "''")}' -Encoding UTF8 | Out-Printer -Name '${impDestino.nombre.replace(/'/g, "''")}'`;

      execFile('powershell.exe', ['-NoProfile', '-Command', script], { timeout: 8000 }, (err) => {
        // Limpiar archivo temporal
        try { fs.unlinkSync(archivoTemp); } catch {}

        if (err) {
          return resolve({
            success: false,
            mensaje: `Error al enviar a la impresora "${impDestino!.nombre}": ${err.message}`,
          });
        }

        resolve({
          success: true,
          mensaje: `Trabajo de impresión enviado correctamente a "${impDestino!.nombre}".`,
        });
      });
    } catch (e: any) {
      try { fs.unlinkSync(archivoTemp); } catch {}
      resolve({
        success: false,
        mensaje: `Error al preparar archivo de impresión: ${e?.message || 'Error'}`,
      });
    }
  });
}

/**
 * Genera el texto formateado de comanda para enviar a impresoras de sistema
 */
export function generarTicketTextoComanda(
  datos: {
    mesa: string | number;
    seccion?: string;
    cliente?: string;
    mesero?: string;
    items: { nombre: string; cantidad: number; nota?: string }[];
  },
  negocio?: { nombre?: string | null; direccion?: string | null; telefono?: string | null } | null
): string {
  const line = '----------------------------------------';
  const doubleLine = '========================================';
  const fechaStr = new Date().toLocaleDateString('es-CO');
  const horaStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

  const lineas: string[] = [];
  lineas.push(doubleLine);
  lineas.push(centrarTexto(negocio?.nombre?.toUpperCase() || 'SABORSTOCK RESTAURANTE', 40));
  lineas.push(centrarTexto('*** COMANDA DE COCINA / BARRA ***', 40));
  lineas.push(doubleLine);
  lineas.push(`MESA:     ${datos.mesa}`);
  if (datos.seccion) lineas.push(`SECCION:  ${datos.seccion}`);
  if (datos.cliente) lineas.push(`CLIENTE:  ${datos.cliente}`);
  if (datos.mesero)  lineas.push(`MESERO:   ${datos.mesero}`);
  lineas.push(`FECHA:    ${fechaStr} - ${horaStr}`);
  lineas.push(line);
  lineas.push(padRight('CANT', 6) + 'DESCRIPCION');
  lineas.push(line);

  let totalItems = 0;
  for (const it of datos.items) {
    totalItems += it.cantidad;
    lineas.push(`${padRight(`${it.cantidad}x`, 6)}${it.nombre}`);
    if (it.nota && it.nota.trim()) {
      lineas.push(`      * NOTA: ${it.nota.trim()}`);
    }
  }

  lineas.push(line);
  lineas.push(`TOTAL PRODUCTOS EN ESTA TANDA: ${totalItems}`);
  lineas.push(doubleLine);
  lineas.push(centrarTexto('SaborStock POS - Control de Pedidos', 40));
  lineas.push('\n\n\n'); // Espacio de corte

  return lineas.join('\r\n');
}

/**
 * Genera el texto formateado de prueba de impresora
 */
export function generarTicketTextoPrueba(
  nombreImpresora: string,
  negocio?: { nombre?: string | null; nit?: string | null; direccion?: string | null; telefono?: string | null } | null
): string {
  const doubleLine = '========================================';
  const line = '----------------------------------------';
  const fechaHora = new Date().toLocaleString('es-CO');

  const lineas: string[] = [];
  lineas.push(doubleLine);
  lineas.push(centrarTexto(negocio?.nombre?.toUpperCase() || 'SABORSTOCK RESTAURANTE', 40));
  lineas.push(centrarTexto('PRUEBA DE IMPRESORA CONECTADA', 40));
  lineas.push(doubleLine);
  if (negocio?.nit) lineas.push(`NIT:       ${negocio.nit}`);
  if (negocio?.direccion) lineas.push(`DIRECCION: ${negocio.direccion}`);
  if (negocio?.telefono) lineas.push(`TEL:       ${negocio.telefono}`);
  lineas.push(`FECHA:     ${fechaHora}`);
  lineas.push(line);
  lineas.push(`IMPRESORA: ${nombreImpresora}`);
  lineas.push(`ESTADO:    CONECTADA Y FUNCIONAL (100%)`);
  lineas.push(line);
  lineas.push('¡FELICITACIONES!');
  lineas.push('Tu impresora esta lista para imprimir');
  lineas.push('comandas, pre-cuentas y facturas');
  lineas.push('automaticamente desde SaborStock.');
  lineas.push(doubleLine);
  lineas.push(centrarTexto('SaborStock Sistema Gastronomico', 40));
  lineas.push('\n\n\n');

  return lineas.join('\r\n');
}

function centrarTexto(txt: string, ancho: number): string {
  if (txt.length >= ancho) return txt.substring(0, ancho);
  const pad = Math.floor((ancho - txt.length) / 2);
  return ' '.repeat(pad) + txt;
}

function padRight(txt: string, ancho: number): string {
  if (txt.length >= ancho) return txt;
  return txt + ' '.repeat(ancho - txt.length);
}
