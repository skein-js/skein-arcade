import { DifficultyLevel, GameEngine, GameResult, PlayerId } from '../common/game-engine.interface';

export interface TicTacToeState {
  board: (PlayerId | null)[][];
  currentTurn: PlayerId;
  moveCount: number;
}

export interface TicTacToeMove {
  row: number;
  col: number;
}

export class TicTacToeEngine implements GameEngine<TicTacToeState, TicTacToeMove> {
  readonly id = 'tic-tac-toe';
  readonly name = 'Tic-Tac-Toe';
  readonly description = 'Classic 3x3 grid game. Line up three marks in a row, column, or diagonal to win.';

  getInitialState(): TicTacToeState {
    return {
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      currentTurn: 'player',
      moveCount: 0,
    };
  }

  getValidMoves(state: TicTacToeState): TicTacToeMove[] {
    const moves: TicTacToeMove[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (state.board[r][c] === null) {
          moves.push({ row: r, col: c });
        }
      }
    }
    return moves;
  }

  isValidMove(state: TicTacToeState, move: TicTacToeMove, player: PlayerId): boolean {
    if (state.currentTurn !== player) {
      return false;
    }
    if (move.row < 0 || move.row >= 3 || move.col < 0 || move.col >= 3) {
      return false;
    }
    return state.board[move.row][move.col] === null;
  }

  applyMove(state: TicTacToeState, move: TicTacToeMove, player: PlayerId): TicTacToeState {
    if (!this.isValidMove(state, move, player)) {
      throw new Error(`Invalid move: [${move.row}, ${move.col}] by player ${player}`);
    }

    const newBoard = state.board.map((row, r) =>
      row.map((cell, c) => (r === move.row && c === move.col ? player : cell))
    );

    return {
      board: newBoard,
      currentTurn: player === 'player' ? 'ai' : 'player',
      moveCount: state.moveCount + 1,
    };
  }

  checkResult(state: TicTacToeState): GameResult {
    const b = state.board;

    // Check rows
    for (let r = 0; r < 3; r++) {
      if (b[r][0] && b[r][0] === b[r][1] && b[r][1] === b[r][2]) {
        return {
          isOver: true,
          winner: b[r][0] as PlayerId,
          winningLine: [
            [r, 0],
            [r, 1],
            [r, 2],
          ],
        };
      }
    }

    // Check columns
    for (let c = 0; c < 3; c++) {
      if (b[0][c] && b[0][c] === b[1][c] && b[1][c] === b[2][c]) {
        return {
          isOver: true,
          winner: b[0][c] as PlayerId,
          winningLine: [
            [0, c],
            [1, c],
            [2, c],
          ],
        };
      }
    }

    // Check main diagonal
    if (b[0][0] && b[0][0] === b[1][1] && b[1][1] === b[2][2]) {
      return {
        isOver: true,
        winner: b[0][0] as PlayerId,
        winningLine: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
      };
    }

    // Check anti-diagonal
    if (b[0][2] && b[0][2] === b[1][1] && b[1][1] === b[2][0]) {
      return {
        isOver: true,
        winner: b[0][2] as PlayerId,
        winningLine: [
          [0, 2],
          [1, 1],
          [2, 0],
        ],
      };
    }

    // Check draw
    const isFull = b.every((row) => row.every((cell) => cell !== null));
    if (isFull) {
      return {
        isOver: true,
        winner: 'draw',
      };
    }

    return { isOver: false };
  }

  formatStateForPrompt(state: TicTacToeState): string {
    const symbolMap = { player: 'X', ai: 'O' };
    const rows = state.board.map((row, r) => {
      const formatted = row.map((cell) => (cell ? symbolMap[cell] : '.')).join(' ');
      return `Row ${r}: ${formatted}`;
    });

    return `Board (X = human, O = you, . = empty):
Col:   0 1 2
${rows.join('\n')}`;
  }

  getHeuristicMove(state: TicTacToeState, player: PlayerId, difficulty: DifficultyLevel): TicTacToeMove {
    const validMoves = this.getValidMoves(state);
    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }

    const opponent: PlayerId = player === 'player' ? 'ai' : 'player';

    if (difficulty === 'casual') {
      const randomIndex = Math.floor(Math.random() * validMoves.length);
      return validMoves[randomIndex];
    }

    if (difficulty === 'smart') {
      for (const move of validMoves) {
        const nextState = this.applyMove(state, move, player);
        if (this.checkResult(nextState).winner === player) {
          return move;
        }
      }

      for (const move of validMoves) {
        const hypotheticalState: TicTacToeState = {
          ...state,
          currentTurn: opponent,
        };
        const nextState = this.applyMove(hypotheticalState, move, opponent);
        if (this.checkResult(nextState).winner === opponent) {
          return move;
        }
      }

      const center = validMoves.find((m) => m.row === 1 && m.col === 1);
      if (center) return center;

      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const move of validMoves) {
      const nextState = this.applyMove(state, move, player);
      const score = this.minimax(nextState, 0, false, player, opponent);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(
    state: TicTacToeState,
    depth: number,
    isMaximizing: boolean,
    aiPlayer: PlayerId,
    humanPlayer: PlayerId
  ): number {
    const result = this.checkResult(state);
    if (result.isOver) {
      if (result.winner === aiPlayer) return 10 - depth;
      if (result.winner === humanPlayer) return depth - 10;
      return 0;
    }

    const moves = this.getValidMoves(state);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const nextState = this.applyMove(state, move, aiPlayer);
        const evaluation = this.minimax(nextState, depth + 1, false, aiPlayer, humanPlayer);
        maxEval = Math.max(maxEval, evaluation);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const nextState = this.applyMove(state, move, humanPlayer);
        const evaluation = this.minimax(nextState, depth + 1, true, aiPlayer, humanPlayer);
        minEval = Math.min(minEval, evaluation);
      }
      return minEval;
    }
  }
}
