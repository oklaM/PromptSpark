import { generateObject, streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import OpenAI from 'openai'; // Used for listing models specific to OpenAI-compatible APIs

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

export class AiService {
  private static readonly KEYWORDS = {
    coding: ['function', 'code', 'api', 'class', 'import', 'const', 'var', 'let', 'return', 'interface', 'sql', 'database', 'react', 'node', 'python', 'java', 'css', 'html', 'json', 'xml', 'script'],
    writing: ['story', 'write', 'essay', 'poem', 'blog', 'article', 'character', 'plot', 'narrative', 'description', 'text', 'draft', 'copy'],
    analysis: ['analyze', 'data', 'report', 'summary', 'chart', 'trend', 'statistics', 'forecast', 'review', 'audit'],
    other: []
  };

  private static getModel(config: { apiKey?: string; baseURL?: string; provider?: string; model?: string }) {
    const provider = (config?.provider === 'auto' ? undefined : config?.provider) || process.env.AI_PROVIDER;
    const deepSeekKey = (provider === 'deepseek' ? config?.apiKey : undefined) || process.env.DEEPSEEK_API_KEY;
    const geminiKey = (provider === 'gemini' ? config?.apiKey : undefined) || process.env.AI_API_KEY;
    
    // Fallback keys if provider not strictly matched but key provided in config
    const apiKey = config?.apiKey;

    // Prioritize DeepSeek or OpenAI-compatible
    if (provider === 'deepseek' || (config?.model && config.model.startsWith('deepseek'))) {
       const key = deepSeekKey || apiKey;
       if (!key) throw new Error('DeepSeek API Key is required');
       
       const deepseek = createOpenAI({
           apiKey: key,
           baseURL: config?.baseURL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
       });
       return deepseek(config?.model || 'deepseek-chat');
    }

    // Default to Gemini
    const key = geminiKey || apiKey;
    if (!key) throw new Error('Gemini API Key is required');

    const google = createGoogleGenerativeAI({
        apiKey: key,
    });
    return google(config?.model || 'gemini-1.5-flash');
  }

  /**
   * Diagnoses prompt quality and returns a score with detailed feedback.
   */
  static async diagnosePrompt(
    content: string,
    config?: { apiKey?: string; baseURL?: string; provider?: string; model?: string }
  ): Promise<PromptDiagnosis> {
     const diagnosisSchema = z.object({
        score: z.number().describe('Score from 0 to 100 based on overall quality'),
        clarity: z.string().describe('Short analysis of clarity'),
        safety: z.string().describe('Short analysis of potential safety issues'),
        logic: z.string().describe('Short analysis of logical gaps'),
        suggestions: z.array(z.string()).describe('List of 3 improvement suggestions'),
     });

     try {
         const model = this.getModel(config || {});
         const { object } = await generateObject({
             model,
             schema: diagnosisSchema,
             prompt: `Act as a strict Prompt Engineer. Analyze the following prompt for Clarity, Safety, and Logical consistency.\n\nPrompt: "${content}"`,
         });
         return object;
     } catch (error) {
         console.error('Diagnosis Error:', error);
         return {
            score: 0,
            clarity: "AI Diagnosis unavailable.",
            safety: "Unable to check safety.",
            logic: "Unable to check logic.",
            suggestions: ["Check your API configuration."]
        };
     }
  }

  /**
   * Optimizes a prompt for better quality, detail, or specific goals.
   */
  static async optimizePrompt(
    content: string,
    goal: 'quality' | 'detail' | 'creative' | 'clarity' = 'quality',
    config?: { apiKey?: string; baseURL?: string; provider?: string; model?: string }
  ): Promise<{ original: string; optimized: string; changes: string[] }> {
    const optimizationSchema = z.object({
        optimized: z.string().describe('The fully optimized prompt text'),
        changes: z.array(z.string()).describe('List of key changes made'),
    });

    try {
        const model = this.getModel(config || {});
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
            changes: object.changes
        };
    } catch (error) {
        console.error('Optimization Error:', error);
        return {
            original: content,
            optimized: content,
            changes: ["AI service unavailable"]
        };
    }
  }

  /**
   * Analyzes prompt content to generate metadata.
   */
  static async analyzeContent(
    data: { content?: string; title?: string; description?: string }, 
    targetField?: string,
    config?: { apiKey?: string; baseURL?: string; provider?: string; model?: string }
  ): Promise<AiAnalysisResult> {
    const { content, title, description } = data;
    const context = `Context: ${title ? `Title: ${title}\n` : ''}${description ? `Description: ${description}\n` : ''}${content ? `Content: ${content}\n` : ''}`;

    try {
        const model = this.getModel(config || {});
        
        if (targetField === 'content') {
            const { text } = await generateText({
                model,
                prompt: `Act as an expert prompt engineer. ${content ? 'Improve and expand' : 'Create'} a high-quality prompt based on the context.\n${context}\nReturn ONLY the prompt text.`
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

    } catch (error) {
        console.error('Analysis Error:', error);
        // Fallback to local
        if (content) return this.analyzeLocally(content);
        return {};
    }
  }

  private static analyzeLocally(content: string): AiAnalysisResult {
    const lowerContent = content.toLowerCase();
    const tags = new Set<string>();
    let category = '';
    let maxKeywordCount = 0;

    for (const [cat, keywords] of Object.entries(this.KEYWORDS)) {
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
      category: category || 'other',
      tags: Array.from(tags).slice(0, 8)
    };
  }

  /**
   * Runs a prompt and returns a stream of generated content.
   */
  static async runPromptStream(
    prompt: string, 
    config: { temperature?: number, maxTokens?: number, model?: string, apiKey?: string, baseURL?: string, provider?: string } = {}
  ) {
    const model = this.getModel(config);
    const result = await streamText({
        model,
        prompt,
        temperature: config.temperature,
        // maxTokens: config.maxTokens,
    });
    
    return result.textStream;
  }

  static async getAvailableModels() {
    const models: Array<{ id: string, name: string, provider: string, color: string }> = [];
    
    // Check for DeepSeek
    const deepSeekKey = process.env.DEEPSEEK_API_KEY;
    if (deepSeekKey) {
      try {
        const openai = new OpenAI({
            apiKey: deepSeekKey,
            baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
        });
        const response = await openai.models.list();
        
        response.data.forEach(model => {
            models.push({
                id: model.id,
                name: model.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                provider: 'DeepSeek',
                color: model.id.includes('coder') ? 'bg-teal-600' : 'bg-blue-600'
            });
        });
      } catch (error) {
        console.error('Failed to fetch DeepSeek models:', error);
      }
    }

    // Check for Gemini
    if (process.env.AI_API_KEY) {
      models.push(
        { id: 'gemini-pro', name: 'Gemini 1.0 Pro', provider: 'Google', color: 'bg-violet-500' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', color: 'bg-blue-500' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', color: 'bg-indigo-600' }
      );
    }
    
    return models;
  }
}
