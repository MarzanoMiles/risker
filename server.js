const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3306;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: 'shuttle.proxy.rlwy.net:',
  port: 38580,
  user: 'root',
  password: 'StzsTAbAQPgiBsUiSVDZhXahUOnnncQm',
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Risker API is running! 🚀' });
});

// Save data endpoint
app.post('/api/save', async (req, res) => {
  try {
    const { sessionId, question, answer, username, adventureScore, metadata, timestamp } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO risker (session_id, question, answer, username, adventure_score, metadata, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId, 
        question, 
        answer, 
        username || '', 
        adventureScore || 0, 
        metadata || '', 
        timestamp
      ]
    );

    res.status(200).json({ 
      success: true, 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// View all responses
app.get('/api/responses', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM risker ORDER BY timestamp DESC LIMIT 100'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚂 Server running on port ${PORT}`);
});
