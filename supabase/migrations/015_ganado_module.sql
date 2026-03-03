-- ============================================================
-- MIGRATION 015: Modulo de Movimiento de Ganado
-- Date: 2026-03-03
-- Purpose: Cattle movement tracking (guias de ganado SENACSA)
-- ============================================================

-- 1. Extend suppliers table for cattle suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_ganadero BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS senacsa_code_proveedor TEXT;

-- 2. Extend companies table for destination companies (frigorificos)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_frigorifico BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS senacsa_code_empresa TEXT;

-- 3. Animal categories lookup table
CREATE TABLE IF NOT EXISTS categorias_animales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  sexo TEXT CHECK (sexo IN ('macho', 'hembra', 'mixto')),
  edad_min_meses INTEGER,
  edad_max_meses INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the 6 standard SENACSA categories
INSERT INTO categorias_animales (codigo, nombre, descripcion, sexo, edad_min_meses, edad_max_meses) VALUES
  ('DM',  'Destete Macho',       'Ternero macho destetado (6-12 meses)',        'macho',  6,    12),
  ('DH',  'Destete Hembra',      'Ternera hembra destetada (6-12 meses)',       'hembra', 6,    12),
  ('TOR', 'Torito/Toro',         'Toro reproductor o torito',                   'macho',  12,   NULL),
  ('NOV', 'Novillito/Novillo',   'Novillo para engorde o faena',                'macho',  12,   48),
  ('VAQ', 'Vaquillona/Vaca',     'Vaquillona o vaca para cria/engorde',         'hembra', 12,   NULL),
  ('TER', 'Ternero/a',           'Ternero/a al pie de la madre (0-6 meses)',    'mixto',  0,    6)
ON CONFLICT (codigo) DO NOTHING;

-- 4. Main cattle movements table
CREATE TABLE IF NOT EXISTS movimientos_ganado (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_number TEXT UNIQUE,

  -- SENACSA document numbers
  nro_guia TEXT,
  nro_cota TEXT,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Classification
  finalidad TEXT NOT NULL CHECK (finalidad IN (
    'faena', 'cria', 'engorde', 'remate', 'exposicion',
    'transito', 'cambio_titular', 'otro'
  )),
  tipo_operacion TEXT NOT NULL CHECK (tipo_operacion IN (
    'compra', 'venta', 'transferencia_interna', 'consignacion'
  )),

  -- Origin (FK to existing establishments)
  establecimiento_origen_id UUID REFERENCES establishments(id),

  -- Destination
  empresa_destino_id UUID REFERENCES companies(id),
  establecimiento_destino_id UUID REFERENCES establishments(id),
  destino_nombre TEXT,

  -- Animal details
  categoria_id UUID NOT NULL REFERENCES categorias_animales(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  peso_total_kg NUMERIC(10,2),
  peso_promedio_kg NUMERIC(8,2) GENERATED ALWAYS AS (
    CASE WHEN cantidad > 0 AND peso_total_kg IS NOT NULL
         THEN ROUND(peso_total_kg / cantidad, 2)
         ELSE NULL END
  ) STORED,

  -- Financial
  precio_por_kg NUMERIC(12,2),
  precio_total NUMERIC(14,2),
  moneda TEXT DEFAULT 'PYG' CHECK (moneda IN ('PYG', 'USD', 'BRL')),

  -- Status & workflow
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN (
    'borrador', 'pendiente_validacion', 'validado',
    'en_transito', 'recibido', 'cerrado', 'anulado'
  )),

  -- Validation checks
  marca_verificada BOOLEAN DEFAULT false,
  senacsa_verificado BOOLEAN DEFAULT false,
  guia_conforme BOOLEAN DEFAULT false,

  -- Observations
  observaciones TEXT,

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_by_name TEXT,
  validated_by UUID REFERENCES profiles(id),
  validated_by_name TEXT,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Auto-generate movimiento_number (MG-2026-001, MG-2026-002, ...)
CREATE OR REPLACE FUNCTION generate_movimiento_number()
RETURNS TRIGGER AS $$
DECLARE
  yr TEXT;
  seq INTEGER;
BEGIN
  yr := to_char(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(movimiento_number FROM 'MG-' || yr || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM movimientos_ganado
  WHERE movimiento_number LIKE 'MG-' || yr || '-%';
  NEW.movimiento_number := 'MG-' || yr || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movimiento_number ON movimientos_ganado;
CREATE TRIGGER trg_movimiento_number
  BEFORE INSERT ON movimientos_ganado
  FOR EACH ROW
  WHEN (NEW.movimiento_number IS NULL)
  EXECUTE FUNCTION generate_movimiento_number();

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_movimientos_estado ON movimientos_ganado(estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_ganado(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_movimientos_origen ON movimientos_ganado(establecimiento_origen_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_destino ON movimientos_ganado(empresa_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_created_by ON movimientos_ganado(created_by);
CREATE INDEX IF NOT EXISTS idx_movimientos_created_at ON movimientos_ganado(created_at);

-- 7. Divergences (discrepancies) table
CREATE TABLE IF NOT EXISTS movimiento_divergencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_id UUID NOT NULL REFERENCES movimientos_ganado(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'cantidad', 'peso', 'categoria', 'marca', 'documento', 'otro'
  )),
  descripcion TEXT NOT NULL,
  cantidad_diferencia INTEGER,
  peso_diferencia_kg NUMERIC(8,2),
  resolucion TEXT,
  resuelto BOOLEAN DEFAULT false,
  reportado_por UUID REFERENCES profiles(id),
  reportado_por_nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_divergencias_movimiento ON movimiento_divergencias(movimiento_id);

-- 8. Attachments (PDFs, photos) table
CREATE TABLE IF NOT EXISTS movimiento_archivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_id UUID NOT NULL REFERENCES movimientos_ganado(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('guia_pdf', 'cota_pdf', 'foto', 'otro')),
  nombre TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archivos_movimiento ON movimiento_archivos(movimiento_id);

-- 9. Updated_at trigger for movimientos_ganado
CREATE OR REPLACE FUNCTION update_movimientos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movimientos_updated_at ON movimientos_ganado;
CREATE TRIGGER trg_movimientos_updated_at
  BEFORE UPDATE ON movimientos_ganado
  FOR EACH ROW
  EXECUTE FUNCTION update_movimientos_updated_at();

-- 10. Audit triggers (reuse existing audit_trigger_func from 001)
DO $$
BEGIN
  CREATE TRIGGER trg_audit_movimientos_ganado
    AFTER INSERT OR UPDATE OR DELETE ON movimientos_ganado
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_audit_movimiento_divergencias
    AFTER INSERT OR UPDATE OR DELETE ON movimiento_divergencias
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 11. RLS Policies
ALTER TABLE movimientos_ganado ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_divergencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_animales ENABLE ROW LEVEL SECURITY;

-- categorias_animales: everyone can read
CREATE POLICY "categorias_animales_select" ON categorias_animales
  FOR SELECT USING (true);

-- movimientos_ganado: authenticated users can read
CREATE POLICY "movimientos_select" ON movimientos_ganado
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "movimientos_service_insert" ON movimientos_ganado
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "movimientos_service_update" ON movimientos_ganado
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "movimientos_service_delete" ON movimientos_ganado
  FOR DELETE TO service_role USING (true);

-- divergencias
CREATE POLICY "divergencias_select" ON movimiento_divergencias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "divergencias_service_insert" ON movimiento_divergencias
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "divergencias_service_update" ON movimiento_divergencias
  FOR UPDATE TO service_role USING (true);

-- archivos
CREATE POLICY "archivos_select" ON movimiento_archivos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "archivos_service_insert" ON movimiento_archivos
  FOR INSERT TO service_role WITH CHECK (true);
