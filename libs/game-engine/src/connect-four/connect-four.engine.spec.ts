import test from 'node:test';
import assert from 'node:assert/strict';
import { ConnectFourEngine, CONNECT_FOUR_ROWS, CONNECT_FOUR_COLS } from './connect-four.engine';

test('ConnectFourEngine - starts with empty 6x7 grid', () => {
  const engine = new ConnectFourEngine();
  const state = engine.getInitialState();

  assert.equal(state.board.length, CONNECT_FOUR_ROWS);
  assert.equal(state.board[0].length, CONNECT_FOUR_COLS);
  assert.equal(state.currentTurn, 'player');
  assert.equal(engine.getValidMoves(state).length, 7);
});

test('ConnectFourEngine - gravity stacks discs to bottom row', () => {
  const engine = new ConnectFourEngine();
  let state = engine.getInitialState();

  // Player drops in column 3 -> should land in row 5
  state = engine.applyMove(state, { col: 3 }, 'player');
  assert.equal(state.board[5][3], 'player');
  assert.equal(state.currentTurn, 'ai');

  // AI drops in column 3 -> should stack on top in row 4
  state = engine.applyMove(state, { col: 3 }, 'ai');
  assert.equal(state.board[4][3], 'ai');
});

test('ConnectFourEngine - detects horizontal 4-in-a-row', () => {
  const engine = new ConnectFourEngine();
  let state = engine.getInitialState();

  // Columns 0, 1, 2, 3 on bottom row (5)
  state = engine.applyMove(state, { col: 0 }, 'player'); // row 5, col 0
  state = engine.applyMove(state, { col: 0 }, 'ai');     // row 4, col 0
  state = engine.applyMove(state, { col: 1 }, 'player'); // row 5, col 1
  state = engine.applyMove(state, { col: 1 }, 'ai');     // row 4, col 1
  state = engine.applyMove(state, { col: 2 }, 'player'); // row 5, col 2
  state = engine.applyMove(state, { col: 2 }, 'ai');     // row 4, col 2
  state = engine.applyMove(state, { col: 3 }, 'player'); // row 5, col 3 -> WIN

  const result = engine.checkResult(state);
  assert.equal(result.isOver, true);
  assert.equal(result.winner, 'player');
});

test('ConnectFourEngine - detects vertical 4-in-a-row', () => {
  const engine = new ConnectFourEngine();
  let state = engine.getInitialState();

  state = engine.applyMove(state, { col: 2 }, 'player'); // P (5)
  state = engine.applyMove(state, { col: 3 }, 'ai');     // AI
  state = engine.applyMove(state, { col: 2 }, 'player'); // P (4)
  state = engine.applyMove(state, { col: 3 }, 'ai');     // AI
  state = engine.applyMove(state, { col: 2 }, 'player'); // P (3)
  state = engine.applyMove(state, { col: 3 }, 'ai');     // AI
  state = engine.applyMove(state, { col: 2 }, 'player'); // P (2) -> 4 vertical

  const result = engine.checkResult(state);
  assert.equal(result.isOver, true);
  assert.equal(result.winner, 'player');
});

test('ConnectFourEngine - smart heuristic blocks opponent vertical win', () => {
  const engine = new ConnectFourEngine();
  let state = engine.getInitialState();

  // Player stacks 3 discs in col 4
  state = engine.applyMove(state, { col: 4 }, 'player'); // P (5)
  state = engine.applyMove(state, { col: 0 }, 'ai');     // AI (5)
  state = engine.applyMove(state, { col: 4 }, 'player'); // P (4)
  state = engine.applyMove(state, { col: 0 }, 'ai');     // AI (4)
  state = engine.applyMove(state, { col: 4 }, 'player'); // P (3)

  // AI turn: player has 3 in col 4. AI must block by dropping into col 4!
  const move = engine.getHeuristicMove(state, 'ai', 'smart');
  assert.equal(move.col, 4);
});
