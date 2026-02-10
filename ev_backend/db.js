const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '@ma02#$@',
  database: process.env.DB_NAME || 'voting',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Use promise wrapper for async/await
const promisePool = pool.promise();

// Test the connection
async function testConnection() {
  try {
    const [rows] = await promisePool.query('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

testConnection();

// Export the promise pool for use in other files
module.exports = promisePool;
