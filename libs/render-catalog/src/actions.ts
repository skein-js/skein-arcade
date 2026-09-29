import { z } from 'zod';

export const MoveActionSchema = z.object({
  type: z.literal('arcade:move'),
  payload: z.object({
    gameId: z.string(),
    move: z.union([
      z.object({ row: z.number(), col: z.number() }), // Tic-Tac-Toe
      z.object({ col: z.number() }),                   // Connect Four
    ]),
  }),
});

export const RestartActionSchema = z.object({
  type: z.literal('arcade:restart'),
  payload: z.object({
    gameId: z.string(),
    difficulty: z.enum(['casual', 'smart', 'grandmaster']).optional(),
  }),
});

export const SelectGameActionSchema = z.object({
  type: z.literal('arcade:select_game'),
  payload: z.object({
    gameId: z.enum(['tic-tac-toe', 'connect-four']),
    difficulty: z.enum(['casual', 'smart', 'grandmaster']),
  }),
});

export type MoveAction = z.infer<typeof MoveActionSchema>;
export type RestartAction = z.infer<typeof RestartActionSchema>;
export type SelectGameAction = z.infer<typeof SelectGameActionSchema>;
