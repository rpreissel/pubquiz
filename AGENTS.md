# Pub Quiz Web App - Agent Guidelines

## Project Overview

A simple Pub Quiz web application where Quiz Masters create quizzes and teams answer questions sequentially. Features token-based security, free-text answers with automatic scoring, and manual score adjustments.

**Tech Stack:**

- Frontend: React 19 + TypeScript + Vite 7
- Backend: Node.js 18+ + Express 5
- Storage: Filesystem (JSON files)
- Testing: Vitest + React Testing Library
- Linting: ESLint 9 + Prettier 3
- Deployment: fly.io

**Key Features:**

- Token-based security (Master-Token for Quiz Master, Session-Token for Teams)
- Free-text answers with automatic case-insensitive validation
- Manual score adjustment (0, 0.5, 1 points)
- CSV import for questions
- Polling-based updates (no WebSockets needed)
- Mobile-first responsive design

---

## Development Commands

### Installation

```bash
npm install
```

### Development

```bash
npm run start        # Start frontend + backend concurrently (recommended)
npm run dev          # Start frontend only (Vite)
npm run dev:server   # Start backend only (nodemon + tsx)
```

### Build

```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Linting & Formatting

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting without changes
```

### Testing

```bash
npm test                           # Run all tests
npm test -- <filename>             # Run single test file
npm test -- --coverage             # Run tests with coverage
npm test -- --ui                   # Open Vitest UI
npm test -- <filename> --watch     # Watch mode for single test
```

**Examples:**

```bash
npm test -- QuizMaster.test.tsx           # Test specific component
npm test -- src/utils/scoring.test.ts     # Test specific utility
```

---

## Code Style & Formatting

### General Rules

- **Line length:** Max 100 characters
- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Single quotes for strings (except JSX attributes)
- **Semicolons:** Required
- **Trailing commas:** Always in multiline

### Prettier Configuration

All code must be formatted with Prettier. Run `npm run format` before committing.

### ESLint

- Follow all ESLint rules in `.eslintrc.json`
- Fix warnings and errors before committing
- Use `npm run lint:fix` for auto-fixable issues

---

## TypeScript Guidelines

### Strict Mode

- TypeScript strict mode is enabled
- No implicit `any` types
- All function parameters and return types must be explicitly typed

### Type Definitions

```typescript
// ✅ Good - Explicit types
interface Quiz {
  code: string;
  title: string;
  questions: Question[];
  status: 'draft' | 'active' | 'finished';
  current_question_index: number;
  created_at: string;
  master_token: string; // Secret token for quiz master access
}

interface Question {
  id: number;
  text: string;
  correct: string; // Free-text answer (not multiple choice)
}

// ❌ Bad - Implicit any
function processQuiz(quiz) {
  return quiz.questions;
}

// ✅ Good - Explicit parameters and return type
function processQuiz(quiz: Quiz): Question[] {
  return quiz.questions;
}
```

### Utility Types

Prefer TypeScript utility types where appropriate:

- `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`
- `Record<K, V>` for object maps

---

## Naming Conventions

- **PascalCase** for components: `QuizMaster.tsx`, `TeamJoin.tsx`
- **camelCase** for hooks: `useQuizState.ts`, `useTeamAnswers.ts`
- **camelCase** for variables and functions: `quizCode`, `handleSubmit()`
- **UPPER_SNAKE_CASE** for constants: `MAX_TEAMS`, `API_BASE_URL`
- **Boolean prefixes:** `is`, `has`, `should` (e.g. `isActive`, `hasAnswered`)

### Files

- Components: `ComponentName.tsx`
- Utilities: `utilityName.ts`
- Types: `types.ts` or `ComponentName.types.ts`
- Tests: `ComponentName.test.tsx` or `utilityName.test.ts`

---

## Error Handling

### Async/Await Pattern

Always use try-catch for async operations:

```typescript
// ✅ Good
async function loadQuiz(code: string): Promise<Quiz | null> {
  try {
    const response = await fetch(`/api/quiz/${code}`);
    if (!response.ok) {
      throw new Error(`Quiz not found: ${code}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load quiz:', error);
    return null;
  }
}

// ❌ Bad - No error handling
async function loadQuiz(code: string) {
  const response = await fetch(`/api/quiz/${code}`);
  return response.json();
}
```

### User-Facing Errors

- Display user-friendly error messages
- Log detailed errors to console
- Use toast/notification for temporary errors

---

## React Component Patterns

### Functional Components

Use functional components with hooks:

```typescript
interface QuizCardProps {
  quiz: Quiz;
  onSelect: (code: string) => void;
}

export function QuizCard({ quiz, onSelect }: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div onClick={() => onSelect(quiz.code)}>
      {quiz.title}
    </div>
  );
}
```

### State Management

- Use `useState` for local component state
- Use Context API for shared state (quiz state, team info)
- Keep state as close to usage as possible

### Hooks Rules

- Custom hooks must start with `use`
- Only call hooks at top level
- Extract complex logic into custom hooks

---

## Backend/API Conventions

### File Structure

```
backend/
├── server.ts          # Express app setup
├── routes/
│   ├── quiz.ts        # Quiz-related endpoints
│   └── team.ts        # Team-related endpoints
├── utils/
│   ├── storage.ts     # Filesystem operations
│   └── validation.ts  # Input validation
└── types/
    └── api.ts         # API types
```

### Filesystem Storage

All data stored as JSON files in `data/` directory:

- Quizzes: `data/quizzes/{code}.json`
- Teams: `data/teams/{quizCode}/{teamId}.json`

```typescript
// Storage utility pattern
export async function saveQuiz(quiz: Quiz): Promise<void> {
  const filePath = path.join(__dirname, '../data/quizzes', `${quiz.code}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(quiz, null, 2));
}
```

### API Endpoints

Follow RESTful conventions. See `backend/routes/quiz.ts` and `backend/routes/team.ts` for all endpoints.
For detailed API documentation, see `anforderungen.md` section 5.

**Key principles:**

- Use token-based endpoints for sensitive operations (master_token, session_token)
- Validate all inputs on backend
- Return proper HTTP status codes (200, 201, 400, 404, 500)

---

## Testing Guidelines

### Test File Location

- Place tests next to source files: `Component.test.tsx`
- Or in `__tests__` directory

### Testing Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuizCard } from './QuizCard';

describe('QuizCard', () => {
  it('displays quiz title', () => {
    const quiz = { code: 'TEST123', title: 'Test Quiz', questions: [] };
    render(<QuizCard quiz={quiz} onSelect={() => {}} />);
    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    const quiz = { code: 'TEST123', title: 'Test Quiz', questions: [] };
    render(<QuizCard quiz={quiz} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Test Quiz'));
    expect(onSelect).toHaveBeenCalledWith('TEST123');
  });
});
```

### Test Coverage

- Aim for >80% coverage on utilities
- Test user interactions in components
- Test error states and edge cases

---

## Notes for AI Agents

### General Principles

- This is a simple MVP - avoid over-engineering
- No real-time features (WebSockets) - use simple HTTP polling
- Mobile-first responsive design
- Focus on functionality over fancy animations
- Data persistence is filesystem-based, not a database

### Security Model

- Quiz Master gets a `master_token` (UUID) when creating a quiz - this is SECRET
- Teams get a `session_token` (UUID) when joining - this is SECRET
- Quiz codes are public (for joining only, not for control)
- Always use token-based endpoints for sensitive operations

### Answer System

- Questions have free-text answers (not multiple choice)
- Automatic scoring: case-insensitive string comparison
- Quiz Master can manually adjust scores to 0, 0.5, or 1 point
- `total_score` is calculated by summing all `answer.score` values

### Quiz Flow

- Status transitions: `draft` → `active` → `finished`
- Quiz Master controls `current_question_index` to navigate questions
- Teams poll for updates (no WebSocket needed)
- Previous answers are locked when moving to next question

### CSV Import

- Format: `text,correct` (columns)
- Parser handles quotes and multiline values
- See `src/utils/csv.ts` for implementation

### Validation

- Team names must be unique per quiz (case-insensitive)
- Quiz codes are 6 characters, uppercase alphanumeric
- All inputs are validated on backend (see `backend/utils/validation.ts`)
