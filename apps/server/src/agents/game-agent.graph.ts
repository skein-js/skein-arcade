import { GoogleGenAI } from "@google/genai";
import { Spec } from "@json-render/core";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  ConnectFourEngine,
  DifficultyLevel,
  GameEngine,
  GameResult,
  TicTacToeEngine,
} from "@skein-alcade/game-engine";
import { buildGamePrompt } from "../prompts/gemini.prompt";
import { buildGameRenderSpec } from "../specs/render-spec.builder";

export const GameAgentAnnotation = Annotation.Root({
  gameId: Annotation<"tic-tac-toe" | "connect-four">,
  boardState: Annotation<any>,
  playerMove: Annotation<any>,
  aiMove: Annotation<any>,
  difficulty: Annotation<DifficultyLevel>,
  banter: Annotation<string>,
  thought: Annotation<string | undefined>,
  rawThought: Annotation<string | undefined>,
  mood: Annotation<
    "smug" | "competitive" | "encouraging" | "surprised" | "neutral"
  >,
  result: Annotation<GameResult>,
  source: Annotation<string | undefined>,
  renderSpec: Annotation<Spec | undefined>,
  error: Annotation<string | null | undefined>,
});

export type GameAgentState = typeof GameAgentAnnotation.State;

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

// Node 1: Validate and apply human player move
async function applyPlayerMoveNode(
  state: GameAgentState,
): Promise<Partial<GameAgentState>> {
  if (!state.playerMove) {
    return {};
  }

  const engine = getEngine(state.gameId);
  if (!engine.isValidMove(state.boardState, state.playerMove, "player")) {
    return {
      error: `Invalid move attempt: ${JSON.stringify(state.playerMove)}`,
    };
  }

  const updatedBoardState = engine.applyMove(
    state.boardState,
    state.playerMove,
    "player",
  );
  const result = engine.checkResult(updatedBoardState);

  return {
    boardState: updatedBoardState,
    result,
    error: null,
  };
}

// Node 2: Agent reasoning and move generation
async function agentMoveNode(
  state: GameAgentState,
): Promise<Partial<GameAgentState>> {
  const engine = getEngine(state.gameId);
  const promptText = buildGamePrompt({
    gameName: engine.name,
    boardRepresentation: engine.formatStateForPrompt(state.boardState),
    difficulty: state.difficulty,
    playerMove: state.playerMove,
  });

  console.log("\n=======================================================");
  console.log(`🕹️  [SkeinArcade:Turn] AI Move Calculation`);
  console.log(`🎮 Game: ${state.gameId} | Difficulty: ${state.difficulty.toUpperCase()}`);
  console.log(`👤 Human Move:`, state.playerMove);

  let chosenMove: any = null;
  let thought = "Calculated optimal tactical response.";
  let rawThought: string | undefined = undefined;
  let banter = "My turn! Let's see how you handle this counter.";
  let mood: GameAgentState["mood"] = "neutral";
  let source = "Deterministic Engine";

  const apiKey = process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"];

  if (!apiKey) {
    console.error("❌ [SkeinArcade:Error] Neither GEMINI_API_KEY nor GOOGLE_API_KEY is configured in the environment.");
    console.error("🛑 [SkeinArcade:Refusal] Fallback disabled. Refusing to use deterministic engine.");
    console.log("=======================================================\n");
    return {
      error: "GEMINI_API_KEY is missing. Please add your GEMINI_API_KEY to the .env file to enable Gemini AI gameplay.",
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  // Gemini 3 models to attempt in order
  const candidateModels = [
    process.env["GEMINI_MODEL"] || "gemini-3.8-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
  ];

  let usedModel = "";
  let response: any = null;
  let lastErrorMessage = "";

  for (const model of candidateModels) {
    try {
      console.log(`🤖 [SkeinArcade:Gemini] Calling model: "${model}" (Thinking enabled)...`);
      usedModel = model;

      // Gemini 3 supports thinkingLevel ("high", "medium", "low"); older models support thinkingBudget
      const isGemini3 = model.startsWith("gemini-3");
      const thinkingConfig = isGemini3
        ? {
            includeThoughts: true,
            thinkingLevel: state.difficulty === "grandmaster" ? "high" : "medium",
          }
        : {
            includeThoughts: true,
            thinkingBudget: state.difficulty === "grandmaster" ? 2048 : 1024,
          };

      response = await ai.models.generateContent({
        model,
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          temperature: state.difficulty === "grandmaster" ? 0.2 : 0.7,
          thinkingConfig: thinkingConfig as any,
        },
      });
      break; // Successfully got response
    } catch (err: any) {
      lastErrorMessage = err.message;
      console.warn(`⚠️  [SkeinArcade:Gemini] Model "${model}" failed: ${err.message}`);
      response = null;
    }
  }

  if (!response) {
    console.error(`❌ [SkeinArcade:Error] Gemini API generation failed for all candidate models.`);
    console.error(`🛑 [SkeinArcade:Refusal] Fallback disabled. Last error: ${lastErrorMessage}`);
    console.log("=======================================================\n");
    return {
      error: `Gemini inference error: ${lastErrorMessage || "Unable to reach Gemini API"}`,
    };
  }

  try {
    let thinkingTrace = "";
    let responseJsonText = "";

    // Extract reasoning trace from candidate parts where part.thought is true
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.thought) {
          thinkingTrace += (thinkingTrace ? "\n" : "") + (part.text || "");
        } else if (part.text) {
          responseJsonText += part.text;
        }
      }
    }

    if (!responseJsonText && response.text) {
      responseJsonText = response.text;
    }

    if (thinkingTrace) {
      console.log(`🧠 [SkeinArcade:ThinkingTrace] (${thinkingTrace.length} chars):`);
      console.log("-------------------------------------------------------");
      console.log(thinkingTrace);
      console.log("-------------------------------------------------------");
      rawThought = thinkingTrace;
    }

    if (responseJsonText) {
      const parsed = JSON.parse(responseJsonText.trim());

      // Check if model recognizes an unavoidable loss and concedes
      if (parsed.concede === true || parsed.chosenMove === null) {
        if (parsed.thought) {
          thought = parsed.thought;
        }
        banter = parsed.banter || "I yield! You've got me completely trapped this time!";
        mood = parsed.mood || "surprised";
        source = `Gemini (${usedModel})`;

        console.log(`🏳️  [SkeinArcade:Gemini] AI CONCEDED: "${banter}"`);
        console.log("=======================================================\n");

        const result: GameResult = {
          isOver: true,
          winner: "player",
          reason: "concession",
        };

        return {
          aiMove: null,
          boardState: state.boardState,
          banter,
          thought,
          rawThought,
          mood,
          source,
          result,
        };
      }

      if (
        parsed.chosenMove &&
        engine.isValidMove(state.boardState, parsed.chosenMove, "ai")
      ) {
        chosenMove = parsed.chosenMove;
        if (parsed.thought) {
          thought = parsed.thought;
        }
        banter = parsed.banter || banter;
        mood = parsed.mood || "competitive";
        source = `Gemini (${usedModel})`;

        console.log(`✅ [SkeinArcade:Gemini] Valid move accepted:`, chosenMove);
        console.log(`💬 [SkeinArcade:Gemini] Banter: "${banter}" [Mood: ${mood}]`);
      } else {
        console.error(
          `❌ [SkeinArcade:Error] Model proposed illegal move:`,
          parsed.chosenMove,
        );
        console.error("🛑 [SkeinArcade:Refusal] Fallback disabled.");
        console.log("=======================================================\n");
        return {
          error: `Gemini model proposed an illegal move: ${JSON.stringify(parsed.chosenMove)}`,
        };
      }
    }
  } catch (parseErr: any) {
    console.error(`❌ [SkeinArcade:Error] Failed to parse model response JSON:`, parseErr.message);
    console.error("🛑 [SkeinArcade:Refusal] Fallback disabled.");
    console.log("=======================================================\n");
    return {
      error: `Failed to parse Gemini response: ${parseErr.message}`,
    };
  }

  if (!chosenMove) {
    return {
      error: "Gemini did not return a valid move.",
    };
  }

  const updatedBoardState = engine.applyMove(
    state.boardState,
    chosenMove,
    "ai",
  );
  const result = engine.checkResult(updatedBoardState);

  console.log(`🏁 [SkeinArcade:Turn] Result: ${result.isOver ? (result.winner ? `Winner: ${result.winner}` : "Draw") : "In Progress"}`);
  console.log(`⚡ [SkeinArcade:Turn] Provider: ${source}`);
  console.log("=======================================================\n");

  return {
    aiMove: chosenMove,
    boardState: updatedBoardState,
    banter,
    thought,
    rawThought,
    mood,
    source,
    result,
  };
}

// Node 3: Render specification builder
async function generateRenderSpecNode(
  state: GameAgentState,
): Promise<Partial<GameAgentState>> {
  const spec = buildGameRenderSpec({
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

  return { renderSpec: spec };
}

// Graph builder using method chaining for type inference
export function createGameAgentGraph() {
  return new StateGraph(GameAgentAnnotation)
    .addNode("applyPlayerMove", applyPlayerMoveNode)
    .addNode("agentMove", agentMoveNode)
    .addNode("generateRenderSpec", generateRenderSpecNode)
    .addEdge(START, "applyPlayerMove")
    .addConditionalEdges(
      "applyPlayerMove",
      (state: GameAgentState) => {
        if (state.error || state.result.isOver) {
          return "generateRenderSpec";
        }
        return "agentMove";
      },
      ["agentMove", "generateRenderSpec"],
    )
    .addEdge("agentMove", "generateRenderSpec")
    .addEdge("generateRenderSpec", END)
    .compile();
}

export const graph = createGameAgentGraph();
export default graph;
