# Migration Guide: Express → Kotlin/Ktor

## Übersicht

Diese Anleitung beschreibt, wie du vom Express.js Backend zum Kotlin/Ktor Backend wechselst.

## Wichtig: Datenkompatibilität

✅ **Die JSON-Daten sind zu 100% kompatibel!**

Beide Backends verwenden das gleiche `data/` Verzeichnis:

- `data/quizzes/{CODE}.json`
- `data/teams/{QUIZ_CODE}/{TEAM_ID}.json`

Du kannst jederzeit zwischen Express und Kotlin wechseln, ohne Daten zu verlieren.

---

## Quick Start (beide Backends testen)

### Option 1: Express Backend (bisherig)

```bash
npm run start
# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### Option 2: Kotlin Backend (neu)

```bash
npm run start:ktor
# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

---

## Schritt-für-Schritt Migration

### 1. Prerequisites

Stelle sicher, dass Java installiert ist:

```bash
java -version
# Java 17 oder höher erforderlich
```

Falls nicht installiert (macOS):

```bash
brew install openjdk@21
```

### 2. Kotlin Backend testen

```bash
# Backend starten
cd backend-ktor
./gradlew run

# In anderem Terminal: Frontend starten
npm run dev
```

Öffne http://localhost:5173 und teste die App.

### 3. Tests ausführen

```bash
# Kotlin Backend Tests
npm run test:ktor

# Oder direkt:
cd backend-ktor && ./gradlew test
```

### 4. Build erstellen

```bash
# Kotlin Backend bauen
npm run build:ktor

# JAR liegt in: backend-ktor/build/libs/
```

---

## API-Kompatibilität

Alle Endpunkte sind **identisch**:

| Endpoint                             | Express | Kotlin/Ktor | Status    |
| ------------------------------------ | ------- | ----------- | --------- |
| POST /api/quiz/create                | ✅      | ✅          | Identisch |
| GET /api/quiz/:code                  | ✅      | ✅          | Identisch |
| POST /api/team/join                  | ✅      | ✅          | Identisch |
| POST /api/team/session/:token/answer | ✅      | ✅          | Identisch |
| ... (alle anderen)                   | ✅      | ✅          | Identisch |

### Request/Response Format

```json
// POST /api/quiz/create
// Request (identisch)
{
  "title": "General Knowledge",
  "questions": [
    {"id": 0, "text": "What is 2+2?", "correct": "4"}
  ]
}

// Response (identisch)
{
  "quiz": {
    "code": "ABC123",
    "title": "General Knowledge",
    "questions": [...],
    "status": "draft",
    "current_question_index": 0,
    "created_at": "2026-01-23T...",
    "master_token": "uuid-..."
  }
}
```

---

## Fehlerbehebung

### Port bereits belegt

```bash
# Stoppe Express Backend falls läuft
pkill -f "tsx backend/server.ts"

# Oder finde Prozess auf Port 3000
lsof -ti:3000 | xargs kill -9
```

### Gradle Build Fehler

```bash
cd backend-ktor
./gradlew clean
./gradlew build --refresh-dependencies
```

### Java Version Fehler

```bash
# Prüfe Java Version
java -version

# Setze JAVA_HOME (macOS)
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

---

## Performance Vergleich

| Metrik     | Express      | Kotlin/Ktor       |
| ---------- | ------------ | ----------------- |
| Startup    | ~1.5s        | ~0.2s             |
| Memory     | ~50MB        | ~150MB            |
| Throughput | Gut          | Sehr gut          |
| Hot Reload | ✅ (nodemon) | ✅ (--continuous) |

---

## Production Deployment

### Fly.io mit Kotlin Backend

1. **Dockerfile aktualisieren:**

   ```bash
   cp Dockerfile.kotlin Dockerfile
   ```

2. **fly.toml anpassen** (optional):

   ```toml
   [build]
     dockerfile = "Dockerfile.kotlin"
   ```

3. **Deployen:**
   ```bash
   fly deploy
   ```

### Docker lokal testen

```bash
# Build
docker build -f Dockerfile.kotlin -t pubquiz-kotlin .

# Run
docker run -p 3000:3000 pubquiz-kotlin

# Test
curl http://localhost:3000/api/health
```

---

## Rollback zu Express

Falls du zurück zum Express-Backend möchtest:

```bash
# Stoppe Kotlin Backend
pkill -f "gradle"

# Starte Express Backend
npm run start
```

Alle Daten bleiben erhalten!

---

## Weitere Schritte

Nach erfolgreicher Migration:

1. ✅ Kotlin Backend in Produktion deployen
2. ⚠️ Express Backend als Fallback behalten (falls gewünscht)
3. 🗑️ Express Backend entfernen (optional):
   ```bash
   rm -rf backend/
   npm uninstall express cors @types/express @types/cors tsx nodemon
   ```

---

## Support

Bei Fragen oder Problemen:

- Siehe `backend-ktor/README.md`
- Logs prüfen: `cd backend-ktor && ./gradlew run`
- Tests ausführen: `npm run test:ktor`
