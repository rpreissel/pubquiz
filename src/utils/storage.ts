// LocalStorage utilities for team session management

const TEAM_SESSION_KEY = 'pubquiz_team_session';

export interface TeamSession {
  teamId: string;
  quizCode: string;
  teamName: string;
}

export function saveTeamSession(session: TeamSession): void {
  try {
    localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save team session:', error);
  }
}

export function loadTeamSession(): TeamSession | null {
  try {
    const data = localStorage.getItem(TEAM_SESSION_KEY);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as TeamSession;
  } catch (error) {
    console.error('Failed to load team session:', error);
    return null;
  }
}

export function clearTeamSession(): void {
  try {
    localStorage.removeItem(TEAM_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear team session:', error);
  }
}
