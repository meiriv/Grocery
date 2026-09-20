// Discovery of the Gemini models a key can actually use.
//
// The app used to carry a hardcoded list of model names and pick the first one
// that answered. That silently pinned every user to whatever existed the day
// they saved their key, and knew nothing about models released since. Asking
// the API is the only answer that stays correct.

export interface GeminiModel {
  id: string;
  displayName: string;
  description?: string;
}

const MODELS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

// Fallback when no model has been chosen yet and the list cannot be reached
export const FALLBACK_MODEL = 'gemini-2.0-flash';

// Models that cannot do what this app needs (text in, small JSON out)
const UNUSABLE = /embedding|imagen|veo|tts|audio|image-generation/i;

interface ApiModel {
  name?: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

/**
 * List the models this API key may call with generateContent.
 * Throws when the key is rejected or the request fails.
 */
export async function listGenerativeModels(apiKey: string): Promise<GeminiModel[]> {
  const response = await fetch(
    `${MODELS_ENDPOINT}?pageSize=200&key=${encodeURIComponent(apiKey)}`
  );

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const data = (await response.json()) as { models?: ApiModel[] };
  const models = Array.isArray(data.models) ? data.models : [];

  return models
    .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
    .map(model => {
      const id = String(model.name || '').replace(/^models\//, '');
      return {
        id,
        displayName: model.displayName || id,
        description: model.description,
      };
    })
    .filter(model => model.id.length > 0 && !UNUSABLE.test(model.id))
    .sort((a, b) => score(b.id) - score(a.id) || a.id.localeCompare(b.id));
}

/**
 * Rank a model for this app's job: categorizing a few words of grocery text.
 * That wants the cheapest, fastest model of the newest generation - not the
 * strongest one. Scoring is derived from what the API returned, so a model
 * released tomorrow ranks itself.
 */
function score(id: string): number {
  let value = 0;

  // Stability outranks everything: a preview can be withdrawn, throttled or
  // changed under you, so a newer generation is not worth that risk as a
  // default. Previews are still offered in the picker, and still win when
  // nothing stable exists.
  if (!/preview|exp\b|-exp-/.test(id)) value += 1000;

  // Then the newest generation: gemini-3-... over gemini-2.5-...
  const generation = id.match(/gemini-(\d+(?:\.\d+)?)/);
  if (generation) {
    value += parseFloat(generation[1]) * 100;
  }

  if (/flash/.test(id)) value += 50;    // fast and cheap: what this task needs
  if (/pro/.test(id)) value += 10;      // usable, but slower and dearer
  if (/lite/.test(id)) value -= 5;      // weaker than plain flash
  if (/thinking/.test(id)) value -= 30; // pays for reasoning this never needs

  // Prefer the rolling alias over a pinned build (gemini-x-flash over -001)
  if (/-\d{3}$/.test(id)) value -= 3;
  if (/latest$/.test(id)) value -= 1;

  return value;
}

/** The model to use when the user has not chosen one. */
export function chooseDefaultModel(models: GeminiModel[]): string | null {
  if (models.length === 0) return null;
  // listGenerativeModels already returns them best-first
  return models[0].id;
}
