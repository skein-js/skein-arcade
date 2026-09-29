import { defineRegistry } from '@ng-json-render/core';
import { ArcadeContainerComponent } from './arcade-container.component';
import { ArcadeFrameComponent } from './arcade-frame.component';
import { ArcadeBoardComponent } from './arcade-board.component';
import { ArcadeCellComponent } from './arcade-cell.component';
import { ColumnDropButtonComponent } from './column-drop-button.component';
import { AgentDialogueComponent } from './agent-dialogue.component';
import { GameResultBannerComponent } from './game-result-banner.component';
import { GeminiThinkingPanelComponent } from './gemini-thinking-panel.component';

export const arcadeRegistry = defineRegistry({
  ArcadeContainer: ArcadeContainerComponent,
  ArcadeFrame: ArcadeFrameComponent,
  ArcadeBoard: ArcadeBoardComponent,
  ArcadeCell: ArcadeCellComponent,
  ColumnDropButton: ColumnDropButtonComponent,
  AgentDialogue: AgentDialogueComponent,
  GameResultBanner: GameResultBannerComponent,
  GeminiThinkingPanel: GeminiThinkingPanelComponent,
});
