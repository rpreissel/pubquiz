# 🎯 Pub Quiz Web App

Eine moderne Pub Quiz Anwendung mit React + TypeScript Frontend und Node.js + Express Backend.

## 📋 Features

### Quiz Master

- ✅ Quiz erstellen mit Titel und Fragen
- ✅ Fragen manuell hinzufügen oder per CSV importieren
- ✅ Quiz-Code wird automatisch generiert
- ✅ Quiz starten und Fragen nacheinander durchgehen
- ✅ Korrekte Antworten sehen
- ✅ Quiz beenden und Ergebnisse anzeigen

### Team

- ✅ Quiz mit Code beitreten
- ✅ Team-Namen eingeben
- ✅ Fragen beantworten (4 Optionen)
- ✅ Antworten werden automatisch gespeichert
- ✅ Polling alle 5 Sekunden für Quiz-Updates
- ✅ Finale Rangliste nach Quiz-Ende

### Ergebnisse

- ✅ Rangliste mit Medaillen (🥇🥈🥉)
- ✅ Punktzahl pro Team
- ✅ Anzahl richtiger Antworten
- ✅ Quiz-Details

## 🚀 Installation & Start

### Voraussetzungen

- Node.js (v18+)
- npm

### Installation

```bash
npm install
```

### Development

**Beide Server gleichzeitig starten (empfohlen):**

```bash
npm start
```

**Oder einzeln starten:**

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run dev:server
```

Die App ist dann verfügbar unter:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Build & Deployment

**Projekt bauen:**

```bash
npm run build
```

**Production Build testen:**

```bash
npm run preview
```

## 📁 Projektstruktur

```
pubquiz/
├── backend/                # Backend (Node.js + Express)
│   ├── routes/            # API-Routen
│   │   ├── quiz.ts        # Quiz-Endpunkte
│   │   └── team.ts        # Team-Endpunkte
│   ├── types/             # Backend-Types
│   ├── utils/             # Utilities (Storage, Validation)
│   └── server.ts          # Express Server
│
├── src/                   # Frontend (React + TypeScript)
│   ├── components/        # Wiederverwendbare Komponenten
│   │   ├── Button.tsx     # Button-Komponente
│   │   ├── Card.tsx       # Card-Container
│   │   ├── Input.tsx      # Input-Feld
│   │   ├── QuestionCard.tsx    # Frage mit Optionen
│   │   └── QuestionForm.tsx    # Frage-Editor
│   │
│   ├── pages/             # Seiten/Views
│   │   ├── Home.tsx       # Startseite
│   │   ├── CreateQuiz.tsx # Quiz erstellen
│   │   ├── QuizMaster.tsx # Quiz Master Ansicht
│   │   ├── TeamJoin.tsx   # Team Beitritt
│   │   ├── TeamQuiz.tsx   # Team Quiz spielen
│   │   └── Results.tsx    # Ergebnisse
│   │
│   ├── services/          # API-Calls
│   │   └── api.ts         # Zentrale API-Funktionen
│   │
│   ├── utils/             # Utilities
│   │   ├── csv.ts         # CSV-Import/Export
│   │   └── storage.ts     # LocalStorage Helper
│   │
│   ├── types.ts           # TypeScript-Typen
│   └── App.tsx            # Haupt-App mit Routing
│
├── data/                  # Filesystem-Datenbank
│   ├── quizzes/          # Quiz JSON-Dateien
│   └── teams/            # Team JSON-Dateien
│
└── public/               # Statische Dateien
```

## 🎮 Verwendung

### 1. Quiz Master Flow

1. **Startseite öffnen** → "Quiz erstellen" klicken
2. **Quiz-Titel eingeben** (z.B. "Pub Quiz 2026")
3. **Fragen hinzufügen:**
   - Manuell: Frage + 4 Optionen + korrekte Antwort markieren
   - CSV-Import: Template herunterladen, ausfüllen, hochladen
4. **Quiz erstellen** → Code wird generiert (z.B. `ABC123`)
5. **Code mit Teams teilen**
6. **"Quiz starten"** klicken
7. **Fragen durchgehen** mit "Nächste" Button
8. **Nach letzter Frage:** "Quiz beenden" → Ergebnisse

### 2. Team Flow

1. **Startseite öffnen** → "Quiz beitreten" klicken
2. **Quiz-Code eingeben** (z.B. `ABC123`)
3. **Team-Namen eingeben** (z.B. "Die Experten")
4. **"Quiz beitreten"** → Warten auf Start
5. **Fragen beantworten:**
   - Option auswählen
   - "Antwort speichern" klicken
6. **Warten auf nächste Frage** (Polling alle 5s)
7. **Nach letzter Frage:** Automatisch zu Ergebnissen

### 3. CSV-Format für Fragen

```csv
question,correct
Welche Farbe hat der Himmel?,Blau
Was ist 2+2?,4
```

**Format:** Frage und korrekte Antwort als Text (case-insensitive Vergleich)

## 🔧 Development

### Code formatieren

```bash
npm run format
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Tests

```bash
npm test                    # Alle Tests
npm test -- --ui            # Vitest UI
npm test -- --coverage      # Mit Coverage
```

## 📡 API-Endpunkte

### Quiz

- `POST /api/quiz/create` - Quiz erstellen
- `GET /api/quiz/:code` - Quiz laden (ohne korrekte Antworten)
- `GET /api/quiz/:code/master` - Quiz Master Ansicht (mit Antworten)
- `GET /api/quiz/:code/results` - Ergebnisse mit Rangliste
- `PATCH /api/quiz/:code/status` - Quiz-Status ändern

### Team

- `POST /api/team/join` - Team beitreten
- `POST /api/team/:teamId/answer` - Antwort abgeben
- `GET /api/team/:teamId` - Team-Informationen

## 🎨 Design-Entscheidungen

- **Mobile-First:** Responsive Design für alle Bildschirmgrößen
- **Plain CSS:** Keine CSS-in-JS, einfache CSS-Dateien
- **Polling statt WebSockets:** Einfacher, keine Echtzeit-Komplexität
- **Filesystem-Datenbank:** JSON-Dateien statt SQL/NoSQL
- **LocalStorage für Teams:** Session-Persistenz im Browser
- **Manuelle Quiz-Steuerung:** Quiz Master steuert Ablauf

## 🚀 Deployment

Das Projekt ist für fly.io vorbereitet. Deployment-Anleitung folgt.

## 📝 Lizenz

ISC
