import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { DifficultyLevel } from "@skein-alcade/game-engine";

export type Mood =
  | "smug"
  | "competitive"
  | "encouraging"
  | "surprised"
  | "neutral";

/** The JSON Gemini is asked to reply with (see gemini.prompt.ts). */
export interface GeminiAnswer {
  thought?: string;
  chosenMove: any | null;
  concede?: boolean;
  banter?: string;
  mood?: Mood;
}

export interface GeminiTurn {
  /** Parsed answer, or null when the reply was not valid JSON. */
  answer: GeminiAnswer | null;
  /** Why the reply could not be parsed, when `answer` is null. */
  parseError?: string;
  /** The model's thinking trace, shown in the UI's "raw trace" panel. */
  rawThought?: string;
  /** Label for the model that actually answered, e.g. "Gemini (gemini-3.8-flash)". */
  source: string;
}

/**
 * Asks one Gemini model for a move. There is deliberately no fallback model:
 * if the call fails, the error propagates so it's always clear who is playing.
 */
export class GeminiPlayer {
  private readonly ai: GoogleGenAI;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async ask(prompt: string, difficulty: DifficultyLevel): Promise<GeminiTurn> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Gemini 3 reasons best at its default temperature, so we only tune thinking depth
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel:
            difficulty === "casual" ? ThinkingLevel.LOW : ThinkingLevel.HIGH,
        },
      },
    });

    const { thinking, text } = splitThinkingFromAnswer(response);
    const turn = {
      rawThought: thinking || undefined,
      source: `Gemini (${response.modelVersion || this.model})`,
    };

    try {
      return { ...turn, answer: JSON.parse(text.trim()) };
    } catch (err: any) {
      return { ...turn, answer: null, parseError: err.message };
    }
  }
}

/** Gemini returns thought parts and answer parts side by side; separate them. */
function splitThinkingFromAnswer(response: any): {
  thinking: string;
  text: string;
} {
  const parts: any[] = response.candidates?.[0]?.content?.parts ?? [];

  const thinking = parts
    .filter((part) => part.thought)
    .map((part) => part.text ?? "")
    .join("\n");

  const text =
    parts
      .filter((part) => !part.thought && part.text)
      .map((part) => part.text)
      .join("") ||
    response.text ||
    "";

  return { thinking, text };
}
