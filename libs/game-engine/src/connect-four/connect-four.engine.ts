import { DifficultyLevel, GameEngine, GameResult, PlayerId } from '../common/game-engine.interface';

export const CONNECT_FOUR_ROWS = 6;
export const CONNECT_FOUR_COLS = 7;

export interface ConnectFourState {
  board: (PlayerId | null)[][]; // 6 rows x 7 cols (0=top, 5=bottom)
  currentTurn: PlayerId;
  moveCount: number;
}

export interface ConnectFourMove {
  col: number;
}

export interface ConnectFourTacticalAnalysis {
  landingRows: Record<number, number>;
  immediateWins: number[];
  opponentWinningThreats: number[];
  suicideMoves: number[];
  safeMoves: number[];
  centerAvailable: boolean;
}

export class ConnectFourEngine implements GameEngine<ConnectFourState, ConnectFourMove> {
  readonly id = 'connect-four';
  readonly name = 'Connect Four';
  readonly description = 'Vertical grid game. Drop discs into 7 columns to connect 4 in a row before the AI!';

  getInitialState(): ConnectFourState {
    const board: (PlayerId | null)[][] = Array.from({ length: CONNECT_FOUR_ROWS }, () =>
      Array.from({ length: CONNECT_FOUR_COLS }, () => null)
    );
    return {
      board,
      currentTurn: 'player',
      moveCount: 0,
    };
  }

  getValidMoves(state: ConnectFourState): ConnectFourMove[] {
    const valid: ConnectFourMove[] = [];
    for (let c = 0; c < CONNECT_FOUR_COLS; c++) {
      if (state.board[0][c] === null) {
        valid.push({ col: c });
      }
    }
    return valid;
  }

  isValidMove(state: ConnectFourState, move: ConnectFourMove, player: PlayerId): boolean {
    if (state.currentTurn !== player) {
      return false;
    }
    if (move.col < 0 || move.col >= CONNECT_FOUR_COLS) {
      return false;
    }
    return state.board[0][move.col] === null;
  }

  applyMove(state: ConnectFourState, move: ConnectFourMove, player: PlayerId): ConnectFourState {
    if (!this.isValidMove(state, move, player)) {
      throw new Error(`Invalid move: column ${move.col} by player ${player}`);
    }

    // Find the lowest empty row for this column
    let targetRow = -1;
    for (let r = CONNECT_FOUR_ROWS - 1; r >= 0; r--) {
      if (state.board[r][move.col] === null) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      throw new Error(`Column ${move.col} is completely full`);
    }

    const newBoard = state.board.map((row, r) =>
      row.map((cell, c) => (r === targetRow && c === move.col ? player : cell))
    );

    return {
      board: newBoard,
      currentTurn: player === 'player' ? 'ai' : 'player',
      moveCount: state.moveCount + 1,
    };
  }

  checkResult(state: ConnectFourState): GameResult {
    const b = state.board;

    // 1. Horizontal
    for (let r = 0; r < CONNECT_FOUR_ROWS; r++) {
      for (let c = 0; c <= CONNECT_FOUR_COLS - 4; c++) {
        const p = b[r][c];
        if (p && p === b[r][c + 1] && p === b[r][c + 2] && p === b[r][c + 3]) {
          return {
            isOver: true,
            winner: p,
            winningLine: [
              [r, c],
              [r, c + 1],
              [r, c + 2],
              [r, c + 3],
            ],
          };
        }
      }
    }

    // 2. Vertical
    for (let r = 0; r <= CONNECT_FOUR_ROWS - 4; r++) {
      for (let c = 0; c < CONNECT_FOUR_COLS; c++) {
        const p = b[r][c];
        if (p && p === b[r + 1][c] && p === b[r + 2][c] && p === b[r + 3][c]) {
          return {
            isOver: true,
            winner: p,
            winningLine: [
              [r, c],
              [r + 1, c],
              [r + 2, c],
              [r + 3, c],
            ],
          };
        }
      }
    }

    // 3. Diagonal down-right (\)
    for (let r = 0; r <= CONNECT_FOUR_ROWS - 4; r++) {
      for (let c = 0; c <= CONNECT_FOUR_COLS - 4; c++) {
        const p = b[r][c];
        if (p && p === b[r + 1][c + 1] && p === b[r + 2][c + 2] && p === b[r + 3][c + 3]) {
          return {
            isOver: true,
            winner: p,
            winningLine: [
              [r, c],
              [r + 1, c + 1],
              [r + 2, c + 2],
              [r + 3, c + 3],
            ],
          };
        }
      }
    }

    // 4. Diagonal up-right (/)
    for (let r = 3; r < CONNECT_FOUR_ROWS; r++) {
      for (let c = 0; c <= CONNECT_FOUR_COLS - 4; c++) {
        const p = b[r][c];
        if (p && p === b[r - 1][c + 1] && p === b[r - 2][c + 2] && p === b[r - 3][c + 3]) {
          return {
            isOver: true,
            winner: p,
            winningLine: [
              [r, c],
              [r - 1, c + 1],
              [r - 2, c + 2],
              [r - 3, c + 3],
            ],
          };
        }
      }
    }

    // Check draw (top row full)
    const isFull = b[0].every((cell) => cell !== null);
    if (isFull) {
      return {
        isOver: true,
        winner: 'draw',
      };
    }

    return { isOver: false };
  }

  getTacticalAnalysis(state: ConnectFourState, player: PlayerId = state.currentTurn): ConnectFourTacticalAnalysis {
    const validMoves = this.getValidMoves(state);
    const opponent: PlayerId = player === 'player' ? 'ai' : 'player';
    const playerState: ConnectFourState = { ...state, currentTurn: player };
    const opponentState: ConnectFourState = { ...state, currentTurn: opponent };

    const landingRows: Record<number, number> = {};
    for (const move of validMoves) {
      for (let r = CONNECT_FOUR_ROWS - 1; r >= 0; r--) {
        if (state.board[r][move.col] === null) {
          landingRows[move.col] = r;
          break;
        }
      }
    }

    const immediateWins: number[] = [];
    for (const move of validMoves) {
      const nextState = this.applyMove(playerState, move, player);
      if (this.checkResult(nextState).winner === player) {
        immediateWins.push(move.col);
      }
    }

    const opponentWinningThreats: number[] = [];
    for (const move of validMoves) {
      const nextState = this.applyMove(opponentState, move, opponent);
      if (this.checkResult(nextState).winner === opponent) {
        opponentWinningThreats.push(move.col);
      }
    }

    const suicideMoves: number[] = [];
    for (const move of validMoves) {
      if (immediateWins.includes(move.col)) continue;

      const nextState = this.applyMove(playerState, move, player);
      const opponentMoves = this.getValidMoves(nextState);
      const givesOpponentWin = opponentMoves.some((oppMove) => {
        const oppNext = this.applyMove(nextState, oppMove, opponent);
        return this.checkResult(oppNext).winner === opponent;
      });

      if (givesOpponentWin) {
        suicideMoves.push(move.col);
      }
    }

    const safeMoves = validMoves
      .map((m) => m.col)
      .filter((col) => !suicideMoves.includes(col));

    return {
      landingRows,
      immediateWins,
      opponentWinningThreats,
      suicideMoves,
      safeMoves: safeMoves.length > 0 ? safeMoves : validMoves.map((m) => m.col),
      centerAvailable: landingRows[3] !== undefined,
    };
  }

  formatStateForPrompt(state: ConnectFourState): string {
    const symbolMap = { player: 'X', ai: 'O', null: '.' };
    const rows = state.board.map((row, r) => {
      const formatted = row.map((cell) => (cell ? symbolMap[cell] : '.')).join('  ');
      return `Row ${r} (${r === 0 ? 'top' : r === 5 ? 'floor' : '   '}):  | ${formatted} |`;
    });

    const validMoves = this.getValidMoves(state);
    const landingCoordLines = validMoves.map((m) => {
      let landingRow = -1;
      for (let r = CONNECT_FOUR_ROWS - 1; r >= 0; r--) {
        if (state.board[r][m.col] === null) {
          landingRow = r;
          break;
        }
      }
      return `  - Column ${m.col}: disc will drop into [Row ${landingRow}, Col ${m.col}]${m.col === 3 ? ' (Center Column)' : ''}`;
    }).join('\n');

    return `Connect Four Board (6 rows x 7 cols | Human=X, AI=O, Empty=.) :
Columns:      0   1   2   3   4   5   6
-----------------------------------------
${rows.join('\n')}
-----------------------------------------
Current Turn: ${state.currentTurn === 'player' ? 'Human (X)' : 'AI (O)'}

Gravity Mechanics (Where pieces will land if played now):
${landingCoordLines}

Board Geometry Reference:
- Horizontal win: 4 of same symbol in row r, e.g. [r, c], [r, c+1], [r, c+2], [r, c+3]
- Vertical win: 4 of same symbol in column c, e.g. [r, c], [r+1, c], [r+2, c], [r+3, c]
- Diagonal down-right (\\): [r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]
- Diagonal up-right (/): [r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]`;
  }

  getHeuristicMove(state: ConnectFourState, player: PlayerId, difficulty: DifficultyLevel): ConnectFourMove {
    const validMoves = this.getValidMoves(state);
    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }

    const analysis = this.getTacticalAnalysis(state, player);

    // 1. Instant Win available
    if (analysis.immediateWins.length > 0) {
      return { col: analysis.immediateWins[0] };
    }

    // 2. Immediate Block required
    if (analysis.opponentWinningThreats.length > 0) {
      return { col: analysis.opponentWinningThreats[0] };
    }

    if (difficulty === 'casual') {
      const candidates = analysis.safeMoves.length > 0 ? analysis.safeMoves : validMoves.map((m) => m.col);
      return { col: candidates[Math.floor(Math.random() * candidates.length)] };
    }

    if (difficulty === 'smart') {
      const candidates = analysis.safeMoves.length > 0 ? analysis.safeMoves : validMoves.map((m) => m.col);
      const columnPreference = [3, 2, 4, 1, 5, 0, 6];
      for (const col of columnPreference) {
        if (candidates.includes(col)) {
          return { col };
        }
      }
      return { col: candidates[0] };
    }

    // Grandmaster: Minimax with Alpha-Beta Pruning (Depth 4)
    const opponent: PlayerId = player === 'player' ? 'ai' : 'player';
    const minimaxResult = this.minimax(state, 4, -Infinity, Infinity, true, player, opponent);
    if (minimaxResult.col !== undefined && validMoves.some((m) => m.col === minimaxResult.col)) {
      return { col: minimaxResult.col };
    }

    // Fallback to center preference from safe moves
    const candidates = analysis.safeMoves.length > 0 ? analysis.safeMoves : validMoves.map((m) => m.col);
    const columnPreference = [3, 2, 4, 1, 5, 0, 6];
    for (const col of columnPreference) {
      if (candidates.includes(col)) {
        return { col };
      }
    }
    return { col: candidates[0] };
  }

  private evaluateBoard(state: ConnectFourState, aiPlayer: PlayerId, humanPlayer: PlayerId): number {
    const b = state.board;
    let score = 0;

    // Center column preference (Column 3 is pivotal)
    for (let r = 0; r < CONNECT_FOUR_ROWS; r++) {
      if (b[r][3] === aiPlayer) score += 6;
      else if (b[r][3] === humanPlayer) score -= 6;

      if (b[r][2] === aiPlayer || b[r][4] === aiPlayer) score += 3;
      else if (b[r][2] === humanPlayer || b[r][4] === humanPlayer) score -= 3;
    }

    const evaluateWindow = (cells: (PlayerId | null)[]) => {
      let aiCount = 0;
      let humanCount = 0;
      let emptyCount = 0;

      for (const cell of cells) {
        if (cell === aiPlayer) aiCount++;
        else if (cell === humanPlayer) humanCount++;
        else emptyCount++;
      }

      if (aiCount === 4) return 100000;
      if (humanCount === 4) return -100000;

      if (aiCount === 3 && emptyCount === 1) return 120;
      if (aiCount === 2 && emptyCount === 2) return 15;

      if (humanCount === 3 && emptyCount === 1) return -150;
      if (humanCount === 2 && emptyCount === 2) return -20;

      return 0;
    };

    // 1. Horizontal windows
    for (let r = 0; r < CONNECT_FOUR_ROWS; r++) {
      for (let c = 0; c <= CONNECT_FOUR_COLS - 4; c++) {
        score += evaluateWindow([b[r][c], b[r][c + 1], b[r][c + 2], b[r][c + 3]]);
      }
    }

    // 2. Vertical windows
    for (let r = 0; r <= CONNECT_FOUR_ROWS - 4; r++) {
      for (let c = 0; c < CONNECT_FOUR_COLS; c++) {
        score += evaluateWindow([b[r][c], b[r + 1][c], b[r + 2][c], b[r + 3][c]]);
      }
    }

    // 3. Diagonal down-right (\)
    for (let r = 0; r <= CONNECT_FOUR_ROWS - 4; r++) {
      for (let c = 0; c <= CONNECT_FOUR_COLS - 4; c++) {
        score += evaluateWindow([b[r][c], b[r + 1][c + 1], b[r + 2][c + 2], b[r + 3][c + 3]]);
      }
    }

    // 4. Diagonal up-right (/)
    for (let r = 3; r < CONNECT_FOUR_ROWS; r++) {
      for (let c = 0; c <= CONNECT_FOUR_COLS - 4; c++) {
        score += evaluateWindow([b[r][c], b[r - 1][c + 1], b[r - 2][c + 2], b[r - 3][c + 3]]);
      }
    }

    return score;
  }

  private minimax(
    state: ConnectFourState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiPlayer: PlayerId,
    humanPlayer: PlayerId
  ): { score: number; col?: number } {
    const result = this.checkResult(state);
    if (result.isOver) {
      if (result.winner === aiPlayer) return { score: 100000 - (4 - depth) * 100 };
      if (result.winner === humanPlayer) return { score: -100000 + (4 - depth) * 100 };
      return { score: 0 };
    }

    if (depth === 0) {
      return { score: this.evaluateBoard(state, aiPlayer, humanPlayer) };
    }

    const validMoves = this.getValidMoves(state);
    if (validMoves.length === 0) {
      return { score: 0 };
    }

    // Move ordering: prioritize central columns for maximum alpha-beta pruning
    const moveOrder = [3, 2, 4, 1, 5, 0, 6];
    const orderedMoves = [...validMoves].sort((a, b) => {
      return moveOrder.indexOf(a.col) - moveOrder.indexOf(b.col);
    });

    if (isMaximizing) {
      let maxScore = -Infinity;
      let bestCol = orderedMoves[0].col;

      for (const move of orderedMoves) {
        const nextState = this.applyMove(state, move, aiPlayer);
        const evalResult = this.minimax(nextState, depth - 1, alpha, beta, false, aiPlayer, humanPlayer);
        if (evalResult.score > maxScore) {
          maxScore = evalResult.score;
          bestCol = move.col;
        }
        alpha = Math.max(alpha, evalResult.score);
        if (beta <= alpha) {
          break; // Beta cut-off
        }
      }
      return { score: maxScore, col: bestCol };
    } else {
      let minScore = Infinity;
      let bestCol = orderedMoves[0].col;

      for (const move of orderedMoves) {
        const nextState = this.applyMove(state, move, humanPlayer);
        const evalResult = this.minimax(nextState, depth - 1, alpha, beta, true, aiPlayer, humanPlayer);
        if (evalResult.score < minScore) {
          minScore = evalResult.score;
          bestCol = move.col;
        }
        beta = Math.min(beta, evalResult.score);
        if (beta <= alpha) {
          break; // Alpha cut-off
        }
      }
      return { score: minScore, col: bestCol };
    }
  }
}
