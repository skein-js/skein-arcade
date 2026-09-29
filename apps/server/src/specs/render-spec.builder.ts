import { nestedToFlat, Spec } from '@json-render/core';
import {
  DifficultyLevel,
  GameResult,
  PlayerId,
  TicTacToeState,
  ConnectFourState,
} from '@skein-alcade/game-engine';

export interface RenderNode {
  type: string;
  props?: Record<string, unknown>;
  children?: RenderNode[];
}

export function buildGameRenderSpec(options: {
  gameId: 'tic-tac-toe' | 'connect-four';
  state: TicTacToeState | ConnectFourState;
  result: GameResult;
  difficulty: DifficultyLevel;
  banter: string;
  thought?: string;
  rawThought?: string;
  mood?: 'smug' | 'competitive' | 'encouraging' | 'surprised' | 'neutral';
  source?: string;
  isThinking?: boolean;
}): Spec {
  const { gameId, state, result, difficulty, banter, thought, rawThought, mood = 'neutral', source, isThinking = false } = options;

  const winningCoords = new Set(
    (result.winningLine || []).map(([r, c]) => `${r}-${c}`)
  );

  const isGameOver = result.isOver;

  // 1. Title / Frame Header Node
  const headerNode: RenderNode = {
    type: 'ArcadeFrame',
    props: {
      title: gameId === 'tic-tac-toe' ? 'Tic-Tac-Toe Showdown' : 'Connect Four Challenge',
      subtitle: `Difficulty: ${difficulty.toUpperCase()}`,
      gameId,
      difficulty,
    },
  };

  // 2. Dialogue / Persona Node
  const dialogueNode: RenderNode = {
    type: 'AgentDialogue',
    props: {
      agentName: 'Gemini Arcade AI',
      message: banter,
      thought,
      mood,
      difficulty,
      source,
      isThinking,
    },
  };

  // 3. Board Node
  const boardNode: RenderNode = {
    type: 'ArcadeBoard',
    props: {
      gameId,
      rows: state.board.length,
      cols: state.board[0].length,
      board: state.board,
      winningLine: result.winningLine || [],
      isGameOver,
      isInteractive: !isGameOver,
    },
  };

  const children: RenderNode[] = [headerNode, dialogueNode, boardNode];

  // 4. Result Banner (if game over)
  if (isGameOver) {
    let headline = '';
    let subtext = '';
    let status: 'player_won' | 'ai_won' | 'draw' = 'draw';

    if (result.winner === 'player') {
      status = 'player_won';
      headline = 'VICTORY!';
      subtext = 'Impressive moves! You defeated the Gemini Arcade AI.';
    } else if (result.winner === 'ai') {
      status = 'ai_won';
      headline = 'DEFEAT!';
      subtext = 'Gemini reigns supreme! Better luck next round.';
    } else {
      status = 'draw';
      headline = 'STALEMATE!';
      subtext = 'A balanced duel! No one gives an inch.';
    }

    children.push({
      type: 'GameResultBanner',
      props: {
        status,
        headline,
        subtext,
        restartLabel: 'Play Again',
      },
    });
  }

  // 5. Dedicated Gemini Thinking Panel (below the game board and results)
  children.push({
    type: 'GeminiThinkingPanel',
    props: {
      thought,
      rawThought,
      model: source,
      difficulty,
      isThinking,
      snarkyComment: banter,
    },
  });

  return nestedToFlat({
    type: 'ArcadeContainer',
    props: {},
    children,
  }) as Spec;
}
