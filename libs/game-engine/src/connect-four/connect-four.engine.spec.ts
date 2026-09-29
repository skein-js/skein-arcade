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

test('ConnectFourEngine - tactical analysis identifies landing rows, threats, and wins', () => {
  const engine = new ConnectFourEngine();
  let state = engine.getInitialState();

  // Create horizontal setup for AI in row 5: cols 0, 1, 2
  state = engine.applyMove(state, { col: 0 }, 'player'); // Player col 0, row 5
  state = engine.applyMove(state, { col: 1 }, 'ai');     // AI col 1, row 5
  state = engine.applyMove(state, { col: 0 }, 'player'); // Player col 0, row 4
  state = engine.applyMove(state, { col: 2 }, 'ai');     // AI col 2, row 5
  state = engine.applyMove(state, { col: 0 }, 'player'); // Player col 0, row 3
  state = engine.applyMove(state, { col: 3 }, 'ai');     // AI col 3, row 5 (AI now has cols 1, 2, 3 in row 5)

  // Player's turn
  const playerAnalysis = engine.getTacticalAnalysis(state, 'player');
  // AI threatens to win on col 4 at row 5!
  assert.ok(playerAnalysis.opponentWinningThreats.includes(4));

  // AI's perspective
  const aiAnalysis = engine.getTacticalAnalysis(state, 'ai');
  assert.ok(aiAnalysis.immediateWins.includes(4));
});

test('ConnectFourEngine - grandmaster mode avoids suicide moves', () => {
  const engine = new ConnectFourEngine();
  let state = engine.getInitialState();

  // Build a scenario where dropping in column 2 lands at row 4,
  // which would give the human an immediate horizontal win at row 3
  // Bottom row (5): Player has cols 1, 3, 4
  state = engine.applyMove(state, { col: 1 }, 'player'); // row 5, col 1
  state = engine.applyMove(state, { col: 5 }, 'ai');     // row 5, col 5
  state = engine.applyMove(state, { col: 3 }, 'player'); // row 5, col 3
  state = engine.applyMove(state, { col: 5 }, 'ai');     // row 4, col 5
  state = engine.applyMove(state, { col: 4 }, 'player'); // row 5, col 4

  // AI turn: Player already has row 5 cols 1, 3, 4!
  // Col 2 has row 5 empty! Dropping in col 2 will land in row 5,
  // which is actually a forced block!
  const analysis = engine.getTacticalAnalysis(state, 'ai');
  assert.ok(analysis.opponentWinningThreats.includes(2));

  // Grandmaster AI must block col 2
  const gmMove = engine.getHeuristicMove(state, 'ai', 'grandmaster');
  assert.equal(gmMove.col, 2);
});

test('ConnectFourEngine - grandmaster mode takes immediate win over everything else', () => {
  const engine = new ConnectFourEngine();
  let state = engine.getInitialState();

  // AI has 3 discs stacked vertically in column 3 (rows 5, 4, 3)
  state = engine.applyMove(state, { col: 0 }, 'player');
  state = engine.applyMove(state, { col: 3 }, 'ai'); // row 5
  state = engine.applyMove(state, { col: 0 }, 'player');
  state = engine.applyMove(state, { col: 3 }, 'ai'); // row 4
  state = engine.applyMove(state, { col: 0 }, 'player');
  state = engine.applyMove(state, { col: 3 }, 'ai'); // row 3

  // Even if player has a threat elsewhere, AI should instantly close out the win in col 3
  const move = engine.getHeuristicMove(state, 'ai', 'grandmaster');
  assert.equal(move.col, 3);
});
