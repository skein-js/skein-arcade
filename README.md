# 🎮 Skein Arcade

> **Generative UI Arcade Platform** powered by **[skein-js](https://skein-js.github.io/skein-js/)**, **LangGraph**, **Google Gemini 3**, **[@langchain/angular](https://reference.langchain.com/javascript/langchain-angular)**, and **Angular (`@ng-json-render/core`)**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031.svg?logo=angular)](https://angular.dev/)
[![LangChain Angular](https://img.shields.io/badge/@langchain/angular-Stream_SDK-green.svg)](https://reference.langchain.com/javascript/langchain-angular)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent_Workflow-orange.svg)](https://langchain-ai.github.io/langgraph/)
[![skein-js](https://img.shields.io/badge/skein--js-Agent_Runtime-purple.svg)](https://skein-js.github.io/skein-js/)
[![Gemini 3](https://img.shields.io/badge/Gemini_3-Thinking_Models-4285F4.svg?logo=google)](https://ai.google.dev/)
[![Nx](https://img.shields.io/badge/Nx-Monorepo-143055.svg?logo=nx)](https://nx.dev/)

---

## 🕹️ Overview

**Skein Arcade** is an educational, AI-driven arcade gaming platform where players duel **Google Gemini** in turn-based puzzle games. The project showcases how to pair **Generative UI** with **Agent Workflows**:

- **Native LangGraph Stream via `@langchain/angular`**: Uses `injectStream` from [`@langchain/angular`](https://reference.langchain.com/javascript/langchain-angular) to connect the Angular frontend directly to the `skein-js` LangGraph agent protocol runtime with reactive Angular Signals (`values`, `isLoading`, `error`).
- **Generative UI with `@ng-json-render/core`**: The backend never sends raw HTML or arbitrary scripts. Instead, it emits structured JSON specifications validated by Zod schemas, rendered natively into Angular standalone components.
- **Deterministic Rules vs. Generative Personality**: The rules, board matrix, legal moves, and win/draw checks are 100% deterministic (TypeScript state machine in `libs/game-engine`). The Gemini agent supplies the strategic reasoning, personality, and witty arcade trash-talk.
- **Gemini 3 Thinking Trace**: Inspect real-time reasoning and tactical evaluation from Gemini 3 thinking models (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-pro`), with simplified tactical summaries and an optional raw chain-of-thought trace inspector.
- **Zero-Latency Optimistic UI**: Immediate tactile feedback when clicking cells or drop columns (0ms), while automatically locking controls and displaying live snarky waiting thoughts during AI calculation.

---

## 🎮 Featured Games

| Game | Grid Size | Description |
| :--- | :--- | :--- |
| **Tic-Tac-Toe** | 3 &times; 3 | Fast-paced tactical classic. Line up 3 marks horizontally, vertically, or diagonally. |
| **Connect Four** | 7 &times; 6 | Gravity-based disc-dropping matrix. Connect 4 discs while dodging Gemini's traps and forks. |

---

## 🤖 AI Difficulty Tiers & Personas

- **Casual**: Exploratory, gentle gameplay with playful and encouraging banter.
- **Smart**: Tactical blocking of human winning threats, opportunistic counters, and snarky arcade banter.
- **Grandmaster**: Multi-step foresight, trap-building, and hilarious, haughty retro-boss trash talk.

---

## 🏗️ Architecture & Directory Structure

```text
skein-arcade/
├── apps/
│   ├── web/                           # Angular 22+ Frontend (Signals, Zoneless, Tailwind CSS)
│   │   ├── src/app/
│   │   │   ├── catalog/               # Custom @ng-json-render catalog components
│   │   │   │   ├── arcade-board.component.ts        # Interactive board with optimistic feedback
│   │   │   │   ├── agent-dialogue.component.ts      # Gemini dialogue & mood badge
│   │   │   │   ├── gemini-thinking-panel.component.ts # Sanitized & raw thinking trace panel
│   │   │   │   ├── arcade-frame.component.ts        # Arcade header and title
│   │   │   │   └── arcade.registry.ts               # Registry mapping JSON types to Angular components
│   │   │   ├── services/
│   │   │   │   └── arcade-session.service.ts        # Client session manager & API connection
│   │   │   └── app.ts                               # App shell & game selector
│   │   └── rspack.config.ts
│   │
│   └── server/                        # skein-js + LangGraph Backend Agent Service
│       └── src/
│           ├── agents/
│           │   └── game-agent.graph.ts  # LangGraph StateGraph (Validate -> AI Reason -> Spec)
│           ├── prompts/
│           │   └── gemini.prompt.ts     # Gemini persona, difficulty & move context prompts
│           ├── specs/
│           │   └── render-spec.builder.ts # Generative UI spec compiler (@json-render/core)
│           └── main.ts                  # @skein-js/express runtime server
│
├── libs/
│   ├── game-engine/                   # Pure TypeScript Deterministic Rules (100% Tested)
│   │   └── src/
│   │       ├── common/                # GameEngine interface, player & result types
│   │       ├── tic-tac-toe/           # 3x3 Tic-Tac-Toe rules & win validation
│   │       └── connect-four/          # 7x6 Connect Four rules & 4-in-a-row checks
│   │
│   └── render-catalog/                # Shared Zod Schemas for Generative UI
│       └── src/
│           ├── components.ts          # Board, Cell, HUD, Thinking Panel schemas
│           └── actions.ts             # Action payload schemas (e.g. arcade:move)
│
├── langgraph.json                     # LangGraph graph definition for skein runtime
├── nx.json                            # Nx monorepo configuration
└── pnpm-workspace.yaml
```

---

## ⚡ Quickstart

### 1. Prerequisites
- **Node.js**: `v20.x` or later
- **pnpm**: `v9.x` or later
- **Google Gemini API Key**: Obtain one from [Google AI Studio](https://aistudio.google.com/)

### 2. Installation
```sh
git clone https://github.com/skein-js/skein-arcade.git
cd skein-arcade
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```sh
cp .env.example .env
```
Edit `.env` and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
```

> **Note**: Gemini 3 models support deep thinking traces (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-pro`). If no key is configured, the agent explicitly refuses to play to guarantee real AI gameplay without deceptive deterministic fallbacks.

### 4. Running the Development Servers

Start the **Backend Agent Server** (`skein-js` + LangGraph on port 3000):
```sh
pnpm nx serve server
```

Start the **Frontend Web App** (Angular on port 4200):
```sh
pnpm nx serve web
```

Open your browser at **[http://localhost:4200](http://localhost:4200)**.

---

## 🧪 Testing & Verification

Run the deterministic game engine unit tests (100% pass rate):
```sh
pnpm nx test game-engine
```

Run production builds:
```sh
pnpm nx build server
pnpm nx build web
```

---

## 🧩 Adding a New Game

Adding a new arcade game requires only five steps:

1. **Engine**: Implement `GameEngine<TState, TMove>` in `libs/game-engine/src/<game-name>/` with comprehensive test coverage.
2. **Catalog**: If the game needs custom UI widgets, add schemas to `libs/render-catalog`.
3. **Frontend**: Implement the corresponding Angular component in `apps/web/src/app/catalog/` and register it in `arcade.registry.ts`.
4. **Prompt**: Configure board representation formatting and game-specific rules in `gemini.prompt.ts`.
5. **Registry**: Register the engine in `apps/server/src/main.ts`.

---

## 🔗 Ecosystem & Related Projects

| Project / Library | Description | Useful Links |
| :--- | :--- | :--- |
| **`skein-js`** | Open-source TypeScript runtime & server implementation of the LangGraph Agent Protocol | • [Documentation](https://skein-js.github.io/skein-js/)<br>• [GitHub Repository](https://github.com/skein-js/skein-js)<br>• [`@skein-js/express`](https://github.com/skein-js/skein-js/tree/main/packages/server-express) |
| **`@langchain/angular`** | Official LangChain / LangGraph client SDK for Angular with reactive signals and stream orchestration | • [API Reference](https://reference.langchain.com/javascript/langchain-angular)<br>• [LangChain.js GitHub](https://github.com/langchain-ai/langchainjs)<br>• [LangGraph.js Docs](https://langchain-ai.github.io/langgraphjs/) |
| **`@ng-json-render/core`** | Angular renderer for JSON-driven Generative UI specifications | • [Documentation](https://mainawycliffe.github.io/ng-json-render/)<br>• [GitHub Repository](https://github.com/mainawycliffe/ng-json-render) |
| **`@json-render/core`** | Core schema and tree specifications for Generative UI | • [Website](https://json-render.dev)<br>• [GitHub Repository](https://github.com/vercel-labs/json-render) |
| **`Google Gemini AI`** | Gemini 3 family models (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-pro`) with thinking reasoning traces | • [Google AI Studio](https://aistudio.google.com/)<br>• [Gemini API Docs](https://ai.google.dev/)<br>• [`@google/genai` SDK](https://www.npmjs.com/package/@google/genai) |
| **`Angular`** | Modern web platform utilizing Signals, Zoneless change detection, and standalone components | • [Angular Docs](https://angular.dev/) |
| **`Nx`** | Smart, fast, extensible build system and monorepo management | • [Nx Documentation](https://nx.dev/) |

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

