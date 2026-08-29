import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Map route slugs to PostgreSQL table names
const TABLE_MAP = {
  'student-profiles': 'student_profiles',
  'company-profiles': 'company_profiles',
  'jobs': 'jobs',
  'applications': 'applications',
  'saved-jobs': 'saved_jobs',
  'interviews': 'interviews',
  'conversations': 'conversations',
  'messages': 'messages',
  'notifications': 'notifications',
  'admin-notifications': 'admin_notifications',
  'audit-logs': 'audit_logs',
  'reports': 'reports',
};

// Convert slug or entity name to valid table name
function getTableName(param) {
  const normalized = param.toLowerCase().replace(/_/g, '-');
  return TABLE_MAP[normalized] || TABLE_MAP[param] || param.replace(/-/g, '_');
}

function generateId(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// In-memory cache for table columns to minimize DB calls
const tableColumnsCache = {};

// Automatically ensure any new column sent in payload exists in table
async function ensureColumnsExist(table, payload) {
  try {
    if (!tableColumnsCache[table]) {
      const colsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [table]
      );
      tableColumnsCache[table] = new Set(colsRes.rows.map((r) => r.column_name));
    }

    const knownCols = tableColumnsCache[table];
    for (const [key, val] of Object.entries(payload)) {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      if (safeKey && !knownCols.has(safeKey)) {
        const colType = typeof val === 'object' && val !== null ? "JSONB DEFAULT '[]'" : 'TEXT';
        await query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${safeKey} ${colType}`);
        knownCols.add(safeKey);
        console.log(`[Auto-Migration] Added column "${safeKey}" (${colType}) to "${table}"`);
      }
    }
  } catch (err) {
    console.warn(`[Auto-Migration Warning on ${table}]`, err.message);
  }
}

// GET /api/entities/:entity - List items with sort & limit
router.get('/:entity', async (req, res) => {
  const table = getTableName(req.params.entity);
  const { sort, limit = 500 } = req.query;

  try {
    let orderClause = 'ORDER BY created_date DESC';
    if (sort) {
      const isDesc = sort.startsWith('-');
      const col = isDesc ? sort.substring(1) : sort;
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, '');
      orderClause = `ORDER BY ${safeCol} ${isDesc ? 'DESC' : 'ASC'}`;
    }

    const sql = `SELECT * FROM ${table} ${orderClause} LIMIT $1`;
    const result = await query(sql, [parseInt(limit, 10)]);
    res.json(result.rows);
  } catch (err) {
    console.error(`Error listing ${table}:`, err.message);
    res.status(500).json({ error: `Failed to fetch ${table}` });
  }
});

// GET /api/entities/:entity/filter - Filter items by query params
router.get('/:entity/filter', async (req, res) => {
  const table = getTableName(req.params.entity);
  const { sort, limit = 500, ...filters } = req.query;

  try {
    const whereConditions = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        const safeCol = key.replace(/[^a-zA-Z0-9_]/g, '');
        whereConditions.push(`${safeCol} = $${paramIndex}`);
        values.push(val);
        paramIndex++;
      }
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY created_date DESC';
    if (sort) {
      const isDesc = sort.startsWith('-');
      const col = isDesc ? sort.substring(1) : sort;
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, '');
      orderClause = `ORDER BY ${safeCol} ${isDesc ? 'DESC' : 'ASC'}`;
    }

    values.push(parseInt(limit, 10));
    const sql = `SELECT * FROM ${table} ${whereClause} ${orderClause} LIMIT $${paramIndex}`;

    const result = await query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error(`Error filtering ${table}:`, err.message);
    res.status(500).json({ error: `Failed to filter ${table}` });
  }
});

// GET /api/entities/:entity/:id - Get single record by ID
router.get('/:entity/:id', async (req, res) => {
  const table = getTableName(req.params.entity);
  const { id } = req.params;

  try {
    const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `${table} with id ${id} not found` });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching ${table}/${id}:`, err.message);
    res.status(500).json({ error: `Failed to fetch record` });
  }
});

// POST /api/entities/:entity - Create new record
router.post('/:entity', async (req, res) => {
  const table = getTableName(req.params.entity);
  const payload = { ...req.body };

  if (!payload.id) {
    payload.id = generateId(table.substring(0, 4));
  }

  try {
    // Ensure all payload columns exist in the PostgreSQL table
    await ensureColumnsExist(table, payload);

    const columns = [];
    const values = [];
    const placeholders = [];

    Object.entries(payload).forEach(([key, value], idx) => {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      columns.push(safeKey);
      if (typeof value === 'object' && value !== null) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      placeholders.push(`$${idx + 1}`);
    });

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const result = await query(sql, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`Error creating ${table}:`, err.message);
    res.status(500).json({ error: `Failed to create in ${table}: ${err.message}` });
  }
});

// PUT /api/entities/:entity/:id - Update record
router.put('/:entity/:id', async (req, res) => {
  const table = getTableName(req.params.entity);
  const { id } = req.params;
  const payload = { ...req.body };
  delete payload.id; // do not update primary key

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  try {
    // Ensure all update columns exist in the PostgreSQL table
    await ensureColumnsExist(table, payload);

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(payload).forEach(([key, value]) => {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      setClauses.push(`${safeKey} = $${paramIndex}`);
      if (typeof value === 'object' && value !== null) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramIndex++;
    });

    setClauses.push(`updated_date = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      // Upsert fallback
      const insertCols = ['id', ...Object.keys(payload).map((k) => k.replace(/[^a-zA-Z0-9_]/g, ''))];
      const insertVals = [id, ...Object.values(payload).map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : v))];
      const placeholders = insertVals.map((_, i) => `$${i + 1}`);
      const insertSql = `INSERT INTO ${table} (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const inserted = await query(insertSql, insertVals);
      return res.json(inserted.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating ${table}/${id}:`, err.message);
    res.status(500).json({ error: `Failed to update ${table}: ${err.message}` });
  }
});

// DELETE /api/entities/:entity/:id - Delete record
router.delete('/:entity/:id', async (req, res) => {
  const table = getTableName(req.params.entity);
  const { id } = req.params;

  try {
    await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true, id });
  } catch (err) {
    console.error(`Error deleting ${table}/${id}:`, err.message);
    res.status(500).json({ error: `Failed to delete record from ${table}` });
  }
});

// POST /api/entities/:entity/bulk-update - Bulk update records
router.post('/:entity/bulk-update', async (req, res) => {
  const table = getTableName(req.params.entity);
  const items = req.body.items || req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array expected' });
  }

  try {
    const results = [];
    for (const item of items) {
      if (item.id) {
        const { id, ...data } = item;
        await ensureColumnsExist(table, data);

        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.entries(data).forEach(([key, value]) => {
          const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
          setClauses.push(`${safeKey} = $${paramIndex}`);
          values.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
          paramIndex++;
        });

        values.push(id);
        const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const res = await query(sql, values);
        if (res.rows.length > 0) results.push(res.rows[0]);
      }
    }
    res.json(results);
  } catch (err) {
    console.error(`Error bulk updating ${table}:`, err.message);
    res.status(500).json({ error: `Failed to bulk update ${table}` });
  }
});

export default router;
