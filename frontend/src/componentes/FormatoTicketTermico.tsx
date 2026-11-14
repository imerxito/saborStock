import React from 'react';

export interface DatosNegocioTicket {
  nombre?: string;
  nit?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  slogan?: string | null;
}

export interface DatosFacturacionTicket {
  habilitada?: boolean;
  resolucion?: string | null;
  prefijo?: string | null;
  rangoInicial?: number | null;
  rangoFinal?: number | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface ItemTicket {
  nombre: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
  nota?: string;
}

export interface PropsTicketTermico {
  tipo: 'precuenta' | 'factura' | 'comanda' | 'prueba';
  negocio?: DatosNegocioTicket | null;
  facturacion?: DatosFacturacionTicket | null;
  titulo?: string;

  // Datos mesa / cliente
  mesa?: string | number;
  seccion?: string;
  cliente?: string;
  mesero?: string;
  fechaHora?: string;
  metodoPago?: string;

  // Items y montos
  items?: ItemTicket[];
  subtotal?: number;
  descuento?: number;
  propina?: number;
  total?: number;

  // Datos de Impresora
  nombreImpresora?: string;
  tipoImpresora?: string;
  direccionImpresora?: string;
  estadoImpresora?: string;
  categoriasAsignadas?: string[];
  seccionesAsignadas?: string[];

  mensajePie?: string;
}

export default function FormatoTicketTermico({
  tipo,
  negocio,
  facturacion,
  titulo,
  mesa,
  seccion,
  cliente,
  mesero,
  fechaHora,
  metodoPago,
  items = [],
  subtotal = 0,
  descuento = 0,
  propina = 0,
  total = 0,
  nombreImpresora,
  tipoImpresora,
  direccionImpresora,
  estadoImpresora,
  categoriasAsignadas = [],
  seccionesAsignadas = [],
  mensajePie,
}: PropsTicketTermico) {
  const nombreNegocio = negocio?.nombre || 'SABOR & STOCK RESTAURANTE';
  const fechaActual = fechaHora || new Date().toLocaleString('es-CO');

  return (
    <div id="ticket-impresion-pos" className="hidden print:block">
      {/* ================= 1. ENCABEZADO COMERCIAL ================= */}
      {tipo !== 'comanda' ? (
        <div className="text-center pb-2 mb-2 border-b border-black border-dashed">
          <h1 className="font-bold text-base uppercase leading-tight tracking-tight">
            {nombreNegocio}
          </h1>
          {negocio?.nit && <p className="text-xs font-semibold">NIT: {negocio.nit}</p>}
          {negocio?.direccion && <p className="text-[11px] leading-snug">{negocio.direccion}</p>}
          {negocio?.telefono && <p className="text-[11px]">TEL: {negocio.telefono}</p>}
          {negocio?.email && <p className="text-[10px]">{negocio.email}</p>}

          {/* DATOS FISCALES DIAN (SI APLICA) */}
          {facturacion?.habilitada && facturacion.resolucion && (
            <div className="mt-1 pt-1 border-t border-black border-dotted text-[9px] leading-tight space-y-0.5">
              <p>RESOLUCIÓN DIAN: {facturacion.resolucion}</p>
              <p>
                PREFIJO: {facturacion.prefijo || 'FAC'} | RANGO: {facturacion.rangoInicial || 1} AL {facturacion.rangoFinal || 5000}
              </p>
              {facturacion.fechaInicio && facturacion.fechaFin && (
                <p>VIGENCIA: {facturacion.fechaInicio} A {facturacion.fechaFin}</p>
              )}
            </div>
          )}

          <div className="mt-2 py-1 border-t border-b border-black font-bold text-xs uppercase tracking-wider">
            {titulo || (tipo === 'precuenta' ? 'PRE-CUENTA / DETALLE DE CONSUMO' : tipo === 'factura' ? 'FACTURA DE VENTA' : 'TICKET DE PRUEBA')}
          </div>
        </div>
      ) : (
        /* ENCABEZADO PARA COMANDA DE COCINA / BARRA */
        <div className="text-center pb-2 mb-2 border-b border-black border-dashed">
          <div className="py-1 border-t-2 border-b-2 border-black font-bold text-sm uppercase tracking-wide">
            *** COMANDA DE DESPACHO ***
          </div>
          {nombreImpresora && (
            <p className="font-bold text-xs uppercase mt-1">ÁREA: {nombreImpresora}</p>
          )}
        </div>
      )}

      {/* ================= 2. METADATOS (MESA, CLIENTE, HORA) ================= */}
      <div className="mb-2 pb-2 border-b border-black border-dashed text-xs space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>{mesa ? `MESA: #${mesa} ${seccion ? `(${seccion})` : ''}` : (seccion ? `ZONA: ${seccion}` : 'VENTA DIRECTA / CAJA')}</span>
          <span className="font-mono">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
        </div>
        {cliente && <p>CLIENTE: <span className="font-bold uppercase">{cliente}</span></p>}
        {mesero && <p>ATIENDE: <span className="uppercase">{mesero}</span></p>}
        <p>FECHA: {fechaActual}</p>
        {metodoPago && <p>FORMA DE PAGO: <span className="font-bold uppercase">{metodoPago}</span></p>}
      </div>

      {/* ================= 3. CASO TICKET DE PRUEBA ESC/POS ================= */}
      {tipo === 'prueba' ? (
        <div className="space-y-2 mb-3 text-xs">
          <div className="bg-gray-100 p-2 border border-black border-dotted space-y-1 text-[11px]">
            <p className="font-bold uppercase text-xs">&gt; DATOS DEL DISPOSITIVO:</p>
            <p>NOMBRE: <strong>{nombreImpresora}</strong></p>
            <p>CONEXIÓN: {tipoImpresora}</p>
            <p>DIRECCIÓN / PUERTO: <span className="font-mono">{direccionImpresora}</span></p>
            <p>ESTADO: <strong>{estadoImpresora || 'ONLINE'}</strong></p>
          </div>

          <div className="border border-black border-dotted p-2 space-y-1 text-[10px]">
            <p className="font-bold uppercase text-[11px]">&gt; ENRUTAMIENTO DE CATEGORÍAS:</p>
            <p className="pl-1 leading-snug">
              {categoriasAsignadas.length === 0
                ? '* Todas las categorías del menú están habilitadas'
                : categoriasAsignadas.join(' • ')}
            </p>

            <p className="font-bold uppercase text-[11px] pt-1">&gt; SECCIONES DE MESAS ASIGNADAS:</p>
            <p className="pl-1 leading-snug">
              {seccionesAsignadas.length === 0
                ? '* Todas las secciones del establecimiento'
                : seccionesAsignadas.join(' • ')}
            </p>
          </div>

          <div className="border-t border-b border-black border-dashed py-2 space-y-1 text-[10px] text-center">
            <p className="font-bold uppercase">&gt; TEST DE CARACTERES Y ALINEACIÓN &lt;</p>
            <p className="font-mono text-[9px]">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p className="font-mono text-[9px]">abcdefghijklmnopqrstuvwxyz 0123456789</p>
            <p className="font-mono text-[9px]">$ € % & / ( ) = ? ! ¿ ¡ @ + -</p>
            <div className="flex justify-between font-bold text-[10px] pt-1">
              <span>[IZQUIERDA]</span>
              <span>[CENTRO]</span>
              <span>[DERECHA]</span>
            </div>
          </div>
        </div>
      ) : (
        /* ================= 4. TABLA DE ÍTEMS (PRECUENTA / FACTURA / COMANDA) ================= */
        <div className="mb-2">
          {tipo === 'comanda' ? (
            /* LISTA PARA COCINA/BARRA CON TEXTO GRANDE Y NOTAS */
            <div className="space-y-2">
              <div className="flex font-bold border-b border-black pb-1 mb-1 text-xs">
                <span className="w-8">CANT</span>
                <span className="flex-1">PLATO / DESCRIPCIÓN</span>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="pb-1.5 border-b border-gray-300">
                  <div className="flex font-bold text-sm">
                    <span className="w-8">{it.cantidad}x</span>
                    <span className="flex-1 uppercase leading-snug">{it.nombre}</span>
                  </div>
                  {it.nota && (
                    <p className="text-[11px] font-bold italic pl-8 text-black mt-0.5">
                      &gt;&gt; NOTA: {it.nota}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* LISTA ESTÁNDAR DE PRECIOS PARA CLIENTE / CAJA */
            <div>
              <div className="flex font-bold border-b border-black pb-1 mb-1 text-xs">
                <span className="w-8">CANT</span>
                <span className="flex-1">PRODUCTO</span>
                <span className="w-16 text-right">TOTAL</span>
              </div>
              {items.map((it, idx) => {
                const sub = it.subtotal ?? ((it.precioUnitario || 0) * it.cantidad);
                return (
                  <div key={idx} className="flex text-xs mb-1">
                    <span className="w-8">{it.cantidad}x</span>
                    <span className="flex-1 uppercase truncate">{it.nombre}</span>
                    <span className="w-16 text-right font-mono">${sub.toLocaleString('es-CO')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 5. TOTALES (SI NO ES COMANDA NI PRUEBA) ================= */}
      {tipo !== 'comanda' && tipo !== 'prueba' && (
        <div className="border-t border-black border-dashed pt-2 mb-2 text-right text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span className="font-mono">${subtotal.toLocaleString('es-CO')}</span>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-black">
              <span>DESCUENTO:</span>
              <span className="font-mono">-${descuento.toLocaleString('es-CO')}</span>
            </div>
          )}
          {propina > 0 && (
            <div className="flex justify-between">
              <span>PROPINA VOLUNTARIA:</span>
              <span className="font-mono">+${propina.toLocaleString('es-CO')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-black border-dotted mt-1">
            <span>TOTAL A PAGAR:</span>
            <span className="font-mono">${total.toLocaleString('es-CO')}</span>
          </div>
        </div>
      )}

      {/* ================= 6. PIE DE PÁGINA DEL TICKET ================= */}
      <div className="text-center text-[10px] mt-4 pt-2 border-t border-black border-dashed space-y-0.5 leading-tight">
        {tipo === 'prueba' ? (
          <>
            <p className="font-bold text-xs uppercase">*** PRUEBA FINALIZADA CON ÉXITO ***</p>
            <p>El dispositivo está listo para operar en el sistema POS.</p>
            <p className="pt-1">*** {nombreNegocio} ***</p>
          </>
        ) : tipo === 'comanda' ? (
          <>
            <p className="font-bold text-[11px] uppercase">&gt;&gt;&gt; FIN DE COMANDA &lt;&lt;&lt;</p>
            <p>Impresora: {nombreImpresora || 'Cocina/Barra'}</p>
          </>
        ) : (
          <>
            <p className="font-semibold">{mensajePie || '¡GRACIAS POR SU COMPRA Y PREFERENCIA!'}</p>
            <p className="text-[9px]">Sistema POS Sabor & Stock</p>
            <p className="text-[9px]">*** {nombreNegocio} ***</p>
          </>
        )}
      </div>
    </div>
  );
}
