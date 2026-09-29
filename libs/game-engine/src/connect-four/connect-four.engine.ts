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

  formatStateForPrompt(state: ConnectFourState): string {
    const symbolMap = { player: 'X', ai: 'O', null: '.' };
    const rows = state.board.map((row, r) => {
      const formatted = row.map((cell) => (cell ? symbolMap[cell] : '.')).join(' ');
      return `Row ${r}: [ ${formatted} ]`;
    });

    const validCols = this.getValidMoves(state)
      .map((m) => m.col)
      .join(', ');

    return `Connect Four Board (6 rows x 7 cols, Human=X, AI=O, Empty=.) :
Columns: 0 1 2 3 4 5 6
${rows.join('\n')}
Current Turn: ${state.currentTurn === 'player' ? 'Human (X)' : 'AI (O)'}
Valid Drop Columns: [${validCols}]`;
  }

  getHeuristicMove(state: ConnectFourState, player: PlayerId, difficulty: DifficultyLevel): ConnectFourMove {
    const validMoves = this.getValidMoves(state);
    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }

    const opponent: PlayerId = player === 'player' ? 'ai' : 'player';

    if (difficulty === 'casual') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // Smart & Grandmaster:
    // 1. Can we win in 1 move?
    for (const move of validMoves) {
      const nextState = this.applyMove(state, move, player);
      if (this.checkResult(nextState).winner === player) {
        return move;
      }
    }

    // 2. Can opponent win in 1 move? Block them!
    for (const move of validMoves) {
      const hypothetical: ConnectFourState = {
        ...state,
        currentTurn: opponent,
      };
      const nextState = this.applyMove(hypothetical, move, opponent);
      if (this.checkResult(nextState).winner === opponent) {
        return move;
      }
    }

    // 3. Prefer center columns (3, then 2 & 4, then 1 & 5, then 0 & 6)
    const columnPreference = [3, 2, 4, 1, 5, 0, 6];
    for (const preferredCol of columnPreference) {
      const move = validMoves.find((m) => m.col === preferredCol);
      if (move) {
        // Ensure this move doesn't give opponent an immediate win on top
        const nextState = this.applyMove(state, move, player);
        const opponentMoves = this.getValidMoves(nextState);
        const givesOpponentWin = opponentMoves.some((oppMove) => {
          const oppNext = this.applyMove(nextState, oppMove, opponent);
          return this.checkResult(oppNext).winner === opponent;
        });

        if (!givesOpponentWin || validMoves.length === 1) {
          return move;
        }
      }
    }

    return validMoves[0];
  }
}
