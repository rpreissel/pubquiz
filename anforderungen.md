# Pub Quiz Web App (Vereinfacht) - Anforderungsdokument

## 1. Vision & Ãœbersicht

Eine einfache Pub-Quiz Web-App. Quiz Master stellt Fragen nacheinander, Teams beantworten sie. Nach allen Fragen werden Ergebnisse berechnet. Kein Echtzeit-Sync, keine Big-Screen-Anzeige - alles lÃ¤uft auf EinzelgerÃ¤ten.

**Zielgruppe:** Kleine Quiz-Events, Team-Events, Informal Quizzing

---

## 2. Benutzerrollen

### Quiz Master (Host)
- Erstellt Quiz mit Fragen
- Stellt Fragen nacheinander (manuell weiterblÃ¤ttern)
- Sieht Endergebnisse am Schluss

### Team (Spieler)
- Treten Quiz bei (via Code oder direkt)
- Beantworten Fragen der Reihe nach
- Sehen finale Ranking nach letzter Frage

---

## 3. Hauptfunktionen

### 3.1 Quiz Setup
- **Quiz erstellen:** Quiz Master gibt Titel ein
- **Fragen hinzufÃ¼gen:** Manuelle Eingabe von Frage + 4 Antwortoptionen + korrekte Antwort
- **Oder Import:** CSV-Upload mit Fragen (Spalten: question, optionA, optionB, optionC, optionD, correct)
- **Speichern & Aktivieren:** Quiz wird mit eindeutigem Code aktiviert (z.B. `QUIZ123`)

### 3.2 Team-Beitritt
- Team Ã¶ffnet App
- Gibt Quiz-Code ein
- Gibt Team-Namen ein
- "Beitreten" â†’ Wartet auf Start

### 3.3 Quiz durchfÃ¼hren
1. Quiz Master klickt "Quiz starten"
2. **Frage 1 wird angezeigt** - Teams sehen sie auf ihren GerÃ¤ten
3. Teams wÃ¤hlen eine der 4 Optionen
4. Teams klicken "Weiter" oder "Antwort speichern"
5. Quiz Master klickt "NÃ¤chste Frage"
6. **Frage 2** wird angezeigt (Teams kÃ¶nnen alte Antwort nicht mehr Ã¤ndern)
7. Wiederholen bis letzte Frage
8. Nach letzter Frage: Finale Rangliste anzeigen

---

## 4. User Flows (Simpel)

### Flow 1: Quiz erstellen
```
1. Quiz Master klickt "Neues Quiz"
2. Titel eingeben (z.B. "Pub Quiz 2026")
3. Fragen hinzufÃ¼gen:
   - Frage eingeben
   - 4 Antwortoptionen eingeben
   - Markieren welche Option korrekt ist
   - "Frage hinzufÃ¼gen" wiederholen
4. "Quiz speichern" â†’ Code wird angezeigt (z.B. QUIZ123)
5. Quiz Master teilt Code mit Teams
```

### Flow 2: Team beitreten
```
1. Team Ã¶ffnet die Web-App
2. Klickt "Quiz beitreten"
3. Gibt Quiz-Code ein (z.B. QUIZ123)
4. Gibt Team-Namen ein (z.B. "Die Experten")
5. Klickt "Beitreten"
6. Sieht "Warte auf Quiz-Start..."
```

### Flow 3: Quiz spielen
```
Quiz Master Seite:
  1. Sieht alle beigetretenen Teams
  2. Klickt "Quiz starten"
  
Team Seite (synchron, aber nicht live):
  1. Sieht Frage 1: "Welche Farbe ist der Himmel?"
  2. Sieht 4 Buttons: A) Blau  B) Rot  C) GrÃ¼n  D) Gelb
  3. Klickt "A) Blau"
  4. Button wird grÃ¼n, "Speichern" wird klickbar
  5. Klickt "Speichern" (oder Auto-Save nach 5s)
  
Quiz Master Seite:
  6. Sieht "Team 1: beantwortet, Team 2: beantwortet, Team 3: noch offen"
  7. Klickt "NÃ¤chste Frage" â†’ Gibt allen Teams Signal
  
Team Seite:
  8. Frage 1 ist jetzt "gesperrt" (Antwort kann nicht mehr geÃ¤ndert werden)
  9. Sieht Frage 2
  10. Antwortet wieder
  

---

## 5. Technische Anforderungen (Minimal)

### Frontend
- **Framework:** React
- **Responsive:** Mobile + Desktop
- **Keine Echtzeit-Dependencies:** Normale HTTP-Requests, kein WebSocket
- **Local State:** Antworten werden lokal gespeichert, bei Quiz-End hochgeladen

### Backend
- **Framework:** Node.js (Express) 
- **Datenbank:** filesystem
- **Endpoints (sehr simpel):**
  - `POST /quiz/create` - Quiz speichern
  - `GET /quiz/{code}` - Quiz-Daten laden
  - `POST /team/join` - Team beitreten
  - `POST /team/{teamId}/answer` - Antwort speichern
  - `GET /quiz/{code}/results` - Endergebnisse berechnen

### Deployment
- **Hosting:** fly.io
- **Datenbank:** files

---

## 6. Datenmodelle (Vereinfacht)

### Quiz
```json
{
  "code": "QUIZ123",
  "title": "Pub Quiz 2026",
  "questions": [
    {
      "id": 1,
      "text": "Welche Farbe ist der Himmel?",
      "options": ["Blau", "Rot", "GrÃ¼n", "Gelb"],
      "correct": 0
    }
  ],
  "status": "draft|active|finished",
  "created_at": "2026-01-22"
}
```

### Team
```json
{
  "id": "abc123",
  "quiz_code": "QUIZ123",
  "name": "Die Experten",
  "answers": [
    {
      "question_id": 1,
      "selected_option": 0,
      "is_correct": true
    }
  ],
  "total_score": 5,
  "joined_at": "2026-01-22T14:50:00"
}
```

---

## 7. MVP Features (Nur das NÃ¶tigste)

- âœ… Quiz erstellen (manuell oder CSV)
- âœ… Teams beitreten mit Code
- âœ… Nacheinander Fragen beantworten
- âœ… Antwort speichern pro Frage
- âœ… Einfaches UI (keine Animations, kein fancy Stuff)

---

## 8. Nicht enthalten (KomplexitÃ¤t sparen)

- âŒ Echtzeit-Updates (Polling oder statische Seite)
- âŒ Big Screen / Beamer-Ansicht
- âŒ Zeitlimit pro Frage
- âŒ Schwierigkeitsgrade
- âŒ Kategorien
- âŒ Admin-Login (nur Ã¼ber direkten Code-Link)
- âŒ Push-Notifications
- âŒ Mobile Native Apps

---



## 10. Success Criteria

- [ ] Quiz kann in < 2 Minuten erstellt werden
- [ ] Team braucht nur Code eingeben (kein Login)
- [ ] Antworten werden korrekt gespeichert
- [ ] Rangliste wird richtig berechnet
- [ ] UI lÃ¤dt schnell (< 1s)
- [ ] Funktioniert auf Mobile + Desktop