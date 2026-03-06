/**
 * SIGAM Notification Service
 * Rules-based alerting with multi-channel support.
 */
import { supabase } from './supabase';

/**
 * Create a notification for a user.
 */
export async function createNotification({
  ruleId = null,
  recipientId,
  channel = 'in_app',
  title,
  body = '',
  severity = 'info',
  relatedObjectType = null,
  relatedObjectId = null,
  link = null,
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      rule_id: ruleId,
      recipient_id: recipientId,
      channel,
      title,
      body,
      severity,
      related_object_type: relatedObjectType,
      related_object_id: relatedObjectId,
      link,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch unread notifications for current user.
 */
export async function getUnreadNotifications(limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all notifications for current user.
 */
export async function getAllNotifications(limit = 100) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Mark all notifications as read.
 */
export async function markAllAsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Get notification rules (for admin config screen).
 */
export async function getNotificationRules() {
  const { data, error } = await supabase
    .from('notification_rules')
    .select('*')
    .order('event_type');

  if (error) throw error;
  return data || [];
}

/**
 * Update a notification rule.
 */
export async function updateNotificationRule(ruleId, updates) {
  const { data, error } = await supabase
    .from('notification_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get unread count for badge display.
 */
export async function getUnreadCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}
