// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    db.query('SELECT user_id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = uuidv4();

      // Create user
      db.query(
        'INSERT INTO users (user_id, email, password, full_name) VALUES (?, ?, ?, ?)',
        [userId, email, hashedPassword, fullName],
        (err) => {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ message: 'Error creating user' });
          }

          // Assign default role (ROLE_USER)
          db.query(
            'INSERT INTO user_roles (user_id, role_id) SELECT ?, role_id FROM roles WHERE name = ?',
            [userId, 'ROLE_USER'],
            (err) => {
              if (err) {
                console.error('Error assigning role:', err);
              }
              res.status(201).json({ message: 'User registered successfully' });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Find user and their roles
  const query = `
    SELECT u.user_id, u.email, u.password, u.full_name, GROUP_CONCAT(r.name) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.role_id
    WHERE u.email = ?
    GROUP BY u.user_id
  `;

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const roles = user.roles ? user.roles.split(',') : ['ROLE_USER'];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        fullName: user.full_name,
        roles: roles
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      role: roles[0] // Return primary role
    });
  });
});

module.exports = router; 