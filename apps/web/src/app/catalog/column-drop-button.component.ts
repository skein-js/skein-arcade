import { Component, input } from '@angular/core';
import { injectJrContext } from '@ng-json-render/core';

@Component({
  selector: 'app-column-drop-button',
  standalone: true,
  host: {
    class: 'flex items-center justify-center w-full py-1',
  },
  template: `
    <button
      type="button"
      class="group relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-12 rounded-xl bg-slate-800/90 border-2 border-indigo-500/40 hover:border-cyan-400 hover:bg-cyan-500/20 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all duration-200 flex flex-col items-center justify-center shadow-lg shadow-indigo-950/50 hover:shadow-arcade-cyan cursor-pointer"
      [disabled]="disabled()"
      (click)="onClick()"
      title="Drop piece into column {{ col() + 1 }}"
    >
      <span class="text-xs font-bold text-indigo-300 group-hover:text-cyan-300 transition-colors uppercase font-arcade text-[9px] mb-0.5">
        {{ col() + 1 }}
      </span>
      <span class="text-sm sm:text-base text-cyan-400 group-hover:translate-y-0.5 transition-transform font-black leading-none">
        ▼
      </span>
    </button>
  `,
})
export class ColumnDropButtonComponent {
  private ctx = injectJrContext();

  col = input<number>(0);
  disabled = input<boolean>(false);

  onClick() {
    if (this.disabled()) return;
    this.ctx.emit('arcade:move', {
      col: this.col(),
    });
  }
}
