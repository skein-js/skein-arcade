import { GameEngine } from "@skein-alcade/game-engine";
import { GeminiTurn } from "./gemini-player";

/**
 * The referee enforces the rules of the game — nothing more. It returns the rule
 * Gemini broke (sent back to the model as feedback), or undefined if the answer
 * stands. It never suggests a move.
 */
export function findRuleViolation(
  engine: GameEngine<any, any>,
  boardState: any,
  turn: GeminiTurn,
): string | undefined {
  const { answer } = turn;

  if (!answer) {
    return `Your response was not valid JSON (${turn.parseError}).`;
  }

  if (answer.concede === true) {
    return isLostNextTurn(engine, boardState)
      ? undefined
      : "Concession rejected: nobody has won and the game is not lost yet. Re-read the board and play a move.";
  }

  if (!answer.chosenMove || !engine.isValidMove(boardState, answer.chosenMove, "ai")) {
    return `${JSON.stringify(answer.chosenMove ?? null)} is not a legal move under the rules (the cell or column must exist and not be full or occupied).`;
  }

  return undefined;
}

/**
 * A concession is only honest if every legal AI move still lets the human
 * complete a line on their very next turn.
 */
function isLostNextTurn(engine: GameEngine<any, any>, boardState: any): boolean {
  return engine.getValidMoves(boardState).every((aiMove) => {
    const afterAiMove = engine.applyMove(boardState, aiMove, "ai");
    if (engine.checkResult(afterAiMove).isOver) {
      return false;
    }

    return engine.getValidMoves(afterAiMove).some((humanMove) => {
      const afterHumanMove = engine.applyMove(afterAiMove, humanMove, "player");
      return engine.checkResult(afterHumanMove).winner === "player";
    });
  });
}
