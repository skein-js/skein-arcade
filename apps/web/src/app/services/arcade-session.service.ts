import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Spec } from '@ng-json-render/core';
import { DifficultyLevel } from '@skein-alcade/game-engine';
import { firstValueFrom } from 'rxjs';

export interface GameStartResponse {
  gameId: 'tic-tac-toe' | 'connect-four';
  difficulty: DifficultyLevel;
  boardState: any;
  result: any;
  renderSpec: Spec;
}

export interface GameTurnResponse {
  gameId: 'tic-tac-toe' | 'connect-four';
  difficulty: DifficultyLevel;
  boardState: any;
  aiMove?: any;
  banter: string;
  thought?: string;
  rawThought?: string;
  mood: string;
  result: any;
  renderSpec: Spec;
}

@Injectable({
  providedIn: 'root',
})
export class ArcadeSessionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/arcade';

  readonly selectedGame = signal<'tic-tac-toe' | 'connect-four'>('tic-tac-toe');
  readonly selectedDifficulty = signal<DifficultyLevel>('smart');
  readonly currentSpec = signal<Spec | null>(null);
  readonly currentBoardState = signal<any>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  async startNewGame(
    gameId: 'tic-tac-toe' | 'connect-four' = this.selectedGame(),
    difficulty: DifficultyLevel = this.selectedDifficulty()
  ) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.selectedGame.set(gameId);
    this.selectedDifficulty.set(difficulty);

    try {
      const res = await firstValueFrom(
        this.http.post<GameStartResponse>(`${this.apiUrl}/start`, {
          gameId,
          difficulty,
        })
      );

      this.currentBoardState.set(res.boardState);
      this.currentSpec.set(res.renderSpec);
    } catch (err: any) {
      console.error('Failed to start arcade session:', err);
      this.errorMessage.set(
        'Unable to connect to the Arcade Backend Server. Make sure the server is running on port 3000.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async playTurn(playerMove: any) {
    const boardState = this.currentBoardState();
    if (!boardState) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const res = await firstValueFrom(
        this.http.post<GameTurnResponse>(`${this.apiUrl}/turn`, {
          gameId: this.selectedGame(),
          difficulty: this.selectedDifficulty(),
          boardState,
          playerMove,
        })
      );

      this.currentBoardState.set(res.boardState);
      this.currentSpec.set(res.renderSpec);
    } catch (err: any) {
      console.error('Failed to process turn:', err);
      const msg =
        err.error?.error ||
        err.message ||
        'Move rejected or error communicating with Gemini agent.';
      this.errorMessage.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }
}
