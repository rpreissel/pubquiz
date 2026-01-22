import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUIZZES_DIR = path.join(__dirname, '../../data/quizzes');
const TEAMS_DIR = path.join(__dirname, '../../data/teams');

async function migrateQuizzes() {
  try {
    // Check if quizzes directory exists
    try {
      await fs.access(QUIZZES_DIR);
    } catch {
      console.log('No quizzes directory found, nothing to migrate.');
      return 0;
    }

    const files = await fs.readdir(QUIZZES_DIR);
    let migratedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      const filePath = path.join(QUIZZES_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const quiz = JSON.parse(content);

      let needsUpdate = false;

      // Add current_question_index if missing
      if (typeof quiz.current_question_index !== 'number') {
        quiz.current_question_index = 0;
        needsUpdate = true;
      }

      // Add master_token if missing
      if (!quiz.master_token) {
        quiz.master_token = randomUUID();
        needsUpdate = true;
        console.log(`  + Added master_token to ${file}`);
      }

      if (needsUpdate) {
        await fs.writeFile(filePath, JSON.stringify(quiz, null, 2), 'utf-8');
        console.log(`✓ ${file} - migrated`);
        migratedCount++;
      } else {
        console.log(`- ${file} - already up to date`);
      }
    }

    return migratedCount;
  } catch (error) {
    console.error('Error migrating quizzes:', error);
    throw error;
  }
}

async function migrateTeams() {
  try {
    // Check if teams directory exists
    try {
      await fs.access(TEAMS_DIR);
    } catch {
      console.log('No teams directory found, nothing to migrate.');
      return 0;
    }

    const quizDirs = await fs.readdir(TEAMS_DIR);
    let migratedCount = 0;

    for (const quizCode of quizDirs) {
      const quizTeamsDir = path.join(TEAMS_DIR, quizCode);
      const stat = await fs.stat(quizTeamsDir);

      if (!stat.isDirectory()) {
        continue;
      }

      const teamFiles = await fs.readdir(quizTeamsDir);

      for (const file of teamFiles) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const filePath = path.join(quizTeamsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const team = JSON.parse(content);

        // Add session_token if missing
        if (!team.session_token) {
          team.session_token = randomUUID();
          await fs.writeFile(filePath, JSON.stringify(team, null, 2), 'utf-8');
          console.log(`✓ ${quizCode}/${file} - added session_token`);
          migratedCount++;
        } else {
          console.log(`- ${quizCode}/${file} - already up to date`);
        }
      }
    }

    return migratedCount;
  } catch (error) {
    console.error('Error migrating teams:', error);
    throw error;
  }
}

async function main() {
  console.log('=== Token Migration Script ===\n');

  console.log('Migrating quizzes...');
  const quizCount = await migrateQuizzes();

  console.log('\nMigrating teams...');
  const teamCount = await migrateTeams();

  console.log(`\n=== Migration Complete ===`);
  console.log(`Quizzes migrated: ${quizCount}`);
  console.log(`Teams migrated: ${teamCount}`);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
