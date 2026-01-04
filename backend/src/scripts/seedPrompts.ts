import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { database } from '../db/database';
import { PromptModel, CreatePromptDTO } from '../models/Prompt';

// Load seed data
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_FILE = path.join(__dirname, '../data/openSourcePrompts.json');

async function seed() {
  try {
    console.log('🌱 Starting prompt seeding...');
    
    // Initialize DB connection
    await database.initialize();

    if (!fs.existsSync(SEED_FILE)) {
      console.warn(`⚠️ Seed file not found at: ${SEED_FILE}`);
      process.exit(0);
    }

    const rawData = fs.readFileSync(SEED_FILE, 'utf-8');
    const prompts: CreatePromptDTO[] = JSON.parse(rawData);

    let createdCount = 0;
    let skippedCount = 0;

    for (const p of prompts) {
      // Check if prompt with same title already exists
      const existing = await database.get(
        'SELECT id FROM prompts WHERE title = ? AND "deletedAt" IS NULL', 
        [p.title]
      );

      if (existing) {
        skippedCount++;
        continue;
      }

      // Add "Open Source" to tags to identify them
      const tags = p.tags || [];
      if (!tags.includes('Open Source')) {
        tags.push('Open Source');
      }

      await PromptModel.create({
        ...p,
        author: 'Community (Open Source)',
        tags
      });
      createdCount++;
    }

    console.log(`✅ Seeding complete.`);
    console.log(`   - Imported: ${createdCount}`);
    console.log(`   - Skipped:  ${skippedCount}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close DB connection
    // Note: database.close() might hang if pool has active clients, but for a script it's usually fine.
    // However, PromptSpark's database class handles it.
    process.exit(0);
  }
}

seed();
