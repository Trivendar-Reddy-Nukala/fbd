// routes/admin.js
const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['ROLE_ADMIN']));

// GET /api/admin/users
router.get('/users', (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 20;
  const offset = page * size;

  // Get total count for pagination
  const countQuery = 'SELECT COUNT(*) as total FROM users';
  db.query(countQuery, (err, countResult) => {
    if (err) {
      console.error('Count query error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const total = countResult[0].total;

    // Get paginated users with their roles
    const usersQuery = `
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.created_at,
        GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(usersQuery, [size, offset], (err, usersResult) => {
      if (err) {
        console.error('Users query error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Format the response
      const users = usersResult.map(user => ({
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.roles ? user.roles.split(',')[0] : 'ROLE_USER',
        roles: user.roles ? user.roles.split(',') : ['ROLE_USER'],
        createdAt: user.created_at
      }));

      res.json({
        users,
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

// GET /api/admin/users/{userId}
router.get('/users/:userId', (req, res) => {
  const { userId } = req.params;

  const userQuery = `
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.created_at,
      u.updated_at,
      GROUP_CONCAT(r.name) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.role_id
    WHERE u.user_id = ?
    GROUP BY u.user_id
  `;

  db.query(userQuery, [userId], (err, userResult) => {
    if (err) {
      console.error('User query error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult[0];
    const userData = {
      userId: user.user_id,
      fullName: user.full_name,
      email: user.email,
      roles: user.roles ? user.roles.split(',') : ['ROLE_USER'],
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    // Get user's accounts
    const accountsQuery = `
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

    db.query(accountsQuery, [userId], (err, accountsResult) => {
      if (err) {
        console.error('Accounts query error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      userData.accounts = accountsResult;
      res.json(userData);
    });
  });
});

// GET /api/admin/analytics/overview
router.get('/analytics/overview', (req, res) => {
  // Get total users
  const usersQuery = 'SELECT COUNT(*) as totalUsers FROM users';
  
  // Get total transactions
  const transactionsQuery = 'SELECT COUNT(*) as totalTransactions FROM transactions';
  
  // Get average API response time (mock data for now)
  const avgResponseTime = '85ms';

  db.query(usersQuery, (err, usersResult) => {
    if (err) {
      console.error('Users count error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    db.query(transactionsQuery, (err, transactionsResult) => {
      if (err) {
        console.error('Transactions count error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const analytics = {
        totalUsers: usersResult[0].totalUsers,
        totalTransactions: transactionsResult[0].totalTransactions,
        avgApiResponseTime: avgResponseTime
      };

      res.json(analytics);
    });
  });
});

// PUT /api/admin/users/{userId}/roles (update user roles)
router.put('/users/:userId/roles', (req, res) => {
  const { userId } = req.params;
  const { roles } = req.body;

  if (!roles || !Array.isArray(roles)) {
    return res.status(400).json({ message: 'Roles array is required' });
  }

  // Verify user exists
  db.query('SELECT user_id FROM users WHERE user_id = ?', [userId], (err, userResult) => {
    if (err) {
      console.error('User verification error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Start transaction
    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Remove existing roles
      db.query('DELETE FROM user_roles WHERE user_id = ?', [userId], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Delete roles error:', err);
            res.status(500).json({ message: 'Error updating roles' });
          });
        }

        // Add new roles
        const rolePromises = roles.map(roleName => {
          return new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO user_roles (user_id, role_id) SELECT ?, role_id FROM roles WHERE name = ?',
              [userId, roleName],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });

        Promise.all(rolePromises)
          .then(() => {
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Commit error:', err);
                  res.status(500).json({ message: 'Error updating roles' });
                });
              }
              res.json({ message: 'User roles updated successfully' });
            });
          })
          .catch((error) => {
            db.rollback(() => {
              console.error('Role assignment error:', error);
              res.status(500).json({ message: 'Error updating roles' });
            });
          });
      });
    });
  });
});

// DELETE /api/admin/users/{userId} (delete user)
router.delete('/users/:userId', (req, res) => {
  const { userId } = req.params;

  // Verify user exists
  db.query('SELECT user_id FROM users WHERE user_id = ?', [userId], (err, userResult) => {
    if (err) {
      console.error('User verification error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    db.query('DELETE FROM users WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ message: 'Error deleting user' });
      }

      res.json({ message: 'User deleted successfully' });
    });
  });
});

module.exports = router; 