export type PlayerId = 'player' | 'ai';

export interface GameResult {
  isOver: boolean;
  winner?: PlayerId | 'draw';
  winningLine?: number[][]; // Coordinates (e.g. [[r1, c1], [r2, c2], ...]) for visual highlight
  reason?: string;
}

export type DifficultyLevel = 'casual' | 'smart' | 'grandmaster';

export interface GameEngine<TState, TMove> {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  getInitialState(): TState;
  getValidMoves(state: TState): TMove[];
  isValidMove(state: TState, move: TMove, player: PlayerId): boolean;
  applyMove(state: TState, move: TMove, player: PlayerId): TState;
  checkResult(state: TState): GameResult;
  formatStateForPrompt(state: TState): string;
  getHeuristicMove?(state: TState, player: PlayerId, difficulty: DifficultyLevel): TMove;
}
