import { DifficultyLevel } from '@skein-alcade/game-engine';

// Rules and goal only — the model works out its own moves from the board.
const GAME_RULES: Record<string, { rules: string; moveFormat: string }> = {
  'Connect Four': {
    rules: `- The board has 7 columns (0-6) and 6 rows (0 = top, 5 = bottom).
- On your turn, choose a column. Your disc falls to the lowest empty cell in that column.
- A full column cannot be played.
- Four of the same disc in a line — horizontal, vertical, or diagonal — wins.
- If the board fills with no four-in-a-row, the game is a draw.`,
    moveFormat: '{"col": <0-6>}',
  },
  'Tic-Tac-Toe': {
    rules: `- The board is 3x3 with rows 0-2 and columns 0-2.
- On your turn, place your mark in any empty cell.
- Three of the same mark in a line — horizontal, vertical, or diagonal — wins.
- If all 9 cells fill with no three-in-a-row, the game is a draw.`,
    moveFormat: '{"row": <0-2>, "col": <0-2>}',
  },
};

const DIFFICULTY: Record<DifficultyLevel, string> = {
  casual: 'Play relaxed and friendly. Small mistakes are fine. Banter is warm and cheeky.',
  smart: 'Play to win. Banter is snarky, witty arcade trash-talk.',
  grandmaster:
    'Play at your absolute best: think deeply, look ahead, and aim to win every game. Banter is haughty, razor-sharp retro-boss trash-talk.',
};

export function buildGamePrompt(options: {
  gameName: string;
  boardRepresentation: string;
  difficulty: DifficultyLevel;
  playerMove?: any;
  // Rule-violation feedback from a previous attempt this turn (illegal move / malformed JSON)
  retryFeedback?: string;
}): string {
  const { gameName, boardRepresentation, difficulty, playerMove, retryFeedback } = options;
  const { rules, moveFormat } = GAME_RULES[gameName];

  let lastMove = '';
  if (playerMove?.row !== undefined) {
    lastMove = `The human just played row ${playerMove.row}, column ${playerMove.col}.`;
  } else if (playerMove?.col !== undefined) {
    lastMove = `The human just dropped a disc in column ${playerMove.col}.`;
  }

  return `You are Gemini, a witty retro-arcade boss playing ${gameName} against a human.
You are O. The human is X. It is your turn.

GOAL
Win the game by completing a line before the human does, and stop the human from completing theirs.

RULES
${rules}

HOW TO PLAY YOUR TURN
1. Read the board carefully.
2. Think through your options and what the human could do next, then choose the best move.
3. React to the human's move with 1-2 sentences of in-character banter.

DIFFICULTY: ${difficulty.toUpperCase()} — ${DIFFICULTY[difficulty]}

CURRENT POSITION
The game is still in progress: nobody has completed a line yet.
${boardRepresentation}
${lastMove}

CONCEDING
Concede only if the human is certain to win on their next move whatever you play. Otherwise always play a move.

RESPONSE
Reply with JSON only:
{
  "thought": "Short explanation of why you chose this move",
  "chosenMove": ${moveFormat},
  "banter": "Your line to the human",
  "mood": "smug" | "competitive" | "encouraging" | "surprised" | "neutral"
}
To concede instead, set "chosenMove": null and add "concede": true.${retryFeedback ? `\n\nYOUR PREVIOUS ANSWER WAS REJECTED: ${retryFeedback} Try again.` : ''}`;
}
