// Database Setup Script
const { testConnection, createDatabaseIfNotExists, applySchema } = require('./db.config.cjs');

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  // Step 1: Test connection to PostgreSQL
  console.log('Step 1/4: Testing PostgreSQL connection...');
  const connectionOk = await testConnection();

  if (!connectionOk) {
    console.error('❌ Database setup failed: Cannot connect to PostgreSQL');
    process.exit(1);
  }

  // Step 2: Create database if it doesn't exist
  console.log('\nStep 2/4: Creating predictive_maintenance database...');
  const dbCreated = await createDatabaseIfNotExists();

  if (!dbCreated) {
    console.error('❌ Database setup failed: Cannot create database');
    process.exit(1);
  }

  // Step 3: Apply database schema
  console.log('\nStep 3/4: Applying database schema...');
  const schemaApplied = await applySchema();

  if (!schemaApplied) {
    console.error('❌ Database setup failed: Cannot apply schema');
    process.exit(1);
  }

  console.log('\nStep 4/4: Database setup completed successfully!');
  console.log('\n🎉 Your PostgreSQL database is ready for the Predictive Maintenance application!');
  console.log('\nDatabase connection details:');
  console.log('- Host: localhost');
  console.log('- Port: 5433');
  console.log('- Database: predictive_maintenance');
  console.log('- User: postgres');
}

// Run the setup
setupDatabase().catch(error => {
  console.error('❌ Unexpected error during database setup:', error.message);
  process.exit(1);
});