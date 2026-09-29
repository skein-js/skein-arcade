import fs from 'node:fs';
import cors from 'cors';
import express from 'express';
import { createExpressServer } from '@skein-js/express';
import {
  DifficultyLevel,
  TicTacToeEngine,
  ConnectFourEngine,
} from '@skein-alcade/game-engine';
import { createGameAgentGraph, GameAgentState } from './agents/game-agent.graph';
import { buildGameRenderSpec } from './specs/render-spec.builder';
import { assertSupportedModel, getConfiguredModel } from './config/gemini-model';

// Auto-load .env file if present
if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
  console.log('📄 [SkeinArcade] Loaded environment variables from .env');
}

const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3000;

const engines = {
  'tic-tac-toe': new TicTacToeEngine(),
  'connect-four': new ConnectFourEngine(),
};

const agentGraph = createGameAgentGraph();

async function startServer() {
  // Refuse to boot with a non-Gemini-3 model rather than silently playing a weaker one
  assertSupportedModel();

  // Initialize Skein Agent Protocol server with langgraph.json
  const skein = await createExpressServer({
    config: './langgraph.json',
  });

  const app = skein.app;

  app.use(cors());
  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'skein-arcade-agent-service',
      skein: 'connected',
      engines: Object.keys(engines),
    });
  });

  // Start new arcade session
  app.post('/api/arcade/start', (req, res) => {
    try {
      const gameId = (req.body.gameId || 'tic-tac-toe') as 'tic-tac-toe' | 'connect-four';
      const difficulty = (req.body.difficulty || 'casual') as DifficultyLevel;

      const engine = engines[gameId];
      if (!engine) {
        return res.status(400).json({ error: `Unknown game: ${gameId}` });
      }

      const initialState = engine.getInitialState();
      const result = engine.checkResult(initialState);

      const apiKey = process.env['GEMINI_API_KEY'] || process.env['GOOGLE_API_KEY'];
      const model = getConfiguredModel();

      let banter =
        difficulty === 'grandmaster'
          ? 'Welcome to the arena, human. You face a Grandmaster AI. Make your opening move!'
          : 'Welcome to Skein Arcade! You go first. Best of luck!';
      let source = apiKey ? `Gemini (${model})` : '⚠️ No API Key Configured';

      if (!apiKey) {
        banter =
          '⚠️ GEMINI_API_KEY is not configured in .env. Please add your Gemini API key to .env to play with Gemini AI!';
      }

      const initialSpec = buildGameRenderSpec({
        gameId,
        state: initialState,
        result,
        difficulty,
        banter,
        thought: !apiKey
          ? 'Add GEMINI_API_KEY=your_key to your .env file to enable Gemini 3 reasoning and play.'
          : undefined,
        mood: difficulty === 'grandmaster' ? 'competitive' : 'encouraging',
        source,
      });

      return res.json({
        gameId,
        difficulty,
        boardState: initialState,
        result,
        renderSpec: initialSpec,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Play a turn through LangGraph agent
  app.post('/api/arcade/turn', async (req, res) => {
    try {
      const { gameId, boardState, playerMove, difficulty = 'casual' } = req.body;

      if (!gameId || !boardState || !playerMove) {
        return res.status(400).json({
          error: 'Missing required parameters: gameId, boardState, playerMove',
        });
      }

      const initialState: GameAgentState = {
        gameId,
        boardState,
        playerMove,
        aiMove: undefined,
        difficulty,
        banter: '',
        thought: undefined,
        rawThought: undefined,
        mood: 'neutral',
        source: undefined,
        result: { isOver: false },
        renderSpec: undefined,
        error: null,
      };

      const finalState = await agentGraph.invoke(initialState);

      if (finalState.error) {
        return res.status(400).json({
          error: finalState.error,
          boardState: finalState.boardState,
        });
      }

      return res.json({
        gameId,
        difficulty,
        boardState: finalState.boardState,
        aiMove: finalState.aiMove,
        banter: finalState.banter,
        thought: finalState.thought,
        rawThought: finalState.rawThought,
        mood: finalState.mood,
        result: finalState.result,
        renderSpec: finalState.renderSpec,
      });
    } catch (err: any) {
      console.error('Error handling arcade turn:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  await skein.listen(PORT, '0.0.0.0');
  const hasKey = !!(process.env['GEMINI_API_KEY'] || process.env['GOOGLE_API_KEY']);
  const model = getConfiguredModel();
  console.log(`🎮 Skein Arcade Server running at http://localhost:${PORT}`);
  console.log(`⚡ LangGraph Agent Protocol endpoints ready on Skein runtime`);
  console.log(`🤖 Gemini AI Status: ${hasKey ? `ONLINE (Targeting ${model} with thinking trace)` : 'OFFLINE (No GEMINI_API_KEY found in .env — AI gameplay requires key)'}`);
}

startServer().catch((err) => {
  console.error('Failed to start Skein Arcade Server:', err);
  process.exit(1);
});
