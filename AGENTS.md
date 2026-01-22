# Pub Quiz Web App - Agent Guidelines

## Project Overview

A simple Pub Quiz web application where Quiz Masters create quizzes and teams answer questions sequentially. Built with React + TypeScript frontend and Node.js + Express backend with filesystem-based data storage.

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Database: Filesystem (JSON files)
- Testing: Vitest + React Testing Library
- Linting: ESLint + Prettier
- Deployment: fly.io

---

## Development Commands

### Installation
```bash
npm install
```

### Development
```bash
npm run dev          # Start development server (Vite)
npm run dev:server   # Start backend server
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
  created_at: string;
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

## Import Conventions

### Import Order
1. React and React-related imports
2. External library imports (alphabetical)
3. Internal type imports
4. Internal component imports
5. Internal utility/helper imports
6. Styles

```typescript
// ✅ Good
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import type { Quiz, Team } from '../types';
import { QuizCard } from '../components/QuizCard';
import { calculateScore } from '../utils/scoring';
import './QuizMaster.css';
```

### Import Style
- Use named imports for utilities and components
- Avoid default exports except for pages/routes
- Use barrel exports (`index.ts`) for cleaner imports

---

## Naming Conventions

### Components
- **PascalCase** for components: `QuizMaster.tsx`, `TeamJoin.tsx`
- **camelCase** for hooks: `useQuizState.ts`, `useTeamAnswers.ts`

### Variables & Functions
- **camelCase** for variables and functions: `quizCode`, `handleSubmit()`
- **UPPER_SNAKE_CASE** for constants: `MAX_TEAMS`, `API_BASE_URL`

### Files
- Components: `ComponentName.tsx`
- Utilities: `utilityName.ts`
- Types: `types.ts` or `ComponentName.types.ts`
- Tests: `ComponentName.test.tsx` or `utilityName.test.ts`

### Boolean Variables
Use `is`, `has`, `should` prefixes:
```typescript
const isActive = quiz.status === 'active';
const hasAnswered = team.answers.length > 0;
const shouldShowResults = currentQuestion === totalQuestions;
```

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
│   └── storage.ts     # Filesystem operations
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
Follow RESTful conventions:
- `POST /api/quiz/create` - Create new quiz
- `GET /api/quiz/:code` - Get quiz by code
- `POST /api/team/join` - Team joins quiz
- `POST /api/team/:teamId/answer` - Submit answer
- `GET /api/quiz/:code/results` - Get final results

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

## Git Workflow

- Create feature branches: `feature/quiz-creation`, `fix/team-join-bug`
- Write clear commit messages: "Add quiz creation form", "Fix team join validation"
- Run lint and tests before committing
- Keep commits focused and atomic

---

## Notes for AI Agents

- This is a simple MVP - avoid over-engineering
- No real-time features (WebSockets) - use simple HTTP polling if needed
- Mobile-first responsive design
- German language in UI (based on requirements document)
- Focus on functionality over fancy animations
- Data persistence is filesystem-based, not a database
