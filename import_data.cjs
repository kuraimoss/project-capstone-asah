// Import Data Script
// This script imports the complete database setup SQL file into PostgreSQL

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'predictive_maintenance',
  user: 'postgres',
  password: 'kurakura',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function importData() {
  console.log('🚀 Starting data import process...\n');

  // Test database connection
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Read the SQL file
  const sqlFilePath = path.join(__dirname, 'complete_database_setup.sql');

  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ SQL file not found:', sqlFilePath);
    process.exit(1);
  }

  console.log('📖 Reading SQL file...');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  console.log(`✅ SQL file loaded (${sqlContent.length} characters)`);

  // Split SQL content into individual statements
  // This is a simple split by semicolon, but it should work for this file
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute`);

  const client = await pool.connect();

  try {
    console.log('\n🔄 Executing SQL statements...');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements or comments
      if (!statement || statement.trim().startsWith('--')) {
        continue;
      }

      try {
        await client.query(statement + ';');
        successCount++;

        // Show progress every 100 statements
        if (successCount % 100 === 0) {
          console.log(`✅ Executed ${successCount} statements...`);
        }
      } catch (error) {
        // Log the error but continue with other statements
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        errorCount++;
      }
    }

    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎊 All data imported successfully!');
    } else {
      console.log(`\n⚠️  Import completed with ${errorCount} errors. Some data may not have been imported.`);
    }

    // Verify the import by checking record count
    console.log('\n🔍 Verifying import...');
    const result = await client.query('SELECT COUNT(*) as total_records FROM machine_sensor_data');
    console.log(`📊 Total records in database: ${result.rows[0].total_records}`);

    // Show some sample data
    const sampleResult = await client.query('SELECT * FROM machine_sensor_data LIMIT 5');
    console.log('\n📋 Sample data:');
    console.table(sampleResult.rows);

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import
importData().catch(error => {
  console.error('❌ Unexpected error during import:', error.message);
  process.exit(1);
});