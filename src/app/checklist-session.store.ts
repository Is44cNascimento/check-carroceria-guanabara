import { Injectable } from '@angular/core';

export type ChecklistSession = {
  sessionId: number;
  operatorName: string;
  carPrefix: string;
};

@Injectable({ providedIn: 'root' })
export class ChecklistSessionStore {
  private currentSession: ChecklistSession | null = null;

  setSession(session: ChecklistSession): void {
    this.currentSession = session;
  }

  getSession(): ChecklistSession | null {
    return this.currentSession;
  }

  clearSession(): void {
    this.currentSession = null;
  }
}
