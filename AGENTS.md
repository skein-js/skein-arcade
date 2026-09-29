# Skein Arcade: Agent & Engineering Guidelines

Welcome to **Skein Arcade** (`@skein-alcade/source`), an educational, AI-powered arcade platform where players challenge Gemini AI in turn-based puzzle games. The project pairs an **Angular** frontend using **`@ng-json-render/core`** for Generative UI with a **`skein-js` + `LangGraph`** agent backend.

---

## 1. Core Principles & Philosophy

1. **Deterministic Logic vs. Generative Output**:
   - Game rules (board state, legal moves, win/loss/draw detection) are **strictly deterministic** and live in `libs/game-engine`.
   - The AI agent (Gemini) provides **strategic moves, personality, commentary, and dynamic challenge**, but **never** dictates raw game rules.
   - All AI moves **must be validated** by the deterministic game engine before execution. If an AI proposes an illegal move, the graph handles retry or fallback.

2. **Generative UI via `@ng-json-render/core`**:
   - The backend/agent emits structured JSON specifications (matching schemas in `libs/render-catalog`).
   - The Angular frontend renders these specifications into trusted, native Angular components using `@ng-json-render/core`.
   - Never inject or evaluate raw generated HTML or executable code strings.

3. **Extensibility First**:
   - The arcade is designed to host multiple puzzle games (starting with **Tic-Tac-Toe** and **Connect Four**).
   - Adding a new game must only require implementing the standard `GameEngine<TState, TMove>` interface, defining its render catalog components, and configuring the agent prompt.

---

## 2. Technology Stack & Workspace Structure

### Stack
- **Monorepo**: Nx 23+ with pnpm.
- **Frontend**: Angular 19+ (standalone components, Signals, zoneless change detection, modern control flow `@if`/`@for`).
- **UI Framework**: `@ng-json-render/core`, `@json-render/core`, Tailwind CSS.
- **Agent Orchestration**: `skein-js`, `@langchain/langgraph`, `@langchain/core`.
- **LLM**: Google Gemini (`@google/genai` or `@langchain/google-genai`).
- **Validation**: Zod (for JSON-render schemas and state validation).

### Directory Layout
```text
skein-alcade/
├── AGENTS.md                          # Repository rules & architecture guide (this file)
├── apps/
│   ├── web/                           # Angular frontend application
│   │   ├── src/app/
│   │   │   ├── catalog/               # Custom @ng-json-render component implementations
│   │   │   ├── components/            # App shell, game selector, arcade frame
│   │   │   ├── services/              # Game session client, Skein agent connection
│   │   │   └── app.component.ts
│   └── server/                        # skein-js + LangGraph backend service
│       └── src/
│           ├── agents/                # LangGraph game workflows & decision nodes
│           ├── prompts/               # Gemini persona & difficulty prompts
│           ├── specs/                 # JSON Render spec generators
│           └── index.ts
└── libs/
    ├── game-engine/                   # Pure TypeScript game rules & state machines
    │   └── src/
    │       ├── common/                # GameEngine interface, player & result types
    │       ├── tic-tac-toe/           # 3x3 Tic-Tac-Toe rules & win validation
    │       └── connect-four/          # 7x6 Connect Four rules & 4-in-a-row checks
    └── render-catalog/                # Shared Zod schemas for JSON Render
        └── src/
            ├── components.ts          # Board, Cell, HUD, Dialogue schemas
            └── actions.ts             # Action schemas (e.g., player move)
```

---

## 3. Frontend Architecture Rules (Angular & `@ng-json-render/core`)

1. **Angular Standards**:
   - **Standalone Only**: Every component, directive, and pipe must be `standalone: true`. No `NgModule`s.
   - **Modern Signals**: Use `signal()`, `computed()`, `input()`, and `output()`. Avoid legacy `@Input()` / `@Output()`.
   - **Zoneless / OnPush**: Write zoneless-ready code. Rely on Signals for reactive UI updates.
   - **Control Flow**: Exclusively use `@if`, `@for`, and `@switch`. Do not use `*ngIf` or `*ngFor`.
   - **Dependency Injection**: Use `inject(Service)` instead of constructor injection.

2. **JSON Render Integration**:
   - Register all game UI components in a centralized catalog using `@ng-json-render/core`.
   - Catalog components receive props validated against their Zod schema.
   - User interactions on catalog elements (e.g. clicking a cell or column) dispatch typed actions back to the game session controller.

---

## 4. Backend & Agent Rules (`skein-js` + LangGraph)

1. **LangGraph StateGraph Patterns**:
   - Keep state strongly typed:
     ```typescript
     export interface GameAgentState {
       gameId: string;
       boardState: unknown;
       turn: 'player' | 'ai';
       history: unknown[];
       difficulty: 'casual' | 'smart' | 'grandmaster';
       agentCommentary?: string;
       renderSpec?: unknown;
       result?: { isOver: boolean; winner?: string };
     }
     ```
   - Graph flow:
     `UserAction -> ValidateMove -> ApplyMove -> CheckGameOver -> (if not over) AgentReasoning -> AgentMove -> CheckGameOver -> GenerateRenderSpec -> END`.

2. **Agent Prompting & Dynamic Challenge**:
   - Pass the board representation clearly formatted (ASCII or structured coordinate array) along with explicitly listed valid moves.
   - Direct Gemini to output structured JSON containing:
     - `chosenMove`: Coordinates / column of the selected move.
     - `thought`: Internal rationale (chain-of-thought) for move selection.
     - `banter`: Short, in-character arcade banter (encouraging, sarcastic, or competitive based on difficulty).
   - Gemini models should adapt playstyle to chosen difficulty:
     - *Casual*: Exploratory moves with light banter.
     - *Smart*: Tactical blocking and opportunistic winning moves.
     - *Grandmaster*: Depth reasoning, foresight, and sharp competitive persona.

---

## 5. Adding New Games Protocol

To add a new puzzle game to the arcade:
1. **Engine**: Implement `GameEngine<TState, TMove>` in `libs/game-engine/src/<game-name>/`. Write 100% test coverage for winning rules and invalid move rejections.
2. **Catalog**: If the game requires custom UI elements beyond the standard grid/cells, add component schemas to `libs/render-catalog`.
3. **Frontend**: Implement corresponding Angular catalog components in `apps/web/src/app/catalog/`.
4. **Agent Profile**: Define game-specific prompt instructions and board representation in `apps/server/src/prompts/<game-name>.prompt.ts`.
5. **Registry**: Register the game in the global arcade registry.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->