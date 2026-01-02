// Core data model for a single captured image parameter set
export interface SparkPrompt {
  id: string;             // UUID
  sourceUrl: string;      // The page URL where it was captured
  previewImageUrl: string; // The image source URL (thumbnail)
  timestamp: number;
  
  // Parsed SD Parameters
  positivePrompt: string;
  negativePrompt: string;
  
  // Generation Metadata
  sampler: string;        // e.g., "DPM++ 2M Karras"
  model: string;          // e.g., "ChilloutMix_v1"
  seed: string;           // e.g., "3456789123"
  steps: number;
  cfgScale: number;
  
  // Advanced
  loras: Array<{ name: string; weight: number }>; // Parsed from prompt text e.g. <lora:name:0.8>
}

// Storage Schema
export interface SparkStorage {
  prompts: SparkPrompt[];
  settings: {
    autoCapture: boolean;
  };
}

/**
 * Parse Generation Data from text content
 */
export function parseGenerationData(rawText: string): Partial<SparkPrompt> {
  const result: Partial<SparkPrompt> = {};
  
  // Extract Steps
  const stepsMatch = rawText.match(/Steps:\s*(\d+)/i);
  if (stepsMatch) {
    result.steps = parseInt(stepsMatch[1], 10);
  }
  
  // Extract Sampler
  const samplerMatch = rawText.match(/Sampler:\s*([^,]+)/i);
  if (samplerMatch) {
    result.sampler = samplerMatch[1].trim();
  }
  
  // Extract CFG Scale
  const cfgMatch = rawText.match(/CFG\s*scale:\s*([\d.]+)/i);
  if (cfgMatch) {
    result.cfgScale = parseFloat(cfgMatch[1]);
  }
  
  // Extract Seed
  const seedMatch = rawText.match(/Seed:\s*(\d+)/i);
  if (seedMatch) {
    result.seed = seedMatch[1];
  }
  
  // Extract Model
  const modelMatch = rawText.match(/Model:\s*([^,\n]+)/i);
  if (modelMatch) {
    result.model = modelMatch[1].trim();
  }
  
  return result;
}

/**
 * Extract LoRA tags from prompt text
 */
export function extractLoras(promptText: string): Array<{ name: string; weight: number }> {
  const loraRegex = /<lora:([^:]+):([\d.]+)>/g;
  const loras: Array<{ name: string; weight: number }> = [];
  let match;
  
  while ((match = loraRegex.exec(promptText)) !== null) {
    loras.push({
      name: match[1],
      weight: parseFloat(match[2])
    });
  }
  
  return loras;
}

/**
 * Parse positive and negative prompts from HTML content
 */
export function parsePromptsFromHtml(html: HTMLElement): { positive: string; negative: string } {
  let positive = '';
  let negative = '';
  
  // Try to find prompt containers
  const promptContainers = html.querySelectorAll('.prompt-container, .prompt, .generation-info, [class*="prompt"]');
  
  promptContainers.forEach(container => {
    const text = container.textContent || '';
    
    // Look for positive/negative prompt indicators
    if (text.includes('Positive prompt:') || text.includes('Positive:')) {
      const parts = text.split(/Positive\s*prompt?:\s*/i);
      if (parts[1]) {
        const negPart = parts[1].split(/Negative\s*prompt?:\s*/i);
        positive = negPart[0].trim();
        if (negPart[1]) {
          negative = negPart[1].trim();
        }
      }
    } else if (text.includes('Negative prompt:') || text.includes('Negative:')) {
      if (!positive) {
        // Try to get positive prompt from previous element
        const prevElement = container.previousElementSibling;
        if (prevElement) {
          positive = prevElement.textContent?.trim() || '';
        }
      }
      const negMatch = text.match(/Negative\s*prompt?:\s*(.+)/i);
      if (negMatch) {
        negative = negMatch[1].trim();
      }
    } else if (!positive && !negative) {
      // Fallback: assume this is the positive prompt
      positive = text.trim();
    }
  });
  
  return { positive, negative };
}

/**
 * Generate UUID for SparkPrompt
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
