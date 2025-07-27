// createTables.js
const db = require('./db');

const createTables = () => {
  const queries = [
    // Users Table
    `CREATE TABLE IF NOT EXISTS users (
      user_id CHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Roles Table
    `CREATE TABLE IF NOT EXISTS roles (
      role_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL
    )`,

    // User Roles Junction Table
    `CREATE TABLE IF NOT EXISTS user_roles (
      user_id CHAR(36),
      role_id INT,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
    )`,

    // Accounts Table
    `CREATE TABLE IF NOT EXISTS accounts (
      account_id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      account_name VARCHAR(255) NOT NULL,
      account_type ENUM('Savings', 'Checking', 'Credit', 'Investment') NOT NULL,
      balance DECIMAL(15,2) DEFAULT 0.00,
      currency VARCHAR(3) DEFAULT 'USD',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`,

    // Transactions Table
    `CREATE TABLE IF NOT EXISTS transactions (
      transaction_id CHAR(36) PRIMARY KEY,
      account_id CHAR(36) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      description VARCHAR(500),
      category VARCHAR(100),
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    )`
  ];

  queries.forEach((query, index) => {
    db.query(query, (err) => {
      if (err) {
        console.error(`Error creating table #${index + 1}:`, err.message);
      } else {
        console.log(`Table #${index + 1} created or already exists.`);
      }
    });
  });

  // Insert default roles
  const defaultRoles = [
    { name: 'ROLE_USER' },
    { name: 'ROLE_CLIENT' },
    { name: 'ROLE_ADMIN' }
  ];

  defaultRoles.forEach(role => {
    db.query('INSERT IGNORE INTO roles (name) VALUES (?)', [role.name], (err) => {
      if (err) {
        console.error('Error inserting role:', err.message);
      } else {
        console.log(`Role ${role.name} inserted or already exists.`);
      }
    });
  });
};

module.exports = createTables;
