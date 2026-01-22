import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUIZZES_DIR = path.join(__dirname, '../../data/quizzes');

async function migrateQuizzes() {
  try {
    const files = await fs.readdir(QUIZZES_DIR);
    let migratedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      const filePath = path.join(QUIZZES_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const quiz = JSON.parse(content);

      // Check if current_question_index already exists
      if (typeof quiz.current_question_index === 'number') {
        console.log(`✓ ${file} - already migrated`);
        continue;
      }

      // Add current_question_index field
      quiz.current_question_index = 0;

      // Write back to file
      await fs.writeFile(filePath, JSON.stringify(quiz, null, 2), 'utf-8');
      console.log(`✓ ${file} - migrated`);
      migratedCount++;
    }

    console.log(`\n✅ Migration complete! Migrated ${migratedCount} quiz(zes).`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateQuizzes();
