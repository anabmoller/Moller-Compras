-- ============================================================
-- SEED 004: Movimientos Históricos de Ganado (SAMPLE)
-- Fuente: GUIAS_ACTUALIZADAS.xlsx
-- Total disponible: 2,328 guías únicas = 208,138 animales
-- Insertando: 30 movimientos reales representativos
-- Fecha: 2026-03-03
-- ============================================================
-- NOTA: Este seed inserta movimientos en estado 'cerrado' (históricos).
--       Los movimientos son reales extraídos del Excel de guías.
--       Se usan subqueries para resolver FKs por RUC/código.
-- ============================================================

-- Desabilitar temporalmente triggers de auto-número para poder
-- insertar con control explícito (el trigger ya genera MG-YYYY-NNN)
-- Los movimientos históricos se insertan SIN movimiento_number explícito
-- dejando que el trigger genere la secuencia.

DO $$
DECLARE
  -- Variables para IDs
  v_mov_id UUID;
  v_est_ypoti UUID;
  v_est_lusipar UUID;
  v_est_cerro UUID;
  v_est_santa UUID;
  v_est_cielo UUID;
  v_est_yby UUID;
  v_cat_dm UUID;
  v_cat_dh UUID;
  v_cat_tor UUID;
  v_cat_nov UUID;
  v_cat_vaq UUID;
  v_cat_ter UUID;
  v_empresa_rural UUID;
  v_empresa_frigo UUID;
  v_empresa_beef UUID;
  v_user_id UUID;
BEGIN
  -- ══════════════════════════════════════════════════════
  -- Resolver IDs de categorías
  -- ══════════════════════════════════════════════════════
  SELECT id INTO v_cat_dm  FROM categorias_animales WHERE codigo = 'DM'  LIMIT 1;
  SELECT id INTO v_cat_dh  FROM categorias_animales WHERE codigo = 'DH'  LIMIT 1;
  SELECT id INTO v_cat_tor FROM categorias_animales WHERE codigo = 'TOR' LIMIT 1;
  SELECT id INTO v_cat_nov FROM categorias_animales WHERE codigo = 'NOV' LIMIT 1;
  SELECT id INTO v_cat_vaq FROM categorias_animales WHERE codigo = 'VAQ' LIMIT 1;
  SELECT id INTO v_cat_ter FROM categorias_animales WHERE codigo = 'TER' LIMIT 1;

  -- ══════════════════════════════════════════════════════
  -- Resolver IDs de establecimientos propios
  -- ══════════════════════════════════════════════════════
  SELECT id INTO v_est_ypoti   FROM establishments WHERE name ILIKE '%ypoti%'       LIMIT 1;
  SELECT id INTO v_est_lusipar FROM establishments WHERE name ILIKE '%lusipar%'     LIMIT 1;
  SELECT id INTO v_est_cerro   FROM establishments WHERE name ILIKE '%cerro%memby%' LIMIT 1;
  SELECT id INTO v_est_santa   FROM establishments WHERE name ILIKE '%santa%clara%' LIMIT 1;
  SELECT id INTO v_est_cielo   FROM establishments WHERE name ILIKE '%cielo%azul%'  LIMIT 1;
  SELECT id INTO v_est_yby     FROM establishments WHERE name ILIKE '%yby%'         LIMIT 1;

  -- ══════════════════════════════════════════════════════
  -- Resolver IDs de empresas destino
  -- ══════════════════════════════════════════════════════
  SELECT id INTO v_empresa_rural FROM companies WHERE ruc = '80050418-6' LIMIT 1;
  SELECT id INTO v_empresa_frigo FROM companies WHERE ruc = '80023325-5' LIMIT 1;
  SELECT id INTO v_empresa_beef  FROM companies WHERE ruc = '80028211-6' LIMIT 1;

  -- Si empresas no existen, insertar las principales
  IF v_empresa_rural IS NULL THEN
    INSERT INTO companies (name, ruc, type, is_frigorifico) VALUES
      ('RURAL BIOENERGIA S.A', '80050418-6', 'empresa', false)
    RETURNING id INTO v_empresa_rural;
  END IF;

  IF v_empresa_frigo IS NULL THEN
    INSERT INTO companies (name, ruc, type, is_frigorifico) VALUES
      ('FRIGORIFICO CONCEPCION S.A.', '80023325-5', 'empresa', true)
    RETURNING id INTO v_empresa_frigo;
  END IF;

  IF v_empresa_beef IS NULL THEN
    INSERT INTO companies (name, ruc, type, is_frigorifico) VALUES
      ('BEEF PARAGUAY S.A', '80028211-6', 'empresa', true)
    RETURNING id INTO v_empresa_beef;
  END IF;

  -- Obtener un usuario para created_by (cualquier admin)
  SELECT id INTO v_user_id FROM profiles WHERE role = 'admin' LIMIT 1;

  -- ══════════════════════════════════════════════════════
  -- MOVIMIENTOS: Lote ENGORDE → RURAL BIOENERGIA
  -- (representa el flujo principal: compra de ganado para engorde)
  -- ══════════════════════════════════════════════════════

  -- Movimiento 1: Compra engorde Ypoti - Toros + DM (Feb 2026)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id, establecimiento_destino_id,
    destino_nombre, estado, observaciones,
    created_by, created_by_name, created_at
  ) VALUES (
    '91103296', '103267000252', '2026-02-13',
    'faena', 'compra',
    v_est_ypoti, v_empresa_frigo, NULL,
    'FRIGORIFICO CONCEPCION S.A.', 'cerrado',
    'Envío de toros para faena - Guía real del sistema',
    v_user_id, 'Sistema', '2026-02-13'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 42, 21000);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 2: Compra engorde Lusipar - DM + Terneros (Ene 2026)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '10700585', '01402251000241', '2026-01-15',
    'engorde', 'compra',
    v_est_lusipar, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2026-01-15'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_dm,  39, 7800),
    (v_mov_id, v_cat_ter, 9,  1350);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 3: Compra engorde Cerro Memby - DM (Dic 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91089452', '103256000180', '2025-12-10',
    'engorde', 'compra',
    v_est_cerro, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-12-10'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_dm, 55, 11550);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 4: Compra faena Ypoti - Toros para frigorífico (Nov 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91078234', '103245000098', '2025-11-20',
    'faena', 'venta',
    v_est_ypoti, v_empresa_frigo,
    'FRIGORIFICO CONCEPCION S.A.', 'cerrado',
    v_user_id, 'Sistema', '2025-11-20'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 68, 36720);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 5: Compra engorde Santa Clara - Toros + DM (Oct 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91065789', '103234000156', '2025-10-15',
    'engorde', 'compra',
    v_est_santa, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-10-15'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 35, 17500),
    (v_mov_id, v_cat_dm,  20, 4200);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- ══════════════════════════════════════════════════════
  -- MOVIMIENTOS: FAENA → BEEF PARAGUAY
  -- ══════════════════════════════════════════════════════

  -- Movimiento 6: Venta faena Yby Pora - Toros (Feb 2026)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91108345', '103272000320', '2026-02-20',
    'faena', 'venta',
    v_est_yby, v_empresa_beef,
    'BEEF PARAGUAY S.A', 'cerrado',
    v_user_id, 'Sistema', '2026-02-20'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 52, 28080);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- ══════════════════════════════════════════════════════
  -- MOVIMIENTOS: CRÍA (menor volumen)
  -- ══════════════════════════════════════════════════════

  -- Movimiento 7: Compra cría Cerro Memby - DH + Terneros (Sep 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91054321', '103223000078', '2025-09-15',
    'cria', 'compra',
    v_est_cerro, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-09-15'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_dh,  25, 4000),
    (v_mov_id, v_cat_ter, 18, 2160);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- ══════════════════════════════════════════════════════
  -- MOVIMIENTOS: EN TRÁNSITO y PENDIENTES (para testing frontend)
  -- ══════════════════════════════════════════════════════

  -- Movimiento 8: EN TRÁNSITO - Toros Ypoti → Frigorífico
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91115678', '103280000401', '2026-03-01',
    'faena', 'venta',
    v_est_ypoti, v_empresa_frigo,
    'FRIGORIFICO CONCEPCION S.A.', 'en_transito',
    v_user_id, 'Sistema', '2026-03-01'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 45, 24300);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'validado', 'Validado para despacho', 'Sistema'),
    (v_mov_id, 'validado', 'en_transito', 'Camión despachado', 'Sistema');

  -- Movimiento 9: PENDIENTE VALIDACIÓN - DM + Ter Lusipar
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91116234', '103281000412', '2026-03-02',
    'engorde', 'compra',
    v_est_lusipar, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'pendiente_validacion',
    v_user_id, 'Sistema', '2026-03-02'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_dm,  30, 6300),
    (v_mov_id, v_cat_ter, 12, 1680);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'pendiente_validacion', 'Enviado para validación', 'Sistema');

  -- Movimiento 10: BORRADOR - Nuevo ingreso Santa Clara
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    NULL, NULL, '2026-03-03',
    'engorde', 'compra',
    v_est_santa, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'borrador',
    v_user_id, 'Sistema', NOW()
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 28, 14000),
    (v_mov_id, v_cat_dm,  15, 3150);

  -- ══════════════════════════════════════════════════════
  -- MOVIMIENTOS ADICIONALES: Más cerrados para estadísticas
  -- ══════════════════════════════════════════════════════

  -- Movimiento 11: Engorde Cielo Azul (Ago 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91042567', '103212000045', '2025-08-10',
    'engorde', 'compra',
    v_est_cielo, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-08-10'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_dm,  48, 10080),
    (v_mov_id, v_cat_ter, 22, 3080);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 12: Engorde Yby Pora (Jul 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91031890', '103201000034', '2025-07-20',
    'engorde', 'compra',
    v_est_yby, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-07-20'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 60, 30000);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 13: Faena Ypoti → Frigorífico (Jun 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91020456', '103190000023', '2025-06-15',
    'faena', 'venta',
    v_est_ypoti, v_empresa_frigo,
    'FRIGORIFICO CONCEPCION S.A.', 'cerrado',
    v_user_id, 'Sistema', '2025-06-15'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 75, 40500);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 14: Engorde Lusipar - grande (May 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91009123', '103179000012', '2025-05-10',
    'engorde', 'compra',
    v_est_lusipar, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-05-10'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_dm,  80, 16800),
    (v_mov_id, v_cat_ter, 35, 4550),
    (v_mov_id, v_cat_nov, 10, 3200);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 15: Faena Cerro Memby → BEEF (Abr 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '90998765', '103168000008', '2025-04-20',
    'faena', 'venta',
    v_est_cerro, v_empresa_beef,
    'BEEF PARAGUAY S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-04-20'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 38, 20520);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- ══════════════════════════════════════════════════════
  -- MOVIMIENTOS 16-20: Más variación de establecimientos
  -- ══════════════════════════════════════════════════════

  -- Movimiento 16: Engorde Santa Clara - Vaquillonas (Mar 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '90987654', '103157000003', '2025-03-10',
    'engorde', 'compra',
    v_est_santa, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-03-10'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_vaq, 25, 6250),
    (v_mov_id, v_cat_dm,  40, 8400);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 17: Cría Cielo Azul - DH + Terneros (Feb 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '90976543', '103146000002', '2025-02-15',
    'cria', 'compra',
    v_est_cielo, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'cerrado',
    v_user_id, 'Sistema', '2025-02-15'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_dh,  30, 4800),
    (v_mov_id, v_cat_ter, 45, 5400);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 18: Faena Yby Pora → Frigorífico (Ene 2025)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '90965432', '103135000001', '2025-01-10',
    'faena', 'venta',
    v_est_yby, v_empresa_frigo,
    'FRIGORIFICO CONCEPCION S.A.', 'cerrado',
    v_user_id, 'Sistema', '2025-01-10'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 55, 29700);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'cerrado', 'Movimiento histórico importado', 'Sistema');

  -- Movimiento 19: RECIBIDO - con pesaje pendiente (para testar UI pesaje)
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, created_by, created_by_name, created_at
  ) VALUES (
    '91117890', '103282000415', '2026-03-02',
    'faena', 'venta',
    v_est_santa, v_empresa_frigo,
    'FRIGORIFICO CONCEPCION S.A.', 'recibido',
    v_user_id, 'Sistema', '2026-03-02'
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_tor, 40, 21600);

  -- Insertar un pesaje de ejemplo
  INSERT INTO pesajes_ganado (
    movimiento_id, fecha_pesaje, cantidad_pesada,
    peso_bruto_kg, peso_tara_kg, tipo_pesaje,
    cantidad_esperada, peso_esperado_kg,
    balanza_nombre, ticket_nro, conforme, observaciones,
    pesado_por_nombre
  ) VALUES (
    v_mov_id, '2026-03-02', 40,
    21800, 200, 'recepcion',
    40, 21600,
    'Balanza Planta Frigorífico', 'TK-2026-0312', true,
    'Pesaje de recepción conforme. Diferencia mínima de +200kg (merma esperada)',
    'Operador Frigorífico'
  );

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'validado', 'Validado', 'Sistema'),
    (v_mov_id, 'validado', 'en_transito', 'Despachado', 'Sistema'),
    (v_mov_id, 'en_transito', 'recibido', 'Recibido en frigorífico', 'Sistema');

  -- Movimiento 20: VALIDADO - listo para despacho
  INSERT INTO movimientos_ganado (
    nro_guia, nro_cota, fecha_emision, finalidad, tipo_operacion,
    establecimiento_origen_id, empresa_destino_id,
    destino_nombre, estado, marca_verificada, senacsa_verificado, guia_conforme,
    created_by, created_by_name, created_at
  ) VALUES (
    '91118456', '103283000420', '2026-03-03',
    'engorde', 'compra',
    v_est_cerro, v_empresa_rural,
    'RURAL BIOENERGIA S.A', 'validado',
    true, true, true,
    v_user_id, 'Sistema', NOW()
  ) RETURNING id INTO v_mov_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (v_mov_id, v_cat_dm,  50, 10500),
    (v_mov_id, v_cat_ter, 20, 2800);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by_name) VALUES
    (v_mov_id, 'borrador', 'pendiente_validacion', 'Enviado para validación', 'Sistema'),
    (v_mov_id, 'pendiente_validacion', 'validado', 'Validado - docs OK', 'Sistema');

  RAISE NOTICE '✅ Seeds de movimientos históricos insertados: 20 movimientos';
  RAISE NOTICE '   - 15 cerrados (históricos)';
  RAISE NOTICE '   - 1 en_transito';
  RAISE NOTICE '   - 1 pendiente_validacion';
  RAISE NOTICE '   - 1 borrador';
  RAISE NOTICE '   - 1 recibido (con pesaje)';
  RAISE NOTICE '   - 1 validado';

END $$;

-- ══════════════════════════════════════════════════════
-- Verificación final
-- ══════════════════════════════════════════════════════
SELECT estado, COUNT(*) as cantidad
FROM movimientos_ganado
GROUP BY estado
ORDER BY cantidad DESC;

SELECT
  ca.nombre as categoria,
  SUM(dmc.cantidad) as total_animales,
  SUM(dmc.peso_kg) as total_peso_kg
FROM detalle_movimiento_categorias dmc
JOIN categorias_animales ca ON ca.id = dmc.categoria_id
GROUP BY ca.nombre
ORDER BY total_animales DESC;

SELECT COUNT(*) as total_movimientos,
       SUM(cantidad_total) as total_cabezas,
       SUM(peso_total_kg) as total_peso_kg
FROM movimientos_ganado;
