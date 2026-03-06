/**
 * SIGAM File/Evidence Service
 * Immutable file storage with SHA256 hashing for ISO 9001 compliance.
 */
import { supabase } from './supabase';

const BUCKET = 'sigam-evidence';

/**
 * Compute SHA-256 hash of a file.
 */
async function computeSHA256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload a file to the evidence store.
 *
 * @param {File} file - The file to upload
 * @param {string} relatedObjectType - e.g. 'request', 'quotation', 'movement'
 * @param {string} relatedObjectId - UUID of the related object
 * @param {string} category - e.g. 'attachment', 'quotation_pdf', 'guide_scan'
 * @param {Object} metadata - optional additional metadata
 * @returns {Object} The created file_store record
 */
export async function uploadFile(file, relatedObjectType, relatedObjectId, category = 'attachment', metadata = {}) {
  const sha256 = await computeSHA256(file);
  const ext = file.name.split('.').pop();
  const storagePath = `${relatedObjectType}/${relatedObjectId}/${sha256}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError && !uploadError.message.includes('already exists')) {
    throw uploadError;
  }

  // Record in file_store table
  const { data, error } = await supabase
    .from('file_store')
    .insert({
      storage_path: storagePath,
      original_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      sha256_hash: sha256,
      related_object_type: relatedObjectType,
      related_object_id: relatedObjectId,
      category,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all files for a related object.
 */
export async function getFiles(relatedObjectType, relatedObjectId) {
  const { data, error } = await supabase
    .from('file_store')
    .select('*')
    .eq('related_object_type', relatedObjectType)
    .eq('related_object_id', relatedObjectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a signed download URL for a file.
 */
export async function getDownloadUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Verify file integrity by comparing stored hash with computed hash.
 */
export async function verifyFileIntegrity(fileStoreId) {
  const { data: record, error } = await supabase
    .from('file_store')
    .select('*')
    .eq('id', fileStoreId)
    .single();

  if (error) throw error;

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(record.storage_path);

  if (downloadError) throw downloadError;

  const computedHash = await computeSHA256(fileData);
  return {
    valid: computedHash === record.sha256_hash,
    stored_hash: record.sha256_hash,
    computed_hash: computedHash,
  };
}
