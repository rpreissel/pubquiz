# Pub Quiz Web App - Anforderungsdokument

## 1. Vision & Übersicht

Eine einfache Pub-Quiz Web-App. Quiz Master erstellt Quizze und stellt Fragen nacheinander, Teams beantworten sie. Nach allen Fragen werden Ergebnisse berechnet und angezeigt. Token-basierte Sicherheit für Quiz Master und Teams.

**Zielgruppe:** Kleine Quiz-Events, Team-Events, Informal Quizzing

**Technologie-Stack:**

- Frontend: React 19 + TypeScript + Vite
- Backend: Node.js + Express 5
- Storage: Filesystem (JSON-Dateien)
- Testing: Vitest + React Testing Library
- Linting: ESLint + Prettier
- Deployment: fly.io

---

## 2. Benutzerrollen

### Quiz Master (Host)

- Erstellt Quiz mit Fragen (manuell oder CSV-Import)
- Aktiviert Quiz und steuert Fragenfluss
- Sieht Antwort-Status aller Teams in Echtzeit
- Kann Punktzahlen manuell korrigieren (0, 0.5, 1 Punkt)
- Sieht finale Rangliste

### Team (Spieler)

- Tritt Quiz bei via Quiz-Code
- Beantwortet Fragen sequenziell mit Freitext
- Erhält automatisches Feedback (richtig/falsch)
- Sieht finale Rangliste mit allen Teams

---

## 3. Hauptfunktionen

### 3.1 Quiz Setup

- **Quiz erstellen:** Quiz Master gibt Titel ein
- **Fragen hinzufügen:**
  - Manuell: Frage + korrekte Antwort als Freitext eingeben
  - CSV-Import: Spalten `text` (Frage) und `correct` (Antwort)
- **Speichern:** Quiz wird mit eindeutigem Code erstellt (z.B. `QUIZ123`)
- **Sicherheit:** Master-Token wird automatisch generiert (UUID)
  - Master-Token ermöglicht exklusiven Zugriff auf Quiz-Steuerung
  - URL-Format: `/quiz-master?token={master_token}`
- **Status:** Quiz startet als `draft`, kann dann zu `active` → `finished` wechseln

### 3.2 Team-Beitritt

- Team öffnet App
- Gibt Quiz-Code ein (z.B. `QUIZ123`)
- Gibt Team-Namen ein (muss einzigartig pro Quiz sein)
- "Beitreten" → Erhält Session-Token für sicheren Zugriff
  - Session-Token wird in localStorage gespeichert
  - URL-Format: `/team-quiz?token={session_token}`
- **Validation:** Nur aktive Quizze erlauben Beitritt
- **Duplikate:** Team-Namen werden case-insensitive geprüft

### 3.3 Quiz durchführen

1. **Start:** Quiz Master öffnet Quiz via Master-Token URL
2. **Aktivieren:** Quiz Master klickt "Quiz starten" → Status: `draft` → `active`
3. **Teams joinen:** Teams treten bei (siehe 3.2)
4. **Frage anzeigen:**
   - Aktuelle Frage wird via `current_question_index` gesteuert
   - Teams sehen Frage via Polling (kein WebSocket)
5. **Antworten:**
   - Teams geben Antwort als Freitext ein
   - Klick auf "Speichern" → automatische Bewertung (case-insensitive Textvergleich)
   - Antwort-Objekt wird gespeichert mit `is_correct` und `score`
6. **Quiz Master Monitoring:**
   - Sieht Liste aller Teams mit Status (✓ beantwortet / ⏳ ausstehend)
   - Kann zur nächsten Frage wechseln via "Nächste Frage"
7. **Fragewechsel:**
   - `current_question_index` wird erhöht
   - Teams sehen neue Frage automatisch (via Polling)
   - Alte Antworten sind gesperrt (nicht mehr änderbar)
8. **Wiederholen** bis alle Fragen beantwortet
9. **Beenden:** Quiz Master klickt "Quiz beenden" → Status: `active` → `finished`
10. **Ergebnisse:** Beide Seiten sehen finale Rangliste (sortiert nach `total_score`)

**Scoring-System:**

- Korrekte Antwort: 1 Punkt (automatisch)
- Falsche Antwort: 0 Punkte (automatisch)
- Quiz Master kann Antworten manuell auf 0.5 Punkte korrigieren
  - Use Case: Teilweise richtige Antworten, Tippfehler, etc.
  - Endpoint: `PATCH /api/team/:teamId/score`

---

## 4. User Flows

### Flow 1: Quiz erstellen

```
1. Quiz Master öffnet App → Klickt "Neues Quiz"
2. Titel eingeben (z.B. "Pub Quiz Januar 2026")
3. Fragen hinzufügen (eine der beiden Methoden):

   Option A - Manuell:
   - Frage eingeben: "Welche Farbe hat der Himmel?"
   - Korrekte Antwort: "Blau"
   - Klick "Frage hinzufügen"
   - Wiederholen für alle Fragen

   Option B - CSV-Import:
   - CSV-Datei mit Spalten: text, correct
   - Datei hochladen → Fragen werden automatisch importiert

4. Klick "Quiz speichern"
5. Erfolgsseite zeigt:
   - Quiz-Code (z.B. QUIZ123) → für Teams
   - Master-Token URL → für Quiz Master (bookmarken!)
6. Quiz Master speichert/bookmarkt Master-Token URL
7. Quiz Master teilt Quiz-Code mit Teams (z.B. via Projektor/Chat)
```

### Flow 2: Team beitreten

```
1. Team öffnet die Web-App (z.B. pubquiz.app)
2. Klickt "Quiz beitreten"
3. Gibt Quiz-Code ein (vom Projektor/Chat): QUIZ123
4. Gibt Team-Namen ein: "Die Experten"
5. Klickt "Beitreten"
6. System prüft:
   - Quiz existiert ✓
   - Quiz ist aktiv ✓
   - Team-Name ist einzigartig ✓
7. Erhält Session-Token (wird automatisch in localStorage gespeichert)
8. Umleitung zu /team-quiz?token={session_token}
9. Sieht entweder:
   - "Warte auf Quiz-Start..." (wenn Status = draft)
   - Aktuelle Frage (wenn Status = active)
```

### Flow 3: Quiz spielen

```
Quiz Master Seite:
  1. Öffnet gespeicherte Master-Token URL
  2. Sieht Quiz-Details + Team-Liste (anfangs leer)
  3. Wartet bis Teams beigetreten sind
  4. Klickt "Quiz starten" → Status: draft → active
  5. Sieht Frage 1 + Team-Status-Liste:
     - Team "Die Experten": ⏳ (noch keine Antwort)
     - Team "Quiz Kings": ✓ (hat geantwortet)
  6. Wartet bis alle/die meisten Teams geantwortet haben
  7. Klickt "Nächste Frage" → current_question_index++
  8. Wiederholt Schritte 5-7 für alle Fragen
  9. Nach letzter Frage: Klickt "Quiz beenden" → Status: active → finished
  10. Sieht finale Rangliste mit allen Teams

Team Seite (Polling alle 2-3 Sekunden):
  1. Sieht Frage 1: "Welche Farbe hat der Himmel?"
  2. Gibt Antwort ein: "blau"
  3. Klickt "Speichern"
  4. Backend:
     - Vergleicht "blau" mit "Blau" (case-insensitive)
     - is_correct = true
     - score = 1
  5. Sieht Bestätigung: "Antwort gespeichert ✓"
  6. Wartet auf nächste Frage (Polling erkennt index-Änderung)
  7. Sieht Frage 2: "Hauptstadt von Deutschland?"
  8. Frage 1 ist jetzt gesperrt (zeigt gespeicherte Antwort "blau")
  9. Wiederholt Schritte 2-6 für alle Fragen
  10. Nach letzter Frage: Sieht finale Rangliste

Rangliste (beide Seiten):
  - Team 1: "Quiz Kings" - 8.5 Punkte
  - Team 2: "Die Experten" - 7 Punkte
  - Team 3: "Brain Trust" - 6.5 Punkte
```

---

## 5. Technische Anforderungen

### Frontend

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Router:** React Router v7
- **Styling:** Plain CSS (kein Framework)
- **State Management:** React Hooks (useState, useEffect)
- **Polling:** `setInterval` für Quiz-Updates (alle 2-3 Sekunden)
- **Local Storage:** Speichert Session-Token und Master-Token
- **Responsive:** Mobile-first Design (funktioniert auf Handy + Desktop)

### Backend

- **Framework:** Node.js 18+ + Express 5
- **TypeScript:** Vollständig typisiert (strict mode)
- **Storage:** Filesystem (keine Datenbank)
  - Quiz-Dateien: `data/quizzes/{code}.json`
  - Team-Dateien: `data/teams/{quiz_code}/{team_id}.json`
- **API-Endpunkte:**

#### Quiz Endpoints

| Method | Endpoint                   | Beschreibung                           |
| ------ | -------------------------- | -------------------------------------- |
| POST   | `/api/quiz/create`         | Quiz erstellen                         |
| GET    | `/api/quiz/:code`          | Quiz laden (ohne Antworten)            |
| GET    | `/api/quiz/:code/master`   | Quiz laden (mit Antworten, für Master) |
| GET    | `/api/quiz/:code/results`  | Finale Ergebnisse                      |
| PATCH  | `/api/quiz/:code/status`   | Status ändern (draft/active/finished)  |
| PATCH  | `/api/quiz/:code/question` | current_question_index ändern          |
| GET    | `/api/quizzes`             | Alle Quizze auflisten (optional)       |

#### Quiz Endpoints (Token-basiert - **SICHER**)

| Method | Endpoint                                 | Beschreibung                |
| ------ | ---------------------------------------- | --------------------------- |
| GET    | `/api/quiz/master/:masterToken`          | Quiz laden via Master-Token |
| PATCH  | `/api/quiz/master/:masterToken/status`   | Status ändern via Token     |
| PATCH  | `/api/quiz/master/:masterToken/question` | Frage ändern via Token      |
| GET    | `/api/quiz/master/:masterToken/results`  | Ergebnisse via Token        |

#### Team Endpoints

| Method | Endpoint                   | Beschreibung                           |
| ------ | -------------------------- | -------------------------------------- |
| POST   | `/api/team/join`           | Team beitreten (quiz_code + team_name) |
| GET    | `/api/team/:teamId`        | Team-Daten laden (benötigt quiz_code)  |
| POST   | `/api/team/:teamId/answer` | Antwort einreichen                     |
| PATCH  | `/api/team/:teamId/score`  | Punktzahl manuell ändern               |

#### Team Endpoints (Token-basiert - **SICHER**)

| Method | Endpoint                                 | Beschreibung                        |
| ------ | ---------------------------------------- | ----------------------------------- |
| GET    | `/api/team/session/:sessionToken`        | Team + Quiz laden via Session-Token |
| POST   | `/api/team/session/:sessionToken/answer` | Antwort via Token einreichen        |

### Deployment

- **Hosting:** fly.io
- **Environment Variables:**
  - `NODE_ENV=production`
  - `PORT=8080` (fly.io Standard)
- **Build Command:** `npm run build`
- **Start Command:** `npm run start:prod`
- **Health Check:** GET `/` (Frontend wird ausgeliefert)

---

## 6. Datenmodelle

### Quiz

```typescript
interface Quiz {
  code: string; // z.B. "QUIZ123" (6 Zeichen, uppercase alphanumeric)
  title: string; // z.B. "Pub Quiz Januar 2026"
  questions: Question[]; // Array von Fragen
  status: 'draft' | 'active' | 'finished';
  current_question_index: number; // 0-basiert, zeigt auf aktuelle Frage
  created_at: string; // ISO 8601 timestamp
  master_token: string; // UUID für Quiz Master Zugriff
}
```

### Question

```typescript
interface Question {
  id: number; // 0-basiert, automatisch vergeben
  text: string; // Fragetext (z.B. "Welche Farbe hat der Himmel?")
  correct: string; // Korrekte Antwort (z.B. "Blau")
}
```

### Team

```typescript
interface Team {
  id: string; // UUID
  quiz_code: string; // Referenz zum Quiz
  name: string; // Team-Name (einzigartig pro Quiz)
  answers: Answer[]; // Array von Antworten
  total_score: number; // Summe aller answer.score Werte
  joined_at: string; // ISO 8601 timestamp
  session_token: string; // UUID für Team Zugriff
}
```

### Answer

```typescript
interface Answer {
  question_id: number; // Referenz zur Frage (Question.id)
  answer: string; // Eingegebene Antwort (z.B. "blau")
  is_correct: boolean; // true wenn answer == correct (case-insensitive)
  score: number; // 0, 0.5, oder 1
}
```

### Beispiel-Daten

**Quiz JSON (`data/quizzes/QUIZ123.json`):**

```json
{
  "code": "QUIZ123",
  "title": "Pub Quiz Januar 2026",
  "questions": [
    {
      "id": 0,
      "text": "Welche Farbe hat der Himmel?",
      "correct": "Blau"
    },
    {
      "id": 1,
      "text": "Hauptstadt von Deutschland?",
      "correct": "Berlin"
    }
  ],
  "status": "active",
  "current_question_index": 1,
  "created_at": "2026-01-23T10:00:00.000Z",
  "master_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Team JSON (`data/teams/QUIZ123/abc-def-123.json`):**

```json
{
  "id": "abc-def-123",
  "quiz_code": "QUIZ123",
  "name": "Die Experten",
  "answers": [
    {
      "question_id": 0,
      "answer": "blau",
      "is_correct": true,
      "score": 1
    },
    {
      "question_id": 1,
      "answer": "Berlim",
      "is_correct": false,
      "score": 0.5
    }
  ],
  "total_score": 1.5,
  "joined_at": "2026-01-23T10:05:00.000Z",
  "session_token": "f1e2d3c4-b5a6-7890-abcd-ef0987654321"
}
```

---

## 7. Sicherheitskonzept

### Token-basierte Authentifizierung

**Problem:** Quiz-Codes sind öffentlich → jeder könnte Quiz steuern oder fremde Antworten sehen

**Lösung:** Separate Tokens für Quiz Master und Teams

#### Master-Token

- Generiert beim Quiz-Erstellen (UUID)
- Nur dem Quiz Master bekannt (URL bookmarken!)
- Berechtigt zu:
  - Quiz-Status ändern (draft/active/finished)
  - Frage wechseln (current_question_index)
  - Ergebnisse sehen
  - Punktzahlen manuell korrigieren
- **NICHT** im Quiz-Code enthalten

#### Session-Token

- Generiert beim Team-Beitritt (UUID)
- Pro Team einzigartig
- Berechtigt zu:
  - Eigene Antworten einreichen
  - Quiz-Daten sehen (ohne korrekte Antworten)
  - Eigene Antworten sehen
- **NICHT** im Quiz-Code enthalten

#### Öffentlicher Quiz-Code

- Nur für Team-Beitritt verwendbar
- Keine sensiblen Operationen möglich
- 6 Zeichen, Uppercase Alphanumeric (z.B. QUIZ12)

### Validation

- **Team-Namen:** 1-50 Zeichen, einzigartig pro Quiz (case-insensitive)
- **Quiz-Titel:** 1-200 Zeichen
- **Fragen:** Mindestens 1 Frage, max 1000 Zeichen pro Frage
- **Antworten:** 1-500 Zeichen
- **Quiz-Code:** Genau 6 Zeichen, nur [A-Z0-9]

---

## 8. MVP Features (Implementiert)

- ✅ Quiz erstellen (manuell + CSV-Import)
- ✅ Token-basierte Sicherheit (Master-Token + Session-Token)
- ✅ Teams beitreten mit Code
- ✅ Freitext-Antworten mit automatischer Bewertung
- ✅ Sequenzielle Fragen-Navigation
- ✅ Team-Status-Monitoring für Quiz Master
- ✅ Manuelle Punktzahl-Korrektur (0, 0.5, 1)
- ✅ Finale Rangliste mit Scoring
- ✅ Responsive UI (Mobile + Desktop)
- ✅ Polling-basierte Updates (kein WebSocket nötig)

---

## 9. Nicht enthalten (Scope Reduction)

- ❌ Echtzeit-Updates via WebSockets (Polling reicht aus)
- ❌ Big Screen / Beamer-Ansicht (jeder auf eigenem Gerät)
- ❌ Zeitlimit pro Frage (manuelles Weiterschalten)
- ❌ Multiple-Choice-Optionen (nur Freitext)
- ❌ Schwierigkeitsgrade / Kategorien
- ❌ Admin-Login (Token-basiert ist ausreichend)
- ❌ Push-Notifications
- ❌ Mobile Native Apps
- ❌ Bild/Video in Fragen
- ❌ Team-Chat
- ❌ Quiz-History / Statistiken

---

## 10. Success Criteria

- [x] Quiz kann in < 2 Minuten erstellt werden
- [x] Team braucht nur Code eingeben (kein Login)
- [x] Antworten werden korrekt gespeichert und bewertet
- [x] Rangliste wird richtig berechnet (total_score = sum of all scores)
- [x] UI lädt schnell (< 1s dank Vite)
- [x] Funktioniert auf Mobile + Desktop (responsive CSS)
- [x] Token-basierte Sicherheit verhindert Manipulation
- [x] CSV-Import funktioniert zuverlässig
- [x] Polling hält Teams synchron (ohne WebSocket-Komplexität)
- [ ] Deploy auf fly.io funktioniert ohne Probleme

---

## 11. Testing-Strategie

### Unit Tests

- Utility-Funktionen: CSV-Parsing, Validation, Scoring
- Ziel: >80% Coverage

### Component Tests

- React Components (Vitest + React Testing Library)
- User-Interaktionen (Click, Input, Form-Submit)
- Edge Cases (leere Inputs, ungültige Codes, etc.)

### API Tests

- Endpoint-Validation
- Error-Handling (404, 400, 500)
- Token-basierte Security

### E2E Flow Tests (manuell)

- Quiz erstellen → Team joinen → Fragen beantworten → Ergebnisse sehen
- CSV-Import → Quiz spielen
- Manuelle Punktzahl-Korrektur

---

## Anhang: Entwickler-Befehle

```bash
# Installation
npm install

# Development
npm run start              # Start Frontend + Backend parallel
npm run dev                # Nur Frontend (Vite)
npm run dev:server         # Nur Backend (nodemon)

# Build
npm run build              # Production build
npm run preview            # Preview production build

# Testing
npm test                   # Run all tests
npm test -- QuizMaster.test.tsx  # Single test file
npm test -- --coverage     # With coverage report
npm test -- --ui           # Vitest UI

# Linting & Formatting
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix ESLint issues
npm run format             # Format with Prettier
npm run format:check       # Check formatting

# Production
npm run start:prod         # Start production server
```

**Code-Stil:** Siehe `AGENTS.md` für detaillierte Guidelines
