import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JrRenderer, JrActionEvent } from '@ng-json-render/core';
import { ArcadeSessionService } from './services/arcade-session.service';
import { arcadeRegistry } from './catalog/arcade.registry';
import { DifficultyLevel } from '@skein-alcade/game-engine';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, JrRenderer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly session = inject(ArcadeSessionService);
  protected readonly arcadeRegistry = arcadeRegistry;

  ngOnInit() {
    this.session.startNewGame('tic-tac-toe', 'smart');
  }

  onSelectGame(gameId: 'tic-tac-toe' | 'connect-four') {
    this.session.startNewGame(gameId, this.session.selectedDifficulty());
  }

  onSelectDifficulty(difficulty: DifficultyLevel) {
    this.session.startNewGame(this.session.selectedGame(), difficulty);
  }

  onRestart() {
    this.session.startNewGame();
  }

  onAction(event: JrActionEvent) {
    if (event.action === 'arcade:move') {
      this.session.playTurn(event.payload);
    } else if (event.action === 'arcade:restart') {
      this.session.startNewGame();
    }
  }
}
