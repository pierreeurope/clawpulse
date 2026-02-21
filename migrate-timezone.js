const { neon } = require('./node_modules/.pnpm/@neondatabase+serverless@0.9.5/node_modules/@neondatabase/serverless');
const fs = require('fs');

const connectionString = 'postgresql://neondb_owner:npg_Bag2kF9lpsXb@ep-floral-feather-aljhw15d-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

async function migrate() {
  console.log('🔄 Running timezone migration...');
  
  const migrationSQL = fs.readFileSync('./sql/003_timezone.sql', 'utf-8');
  
  try {
    await sql(migrationSQL);
    console.log('✅ Migration successful!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
