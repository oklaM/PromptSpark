import { generateObject, streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import OpenAI from 'openai';

export interface AiAnalysisResult {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  content?: string;
}

export interface PromptDiagnosis {
  score: number;
  clarity: string;
  safety: string;
  logic: string;
  suggestions: string[];
}

export interface AiConfig {
  apiKey?: string;
  baseURL?: string;
  provider?: string;
  model?: string;
}

type AiProvider = 'deepseek' | 'gemini';

const KEYWORDS = {
  coding: [
    'function', 'code', 'api', 'class', 'import', 'const', 'var', 'let',
    'return', 'interface', 'sql', 'database', 'react', 'node', 'python',
    'java', 'css', 'html', 'json', 'xml', 'script',
  ],
  writing: [
    'story', 'write', 'essay', 'poem', 'blog', 'article', 'character',
    'plot', 'narrative', 'description', 'text', 'draft', 'copy',
  ],
  analysis: [
    'analyze', 'data', 'report', 'summary', 'chart', 'trend', 'statistics',
    'forecast', 'review', 'audit',
  ],
} as const;

const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';
const DEFAULT_GEMINI_MODEL = 'gemini-pro'; // Use stable gemini-pro model
const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

function getProvider(config?: AiConfig): AiProvider {
  const provider = config?.provider === 'auto' ? undefined : config?.provider;
  const envProvider = process.env.AI_PROVIDER as AiProvider | undefined;
  const modelHint = config?.model;

  if (modelHint?.startsWith('deepseek')) return 'deepseek';
  if (provider === 'deepseek') return 'deepseek';
  if (provider === 'gemini') return 'gemini';
  if (envProvider === 'deepseek') return 'deepseek';

  return 'gemini';
}

function getApiKey(provider: AiProvider, config?: AiConfig): string {
  const envKey = provider === 'deepseek'
    ? process.env.DEEPSEEK_API_KEY
    : process.env.AI_API_KEY;

  if (config?.apiKey) return config.apiKey;
  if (envKey) return envKey;

  throw new Error(`${provider === 'deepseek' ? 'DeepSeek' : 'Gemini'} API Key is required`);
}

function getBaseURL(config?: AiConfig): string {
  return config?.baseURL || process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL;
}

function createDeepSeekModel(config?: AiConfig) {
  const key = getApiKey('deepseek', config);
  const baseURL = getBaseURL(config);

  const client = createOpenAI({ apiKey: key, baseURL });
  return client.chat(config?.model || DEFAULT_DEEPSEEK_MODEL);
}

function createGeminiModel(config?: AiConfig) {
  const key = getApiKey('gemini', config);

  const client = createGoogleGenerativeAI({ apiKey: key });
  return client(config?.model || DEFAULT_GEMINI_MODEL);
}

export class AiService {
  private static getModel(config?: AiConfig) {
    const provider = getProvider(config);

    if (provider === 'deepseek') {
      return createDeepSeekModel(config);
    }

    return createGeminiModel(config);
  }

  /**
   * Diagnoses prompt quality and returns a score with detailed feedback.
   */
  static async diagnosePrompt(
    content: string,
    config?: AiConfig,
  ): Promise<PromptDiagnosis> {
    const diagnosisSchema = z.object({
      score: z.number().describe('Score from 0 to 100 based on overall quality'),
      clarity: z.string().describe('Short analysis of clarity'),
      safety: z.string().describe('Short analysis of potential safety issues'),
      logic: z.string().describe('Short analysis of logical gaps'),
      suggestions: z.array(z.string()).describe('List of 3 improvement suggestions'),
    });

    try {
      const model = this.getModel(config);
      const { object } = await generateObject({
        model,
        schema: diagnosisSchema,
        prompt: `Act as a strict Prompt Engineer. Analyze the following prompt for Clarity, Safety, and Logical consistency.\n\nPrompt: "${content}"`,
      });
      return object;
    } catch {
      return {
        score: 0,
        clarity: 'AI Diagnosis unavailable.',
        safety: 'Unable to check safety.',
        logic: 'Unable to check logic.',
        suggestions: ['Check your API configuration.'],
      };
    }
  }

  /**
   * Optimizes a prompt for better quality, detail, or specific goals.
   */
  static async optimizePrompt(
    content: string,
    goal: 'quality' | 'detail' | 'creative' | 'clarity' = 'quality',
    config?: AiConfig,
  ): Promise<{ original: string; optimized: string; changes: string[] }> {
    try {
      const model = this.getModel(config);

      // Check if using DeepSeek (doesn't support structured output)
      const provider = getProvider(config);
      const useStructured = provider === 'gemini';

      if (useStructured) {
        // Use generateObject for Gemini
        const optimizationSchema = z.object({
          optimized: z.string().describe('The fully optimized prompt text'),
          changes: z.array(z.string()).describe('List of key changes made'),
        });

        const { object } = await generateObject({
          model,
          schema: optimizationSchema,
          prompt: `Act as an Expert Prompt Engineer. OPTIMIZE the user's prompt to achieve the goal: "${goal.toUpperCase()}".
Guidelines:
- Maintain intent.
- Enhance descriptors.
- Fix grammar/logic.

Input Prompt: "${content}"`,
        });

        return {
          original: content,
          optimized: object.optimized,
          changes: object.changes,
        };
      } else {
        // Use generateText for DeepSeek (parse JSON response manually)
        const { text } = await generateText({
          model,
          prompt: `Act as an Expert Prompt Engineer. OPTIMIZE the user's prompt to achieve the goal: "${goal.toUpperCase()}".

Guidelines:
- Maintain intent.
- Enhance descriptors.
- Fix grammar/logic.

Input Prompt: "${content}"

IMPORTANT: Return your response as a JSON object with this exact format:
{
  "optimized": "the optimized prompt text",
  "changes": ["list of key changes made"]
}

Return ONLY the JSON, no other text.`,
        });

        // Parse JSON response
        let parsed: { optimized: string; changes: string[] };
        try {
          // Try to extract JSON from the response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            parsed = JSON.parse(text);
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', text);
          // Fallback: return original content with a note
          return {
            original: content,
            optimized: text.trim() || content,
            changes: ['Optimization completed (parsed from text response)'],
          };
        }

        return {
          original: content,
          optimized: parsed.optimized || content,
          changes: parsed.changes || ['Optimization completed'],
        };
      }
    } catch (error) {
      console.error('AI optimization failed:', error);
      throw new Error(`AI optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes prompt content to generate metadata.
   */
  static async analyzeContent(
    data: { content?: string; title?: string; description?: string },
    targetField?: string,
    config?: AiConfig,
  ): Promise<AiAnalysisResult> {
    const { content, title, description } = data;
    const context = `Context: ${title ? `Title: ${title}\n` : ''}${description ? `Description: ${description}\n` : ''}${content ? `Content: ${content}\n` : ''}`;

    try {
      const model = this.getModel(config);

      if (targetField === 'content') {
        const { text } = await generateText({
          model,
          prompt: `Act as an expert prompt engineer. ${content ? 'Improve and expand' : 'Create'} a high-quality prompt based on the context.\n${context}\nReturn ONLY the prompt text.`,
        });
        return { content: text };
      }

      const analysisSchema = z.object({
        title: z.string().describe('A concise, catchy title (max 50 chars)'),
        description: z.string().describe('A brief summary (max 120 chars)'),
        category: z.string().describe('One of ["writing", "coding", "analysis", "other"]'),
        tags: z.array(z.string()).describe('3-5 relevant tags'),
        content: z.string().optional().describe('Generated prompt text if requested'),
      });

      const { object } = await generateObject({
        model,
        schema: analysisSchema,
        prompt: `Analyze the provided context and generate metadata. \n${context}`,
      });

      return object;
    } catch {
      if (content) {
        return this.analyzeLocally(content);
      }
      return {};
    }
  }

  private static analyzeLocally(content: string): AiAnalysisResult {
    const lowerContent = content.toLowerCase();
    const tags = new Set<string>();
    let category = 'other';
    let maxKeywordCount = 0;

    for (const [cat, keywords] of Object.entries(KEYWORDS)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword)) {
          matchCount++;
          tags.add(keyword);
        }
      }
      if (matchCount > maxKeywordCount) {
        maxKeywordCount = matchCount;
        category = cat;
      }
    }

    const lines = content.split('\n').filter(line => line.trim().length > 0);
    let title = lines[0]?.substring(0, 50) || 'Untitled Prompt';
    if (title.length >= 50) title += '...';

    let description = content.replace(/\n/g, ' ').substring(0, 120);
    if (description.length >= 120) description += '...';

    return {
      title,
      description,
      category,
      tags: Array.from(tags).slice(0, 8),
    };
  }

  /**
   * Runs a prompt and returns a stream of generated content.
   */
  static async runPromptStream(
    prompt: string,
    config: AiConfig & { temperature?: number; maxTokens?: number } = {},
  ) {
    const model = this.getModel(config);
    const options: { temperature?: number; maxTokens?: number } = {};
    if (config.temperature !== undefined) {
      options.temperature = config.temperature;
    }
    // Note: maxTokens is not supported by all providers in Vercel AI SDK v6
    // It's passed through but may be ignored depending on the provider

    const result = await streamText({
      model,
      prompt,
      ...options,
    });

    return result.textStream;
  }

  static async getAvailableModels(): Promise<Array<{ id: string; name: string; provider: string; color: string }>> {
    const models: Array<{ id: string; name: string; provider: string; color: string }> = [];

    const deepSeekModels = await this.fetchDeepSeekModels();
    models.push(...deepSeekModels);

    const geminiModels = this.getGeminiModels();
    models.push(...geminiModels);

    return models;
  }

  private static async fetchDeepSeekModels(): Promise<Array<{ id: string; name: string; provider: string; color: string }>> {
    const deepSeekKey = process.env.DEEPSEEK_API_KEY;
    if (!deepSeekKey) return [];

    try {
      const openai = new OpenAI({
        apiKey: deepSeekKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      });
      const response = await openai.models.list();

      return response.data.map(model => ({
        id: model.id,
        name: model.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        provider: 'DeepSeek',
        color: model.id.includes('coder') ? 'bg-teal-600' : 'bg-blue-600',
      }));
    } catch {
      return [];
    }
  }

  private static getGeminiModels(): Array<{ id: string; name: string; provider: string; color: string }> {
    if (!process.env.AI_API_KEY) return [];

    return [
      { id: 'gemini-pro', name: 'Gemini 1.0 Pro', provider: 'Google', color: 'bg-violet-500' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', color: 'bg-blue-500' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', color: 'bg-indigo-600' },
    ];
  }
}
