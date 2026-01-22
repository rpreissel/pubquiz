// LocalStorage utilities for session management

const TEAM_SESSION_KEY = 'pubquiz_team_session';
const MASTER_SESSION_KEY = 'pubquiz_master_session';

export interface TeamSession {
  sessionToken: string;
  teamName: string;
}

export interface MasterSession {
  masterToken: string;
  quizCode: string;
  quizTitle: string;
}

// Team session management
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

// Master session management
export function saveMasterSession(session: MasterSession): void {
  try {
    localStorage.setItem(MASTER_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save master session:', error);
  }
}

export function loadMasterSession(): MasterSession | null {
  try {
    const data = localStorage.getItem(MASTER_SESSION_KEY);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as MasterSession;
  } catch (error) {
    console.error('Failed to load master session:', error);
    return null;
  }
}

export function clearMasterSession(): void {
  try {
    localStorage.removeItem(MASTER_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear master session:', error);
  }
}
