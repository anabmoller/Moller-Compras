/**
 * SIGAM Hacienda (Cattle) Deep Service
 * Animals, batches, events, TruTest imports, guide custody, compliance.
 */
import { supabase } from './supabase';

// ============================================================
// CATTLE BATCHES
// ============================================================

export async function getBatches(filters = {}) {
  let query = supabase
    .from('cattle_batches')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.establishmentId) query = query.eq('current_establishment_id', filters.establishmentId);
  if (filters.batchType) query = query.eq('batch_type', filters.batchType);
  if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive);

  const { data, error } = await query.limit(filters.limit || 100);
  if (error) throw error;
  return data || [];
}

export async function getBatch(batchId) {
  const { data, error } = await supabase
    .from('cattle_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (error) throw error;
  return data;
}

export async function createBatch(batch) {
  const { data, error } = await supabase
    .from('cattle_batches')
    .insert(batch)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBatch(batchId, updates) {
  const { data, error } = await supabase
    .from('cattle_batches')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', batchId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// CATTLE ANIMALS
// ============================================================

export async function getAnimals(filters = {}) {
  let query = supabase
    .from('cattle_animals')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.batchId) query = query.eq('current_batch_id', filters.batchId);
  if (filters.establishmentId) query = query.eq('current_establishment_id', filters.establishmentId);
  if (filters.status) query = query.eq('current_status', filters.status);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.search) {
    query = query.or(`trutest_id.ilike.%${filters.search}%,visual_tag.ilike.%${filters.search}%,senacsa_id.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.limit(filters.limit || 200);
  if (error) throw error;
  return data || [];
}

export async function getAnimal(animalId) {
  const { data, error } = await supabase
    .from('cattle_animals')
    .select('*')
    .eq('id', animalId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAnimalByTrutest(trustestId) {
  const { data, error } = await supabase
    .from('cattle_animals')
    .select('*')
    .eq('trutest_id', trustestId)
    .single();

  if (error) return null; // Not found is expected
  return data;
}

export async function createAnimal(animal) {
  const { data, error } = await supabase
    .from('cattle_animals')
    .insert(animal)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAnimal(animalId, updates) {
  const { data, error } = await supabase
    .from('cattle_animals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', animalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// CATTLE EVENTS (lifecycle)
// ============================================================

export async function getAnimalEvents(animalId, limit = 50) {
  const { data, error } = await supabase
    .from('cattle_events')
    .select('*')
    .eq('animal_id', animalId)
    .order('event_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getBatchEvents(batchId, limit = 100) {
  const { data, error } = await supabase
    .from('cattle_events')
    .select('*')
    .eq('batch_id', batchId)
    .order('event_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createEvent(event) {
  const { data, error } = await supabase
    .from('cattle_events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// TRUTEST CSV IMPORT
// ============================================================

/**
 * Parse TruTest CSV content and return animal records.
 * TruTest CSVs typically have columns: EID (electronic ID), VID (visual ID), Weight, Date, etc.
 */
export function parseTruTestCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV vacío o inválido');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx]; });

    // Map common TruTest column names
    const eid = row.eid || row.electronic_id || row.rfid || row.trutest_id || '';
    const vid = row.vid || row.visual_id || row.visual_tag || '';
    const weight = parseFloat(row.weight || row.peso || '0');
    const date = row.date || row.fecha || new Date().toISOString().split('T')[0];

    if (!eid && !vid) continue; // Skip empty rows

    records.push({
      trutest_id: eid,
      visual_tag: vid,
      weight: isNaN(weight) ? null : weight,
      date,
      raw: row,
    });
  }

  return records;
}

/**
 * Import TruTest CSV into cattle_animals and create weighing events.
 */
export async function importTruTestCSV(fileStoreId, records, establishmentId, batchId, importedBy) {
  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const rec of records) {
    try {
      // Check if animal exists
      const existing = rec.trutest_id ? await getAnimalByTrutest(rec.trutest_id) : null;

      if (existing) {
        // Update weight and record event
        const updates = { updated_at: new Date().toISOString() };
        if (rec.weight) {
          updates.current_weight = rec.weight;
          updates.last_weigh_date = rec.date;
        }
        if (batchId) updates.current_batch_id = batchId;
        if (establishmentId) updates.current_establishment_id = establishmentId;

        await updateAnimal(existing.id, updates);

        if (rec.weight) {
          await createEvent({
            animal_id: existing.id,
            batch_id: batchId,
            event_type: 'weighing',
            event_date: rec.date,
            weight: rec.weight,
            establishment_id: establishmentId,
            notes: `TruTest import`,
            created_by: importedBy,
          });
        }
        updatedCount++;
      } else if (rec.trutest_id) {
        // Create new animal
        const animal = await createAnimal({
          trutest_id: rec.trutest_id,
          visual_tag: rec.visual_tag || null,
          current_status: 'active',
          current_establishment_id: establishmentId,
          current_batch_id: batchId || null,
          entry_weight: rec.weight || null,
          current_weight: rec.weight || null,
          entry_date: rec.date,
          last_weigh_date: rec.weight ? rec.date : null,
        });

        // Create entry event
        await createEvent({
          animal_id: animal.id,
          batch_id: batchId,
          event_type: 'entry',
          event_date: rec.date,
          weight: rec.weight,
          establishment_id: establishmentId,
          notes: `TruTest import - entrada`,
          created_by: importedBy,
        });
        newCount++;
      }
    } catch (err) {
      console.error(`[TruTest] Error processing record:`, rec, err.message);
      errorCount++;
    }
  }

  // Record import metadata
  await supabase.from('trutest_imports').insert({
    file_store_id: fileStoreId,
    establishment_id: establishmentId,
    batch_id: batchId,
    total_records: records.length,
    new_animals: newCount,
    updated_animals: updatedCount,
    errors: errorCount,
    imported_by: importedBy,
  });

  return { total: records.length, new: newCount, updated: updatedCount, errors: errorCount };
}

// ============================================================
// GUIDE CUSTODY
// ============================================================

export async function getGuideCustodyChain(movimientoId) {
  const { data, error } = await supabase
    .from('guide_custody_events')
    .select('*')
    .eq('movimiento_id', movimientoId)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function recordCustodyTransfer(event) {
  const { data, error } = await supabase
    .from('guide_custody_events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;

  // Update the movement's current custody holder
  if (event.movimiento_id) {
    await supabase
      .from('movimientos_ganado')
      .update({
        guide_custody_holder: event.to_person,
        guide_custody_role: event.to_role,
      })
      .eq('id', event.movimiento_id);
  }

  return data;
}

// ============================================================
// COMPLIANCE TASKS
// ============================================================

export async function getComplianceTasks(filters = {}) {
  let query = supabase
    .from('compliance_tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.establishmentId) query = query.eq('establishment_id', filters.establishmentId);
  if (filters.taskType) query = query.eq('task_type', filters.taskType);
  if (filters.overdue) query = query.lt('due_date', new Date().toISOString().split('T')[0]).neq('status', 'completed');

  const { data, error } = await query.limit(filters.limit || 100);
  if (error) throw error;
  return data || [];
}

export async function completeComplianceTask(taskId, completedBy, evidenceFileId = null) {
  const { data, error } = await supabase
    .from('compliance_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: completedBy,
      evidence_file_id: evidenceFileId,
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// HACIENDA KPIS
// ============================================================

export async function getHaciendaKPIs(establishmentId = null) {
  // Total active animals
  let animalsQuery = supabase
    .from('cattle_animals')
    .select('id', { count: 'exact', head: true })
    .eq('current_status', 'active');
  if (establishmentId) animalsQuery = animalsQuery.eq('current_establishment_id', establishmentId);
  const { count: totalAnimals } = await animalsQuery;

  // Active batches
  let batchesQuery = supabase
    .from('cattle_batches')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  if (establishmentId) batchesQuery = batchesQuery.eq('current_establishment_id', establishmentId);
  const { count: activeBatches } = await batchesQuery;

  // Overdue compliance tasks
  let complianceQuery = supabase
    .from('compliance_tasks')
    .select('id', { count: 'exact', head: true })
    .lt('due_date', new Date().toISOString().split('T')[0])
    .neq('status', 'completed');
  if (establishmentId) complianceQuery = complianceQuery.eq('establishment_id', establishmentId);
  const { count: overdueTasks } = await complianceQuery;

  // Recent movements (this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  let movQuery = supabase
    .from('movimientos_ganado')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());
  const { count: monthlyMovements } = await movQuery;

  return {
    totalAnimals: totalAnimals || 0,
    activeBatches: activeBatches || 0,
    overdueTasks: overdueTasks || 0,
    monthlyMovements: monthlyMovements || 0,
  };
}
