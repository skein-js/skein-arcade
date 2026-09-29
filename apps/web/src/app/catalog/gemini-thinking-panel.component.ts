import { Component, computed, inject, input, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArcadeSessionService } from '../services/arcade-session.service';

const SNARKY_THINKING_LINES = [
  'Simulating 14,000,605 timelines to dismantle that move...',
  'Scanning board state... Wait, did you actually just click there?',
  'Consulting Gemini neural core: Preparing maximum emotional damage...',
  'Processing your audacity... Silicon neurons tingling with amusement.',
  'Calculating counter-trap... Resistance is mathematically inadvisable.',
  'Evaluating your strategy... Bold move, human. Let us test its resilience.',
  'Running tactical foresight routines... Victory probability recalculating.',
  'Consulting the Arcade High Score Council on your insolence...',
];

function cleanSimpleThought(thought: string | undefined): string {
  if (!thought) return '';

  // Clean out any stray markdown code fences, JSON blocks, or prompt mechanics
  let cleaned = thought
    .replace(/```json[\s\S]*?```/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .replace(/TASK:[\s\S]*?Return ONLY valid JSON/gi, '')
    .replace(/^Thinking Process:[\s\S]*?(?=\n\n|$)/i, '')
    .replace(/\*\*/g, '')
    .trim();

  // If it's a huge dump, extract just the high-level summary or first 2 core sentences
  if (cleaned.length > 250) {
    const sentences = cleaned.split(/(?<=[.?!])\s+/);
    // Take first 2 meaningful sentences that don't talk about JSON or internal mechanics
    const good = sentences
      .filter(s => {
        const lower = s.toLowerCase();
        return !lower.includes('json') && !lower.includes('output') && !lower.includes('difficulty') && !lower.includes('keys');
      })
      .slice(0, 2);
    if (good.length > 0) {
      cleaned = good.join(' ');
    }
  }

  return cleaned;
}

@Component({
  selector: 'app-gemini-thinking-panel',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'w-full max-w-xl mt-6 flex justify-center select-none',
  },
  template: `
    <div
      class="w-full rounded-2xl bg-slate-900/90 border shadow-2xl backdrop-blur-md transition-all duration-300 overflow-hidden"
      [class.border-purple-500/60]="isThinking()"
      [class.shadow-purple-950/60]="isThinking()"
      [class.border-slate-800]="!isThinking()"
    >
      <!-- Panel Header -->
      <div class="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-md transition-all"
            [class.bg-purple-600]="!isThinking()"
            [class.text-white]="!isThinking()"
            [class.bg-gradient-to-tr]="isThinking()"
            [class.from-purple-500]="isThinking()"
            [class.to-cyan-400]="isThinking()"
            [class.animate-pulse]="isThinking()"
          >
            🧠
          </div>
          <div>
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              Gemini AI Strategy & Thinking
              @if (isThinking()) {
                <span class="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-normal">
                  <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  Processing Turn...
                </span>
              }
            </h3>
            <p class="text-xs text-slate-400 font-mono">
              {{ model() || 'Gemini 3.5 Flash' }} • {{ difficulty() | uppercase }} MODE
            </p>
          </div>
        </div>

        @if ((rawThought() || thought()) && !isThinking()) {
          <button
            type="button"
            class="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            (click)="showRaw.set(!showRaw())"
          >
            <span>{{ showRaw() ? '▲ Simple View' : '▼ Inspect Raw Trace' }}</span>
          </button>
        }
      </div>

      <!-- Thinking Live State -->
      @if (isThinking()) {
        <div class="p-6 flex flex-col items-center justify-center text-center gap-3.5">
          <div class="flex items-center gap-3 text-cyan-300 font-mono text-sm">
            <span class="w-3 h-3 rounded-full bg-cyan-400 animate-bounce"></span>
            <span class="w-3 h-3 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
            <span class="w-3 h-3 rounded-full bg-purple-400 animate-bounce delay-300"></span>
          </div>

          <!-- Bigger snarky waiting quote -->
          <p class="text-base sm:text-lg font-semibold text-slate-100 italic transition-all max-w-md">
            "{{ activeSnarkyLine() }}"
          </p>

          <div class="w-full max-w-sm bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 mt-1">
            <div class="bg-gradient-to-r from-purple-500 via-cyan-400 to-indigo-500 h-full w-full animate-pulse"></div>
          </div>
          <span class="text-xs text-slate-400 font-mono">Controls locked while Gemini calculates its counter-move</span>
        </div>
      } @else if (thought() || rawThought()) {
        <!-- Display Content -->
        <div class="p-5 sm:p-6">
          @if (showRaw()) {
            <!-- RAW Full Chain-of-Thought Tracing -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs text-slate-400 font-mono pb-1 border-b border-slate-800">
                <span>RAW MODEL REASONING TRACE</span>
                <span>{{ (rawThought() || thought())?.length || 0 }} chars</span>
              </div>
              <pre class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap select-text shadow-inner">{{ rawThought() || thought() }}</pre>
            </div>
          } @else {
            <!-- Simple, Clean, High-Level Tactical Strategy (Bigger Text!) -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span class="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                  Tactical Assessment
                </span>
              </div>

              <!-- Bigger, comfortable, readable font for thought -->
              <p class="text-base sm:text-lg md:text-xl font-medium text-slate-100 leading-relaxed select-text">
                {{ simpleThought() }}
              </p>
            </div>
          }

          @if (snarkyComment()) {
            <div class="mt-4 pt-3.5 border-t border-slate-800/80 flex items-start gap-3 text-purple-200 bg-purple-950/25 p-3.5 rounded-xl border border-purple-500/25">
              <span class="text-xl">💬</span>
              <div class="flex-1">
                <span class="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono block mb-0.5">
                  Arcade Trash-Talk
                </span>
                <span class="text-base sm:text-lg font-medium italic text-slate-200">
                  "{{ snarkyComment() }}"
                </span>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Initial Idle State -->
        <div class="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
          <span class="text-2xl">🕹️</span>
          <p class="text-base sm:text-lg font-semibold text-slate-200">Your move, challenger!</p>
          <p class="text-xs sm:text-sm text-slate-400">
            Place your mark on the board. Gemini AI will evaluate your tactics and plan its counter-attack here.
          </p>
        </div>
      }
    </div>
  `,
})
export class GeminiThinkingPanelComponent implements OnInit, OnDestroy {
  protected readonly session = inject(ArcadeSessionService);

  thought = input<string | undefined>(undefined);
  rawThought = input<string | undefined>(undefined);
  model = input<string | undefined>(undefined);
  difficulty = input<'casual' | 'smart' | 'grandmaster'>('casual');
  snarkyComment = input<string | undefined>(undefined);

  isThinking = computed(() => this.session.isLoading());
  showRaw = signal(false);

  simpleThought = computed(() => cleanSimpleThought(this.thought()));

  activeSnarkyLine = signal(SNARKY_THINKING_LINES[0]);
  private intervalId: any = null;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      if (this.isThinking()) {
        const next =
          SNARKY_THINKING_LINES[
            Math.floor(Math.random() * SNARKY_THINKING_LINES.length)
          ];
        this.activeSnarkyLine.set(next);
      }
    }, 2400);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
