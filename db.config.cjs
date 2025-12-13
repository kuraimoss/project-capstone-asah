// Database Configuration for Setup Script
const { Pool, Client } = require('pg');

// Database configuration from environment variables
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'kurakura'
};

// Test connection to PostgreSQL server
async function testConnection() {
  const client = new Client({
    ...config,
    database: 'postgres' // Connect to default postgres database
  });
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL connection successful');
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
}

// Create database if it doesn't exist
async function createDatabaseIfNotExists() {
  const client = new Client({
    ...config,
    database: 'postgres' // Connect to default postgres database
  });
  
  try {
    await client.connect();
    
    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'predictive_maintenance'"
    );
    
    if (res.rowCount === 0) {
      // Database doesn't exist, create it
      await client.query('CREATE DATABASE predictive_maintenance');
      console.log('✅ Database "predictive_maintenance" created successfully');
    } else {
      console.log('ℹ️ Database "predictive_maintenance" already exists');
    }
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    await client.end();
    return false;
  }
}

// Apply database schema
async function applySchema() {
  const client = new Client({
    ...config,
    database: 'predictive_maintenance'
  });
  
  try {
    await client.connect();
    
    // Read schema file
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'database_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return false;
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await client.query(schemaSQL);
    console.log('✅ Database schema applied successfully');
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Failed to apply schema:', error.message);
    await client.end();
    return false;
  }
}

module.exports = {
  testConnection,
  createDatabaseIfNotExists,
  applySchema
};