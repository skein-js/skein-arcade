import test from 'node:test';
import assert from 'node:assert/strict';
import { TicTacToeEngine } from './tic-tac-toe.engine';

test('TicTacToeEngine - starts with empty board and player turn', () => {
  const engine = new TicTacToeEngine();
  const state = engine.getInitialState();

  assert.equal(state.currentTurn, 'player');
  assert.equal(state.moveCount, 0);
  assert.equal(engine.getValidMoves(state).length, 9);
});

test('TicTacToeEngine - accepts valid move and alternates turn', () => {
  const engine = new TicTacToeEngine();
  let state = engine.getInitialState();

  state = engine.applyMove(state, { row: 0, col: 0 }, 'player');
  assert.equal(state.board[0][0], 'player');
  assert.equal(state.currentTurn, 'ai');
  assert.equal(state.moveCount, 1);
  assert.equal(engine.getValidMoves(state).length, 8);
});

test('TicTacToeEngine - rejects occupied cell move', () => {
  const engine = new TicTacToeEngine();
  let state = engine.getInitialState();
  state = engine.applyMove(state, { row: 1, col: 1 }, 'player');

  assert.equal(engine.isValidMove(state, { row: 1, col: 1 }, 'ai'), false);
  assert.throws(() => engine.applyMove(state, { row: 1, col: 1 }, 'ai'));
});

test('TicTacToeEngine - detects horizontal win for player', () => {
  const engine = new TicTacToeEngine();
  let state = engine.getInitialState();

  state = engine.applyMove(state, { row: 0, col: 0 }, 'player');
  state = engine.applyMove(state, { row: 1, col: 0 }, 'ai');
  state = engine.applyMove(state, { row: 0, col: 1 }, 'player');
  state = engine.applyMove(state, { row: 1, col: 1 }, 'ai');
  state = engine.applyMove(state, { row: 0, col: 2 }, 'player');

  const result = engine.checkResult(state);
  assert.equal(result.isOver, true);
  assert.equal(result.winner, 'player');
  assert.deepEqual(result.winningLine, [
    [0, 0],
    [0, 1],
    [0, 2],
  ]);
});

test('TicTacToeEngine - detects diagonal win for AI', () => {
  const engine = new TicTacToeEngine();
  let state = engine.getInitialState();

  state = engine.applyMove(state, { row: 0, col: 1 }, 'player');
  state = engine.applyMove(state, { row: 0, col: 0 }, 'ai');
  state = engine.applyMove(state, { row: 0, col: 2 }, 'player');
  state = engine.applyMove(state, { row: 1, col: 1 }, 'ai');
  state = engine.applyMove(state, { row: 1, col: 2 }, 'player');
  state = engine.applyMove(state, { row: 2, col: 2 }, 'ai');

  const result = engine.checkResult(state);
  assert.equal(result.isOver, true);
  assert.equal(result.winner, 'ai');
  assert.deepEqual(result.winningLine, [
    [0, 0],
    [1, 1],
    [2, 2],
  ]);
});

test('TicTacToeEngine - detects draw', () => {
  const engine = new TicTacToeEngine();
  let state = engine.getInitialState();
  /*
    X | O | X
    X | O | O
    O | X | X
  */
  state = engine.applyMove(state, { row: 0, col: 0 }, 'player'); // X
  state = engine.applyMove(state, { row: 0, col: 1 }, 'ai');     // O
  state = engine.applyMove(state, { row: 0, col: 2 }, 'player'); // X
  state = engine.applyMove(state, { row: 1, col: 1 }, 'ai');     // O
  state = engine.applyMove(state, { row: 1, col: 0 }, 'player'); // X
  state = engine.applyMove(state, { row: 1, col: 2 }, 'ai');     // O
  state = engine.applyMove(state, { row: 2, col: 1 }, 'player'); // X
  state = engine.applyMove(state, { row: 2, col: 0 }, 'ai');     // O
  state = engine.applyMove(state, { row: 2, col: 2 }, 'player'); // X

  const result = engine.checkResult(state);
  assert.equal(result.isOver, true);
  assert.equal(result.winner, 'draw');
});

test('TicTacToeEngine - smart heuristic blocks opponent win', () => {
  const engine = new TicTacToeEngine();
  let state = engine.getInitialState();

  // Player takes (0,0) and (0,1)
  state = engine.applyMove(state, { row: 0, col: 0 }, 'player');
  state = engine.applyMove(state, { row: 2, col: 2 }, 'ai');
  state = engine.applyMove(state, { row: 0, col: 1 }, 'player');

  // AI turn: player is threatening (0,2). AI must block at (0,2)
  const aiMove = engine.getHeuristicMove(state, 'ai', 'smart');
  assert.deepEqual(aiMove, { row: 0, col: 2 });
});
