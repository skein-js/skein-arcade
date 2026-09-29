import { Component, input } from '@angular/core';
import { injectJrContext } from '@ng-json-render/core';

@Component({
  selector: 'app-game-result-banner',
  standalone: true,
  host: {
    class: 'w-full max-w-md mt-6 flex justify-center',
  },
  template: `
    <div
      class="w-full p-6 rounded-2xl flex flex-col items-center text-center border shadow-2xl backdrop-blur-md transition-all duration-200"
      [class.bg-emerald-950/90]="status() === 'player_won'"
      [class.border-emerald-500]="status() === 'player_won'"
      [class.bg-rose-950/90]="status() === 'ai_won'"
      [class.border-rose-500]="status() === 'ai_won'"
      [class.bg-slate-900/90]="status() === 'draw'"
      [class.border-amber-500]="status() === 'draw'"
    >
      <h3
        class="text-2xl sm:text-3xl font-extrabold tracking-wider uppercase mb-1"
        [class.text-emerald-400]="status() === 'player_won'"
        [class.text-rose-400]="status() === 'ai_won'"
        [class.text-amber-400]="status() === 'draw'"
      >
        {{ headline() }}
      </h3>
      <p class="text-sm text-slate-300 mb-4 max-w-xs">
        {{ subtext() }}
      </p>

      <button
        type="button"
        class="px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide uppercase transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
        [class.bg-emerald-500]="status() === 'player_won'"
        [class.hover:bg-emerald-400]="status() === 'player_won'"
        [class.text-slate-950]="status() === 'player_won'"
        [class.bg-rose-500]="status() === 'ai_won'"
        [class.hover:bg-rose-400]="status() === 'ai_won'"
        [class.text-white]="status() === 'ai_won'"
        [class.bg-amber-500]="status() === 'draw'"
        [class.hover:bg-amber-400]="status() === 'draw'"
        [class.text-slate-950]="status() === 'draw'"
        (click)="onRestart()"
      >
        {{ restartLabel() }}
      </button>
    </div>
  `,
})
export class GameResultBannerComponent {
  private ctx = injectJrContext();

  status = input<'player_won' | 'ai_won' | 'draw'>('draw');
  headline = input<string>('GAME OVER');
  subtext = input<string>('');
  restartLabel = input<string>('Play Again');

  onRestart() {
    this.ctx.emit('arcade:restart');
  }
}
