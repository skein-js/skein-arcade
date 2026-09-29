import { Spec } from "@json-render/core";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  ConnectFourEngine,
  DifficultyLevel,
  GameEngine,
  GameResult,
  TicTacToeEngine,
} from "@skein-alcade/game-engine";
import { getConfiguredModel } from "../config/gemini-model";
import { buildGamePrompt } from "../prompts/gemini.prompt";
import { buildGameRenderSpec } from "../specs/render-spec.builder";
import { GeminiPlayer, GeminiTurn, Mood } from "./gemini-player";
import { findRuleViolation } from "./referee";

// ─── State ──────────────────────────────────────────────────────────────────

export const GameAgentAnnotation = Annotation.Root({
  gameId: Annotation<"tic-tac-toe" | "connect-four">,
  boardState: Annotation<any>,
  playerMove: Annotation<any>,
  aiMove: Annotation<any>,
  difficulty: Annotation<DifficultyLevel>,
  banter: Annotation<string>,
  thought: Annotation<string | undefined>,
  rawThought: Annotation<string | undefined>,
  mood: Annotation<Mood>,
  result: Annotation<GameResult>,
  source: Annotation<string | undefined>,
  renderSpec: Annotation<Spec | undefined>,
  error: Annotation<string | null | undefined>,
});

export type GameAgentState = typeof GameAgentAnnotation.State;
type StateUpdate = Partial<GameAgentState>;

const engines: Record<string, GameEngine<any, any>> = {
  "tic-tac-toe": new TicTacToeEngine(),
  "connect-four": new ConnectFourEngine(),
};

function getEngine(gameId: string): GameEngine<any, any> {
  const engine = engines[gameId];
  if (!engine) {
    throw new Error(`Engine not found for game ${gameId}`);
  }
  return engine;
}

// ─── Node 1: apply the human's move ─────────────────────────────────────────

async function applyPlayerMoveNode(state: GameAgentState): Promise<StateUpdate> {
  if (!state.playerMove) {
    return {};
  }

  const engine = getEngine(state.gameId);
  if (!engine.isValidMove(state.boardState, state.playerMove, "player")) {
    return { error: `Invalid move attempt: ${JSON.stringify(state.playerMove)}` };
  }

  const boardState = engine.applyMove(state.boardState, state.playerMove, "player");
  return { boardState, result: engine.checkResult(boardState), error: null };
}

// ─── Node 2: Gemini plays its move ──────────────────────────────────────────

/** One normal attempt plus one retry after the referee rejects an answer. */
const MAX_ATTEMPTS = 2;

async function agentMoveNode(state: GameAgentState): Promise<StateUpdate> {
  const apiKey = process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"];
  if (!apiKey) {
    return {
      error: "GEMINI_API_KEY is missing. Please add your GEMINI_API_KEY to the .env file to enable Gemini AI gameplay.",
    };
  }

  const engine = getEngine(state.gameId);
  const player = new GeminiPlayer(apiKey, getConfiguredModel());
  log(`🎮 ${state.gameId} | ${state.difficulty} | ${player.model} | human played`, state.playerMove);

  // Feedback from the referee when the previous attempt broke a rule
  let refereeFeedback: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const prompt = buildGamePrompt({
      gameName: engine.name,
      boardRepresentation: engine.formatStateForPrompt(state.boardState),
      difficulty: state.difficulty,
      playerMove: state.playerMove,
      retryFeedback: refereeFeedback,
    });

    let turn: GeminiTurn;
    try {
      turn = await player.ask(prompt, state.difficulty);
    } catch (err: any) {
      return { error: `Gemini model "${player.model}" failed: ${err.message}` };
    }
    logThinking(turn.rawThought);

    const violation = findRuleViolation(engine, state.boardState, turn);
    if (violation) {
      log(`⚠️  Attempt ${attempt} rejected by referee: ${violation}`);
      refereeFeedback = violation;
      continue;
    }

    return turn.answer!.concede ? concede(state, turn) : playMove(engine, state, turn);
  }

  return { error: `Gemini (${player.model}) did not return a legal move: ${refereeFeedback}` };
}

function playMove(engine: GameEngine<any, any>, state: GameAgentState, turn: GeminiTurn): StateUpdate {
  const answer = turn.answer!;
  const boardState = engine.applyMove(state.boardState, answer.chosenMove, "ai");
  log(`✅ ${turn.source} played`, answer.chosenMove);

  return {
    aiMove: answer.chosenMove,
    boardState,
    result: engine.checkResult(boardState),
    banter: answer.banter || "My turn! Let's see how you handle this counter.",
    thought: answer.thought || "Calculated optimal tactical response.",
    rawThought: turn.rawThought,
    mood: answer.mood || "competitive",
    source: turn.source,
  };
}

function concede(state: GameAgentState, turn: GeminiTurn): StateUpdate {
  const answer = turn.answer!;
  log(`🏳️  ${turn.source} conceded`);

  return {
    aiMove: null,
    boardState: state.boardState,
    result: { isOver: true, winner: "player", reason: "concession" },
    banter: answer.banter || "I yield! You've got me completely trapped this time!",
    thought: answer.thought || "The position is lost.",
    rawThought: turn.rawThought,
    mood: answer.mood || "surprised",
    source: turn.source,
  };
}

// ─── Node 3: build the UI spec ──────────────────────────────────────────────

async function generateRenderSpecNode(state: GameAgentState): Promise<StateUpdate> {
  const renderSpec = buildGameRenderSpec({
    gameId: state.gameId,
    state: state.boardState,
    result: state.result,
    difficulty: state.difficulty,
    banter: state.banter,
    thought: state.thought,
    rawThought: state.rawThought,
    mood: state.mood,
    source: state.source,
  });

  return { renderSpec };
}

// ─── Graph ──────────────────────────────────────────────────────────────────

//   START → applyPlayerMove ─┬─ game continues ──→ agentMove ─→ generateRenderSpec → END
//                            └─ game over / error ─────────────↗
export function createGameAgentGraph() {
  return new StateGraph(GameAgentAnnotation)
    .addNode("applyPlayerMove", applyPlayerMoveNode)
    .addNode("agentMove", agentMoveNode)
    .addNode("generateRenderSpec", generateRenderSpecNode)
    .addEdge(START, "applyPlayerMove")
    .addConditionalEdges(
      "applyPlayerMove",
      (state: GameAgentState) =>
        state.error || state.result.isOver ? "generateRenderSpec" : "agentMove",
      ["agentMove", "generateRenderSpec"],
    )
    .addEdge("agentMove", "generateRenderSpec")
    .addEdge("generateRenderSpec", END)
    .compile();
}

export const graph = createGameAgentGraph();
export default graph;

// ─── Logging ────────────────────────────────────────────────────────────────

function log(message: string, ...details: unknown[]) {
  console.log(`[SkeinArcade] ${message}`, ...details);
}

function logThinking(rawThought: string | undefined) {
  if (rawThought) {
    log(`🧠 Thinking trace (${rawThought.length} chars):\n${rawThought}`);
  }
}
