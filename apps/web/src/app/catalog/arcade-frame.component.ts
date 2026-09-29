import { Component, input } from '@angular/core';

@Component({
  selector: 'app-arcade-frame',
  standalone: true,
  host: {
    class: 'w-full flex flex-col items-center mb-4',
  },
  template: `
    <header class="text-center">
      <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
        {{ title() }}
      </h2>
      @if (subtitle()) {
        <span class="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-purple-950/80 text-purple-300 border border-purple-500/30">
          {{ subtitle() }}
        </span>
      }
    </header>
  `,
})
export class ArcadeFrameComponent {
  title = input<string>('Arcade Arena');
  subtitle = input<string | undefined>(undefined);
  gameId = input<string | undefined>(undefined);
  difficulty = input<'casual' | 'smart' | 'grandmaster' | undefined>(undefined);
}
