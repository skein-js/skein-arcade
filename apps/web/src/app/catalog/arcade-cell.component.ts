import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { injectJrContext } from '@ng-json-render/core';

@Component({
  selector: 'app-arcade-cell',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'flex items-center justify-center w-full h-full',
  },
  template: `
    @if (gameId() === 'connect-four') {
      <!-- Connect Four Disc Slot -->
      <button
        type="button"
        class="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200 select-none relative group p-1"
        [class.cursor-pointer]="!disabled()"
        [class.cursor-not-allowed]="disabled()"
        [disabled]="disabled()"
        (click)="onClick()"
        [title]="'Column ' + (col() + 1)"
      >
        <!-- The Slot Well -->
        <div
          class="w-full h-full rounded-full flex items-center justify-center transition-all duration-300"
          [class.bg-slate-950]="!value()"
          [class.shadow-inner]="!value()"
          [class.border]="true"
          [class.border-blue-900]="!isWinningCell()"
          [class.group-hover:border-blue-400]="!disabled() && !value()"
          [class.bg-gradient-to-b]="!!value()"
          [class.from-amber-300]="value() === 'player'"
          [class.via-amber-400]="value() === 'player'"
          [class.to-amber-600]="value() === 'player'"
          [class.shadow-amber-500]="value() === 'player'"
          [class.from-rose-400]="value() === 'ai'"
          [class.via-rose-500]="value() === 'ai'"
          [class.to-rose-700]="value() === 'ai'"
          [class.shadow-rose-500]="value() === 'ai'"
          [class.ring-4]="isWinningCell()"
          [class.ring-amber-300]="isWinningCell()"
          [class.animate-bounce]="isWinningCell()"
        >
          @if (value()) {
            <!-- Inner gloss reflection -->
            <div class="w-3/4 h-3/4 rounded-full border border-white/30 flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-white/60 mb-2 mr-2"></div>
            </div>
          } @else if (!disabled()) {
            <!-- Ghost disc preview on hover -->
            <div class="w-3 h-3 rounded-full bg-blue-500/20 group-hover:bg-amber-400/30 transition-colors"></div>
          }
        </div>
      </button>
    } @else {
      <!-- Tic-Tac-Toe Square Tile -->
      <button
        type="button"
        class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center font-black text-4xl sm:text-5xl transition-all duration-200 select-none shadow-xl border-2"
        [class.bg-slate-900]="!value()"
        [class.border-slate-700]="!value() && !isWinningCell()"
        [class.hover:border-purple-500]="!disabled() && !value()"
        [class.hover:bg-slate-800]="!disabled() && !value()"
        [class.hover:scale-105]="!disabled() && !value()"
        [class.active:scale-95]="!disabled() && !value()"
        [class.cursor-pointer]="!disabled() && !value()"
        [class.cursor-not-allowed]="disabled() || !!value()"
        [class.bg-gradient-to-br]="!!value()"
        [class.from-cyan-950]="value() === 'player'"
        [class.to-slate-900]="value() === 'player'"
        [class.text-cyan-300]="value() === 'player'"
        [class.border-cyan-400]="value() === 'player' && !isWinningCell()"
        [class.shadow-cyan-900]="value() === 'player'"
        [class.from-rose-950]="value() === 'ai'"
        [class.to-slate-900]="value() === 'ai'"
        [class.text-rose-400]="value() === 'ai'"
        [class.border-rose-500]="value() === 'ai' && !isWinningCell()"
        [class.shadow-rose-900]="value() === 'ai'"
        [class.border-amber-400]="isWinningCell()"
        [class.bg-amber-950]="isWinningCell()"
        [class.text-amber-300]="isWinningCell()"
        [class.animate-pulse]="isWinningCell()"
        [class.ring-4]="isWinningCell()"
        [class.ring-amber-400/50]="isWinningCell()"
        [disabled]="disabled() || !!value()"
        (click)="onClick()"
      >
        @if (value() === 'player') {
          <span class="drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">X</span>
        } @else if (value() === 'ai') {
          <span class="drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]">O</span>
        }
      </button>
    }
  `,
})
export class ArcadeCellComponent {
  private ctx = injectJrContext();

  gameId = input<string>('tic-tac-toe');
  row = input<number>(0);
  col = input<number>(0);
  value = input<'player' | 'ai' | null>(null);
  isWinningCell = input<boolean>(false);
  disabled = input<boolean>(false);

  onClick() {
    if (this.disabled()) return;

    if (this.gameId() === 'connect-four') {
      // For Connect Four, drop in column
      this.ctx.emit('arcade:move', {
        col: this.col(),
      });
    } else {
      // For Tic-Tac-Toe, place at (row, col)
      if (this.value()) return;
      this.ctx.emit('arcade:move', {
        row: this.row(),
        col: this.col(),
      });
    }
  }
}
