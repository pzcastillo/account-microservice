const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.db);

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

function tQuery(text, params = [], comp_code) {
  // SUPER_ADMIN: comp_code = null → NO tenant filter
  if (comp_code === null) {
    return pool.query(text.trim().replace(/;+$/, ''), params);
  }

  if (!comp_code) throw new Error('comp_code required');

  let sql = text.trim().replace(/;+$/, '');
  const values = [...params];
  const placeholder = `$${values.length + 1}`;
  const condition = `comp_code = ${placeholder}`;

  if (/\sWHERE\s/i.test(sql)) {
    sql = sql.replace(/\sWHERE\s/i, ` WHERE ${condition} AND `);
  } else {
    const insertPos = sql.search(/\s+(ORDER|LIMIT|GROUP|HAVING|FOR)\s/i);
    if (insertPos !== -1) {
      sql = sql.slice(0, insertPos) + ` WHERE ${condition} ` + sql.slice(insertPos);
    } else {
      sql += ` WHERE ${condition}`;
    }
  }

  values.push(comp_code);
  return pool.query(sql, values);
}

// Optional: helper for INSERTs to always include comp_code
function tInsert(table, data, comp_code, returning = '*') {
  if (!comp_code) throw new Error('comp_code required');

  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');
  const compPlaceholder = `$${keys.length + 1}`;

  const text = `INSERT INTO ${table} (${columns}, comp_code) 
                VALUES (${placeholders}, ${compPlaceholder}) 
                RETURNING ${returning}`;

  return pool.query(text, [...values, comp_code]);
}

async function getAccountByEmpId(emp_id, comp_code) {
  if (!emp_id || !comp_code) return null;

  const res = await tQuery(`
    SELECT * FROM accounts 
    WHERE emp_id = $1
  `, [emp_id], comp_code);

  return res.rows[0] || null;
}

async function getAccountById(id, comp_code) {
  const res = await tQuery('SELECT * FROM accounts WHERE id = $1', [id], comp_code);
  return res.rows[0] || null;
}

// Check if emp_id already exists (useful in create/update)
async function empIdExists(emp_id, comp_code, excludeId = null) {
  const res = await tQuery(`
    SELECT 1 FROM accounts 
    WHERE emp_id = $1
      AND (${excludeId}::uuid IS NULL OR id != ${excludeId}::uuid)
  `, [emp_id], comp_code);

  return res.rowCount > 0;
}

async function rawQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

module.exports = {
  query,           // raw query ← for global tables like roles, user_types, roles
  tQuery,          // tenant-aware query ← for accounts, departments, etc.
  tInsert,
  rawQuery,
  getClient,
  pool,
  getAccountByEmpId,
  getAccountById,
  empIdExists,
};