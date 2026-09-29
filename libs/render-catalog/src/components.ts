import { z } from 'zod';

export const ArcadeContainerSchema = z.object({}).passthrough();

export const ArcadeFrameSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  gameId: z.string().optional(),
  difficulty: z.enum(['casual', 'smart', 'grandmaster']).optional(),
});

export const ArcadeBoardSchema = z.object({
  gameId: z.string(),
  rows: z.number(),
  cols: z.number(),
  board: z.array(z.array(z.enum(['player', 'ai']).nullable())).optional(),
  winningLine: z.array(z.tuple([z.number(), z.number()])).optional(),
  isGameOver: z.boolean().default(false),
  isInteractive: z.boolean().default(true),
});

export const ArcadeCellSchema = z.object({
  gameId: z.string().optional(),
  row: z.number(),
  col: z.number(),
  value: z.enum(['player', 'ai']).nullable(),
  isWinningCell: z.boolean().default(false),
  disabled: z.boolean().default(false),
  actionType: z.literal('arcade:move').default('arcade:move'),
});

export const AgentDialogueSchema = z.object({
  agentName: z.string().default('Gemini Arcade Master'),
  message: z.string(),
  thought: z.string().optional(),
  mood: z.enum(['smug', 'competitive', 'encouraging', 'surprised', 'neutral']).default('neutral'),
  difficulty: z.enum(['casual', 'smart', 'grandmaster']),
  source: z.string().optional(),
  isThinking: z.boolean().default(false),
});

export const GameResultBannerSchema = z.object({
  status: z.enum(['player_won', 'ai_won', 'draw']),
  headline: z.string(),
  subtext: z.string(),
  restartLabel: z.string().default('Play Again'),
});

export const ColumnDropButtonSchema = z.object({
  col: z.number(),
  disabled: z.boolean().default(false),
  actionType: z.literal('arcade:move').default('arcade:move'),
});

export const GeminiThinkingPanelSchema = z.object({
  thought: z.string().optional(),
  rawThought: z.string().optional(),
  model: z.string().optional(),
  difficulty: z.enum(['casual', 'smart', 'grandmaster']).optional(),
  isThinking: z.boolean().default(false),
  snarkyComment: z.string().optional(),
});

export type ArcadeFrameProps = z.infer<typeof ArcadeFrameSchema>;
export type ArcadeBoardProps = z.infer<typeof ArcadeBoardSchema>;
export type ArcadeCellProps = z.infer<typeof ArcadeCellSchema>;
export type AgentDialogueProps = z.infer<typeof AgentDialogueSchema>;
export type GameResultBannerProps = z.infer<typeof GameResultBannerSchema>;
export type ColumnDropButtonProps = z.infer<typeof ColumnDropButtonSchema>;
export type GeminiThinkingPanelProps = z.infer<typeof GeminiThinkingPanelSchema>;

