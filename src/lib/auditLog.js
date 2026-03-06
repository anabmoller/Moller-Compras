/**
 * SIGAM Audit Log Service
 * ISO 9001 compliant change tracking for all objects.
 */
import { supabase } from './supabase';

/**
 * Write an audit log entry. Called from Edge Functions or client-side for read-only audits.
 *
 * @param {string} objectType - e.g. 'request', 'movement', 'delivery'
 * @param {string} objectId - UUID of the object
 * @param {string} action - 'INSERT', 'UPDATE', 'DELETE'
 * @param {Object|null} beforeData - previous state (null for INSERT)
 * @param {Object|null} afterData - new state (null for DELETE)
 * @param {string[]} changedFields - list of changed column names
 */
export async function writeAuditLog(objectType, objectId, action, beforeData, afterData, changedFields = []) {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('audit_log')
    .insert({
      object_type: objectType,
      object_id: objectId,
      action,
      before_data: beforeData,
      after_data: afterData,
      changed_fields: changedFields,
      actor_id: user?.id || null,
      actor_email: user?.email || null,
    });

  if (error) {
    console.error('[AuditLog] Failed to write:', error.message);
    // Don't throw — audit failures should not break the operation
  }
}

/**
 * Compute changed fields between two objects.
 */
export function computeChangedFields(before, after) {
  if (!before || !after) return [];
  const changed = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }
  return changed;
}

/**
 * Fetch audit log entries for an object.
 *
 * @param {string} objectType
 * @param {string} objectId
 * @param {number} limit
 * @returns {Array} audit entries
 */
export async function getAuditLog(objectType, objectId, limit = 50) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('object_type', objectType)
    .eq('object_id', objectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch recent audit activity across all objects.
 *
 * @param {number} limit
 * @returns {Array} recent audit entries
 */
export async function getRecentAuditActivity(limit = 100) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
