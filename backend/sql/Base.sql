## Table `unidad_medida`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_unidad` | `int4` | Primary Identity |
| `nombre` | `varchar` |  Unique |
| `abreviatura` | `varchar` |  Unique |
| `descripcion` | `varchar` |  Nullable |
| `activo` | `bool` |  |

## Table `categoria`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_categoria` | `int4` | Primary Identity |
| `nombre` | `varchar` |  Unique |
| `descripcion` | `varchar` |  Nullable |
| `activo` | `bool` |  |

## Table `categoria_ingrediente`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_categoria_ingrediente` | `int4` | Primary Identity |
| `nombre` | `varchar` |  Unique |
| `activo` | `bool` |  |

## Table `usuario`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_usuario` | `int4` | Primary Identity |
| `auth_id` | `uuid` |  Nullable Unique |
| `nombre` | `varchar` |  |
| `cedula` | `varchar` |  Unique |
| `telefono` | `varchar` |  Nullable |
| `correo` | `varchar` |  Unique |
| `rol` | `varchar` |  |
| `fecha_registro` | `timestamptz` |  |
| `activo` | `bool` |  |

## Table `seccion`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_seccion` | `int4` | Primary Identity |
| `nombre` | `varchar` |  Unique |
| `orden` | `int4` |  |
| `limite_mesas` | `int4` |  |

## Table `mesa`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_mesa` | `int4` | Primary Identity |
| `numero` | `int4` |  Unique |
| `estado` | `varchar` |  |
| `id_seccion` | `int4` |  |
| `id_usuario` | `int4` |  Nullable |
| `capacidad` | `int4` |  |

## Table `proveedor`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_proveedor` | `int4` | Primary Identity |
| `documento` | `varchar` |  Nullable Unique |
| `nombre` | `varchar` |  |
| `contacto` | `varchar` |  Nullable |
| `telefono` | `varchar` |  Nullable |
| `correo` | `varchar` |  Nullable |
| `direccion` | `varchar` |  Nullable |
| `categoria_suministro` | `varchar` |  Nullable |
| `activo` | `bool` |  |
| `id_categoria_ingrediente` | `int8` |  Nullable |

## Table `ingrediente`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_ingrediente` | `int4` | Primary Identity |
| `codigo` | `varchar` |  Unique |
| `nombre` | `varchar` |  |
| `id_unidad` | `int4` |  |
| `id_categoria_ingrediente` | `int4` |  Nullable |
| `stock` | `numeric` |  |
| `stock_minimo` | `numeric` |  |
| `stock_maximo` | `numeric` |  |
| `precio_referencia` | `numeric` |  |
| `caducidad` | `date` |  Nullable |
| `activo` | `bool` |  |

## Table `producto`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_producto` | `int4` | Primary Identity |
| `codigo` | `varchar` |  Unique |
| `nombre` | `varchar` |  |
| `id_categoria` | `int4` |  |
| `precio_venta` | `numeric` |  |
| `descripcion` | `varchar` |  Nullable |
| `activo` | `bool` |  |
| `tipo` | `varchar` |  |

## Table `receta`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_producto` | `int4` | Primary |
| `id_ingrediente` | `int4` | Primary |
| `cantidad` | `numeric` |  |

## Table `componente_combo`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_combo` | `int4` | Primary |
| `id_producto_hijo` | `int4` | Primary |
| `cantidad` | `int4` |  |

## Table `compra`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_compra` | `int4` | Primary Identity |
| `id_proveedor` | `int4` |  |
| `fecha` | `timestamp` |  |
| `estado` | `varchar` |  |
| `total` | `numeric` |  |
| `factura` | `varchar` |  Nullable |

## Table `detalle_compra`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_compra` | `int4` | Primary |
| `id_ingrediente` | `int4` | Primary |
| `cantidad` | `numeric` |  |
| `precio_aplicado` | `numeric` |  |

## Table `movimiento_inventario`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_movimiento` | `int4` | Primary Identity |
| `id_ingrediente` | `int4` |  |
| `tipo` | `varchar` |  |
| `cantidad` | `numeric` |  |
| `fecha` | `timestamp` |  |
| `motivo` | `varchar` |  |

## Table `venta`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_venta` | `int4` | Primary Identity |
| `id_mesa` | `int4` |  Nullable |
| `cliente` | `varchar` |  |
| `personas` | `int4` |  |
| `id_usuario` | `int4` |  Nullable |
| `estado` | `varchar` |  |
| `fecha_apertura` | `timestamp` |  |
| `fecha_cierre` | `timestamp` |  Nullable |
| `observacion` | `varchar` |  Nullable |

## Table `comanda`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_comanda` | `int4` | Primary Identity |
| `id_venta` | `int4` |  |
| `id_usuario` | `int4` |  Nullable |
| `estado` | `varchar` |  |
| `observacion` | `varchar` |  Nullable |
| `fecha_creacion` | `timestamp` |  |
| `fecha_despachada` | `timestamp` |  Nullable |

## Table `detalle_comanda`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_detalle_comanda` | `int4` | Primary Identity |
| `id_comanda` | `int4` |  |
| `id_producto` | `int4` |  |
| `cantidad` | `int4` |  |
| `nota` | `varchar` |  Nullable |

## Table `factura`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_factura` | `int4` | Primary Identity |
| `id_venta` | `int4` |  Nullable |
| `id_mesa` | `int4` |  Nullable |
| `id_usuario` | `int4` |  |
| `cliente` | `varchar` |  |
| `fecha_emision` | `timestamp` |  |
| `subtotal` | `numeric` |  |
| `descuento` | `numeric` |  |
| `propina` | `numeric` |  |
| `total_pagar` | `numeric` |  |
| `metodo_pago` | `varchar` |  |
| `monto_efectivo` | `numeric` |  |
| `monto_tarjeta` | `numeric` |  |
| `monto_transferencia` | `numeric` |  |
| `estado` | `varchar` |  |

## Table `detalle_factura`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_detalle_factura` | `int4` | Primary Identity |
| `id_factura` | `int4` |  |
| `id_producto` | `int4` |  |
| `cantidad` | `int4` |  |
| `precio_unitario` | `numeric` |  |
| `subtotal` | `numeric` |  |

## Table `caja`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_caja` | `int4` | Primary Identity |
| `nombre` | `varchar` |  Nullable |
| `activo` | `bool` |  |

## Table `turno_caja`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_turno_caja` | `int4` | Primary Identity |
| `id_caja` | `int4` |  |
| `id_usuario_apertura` | `int4` |  |
| `id_usuario_cierre` | `int4` |  Nullable |
| `fecha_apertura` | `timestamp` |  |
| `fecha_cierre` | `timestamp` |  Nullable |
| `monto_inicial` | `numeric` |  |
| `monto_final` | `numeric` |  Nullable |
| `estado` | `varchar` |  |
| `ventas_efectivo` | `numeric` |  |
| `ventas_tarjeta` | `numeric` |  |
| `ventas_transferencia` | `numeric` |  |
| `total_generado` | `numeric` |  |
| `egresos_totales` | `numeric` |  |
| `diferencia` | `numeric` |  |

## Table `historial_caja`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_historial_caja` | `int4` | Primary Identity |
| `id_turno_caja` | `int4` |  |
| `id_usuario` | `int4` |  |
| `id_factura` | `int4` |  Nullable |
| `metodo_pago` | `varchar` |  |
| `tipo_pago` | `varchar` |  |
| `monto` | `numeric` |  |
| `descripcion` | `varchar` |  Nullable |
| `fecha_movimiento` | `timestamp` |  |

## Table `historial_mesa`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_historial_mesa` | `int4` | Primary Identity |
| `id_mesa` | `int4` |  |
| `id_venta` | `int4` |  Nullable |
| `id_usuario` | `int4` |  |
| `estado` | `varchar` |  |
| `monto` | `numeric` |  Nullable |
| `motivo` | `varchar` |  Nullable |
| `fecha_accion` | `timestamp` |  |

## Table `pago_nomina`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_pago_nomina` | `int4` | Primary Identity |
| `id_usuario` | `int4` |  |
| `id_turno_caja` | `int4` |  Nullable |
| `monto_base` | `numeric` |  |
| `bono` | `numeric` |  |
| `monto_total` | `numeric` |  |
| `metodo_pago` | `varchar` |  |
| `fecha` | `timestamp` |  |

## Table `ai_conversacion`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_conversacion` | `int4` | Primary Identity |
| `id_usuario` | `int4` |  Nullable |
| `titulo` | `varchar` |  |
| `contexto` | `varchar` |  |
| `archivada` | `bool` |  |
| `fecha_creacion` | `timestamp` |  |
| `fecha_actualizacion` | `timestamp` |  |

## Table `ai_mensaje`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_mensaje` | `int4` | Primary Identity |
| `id_conversacion` | `int4` |  |
| `rol` | `varchar` |  |
| `contenido` | `text` |  |
| `tokens_entrada` | `int4` |  Nullable |
| `tokens_salida` | `int4` |  Nullable |
| `metadata` | `jsonb` |  |
| `fecha` | `timestamp` |  |

## Table `ai_analisis`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_analisis` | `int4` | Primary Identity |
| `id_usuario` | `int4` |  Nullable |
| `tipo` | `varchar` |  |
| `titulo` | `varchar` |  |
| `resumen` | `text` |  Nullable |
| `contenido` | `jsonb` |  |
| `periodo_inicio` | `date` |  Nullable |
| `periodo_fin` | `date` |  Nullable |
| `fecha_creacion` | `timestamp` |  |

## Table `reporte`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_reporte` | `int4` | Primary Identity |
| `tipo` | `varchar` |  |
| `fecha_inicio` | `date` |  |
| `fecha_fin` | `date` |  |
| `contenido` | `text` |  |
| `fecha_creacion` | `timestamp` |  |

## Table `configuracion_negocio`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `nombre` | `varchar` |  |
| `nit` | `varchar` |  Nullable |
| `direccion` | `varchar` |  Nullable |
| `telefono` | `varchar` |  Nullable |
| `email` | `varchar` |  Nullable |
| `moneda` | `varchar` |  |
| `logo_url` | `varchar` |  Nullable |
| `actualizado_en` | `timestamp` |  |

## Table `impresora`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_impresora` | `int4` | Primary Identity |
| `nombre` | `varchar` |  Unique |
| `tipo` | `varchar` |  |
| `direccion` | `varchar` |  |
| `activa` | `bool` |  |
| `auto_print` | `bool` |  |

## Table `ruta_impresion`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_ruta` | `int4` | Primary Identity |
| `id_categoria` | `int4` |  Unique |
| `id_impresora` | `int4` |  Nullable |

## Table `metodo_pago_config`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_metodo` | `int4` | Primary Identity |
| `nombre` | `varchar` |  |
| `tipo` | `varchar` |  |
| `activo` | `bool` |  |
| `requiere_referencia` | `bool` |  |
| `cuenta_destino` | `varchar` |  Nullable |

## Table `configuracion_facturacion`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `habilitada` | `bool` |  |
| `entorno` | `varchar` |  |
| `resolucion` | `varchar` |  Nullable |
| `prefijo` | `varchar` |  Nullable |
| `rango_inicial` | `int4` |  Nullable |
| `rango_final` | `int4` |  Nullable |
| `fecha_inicio` | `date` |  Nullable |
| `fecha_fin` | `date` |  Nullable |
| `clave_tecnica` | `varchar` |  Nullable |
| `software_id` | `varchar` |  Nullable |
| `api_key` | `varchar` |  Nullable |
| `certificado_cargado` | `bool` |  |
| `actualizado_en` | `timestamp` |  |

## Table `producto_componente`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `id_combo` | `int8` |  |
| `id_producto_hijo` | `int8` |  |
| `cantidad` | `numeric` |  |
| `created_at` | `timestamptz` |  |

## RLS Policies

### `usuario`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `usuario_self_read` | SELECT | authenticated | PERMISSIVE | `((auth_id = auth.uid()) OR is_gerencia())` | — |
| `usuario_gerencia_all` | ALL | authenticated | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `unidad_medida`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `um_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `um_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `categoria`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `cat_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `cat_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `categoria_ingrediente`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `cat_ing_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `cat_ing_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `seccion`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `seccion_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `seccion_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `mesa`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `mesa_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `mesa_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |
| `mesa_update_operativo` | UPDATE | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Mesero'::text, 'Caja'::text])))` | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Mesero'::text, 'Caja'::text])))` |

### `producto`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `prod_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `prod_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `ingrediente`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `ing_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `ing_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `receta`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `rec_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `rec_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `componente_combo`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `combo_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `combo_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `proveedor`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `prov_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `compra`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `compra_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `detalle_compra`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `det_compra_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `movimiento_inventario`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `mov_inv_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |
| `mov_inv_insert_operativo` | INSERT | authenticated | PERMISSIVE | — | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Cocinero'::text, 'Caja'::text])))` |

### `venta`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `venta_all` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Mesero'::text, 'Cocinero'::text, 'Caja'::text])))` | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Mesero'::text, 'Cocinero'::text, 'Caja'::text])))` |

### `impresora`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `impresora_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `ruta_impresion`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `ruta_impresora_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `comanda`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `comanda_all` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Mesero'::text, 'Cocinero'::text, 'Caja'::text])))` | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Mesero'::text, 'Cocinero'::text, 'Caja'::text])))` |

### `detalle_comanda`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `det_comanda_all` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Mesero'::text, 'Cocinero'::text, 'Caja'::text])))` | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Mesero'::text, 'Cocinero'::text, 'Caja'::text])))` |

### `factura`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `factura_all` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = 'Caja'::text))` | `(is_gerencia() OR (current_user_rol() = 'Caja'::text))` |

### `detalle_factura`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `det_factura_all` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = 'Caja'::text))` | `(is_gerencia() OR (current_user_rol() = 'Caja'::text))` |

### `caja`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `caja_read` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `caja_write` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `turno_caja`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `turno_all` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = 'Caja'::text))` | `(is_gerencia() OR (current_user_rol() = 'Caja'::text))` |

### `historial_caja`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `hist_caja_all` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = 'Caja'::text))` | `(is_gerencia() OR (current_user_rol() = 'Caja'::text))` |

### `historial_mesa`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `hist_mesa_all` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Caja'::text, 'Mesero'::text])))` | `(is_gerencia() OR (current_user_rol() = ANY (ARRAY['Caja'::text, 'Mesero'::text])))` |

### `pago_nomina`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `nomina_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `ai_conversacion`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `ai_conv_owner` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (id_usuario = ( SELECT usuario.id_usuario    FROM usuario   WHERE (usuario.auth_id = auth.uid()))))` | `(is_gerencia() OR (id_usuario = ( SELECT usuario.id_usuario    FROM usuario   WHERE (usuario.auth_id = auth.uid()))))` |

### `ai_mensaje`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `ai_msg_owner` | ALL | authenticated | PERMISSIVE | `(is_gerencia() OR (EXISTS ( SELECT 1    FROM ai_conversacion c   WHERE ((c.id_conversacion = ai_mensaje.id_conversacion) AND (c.id_usuario = ( SELECT usuario.id_usuario            FROM usuario           WHERE (usuario.auth_id = auth.uid())))))))` | `(is_gerencia() OR (EXISTS ( SELECT 1    FROM ai_conversacion c   WHERE ((c.id_conversacion = ai_mensaje.id_conversacion) AND (c.id_usuario = ( SELECT usuario.id_usuario            FROM usuario           WHERE (usuario.auth_id = auth.uid())))))))` |

### `ai_analisis`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `ai_analisis_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `reporte`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `reporte_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `configuracion_negocio`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `config_negocio_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `metodo_pago_config`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `metodo_pago_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

### `configuracion_facturacion`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `config_facturacion_all` | ALL | public | PERMISSIVE | `is_gerencia()` | `is_gerencia()` |

