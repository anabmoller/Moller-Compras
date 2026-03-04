-- ============================================================
-- GANADO MODULE: Test Data Seed
-- Creates sample movimientos with categories, pesajes, divergencias
-- Run ONLY in test/development environment
-- ============================================================

-- Ensure categorias exist (re-run seed)
INSERT INTO categorias_animales (codigo, nombre, descripcion, sexo, edad_min_meses, edad_max_meses) VALUES
  ('DM',  'Destete Macho',       'Ternero macho destetado (6-12 meses)',        'macho',  6,    12),
  ('DH',  'Destete Hembra',      'Ternera hembra destetada (6-12 meses)',       'hembra', 6,    12),
  ('TOR', 'Torito/Toro',         'Toro reproductor o torito',                   'macho',  12,   NULL),
  ('NOV', 'Novillito/Novillo',   'Novillo para engorde o faena',                'macho',  12,   48),
  ('VAQ', 'Vaquillona/Vaca',     'Vaquillona o vaca para cria/engorde',         'hembra', 12,   NULL),
  ('TER', 'Ternero/a',           'Ternero/a al pie de la madre (0-6 meses)',    'mixto',  0,    6)
ON CONFLICT (codigo) DO NOTHING;

-- Mark some suppliers as ganaderos (if they exist)
UPDATE suppliers SET is_ganadero = true
WHERE name ILIKE '%ganadero%' OR name ILIKE '%estancia%' OR name ILIKE '%agro%'
LIMIT 3;

-- Mark some companies as frigoríficos (if they exist)
UPDATE companies SET is_frigorifico = true
WHERE name ILIKE '%frigori%' OR name ILIKE '%carnes%' OR name ILIKE '%faena%'
LIMIT 2;

-- Helper: get first admin profile for audit fields
DO $$
DECLARE
  admin_id UUID;
  admin_name TEXT;
  cat_nov UUID;
  cat_vaq UUID;
  cat_dm UUID;
  est_id UUID;
  mov1_id UUID;
  mov2_id UUID;
  mov3_id UUID;
BEGIN
  -- Get admin user
  SELECT id, name INTO admin_id, admin_name
  FROM profiles WHERE role = 'admin' AND active = true LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'No admin user found, skipping test data seed';
    RETURN;
  END IF;

  -- Get category IDs
  SELECT id INTO cat_nov FROM categorias_animales WHERE codigo = 'NOV';
  SELECT id INTO cat_vaq FROM categorias_animales WHERE codigo = 'VAQ';
  SELECT id INTO cat_dm FROM categorias_animales WHERE codigo = 'DM';

  -- Get an establishment
  SELECT id INTO est_id FROM establishments WHERE active = true LIMIT 1;

  -- ─────────────────────────────────────────────────
  -- MOVEMENT 1: Compra para Faena (closed workflow)
  -- ─────────────────────────────────────────────────
  INSERT INTO movimientos_ganado (
    tipo_operacion, finalidad, establecimiento_origen_id,
    destino_nombre, cantidad_total, peso_total_kg,
    nro_guia, nro_cota, fecha_emision,
    precio_por_kg, precio_total, moneda,
    estado, marca_verificada, senacsa_verificado, guia_conforme,
    created_by, created_by_name, observaciones
  ) VALUES (
    'compra', 'faena', est_id,
    'Frigorífico Guaraní S.A.', 120, 42000,
    'GU-2026-00145', 'COTA-2026-0089', '2026-02-15',
    12500, 525000000, 'PYG',
    'cerrado', true, true, true,
    admin_id, admin_name, 'Lote de novillos y vaquillonas para faena febrero 2026'
  ) RETURNING id INTO mov1_id;

  -- Category details for mov1
  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg, precio_por_kg, precio_subtotal) VALUES
    (mov1_id, cat_nov, 80, 30000, 12500, 375000000),
    (mov1_id, cat_vaq, 40, 12000, 12500, 150000000);

  -- Pesaje for mov1
  INSERT INTO pesajes_ganado (
    movimiento_id, fecha_pesaje, cantidad_pesada, peso_bruto_kg, peso_tara_kg,
    nro_tropa, tipo_pesaje, cantidad_esperada, peso_esperado_kg,
    balanza_nombre, ticket_nro, conforme,
    pesado_por, pesado_por_nombre, categoria_id
  ) VALUES
    (mov1_id, '2026-02-16', 80, 30250, 250, 'T-001', 'recepcion', 80, 30000, 'Balanza Principal', 'TK-4521', true, admin_id, admin_name, cat_nov),
    (mov1_id, '2026-02-16', 40, 12180, 180, 'T-002', 'recepcion', 40, 12000, 'Balanza Principal', 'TK-4522', true, admin_id, admin_name, cat_vaq);

  -- Status log for mov1
  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by, changed_by_name) VALUES
    (mov1_id, '', 'borrador', 'Movimiento creado', admin_id, admin_name),
    (mov1_id, 'borrador', 'validado', 'Documentación verificada', admin_id, admin_name),
    (mov1_id, 'validado', 'en_transito', 'Camión salió de estancia', admin_id, admin_name),
    (mov1_id, 'en_transito', 'recibido', 'Recibido en frigorífico', admin_id, admin_name),
    (mov1_id, 'recibido', 'cerrado', 'Pesaje conforme, movimiento cerrado', admin_id, admin_name);

  -- ─────────────────────────────────────────────────
  -- MOVEMENT 2: In transit (active)
  -- ─────────────────────────────────────────────────
  INSERT INTO movimientos_ganado (
    tipo_operacion, finalidad, establecimiento_origen_id,
    destino_nombre, cantidad_total, peso_total_kg,
    nro_guia, fecha_emision,
    precio_por_kg, precio_total, moneda,
    estado, marca_verificada, senacsa_verificado,
    created_by, created_by_name
  ) VALUES (
    'venta', 'engorde', est_id,
    'Estancia La Fortuna', 50, 15000,
    'GU-2026-00198', '2026-03-01',
    11000, 165000000, 'PYG',
    'en_transito', true, true,
    admin_id, admin_name
  ) RETURNING id INTO mov2_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (mov2_id, cat_dm, 30, 8100),
    (mov2_id, cat_nov, 20, 6900);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by, changed_by_name) VALUES
    (mov2_id, '', 'borrador', 'Movimiento creado', admin_id, admin_name),
    (mov2_id, 'borrador', 'validado', 'OK', admin_id, admin_name),
    (mov2_id, 'validado', 'en_transito', 'Despacho a las 06:00', admin_id, admin_name);

  -- ─────────────────────────────────────────────────
  -- MOVEMENT 3: Draft with divergence
  -- ─────────────────────────────────────────────────
  INSERT INTO movimientos_ganado (
    tipo_operacion, finalidad, establecimiento_origen_id,
    destino_nombre, cantidad_total, peso_total_kg,
    fecha_emision, moneda,
    estado,
    created_by, created_by_name, observaciones
  ) VALUES (
    'compra', 'cria', est_id,
    'Cabaña Don Pedro', 25, 4500,
    '2026-03-03', 'PYG',
    'borrador',
    admin_id, admin_name, 'Pendiente de documentación SENACSA'
  ) RETURNING id INTO mov3_id;

  INSERT INTO detalle_movimiento_categorias (movimiento_id, categoria_id, cantidad, peso_kg) VALUES
    (mov3_id, cat_vaq, 25, 4500);

  INSERT INTO movimiento_divergencias (movimiento_id, tipo, descripcion, cantidad_diferencia, reportado_por, reportado_por_nombre) VALUES
    (mov3_id, 'documento', 'Falta guía SENACSA - proveedor no entregó aún', NULL, admin_id, admin_name);

  INSERT INTO movimiento_estados_log (movimiento_id, estado_anterior, estado_nuevo, comentario, changed_by, changed_by_name) VALUES
    (mov3_id, '', 'borrador', 'Movimiento creado', admin_id, admin_name);

  RAISE NOTICE 'Test data seeded: 3 movimientos (%, %, %)', mov1_id, mov2_id, mov3_id;
END $$;
