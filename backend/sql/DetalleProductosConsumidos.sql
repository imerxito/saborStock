-- ==============================================================================
-- SABOR & STOCK - VISTAS Y CONSULTAS DE DETALLE DE PRODUCTOS CONSUMIDOS
-- Conforme al esquema oficial de Base.sql (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Vista de Productos Consumidos Activos en Mesas (En Vivo / Comandas Abiertas)
-- Relaciona: detalle_comanda -> comanda -> venta -> mesa -> seccion -> producto -> categoria -> usuario
CREATE OR REPLACE VIEW vista_productos_consumidos_mesas AS
SELECT 
    dc.id_detalle_comanda,
    c.id_comanda,
    v.id_venta,
    m.id_mesa,
    COALESCE(m.numero, 0) AS mesa_numero,
    COALESCE(s.nombre, 'Sin Sección') AS seccion_nombre,
    COALESCE(v.cliente, 'Cliente General') AS cliente_nombre,
    COALESCE(u.nombre, 'Mesero') AS mesero_nombre,
    p.id_producto,
    p.codigo AS producto_codigo,
    p.nombre AS producto_nombre,
    COALESCE(cat.nombre, 'General') AS categoria_nombre,
    dc.cantidad,
    p.precio_venta AS precio_unitario,
    (dc.cantidad * p.precio_venta) AS subtotal,
    dc.nota,
    c.estado AS estado_comanda,
    c.fecha_creacion AS hora_pedido
FROM detalle_comanda dc
JOIN comanda c ON dc.id_comanda = c.id_comanda
JOIN venta v ON c.id_venta = v.id_venta
LEFT JOIN mesa m ON v.id_mesa = m.id_mesa
LEFT JOIN seccion s ON m.id_seccion = s.id_seccion
LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
JOIN producto p ON dc.id_producto = p.id_producto
LEFT JOIN categoria cat ON p.id_categoria = cat.id_categoria
WHERE c.estado != 'Cerrado';

-- 2. Vista de Productos Consumidos Históricos (Facturados y Cobrados en Caja)
-- Relaciona: detalle_factura -> factura -> mesa -> seccion -> producto -> categoria -> usuario
CREATE OR REPLACE VIEW vista_productos_consumidos_facturados AS
SELECT 
    df.id_detalle_factura,
    f.id_factura,
    f.id_venta,
    f.id_mesa,
    COALESCE(m.numero, 0) AS mesa_numero,
    COALESCE(s.nombre, 'Sin Sección') AS seccion_nombre,
    COALESCE(f.cliente, 'Consumidor Final') AS cliente_nombre,
    COALESCE(u.nombre, 'Caja') AS atendido_por,
    p.id_producto,
    p.codigo AS producto_codigo,
    p.nombre AS producto_nombre,
    COALESCE(cat.nombre, 'General') AS categoria_nombre,
    df.cantidad,
    df.precio_unitario,
    df.subtotal,
    f.metodo_pago,
    f.fecha_emision
FROM detalle_factura df
JOIN factura f ON df.id_factura = f.id_factura
LEFT JOIN mesa m ON f.id_mesa = m.id_mesa
LEFT JOIN seccion s ON m.id_seccion = s.id_seccion
LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
JOIN producto p ON df.id_producto = p.id_producto
LEFT JOIN categoria cat ON p.id_categoria = cat.id_categoria;

-- 3. Vista de Resumen Consolidado de Consumo por Producto (Demanda en Tiempo Real)
CREATE OR REPLACE VIEW vista_resumen_consumo_productos AS
SELECT 
    p.id_producto,
    p.codigo AS producto_codigo,
    p.nombre AS producto_nombre,
    COALESCE(cat.nombre, 'General') AS categoria_nombre,
    SUM(dc.cantidad) AS total_unidades_activas,
    p.precio_venta,
    SUM(dc.cantidad * p.precio_venta) AS total_valor_activo,
    COUNT(DISTINCT c.id_comanda) AS comandas_en_curso,
    COUNT(DISTINCT v.id_mesa) AS mesas_distintas
FROM detalle_comanda dc
JOIN comanda c ON dc.id_comanda = c.id_comanda
JOIN venta v ON c.id_venta = v.id_venta
JOIN producto p ON dc.id_producto = p.id_producto
LEFT JOIN categoria cat ON p.id_categoria = cat.id_categoria
WHERE c.estado != 'Cerrado'
GROUP BY p.id_producto, p.codigo, p.nombre, cat.nombre, p.precio_venta;

-- 4. Permisos de lectura (RLS) para usuarios autenticados acordes a Base.sql
GRANT SELECT ON vista_productos_consumidos_mesas TO authenticated, public;
GRANT SELECT ON vista_productos_consumidos_facturados TO authenticated, public;
GRANT SELECT ON vista_resumen_consumo_productos TO authenticated, public;
