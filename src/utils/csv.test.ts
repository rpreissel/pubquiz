import { describe, it, expect } from 'vitest';
import { parseCSV } from './csv';

describe('parseCSV', () => {
  describe('Valid CSV', () => {
    it('parses valid CSV with question and correct columns', () => {
      const csv = `question,correct
Welche Farbe hat der Himmel?,Blau
Was ist die Hauptstadt von Deutschland?,Berlin`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        text: 'Welche Farbe hat der Himmel?',
        correct: 'Blau',
      });
      expect(result[1]).toEqual({
        text: 'Was ist die Hauptstadt von Deutschland?',
        correct: 'Berlin',
      });
    });

    it('handles quoted values with commas', () => {
      const csv = `question,correct
"What is 2+2, roughly?",4
Simple question,Answer`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        text: 'What is 2+2, roughly?',
        correct: '4',
      });
    });

    it('skips empty lines', () => {
      const csv = `question,correct
Question 1,Answer 1

Question 2,Answer 2`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Question 1');
      expect(result[1].text).toBe('Question 2');
    });

    it('handles extra whitespace', () => {
      const csv = `question,correct
  Question with spaces  ,  Answer with spaces  `;

      const result = parseCSV(csv);

      expect(result[0]).toEqual({
        text: 'Question with spaces',
        correct: 'Answer with spaces',
      });
    });

    it('handles different column order', () => {
      const csv = `correct,question
Blau,Welche Farbe hat der Himmel?`;

      const result = parseCSV(csv);

      expect(result[0]).toEqual({
        text: 'Welche Farbe hat der Himmel?',
        correct: 'Blau',
      });
    });

    it('handles case-insensitive headers', () => {
      const csv = `QUESTION,CORRECT
Test question,Test answer`;

      const result = parseCSV(csv);

      expect(result[0]).toEqual({
        text: 'Test question',
        correct: 'Test answer',
      });
    });
  });

  describe('Invalid CSV', () => {
    it('throws error for empty CSV', () => {
      expect(() => parseCSV('')).toThrow('CSV muss mindestens Header und eine Frage enthalten');
    });

    it('throws error for CSV with only header', () => {
      const csv = 'question,correct';
      expect(() => parseCSV(csv)).toThrow('CSV muss mindestens Header und eine Frage enthalten');
    });

    it('throws error for missing question column', () => {
      const csv = `correct,other
Answer,Value`;

      expect(() => parseCSV(csv)).toThrow('Fehlende Spalten: question');
    });

    it('throws error for missing correct column', () => {
      const csv = `question,other
Question,Value`;

      expect(() => parseCSV(csv)).toThrow('Fehlende Spalten: correct');
    });

    it('throws error for missing both columns', () => {
      const csv = `other1,other2
Value1,Value2`;

      expect(() => parseCSV(csv)).toThrow('Fehlende Spalten: question, correct');
    });

    it('throws error for empty question', () => {
      const csv = `question,correct
,Answer`;

      expect(() => parseCSV(csv)).toThrow('Zeile 2: Frage darf nicht leer sein');
    });

    it('throws error for empty correct answer', () => {
      const csv = `question,correct
Question,`;

      expect(() => parseCSV(csv)).toThrow('Zeile 2: Korrekte Antwort darf nicht leer sein');
    });

    it('throws error for insufficient columns', () => {
      const csv = `question,correct
OnlyOneValue`;

      expect(() => parseCSV(csv)).toThrow('Zeile 2: Nicht genügend Spalten');
    });
  });

  describe('Edge Cases', () => {
    it('handles single question', () => {
      const csv = `question,correct
Single question,Single answer`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Single question');
    });

    it('handles many questions', () => {
      const questions = Array.from({ length: 50 }, (_, i) => `Question ${i + 1},Answer ${i + 1}`);
      const csv = `question,correct\n${questions.join('\n')}`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(50);
      expect(result[0].text).toBe('Question 1');
      expect(result[49].text).toBe('Question 50');
    });

    it('handles special characters in text', () => {
      const csv = `question,correct
"Question with ""quotes""",Answer with äöü
Question with emoji 🎉,Answer`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Question with quotes');
      expect(result[0].correct).toBe('Answer with äöü');
      expect(result[1].text).toBe('Question with emoji 🎉');
    });
  });
});
