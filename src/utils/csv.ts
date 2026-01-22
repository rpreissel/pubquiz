import type { Question } from '../types';

export interface CSVQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string;
}

export function parseCSV(csvText: string): Omit<Question, 'id'>[] {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV muss mindestens Header und eine Frage enthalten');
  }

  // Parse header
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const requiredColumns = ['question', 'optiona', 'optionb', 'optionc', 'optiond', 'correct'];
  const missingColumns = requiredColumns.filter((col) => !header.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(
      `Fehlende Spalten: ${missingColumns.join(', ')}. ` +
        `Erforderlich: question, optionA, optionB, optionC, optionD, correct`,
    );
  }

  const questions: Omit<Question, 'id'>[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue; // Skip empty lines
    }

    const values = line.split(',').map((v) => v.trim());

    if (values.length < requiredColumns.length) {
      throw new Error(`Zeile ${i + 1}: Nicht genügend Spalten`);
    }

    const questionIndex = header.indexOf('question');
    const optionAIndex = header.indexOf('optiona');
    const optionBIndex = header.indexOf('optionb');
    const optionCIndex = header.indexOf('optionc');
    const optionDIndex = header.indexOf('optiond');
    const correctIndex = header.indexOf('correct');

    const question = values[questionIndex];
    const options = [
      values[optionAIndex],
      values[optionBIndex],
      values[optionCIndex],
      values[optionDIndex],
    ];
    const correctValue = values[correctIndex].toUpperCase();

    // Validate question
    if (!question) {
      throw new Error(`Zeile ${i + 1}: Frage darf nicht leer sein`);
    }

    // Validate options
    if (options.some((opt) => !opt)) {
      throw new Error(`Zeile ${i + 1}: Alle Optionen müssen ausgefüllt sein`);
    }

    // Parse correct answer (A=0, B=1, C=2, D=3)
    let correctIndex_: number;
    if (correctValue === 'A' || correctValue === '0') {
      correctIndex_ = 0;
    } else if (correctValue === 'B' || correctValue === '1') {
      correctIndex_ = 1;
    } else if (correctValue === 'C' || correctValue === '2') {
      correctIndex_ = 2;
    } else if (correctValue === 'D' || correctValue === '3') {
      correctIndex_ = 3;
    } else {
      throw new Error(`Zeile ${i + 1}: Korrekte Antwort muss A, B, C, D, 0, 1, 2 oder 3 sein`);
    }

    questions.push({
      text: question,
      options,
      correct: correctIndex_,
    });
  }

  if (questions.length === 0) {
    throw new Error('Keine gültigen Fragen im CSV gefunden');
  }

  return questions;
}

export function downloadCSVTemplate(): void {
  const template =
    'question,optionA,optionB,optionC,optionD,correct\n' +
    'Welche Farbe ist der Himmel?,Blau,Rot,Grün,Gelb,A\n' +
    'Was ist 2+2?,3,4,5,6,B';

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quiz-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
