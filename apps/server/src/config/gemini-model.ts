export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * The single Gemini model the arcade plays with. There is deliberately no
 * fallback: if this model fails, the error is surfaced instead of silently
 * downgrading to a weaker model.
 */
export function getConfiguredModel(): string {
  return process.env['GEMINI_MODEL']?.trim() || DEFAULT_GEMINI_MODEL;
}

export function assertSupportedModel(model: string = getConfiguredModel()): void {
  if (!model.startsWith('gemini-3')) {
    throw new Error(
      `GEMINI_MODEL="${model}" is not supported. Skein Arcade requires a Gemini 3 family model (e.g. ${DEFAULT_GEMINI_MODEL}, gemini-3.1-pro).`,
    );
  }
}
