// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3300;

// Middleware
app.use(cors({
  origin: [
    'https://cofee-may.web.app/', 
    'https://console.firebase.google.com/project/cofee-may/overview'
  ],
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'shuttle.proxy.rlwy.net', // Shuttle proxy
  port: process.env.DB_PORT || 38580,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'StzsTAbAQPgiBsUiSVDZhXahUOnnncQm',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: true } // required by Railway MySQL
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to Railway MySQL successfully!');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection error:', err);
  }
})();

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Risker API is running! 🚀' });
});

// Save data endpoint
app.post('/api/save', async (req, res) => {
  try {
    const { sessionId, question, answer, username, adventureScore, metadata, timestamp } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO risker 
      (session_id, question, answer, username, adventure_score, metadata, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId, 
        question, 
        answer, 
        username || '', 
        adventureScore || 0, 
        metadata || '', 
        timestamp || new Date()
      ]
    );

    res.status(200).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// View last 100 responses
app.get('/api/responses', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM risker ORDER BY timestamp DESC LIMIT 100'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚂 Server running on port ${PORT}`);
});
