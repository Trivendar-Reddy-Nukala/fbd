// routes/api.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/dashboard
router.get('/dashboard', requireRole(['ROLE_USER', 'ROLE_CLIENT']), (req, res) => {
  const userId = req.user.userId;

  // Get user's accounts and calculate net worth
  const dashboardQuery = `
    SELECT 
      COALESCE(SUM(a.balance), 0) as netWorth,
      COUNT(a.account_id) as totalAccounts
    FROM accounts a 
    WHERE a.user_id = ?
  `;

  // Get recent transactions
  const recentTransactionsQuery = `
    SELECT 
      t.transaction_id,
      t.amount,
      t.description,
      t.category,
      t.transaction_date,
      a.account_name
    FROM transactions t
    JOIN accounts a ON t.account_id = a.account_id
    WHERE a.user_id = ?
    ORDER BY t.transaction_date DESC
    LIMIT 10
  `;

  // Get income/spending summary (last 30 days)
  const summaryQuery = `
    SELECT 
      COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as totalSpending
    FROM transactions t
    JOIN accounts a ON t.account_id = a.account_id
    WHERE a.user_id = ? 
    AND t.transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `;

  db.query(dashboardQuery, [userId], (err, netWorthResult) => {
    if (err) {
      console.error('Dashboard query error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    db.query(recentTransactionsQuery, [userId], (err, transactionsResult) => {
      if (err) {
        console.error('Transactions query error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      db.query(summaryQuery, [userId], (err, summaryResult) => {
        if (err) {
          console.error('Summary query error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const dashboard = {
          netWorth: parseFloat(netWorthResult[0].netWorth),
          totalAccounts: netWorthResult[0].totalAccounts,
          totalIncome: parseFloat(summaryResult[0].totalIncome),
          totalSpending: parseFloat(summaryResult[0].totalSpending),
          recentTransactions: transactionsResult
        };

        res.json(dashboard);
      });
    });
  });
});

// GET /api/accounts
router.get('/accounts', requireRole(['ROLE_USER', 'ROLE_CLIENT']), (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT 
      account_id,
      account_name,
      account_type,
      balance,
      currency,
      created_at
    FROM accounts 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Accounts query error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    res.json(results);
  });
});

// GET /api/accounts/{accountId}/transactions
router.get('/accounts/:accountId/transactions', requireRole(['ROLE_USER', 'ROLE_CLIENT']), (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.userId;
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 20;
  const offset = page * size;

  // First verify the account belongs to the user
  db.query('SELECT account_id FROM accounts WHERE account_id = ? AND user_id = ?', 
    [accountId, userId], (err, accountResult) => {
    if (err) {
      console.error('Account verification error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (accountResult.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Get total count for pagination
    const countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE account_id = ?';
    db.query(countQuery, [accountId], (err, countResult) => {
      if (err) {
        console.error('Count query error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const total = countResult[0].total;

      // Get paginated transactions
      const transactionsQuery = `
        SELECT 
          transaction_id,
          amount,
          description,
          category,
          transaction_date,
          created_at
        FROM transactions 
        WHERE account_id = ?
        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?
      `;

      db.query(transactionsQuery, [accountId, size, offset], (err, transactionsResult) => {
        if (err) {
          console.error('Transactions query error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.json({
          transactions: transactionsResult,
          pagination: {
            page,
            size,
            total,
            totalPages: Math.ceil(total / size)
          }
        });
      });
    });
  });
});

// POST /api/accounts (create new account)
router.post('/accounts', requireRole(['ROLE_USER', 'ROLE_CLIENT']), (req, res) => {
  const userId = req.user.userId;
  const { accountName, accountType, balance = 0, currency = 'USD' } = req.body;

  if (!accountName || !accountType) {
    return res.status(400).json({ message: 'Account name and type are required' });
  }

  const accountId = uuidv4();
  const query = `
    INSERT INTO accounts (account_id, user_id, account_name, account_type, balance, currency)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [accountId, userId, accountName, accountType, balance, currency], (err) => {
    if (err) {
      console.error('Create account error:', err);
      return res.status(500).json({ message: 'Error creating account' });
    }

    res.status(201).json({ 
      message: 'Account created successfully',
      accountId 
    });
  });
});

// POST /api/accounts/{accountId}/transactions (add transaction)
router.post('/accounts/:accountId/transactions', requireRole(['ROLE_USER', 'ROLE_CLIENT']), (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.userId;
  const { amount, description, category } = req.body;

  if (!amount || !description) {
    return res.status(400).json({ message: 'Amount and description are required' });
  }

  // Verify account belongs to user
  db.query('SELECT account_id FROM accounts WHERE account_id = ? AND user_id = ?', 
    [accountId, userId], (err, accountResult) => {
    if (err) {
      console.error('Account verification error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (accountResult.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const transactionId = uuidv4();
    
    // Start transaction
    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Insert transaction
      db.query(
        'INSERT INTO transactions (transaction_id, account_id, amount, description, category) VALUES (?, ?, ?, ?, ?)',
        [transactionId, accountId, amount, description, category],
        (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Transaction insert error:', err);
              res.status(500).json({ message: 'Error creating transaction' });
            });
          }

          // Update account balance
          db.query(
            'UPDATE accounts SET balance = balance + ? WHERE account_id = ?',
            [amount, accountId],
            (err) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Balance update error:', err);
                  res.status(500).json({ message: 'Error updating balance' });
                });
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error('Commit error:', err);
                    res.status(500).json({ message: 'Error committing transaction' });
                  });
                }

                res.status(201).json({ 
                  message: 'Transaction created successfully',
                  transactionId 
                });
              });
            }
          );
        }
      );
    });
  });
});

module.exports = router; 