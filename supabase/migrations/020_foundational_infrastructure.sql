-- ============================================================
-- MIGRATION 020: Foundational Infrastructure
-- Audit Log, File/Evidence Service, Notification Engine
-- ============================================================

-- ============================================================
-- 1. AUDIT LOG — ISO 9001 compliant change tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  object_type   TEXT NOT NULL,        -- 'request', 'movement', 'animal', etc.
  object_id     TEXT NOT NULL,
  action        TEXT NOT NULL,        -- 'INSERT', 'UPDATE', 'DELETE'
  before_data   JSONB,
  after_data    JSONB,
  changed_fields TEXT[],              -- list of changed column names
  actor_id      UUID REFERENCES auth.users(id),
  actor_email   TEXT,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_object ON audit_log(object_type, object_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- RLS: only admins and diretoria can read audit logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_read ON audit_log
  FOR SELECT USING (
    auth_role() IN ('admin', 'diretoria')
  );

-- ============================================================
-- 2. FILE/EVIDENCE SERVICE — Immutable file store with SHA256
-- ============================================================
CREATE TABLE IF NOT EXISTS file_store (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path    TEXT NOT NULL,           -- Supabase Storage path
  original_name   TEXT NOT NULL,
  mime_type       TEXT,
  file_size       BIGINT,
  sha256_hash     TEXT NOT NULL,           -- hex digest
  related_object_type TEXT NOT NULL,       -- 'request', 'quotation', 'movement', 'delivery', etc.
  related_object_id   TEXT NOT NULL,
  category        TEXT DEFAULT 'attachment', -- 'attachment', 'quotation_pdf', 'guide_scan', 'slaughter_audit', 'evidence'
  metadata        JSONB DEFAULT '{}',
  uploaded_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Files are immutable — no updated_at, no soft deletes
  CONSTRAINT file_store_unique_hash_object UNIQUE (sha256_hash, related_object_type, related_object_id)
);

CREATE INDEX idx_file_store_object ON file_store(related_object_type, related_object_id);
CREATE INDEX idx_file_store_category ON file_store(category);
CREATE INDEX idx_file_store_hash ON file_store(sha256_hash);

ALTER TABLE file_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY file_store_read ON file_store
  FOR SELECT USING (true); -- all authenticated users can read

CREATE POLICY file_store_insert ON file_store
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE policies — files are immutable

-- ============================================================
-- 3. NOTIFICATION ENGINE — Rules + Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  event_type  TEXT NOT NULL,           -- 'request_status_change', 'movement_status_change', 'guide_expiry', 'low_stock', etc.
  conditions  JSONB DEFAULT '{}',      -- e.g. {"status": "pendiente_aprobacion", "threshold_days": 3}
  channels    TEXT[] DEFAULT '{in_app}', -- 'in_app', 'email', 'whatsapp'
  target_roles TEXT[],                 -- which roles receive this notification
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         UUID REFERENCES notification_rules(id),
  recipient_id    UUID NOT NULL REFERENCES auth.users(id),
  channel         TEXT NOT NULL DEFAULT 'in_app',
  title           TEXT NOT NULL,
  body            TEXT,
  severity        TEXT DEFAULT 'info',     -- 'info', 'warning', 'critical'
  related_object_type TEXT,
  related_object_id   TEXT,
  link            TEXT,                    -- deep link within app
  is_read         BOOLEAN DEFAULT false,
  read_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_rule ON notifications(rule_id);
CREATE INDEX idx_notifications_object ON notifications(related_object_type, related_object_id);

ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_rules_admin ON notification_rules
  FOR ALL USING (auth_role() IN ('admin', 'diretoria'));

CREATE POLICY notification_rules_read ON notification_rules
  FOR SELECT USING (true);

CREATE POLICY notifications_own ON notifications
  FOR ALL USING (recipient_id = auth.uid());

CREATE POLICY notifications_admin ON notifications
  FOR SELECT USING (auth_role() IN ('admin', 'diretoria'));

-- Seed default notification rules
INSERT INTO notification_rules (name, event_type, conditions, channels, target_roles) VALUES
  ('Aprobación pendiente', 'request_pending_approval', '{}', '{in_app}', '{gerente,diretoria,admin}'),
  ('Solicitud aprobada', 'request_approved', '{}', '{in_app}', '{solicitante,comprador}'),
  ('Solicitud rechazada', 'request_rejected', '{}', '{in_app}', '{solicitante,comprador}'),
  ('Movimiento ganado - cambio estado', 'movement_status_change', '{}', '{in_app}', '{gerente,lider,admin}'),
  ('Guía próxima a vencer', 'guide_expiry_warning', '{"threshold_days": 3}', '{in_app}', '{gerente,lider,admin}'),
  ('Guía vencida', 'guide_expired', '{}', '{in_app}', '{gerente,lider,admin,diretoria}'),
  ('Stock bajo materia prima', 'low_stock_raw_material', '{"threshold_days_coverage": 7}', '{in_app}', '{gerente,comprador,admin}'),
  ('Consumo combustible anómalo', 'fuel_anomaly', '{}', '{in_app}', '{gerente,admin,diretoria}')
ON CONFLICT DO NOTHING;
