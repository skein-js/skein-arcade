import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-dialogue',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'w-full max-w-xl mb-6 flex justify-center',
  },
  template: `
    <div class="w-full p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 shadow-xl backdrop-blur-md">
      <div class="flex items-start gap-3.5">
        <!-- AI Avatar -->
        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shrink-0">
          AI
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-purple-300 tracking-wide">
                {{ agentName() }}
              </span>
              @if (source()) {
                <span class="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {{ source() }}
                </span>
              }
            </div>

            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border"
              [class.bg-purple-950]="mood() === 'neutral'"
              [class.text-purple-300]="mood() === 'neutral'"
              [class.border-purple-500/40]="mood() === 'neutral'"
              [class.bg-amber-950]="mood() === 'smug'"
              [class.text-amber-300]="mood() === 'smug'"
              [class.border-amber-500/40]="mood() === 'smug'"
              [class.bg-rose-950]="mood() === 'competitive'"
              [class.text-rose-300]="mood() === 'competitive'"
              [class.border-rose-500/40]="mood() === 'competitive'"
              [class.bg-emerald-950]="mood() === 'encouraging'"
              [class.text-emerald-300]="mood() === 'encouraging'"
              [class.border-emerald-500/40]="mood() === 'encouraging'"
            >
              {{ mood() }}
            </span>
          </div>

          <!-- Bigger speech dialogue -->
          <p class="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
            "{{ message() }}"
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AgentDialogueComponent {
  agentName = input<string>('Gemini Arcade AI');
  message = input<string>('');
  thought = input<string | undefined>(undefined);
  mood = input<'smug' | 'competitive' | 'encouraging' | 'surprised' | 'neutral'>('neutral');
  difficulty = input<'casual' | 'smart' | 'grandmaster'>('casual');
  source = input<string | undefined>(undefined);
  isThinking = input<boolean>(false);
}
