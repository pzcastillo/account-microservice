const db = require('../db');
const accountService = require('../services/accountService');

async function createAccount(req, res, next) {
  try {
    let comp_code = req.user.comp_code;

    // SUPER_ADMIN can create in any company
    if (req.user.role_name === 'SUPER_ADMIN' && req.body.comp_code) {
      comp_code = req.body.comp_code.trim().toUpperCase();
    }

    const account = await accountService.createAccount(comp_code, req.body);
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
}

async function listAccounts(req, res, next) {
  try {
    let comp_code = req.user.comp_code;

    // SUPER_ADMIN can list any company
    if (req.user.role_name === 'SUPER_ADMIN' && req.query.comp_code) {
      comp_code = req.query.comp_code.trim().toUpperCase();
    }

    const queryOptions = { ...req.query };

    // CLIENT & EMPLOYEE can only see their own account
    if (['CLIENT', 'EMPLOYEE'].includes(req.user.role_name)) {
      queryOptions.emp_id = req.user.emp_id;  // Force filter to self
      // Alternative (if you prefer UUID): queryOptions.id = req.user.sub || req.user.id;
    }

    // MANAGER can only list own department accounts
    else if (req.user.role_name === 'MANAGER' && req.user.department_id) {
      queryOptions.department_id = req.user.department_id;
    }

    const accounts = await accountService.listAccounts(comp_code, queryOptions);

    // Always return 200 + array (even if just one or zero)
    res.status(200).json(accounts);
  } catch (err) {
    next(err);
  }
}

async function getAccount(req, res, next) {
  try {
    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const lookup = await db.rawQuery('SELECT comp_code FROM accounts WHERE id = $1', [id]);
      if (lookup.rowCount === 0) return res.status(404).json({ error: 'Account not found' });
      comp_code = lookup.rows[0].comp_code;
    }

    const account = await accountService.getAccountById(comp_code, id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function updateAccount(req, res, next) {
  try {
    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const lookup = await db.rawQuery('SELECT comp_code FROM accounts WHERE id = $1', [id]);
      if (lookup.rowCount === 0) return res.status(404).json({ error: 'Account not found' });
      comp_code = lookup.rows[0].comp_code;
    }

    const account = await accountService.updateAccount(comp_code, id, req.body);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function disableAccount(req, res, next) {
  try {
    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const lookup = await db.rawQuery('SELECT comp_code FROM accounts WHERE id = $1', [id]);
      if (lookup.rowCount === 0) return res.status(404).json({ error: 'Account not found' });
      comp_code = lookup.rows[0].comp_code;
    }

    const account = await accountService.disableAccount(comp_code, id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const { id } = req.params;
    let comp_code = req.user.comp_code;

    if (req.user.role_name === 'SUPER_ADMIN') {
      const lookup = await db.rawQuery('SELECT comp_code FROM accounts WHERE id = $1', [id]);
      if (lookup.rowCount === 0) return res.status(404).json({ error: 'Account not found' });
      comp_code = lookup.rows[0].comp_code;
    }

    const deleted = await accountService.deleteAccount(comp_code, id);
    if (!deleted) return res.status(404).json({ error: 'Account not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAccount,
  listAccounts,
  getAccount,
  updateAccount,
  disableAccount,
  deleteAccount
};