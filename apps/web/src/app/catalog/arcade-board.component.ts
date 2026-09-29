import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { injectJrContext } from '@ng-json-render/core';
import { ArcadeSessionService } from '../services/arcade-session.service';

@Component({
  selector: 'app-arcade-board',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'w-full flex flex-col items-center',
  },
  template: `
    @if (gameId() === 'connect-four') {
      <!-- Connect Four Board -->
      <div class="flex flex-col items-center select-none relative">
        <!-- Drop Buttons Row -->
        <div class="grid grid-cols-7 gap-2 sm:gap-3 mb-2.5 w-full">
          @for (col of dropColumns(); track col) {
            <button
              type="button"
              class="h-10 sm:h-12 rounded-xl bg-slate-800/90 hover:bg-indigo-600 disabled:opacity-20 disabled:pointer-events-none text-indigo-300 hover:text-white flex items-center justify-center font-bold text-sm sm:text-base border border-slate-700/80 hover:border-indigo-400 transition-all duration-150 shadow-md cursor-pointer active:scale-95"
              [disabled]="!canInteract() || isColumnFull(col)"
              (click)="onColumnClick(col)"
              title="Drop piece in column {{ col + 1 }}"
            >
              ↓
            </button>
          }
        </div>

        <!-- 7x6 Matrix Frame -->
        <div
          class="p-3 sm:p-5 rounded-3xl bg-blue-950/90 border-2 transition-all duration-300 shadow-2xl backdrop-blur-md relative"
          [class.border-blue-600/60]="!isThinking()"
          [class.border-cyan-500/70]="isThinking()"
          [class.shadow-cyan-950/50]="isThinking()"
        >
          <div class="grid grid-cols-7 gap-2 sm:gap-3">
            @for (row of displayBoard(); track r; let r = $index) {
              @for (val of row; track c; let c = $index) {
                <button
                  type="button"
                  class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all p-0.5"
                  [class.cursor-pointer]="canInteract() && !isColumnFull(c)"
                  [class.cursor-not-allowed]="!canInteract() || isColumnFull(c)"
                  [disabled]="!canInteract() || isColumnFull(c)"
                  (click)="onColumnClick(c)"
                >
                  <div
                    class="w-full h-full rounded-full transition-all duration-200"
                    [class.bg-slate-950]="!val"
                    [class.border]="true"
                    [class.border-blue-900]="!isWinning(r, c)"
                    [class.bg-gradient-to-b]="!!val"
                    [class.from-amber-300]="val === 'player'"
                    [class.to-amber-500]="val === 'player'"
                    [class.shadow-md]="val === 'player'"
                    [class.from-rose-400]="val === 'ai'"
                    [class.to-rose-600]="val === 'ai'"
                    [class.shadow-md]="val === 'ai'"
                    [class.ring-4]="isWinning(r, c)"
                    [class.ring-amber-300]="isWinning(r, c)"
                    [class.animate-bounce]="isWinning(r, c)"
                    [class.animate-pulse]="isOptimistic(r, c)"
                  ></div>
                </button>
              }
            }
          </div>
        </div>
      </div>
    } @else {
      <!-- Tic-Tac-Toe 3x3 Board -->
      <div class="flex flex-col items-center select-none relative">
        <div
          class="grid grid-cols-3 gap-3 p-3 sm:p-4 rounded-3xl bg-slate-900/90 border transition-all duration-300 shadow-2xl backdrop-blur-md"
          [class.border-slate-800]="!isThinking()"
          [class.border-purple-500/50]="isThinking()"
          [class.shadow-purple-950/40]="isThinking()"
        >
          @for (row of displayBoard(); track r; let r = $index) {
            @for (val of row; track c; let c = $index) {
              <button
                type="button"
                class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center font-black text-4xl sm:text-5xl transition-all duration-150 shadow-lg border"
                [class.bg-slate-950]="!val"
                [class.border-slate-800]="!val && !isWinning(r, c)"
                [class.hover:border-purple-500]="canInteract() && !val"
                [class.hover:bg-slate-900]="canInteract() && !val"
                [class.cursor-pointer]="canInteract() && !val"
                [class.cursor-not-allowed]="!canInteract() || !!val"
                [class.bg-cyan-950/40]="val === 'player'"
                [class.border-cyan-500/50]="val === 'player' && !isWinning(r, c)"
                [class.text-cyan-400]="val === 'player'"
                [class.bg-rose-950/40]="val === 'ai'"
                [class.border-rose-500/50]="val === 'ai' && !isWinning(r, c)"
                [class.text-rose-400]="val === 'ai'"
                [class.bg-amber-950/80]="isWinning(r, c)"
                [class.border-amber-400]="isWinning(r, c)"
                [class.text-amber-300]="isWinning(r, c)"
                [class.ring-4]="isWinning(r, c)"
                [class.ring-amber-400/50]="isWinning(r, c)"
                [class.animate-pulse]="isWinning(r, c) || isOptimistic(r, c)"
                [disabled]="!canInteract() || !!val"
                (click)="onCellClick(r, c)"
              >
                @if (val === 'player') {
                  <span class="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">X</span>
                } @else if (val === 'ai') {
                  <span class="drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">O</span>
                }
              </button>
            }
          }
        </div>
      </div>
    }
  `,
})
export class ArcadeBoardComponent {
  private ctx = injectJrContext();
  protected readonly session = inject(ArcadeSessionService);

  gameId = input<string>('tic-tac-toe');
  rows = input<number>(3);
  cols = input<number>(3);
  board = input<(('player' | 'ai') | null)[][]>([]);
  winningLine = input<[number, number][]>([]);
  isGameOver = input<boolean>(false);
  isInteractive = input<boolean>(true);

  // Optimistic Move State: reflects the player's move immediately
  optimisticMove = signal<{ r: number; c: number } | null>(null);

  isThinking = computed(() => this.session.isLoading());

  canInteract = computed(
    () =>
      this.isInteractive() &&
      !this.isGameOver() &&
      !this.isThinking() &&
      this.optimisticMove() === null
  );

  displayBoard = computed(() => {
    const rawBoard = this.board();
    const opt = this.optimisticMove();
    if (!rawBoard || rawBoard.length === 0) return [];
    if (!opt) return rawBoard;

    return rawBoard.map((row, r) =>
      row.map((cell, c) => (r === opt.r && c === opt.c ? 'player' : cell))
    );
  });

  dropColumns = computed(() => Array.from({ length: this.cols() }, (_, i) => i));

  constructor() {
    // When the board input updates from server with real state, reset optimistic move
    effect(() => {
      this.board();
      this.optimisticMove.set(null);
    });

    // Revert optimistic move if error occurs
    effect(() => {
      if (!this.session.isLoading() && this.session.errorMessage()) {
        this.optimisticMove.set(null);
      }
    });
  }

  isOptimistic(r: number, c: number): boolean {
    const opt = this.optimisticMove();
    return !!opt && opt.r === r && opt.c === c;
  }

  isWinning(r: number, c: number): boolean {
    const line = this.winningLine() || [];
    return line.some(([wr, wc]) => wr === r && wc === c);
  }

  isColumnFull(c: number): boolean {
    const b = this.displayBoard();
    if (!b || b.length === 0) return false;
    return b[0]?.[c] !== null;
  }

  onCellClick(r: number, c: number) {
    if (!this.canInteract() || this.displayBoard()[r]?.[c] !== null) return;

    // Immediately reflect player move!
    this.optimisticMove.set({ r, c });
    this.ctx.emit('arcade:move', { row: r, col: c });
  }

  onColumnClick(c: number) {
    if (!this.canInteract() || this.isColumnFull(c)) return;

    // Find the lowest empty row in column c
    const b = this.board();
    let targetRow = -1;
    for (let r = this.rows() - 1; r >= 0; r--) {
      if (b[r]?.[c] === null) {
        targetRow = r;
        break;
      }
    }

    if (targetRow >= 0) {
      this.optimisticMove.set({ r: targetRow, c });
    }
    this.ctx.emit('arcade:move', { col: c });
  }
}
