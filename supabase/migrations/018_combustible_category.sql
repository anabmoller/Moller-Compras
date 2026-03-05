-- ============================================================
-- MIGRATION 018: Add Combustible Category & Default Fuel Products
-- Date: 2026-03-05
-- Purpose: Create Combustible product category and seed fuel items
-- ============================================================

-- 1. Insert Combustible category (if not exists)
INSERT INTO categories (name, code)
VALUES ('Combustible', 'combustible')
ON CONFLICT (name) DO NOTHING;

-- 2. Get the category ID for Combustible
DO $$
DECLARE
  cat_id UUID;
BEGIN
  SELECT id INTO cat_id FROM categories WHERE name = 'Combustible';

  -- 3. Insert default fuel products
  INSERT INTO products (code, name, category_id, unit_of_measure, deposit, tipo_uso)
  VALUES
    ('COMB-000001', 'NAFTA',              cat_id, 'litro', 'TANQUE COMBUSTIBLE', 'Operativo'),
    ('COMB-000002', 'NAFTA 93',           cat_id, 'litro', 'TANQUE COMBUSTIBLE', 'Operativo'),
    ('COMB-000003', 'GASOIL',             cat_id, 'litro', 'TANQUE COMBUSTIBLE', 'Operativo'),
    ('COMB-000004', 'GASOIL ADITIVADO',   cat_id, 'litro', 'TANQUE COMBUSTIBLE', 'Operativo'),
    ('COMB-000005', 'DIESEL',             cat_id, 'litro', 'TANQUE COMBUSTIBLE', 'Operativo')
  ON CONFLICT (code) DO NOTHING;
END $$;

-- 4. Reclassify existing fuel products from Mercadería to Combustible
UPDATE products
SET category_id = (SELECT id FROM categories WHERE name = 'Combustible')
WHERE code IN ('MER-000001', 'MER-000073')
  AND category_id = (SELECT id FROM categories WHERE name = 'Mercadería');
