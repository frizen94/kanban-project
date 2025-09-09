
import { sql } from './database';

export async function addDescriptionColumn() {
  try {
    console.log('🔄 Adding description column to boards table...');
    
    // Add description column to boards table
    await sql`
      ALTER TABLE boards 
      ADD COLUMN IF NOT EXISTS description TEXT;
    `;
    
    console.log('✅ Description column added successfully!');
  } catch (error) {
    console.error('❌ Error adding description column:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addDescriptionColumn()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
