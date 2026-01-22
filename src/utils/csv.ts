import type { Question } from '../types';

export interface CSVQuestion {
  question: string;
  correct: string;
}

export function parseCSV(csvText: string): Omit<Question, 'id'>[] {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV muss mindestens Header und eine Frage enthalten');
  }

  // Parse header
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const requiredColumns = ['question', 'correct'];
  const missingColumns = requiredColumns.filter((col) => !header.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(
      `Fehlende Spalten: ${missingColumns.join(', ')}. ` + `Erforderlich: question, correct`,
    );
  }

  const questions: Omit<Question, 'id'>[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue; // Skip empty lines
    }

    // Handle CSV with quoted values containing commas
    const values = parseCSVLine(line);

    if (values.length < requiredColumns.length) {
      throw new Error(`Zeile ${i + 1}: Nicht genügend Spalten`);
    }

    const questionIndex = header.indexOf('question');
    const correctIndex = header.indexOf('correct');

    const question = values[questionIndex];
    const correct = values[correctIndex];

    // Validate question
    if (!question) {
      throw new Error(`Zeile ${i + 1}: Frage darf nicht leer sein`);
    }

    // Validate correct answer
    if (!correct) {
      throw new Error(`Zeile ${i + 1}: Korrekte Antwort darf nicht leer sein`);
    }

    questions.push({
      text: question,
      correct: correct,
    });
  }

  if (questions.length === 0) {
    throw new Error('Keine gültigen Fragen im CSV gefunden');
  }

  return questions;
}

// Parse a single CSV line, handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function downloadCSVTemplate(): void {
  const template =
    'question,correct\n' +
    'Welche Farbe hat der Himmel?,Blau\n' +
    'Was ist die Hauptstadt von Deutschland?,Berlin\n' +
    'Wie viele Planeten hat unser Sonnensystem?,8';

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quiz-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
