const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'predictive_maintenance',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'kurakura',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// API Routes
app.get('/api/machines', async (req, res) => {
  try {
    const client = await pool.connect();

    // Query to get machine sensor data
    const query = `
      SELECT
        id,
        datetime,
        machine_id,
        volt,
        rotate,
        pressure,
        vibration,
        model,
        age,
        failure,
        error_id,
        component
      FROM machine_sensor_data
      ORDER BY datetime DESC
      LIMIT 10000
    `;

    const result = await client.query(query);
    client.release();

    // Transform data to match frontend expectations
    const machinesData = result.rows.map(row => ({
      id: row.id,
      datetime: row.datetime,
      machine_id: row.machine_id.toString(),
      volt: parseFloat(row.volt),
      rotate: parseFloat(row.rotate),
      pressure: parseFloat(row.pressure),
      vibration: parseFloat(row.vibration),
      model: row.model,
      age: row.age,
      failure: row.failure,
      error_id: row.error_id,
      component: row.component
    }));

    res.json(machinesData);
  } catch (error) {
    console.error('Error fetching machine data:', error);
    res.status(500).json({
      error: 'Failed to fetch machine data',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'OK',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  console.log('🚀 Starting Predictive Maintenance API Server...');

  // Test database connection before starting
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Cannot start server: Database connection failed');
    console.error('💡 Make sure PostgreSQL is running and database is set up');
    console.error('   Run: npm run setup-db');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET /api/machines - Get machine sensor data`);
    console.log(`   GET /api/health - Health check`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});