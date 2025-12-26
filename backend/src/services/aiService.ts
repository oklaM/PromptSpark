import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface AiAnalysisResult {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  content?: string;
}

export class AiService {
  private static readonly KEYWORDS = {
    coding: ['function', 'code', 'api', 'class', 'import', 'const', 'var', 'let', 'return', 'interface', 'sql', 'database', 'react', 'node', 'python', 'java', 'css', 'html', 'json', 'xml', 'script'],
    writing: ['story', 'write', 'essay', 'poem', 'blog', 'article', 'character', 'plot', 'narrative', 'description', 'text', 'draft', 'copy'],
    analysis: ['analyze', 'data', 'report', 'summary', 'chart', 'trend', 'statistics', 'forecast', 'review', 'audit'],
    other: []
  };

  /**
   * Analyzes prompt content to generate metadata.
   * Uses external AI if configured, otherwise falls back to local heuristics.
   */
  static async analyzeContent(data: { content?: string; title?: string; description?: string }, targetField?: string): Promise<AiAnalysisResult> {
    const aiProvider = process.env.AI_PROVIDER;
    const geminiKey = process.env.AI_API_KEY;
    const deepSeekKey = process.env.DEEPSEEK_API_KEY;
    const content = data.content || '';

    // 1. Try Configured Provider (If explicitly set to deepseek, or not set but deepseek key exists)
    if ((aiProvider === 'deepseek' || !aiProvider) && deepSeekKey) {
        try {
            return await this.callDeepSeek(data, deepSeekKey, targetField);
        } catch (error) {
            console.error('AI Service Error (DeepSeek):', error);
        }
    } else if (aiProvider === 'gemini' && geminiKey) {
       try {
         return await this.callGemini(data, geminiKey, targetField);
       } catch (error) {
         console.error('AI Service Error (Gemini):', error);
       }
    }

    // 2. Fallback: Try whatever key is available, prioritizing DeepSeek
    if (deepSeekKey) {
         try {
            return await this.callDeepSeek(data, deepSeekKey, targetField);
        } catch (error) {
            console.error('AI Service Error (DeepSeek Fallback):', error);
        }
    }

    if (geminiKey) {
        try {
            return await this.callGemini(data, geminiKey, targetField);
        } catch (error) {
            console.error('AI Service Error (Gemini Fallback):', error);
        }
    }

    // 3. Final Fallback: Local Heuristics
    return this.analyzeLocally(content);
  }

  private static getAnalysisPrompt(data: { content?: string; title?: string; description?: string }, targetField?: string): string {
    const { content, title, description } = data;
    const context = `
Context Provided:
${title ? `- Title: ${title}` : ''}
${description ? `- Description: ${description}` : ''}
${content ? `- Content: ${content}` : ''}
`;

    if (targetField === 'content') {
        if (content) {
            return `Act as an expert prompt engineer. Improve, polish, and expand the following prompt content to make it more effective, clear, and professional.
${context}

Return a JSON object with a single key:
- content: The improved prompt text.

Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON string.`;
        } else {
             return `Act as an expert prompt engineer. Create a high-quality, detailed prompt based on the provided Title and/or Description.
${context}

Return a JSON object with a single key:
- content: The generated prompt text.

Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON string.`;
        }
    } else {
        const generateContent = !content;
        let prompt = `Analyze the provided context and generate metadata${generateContent ? ' AND the prompt content itself' : ''} in strict JSON format.
${context}

Return a JSON object with the following keys:
- title: A concise, catchy title (max 50 chars).
- description: A brief summary of what the prompt does (max 120 chars).
- category: One of ["writing", "coding", "analysis", "other"].
- tags: An array of 3-5 relevant tags (strings).
${generateContent ? '- content: A high-quality, detailed prompt text based on the title/description.' : ''}

Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON string.`;

        if (targetField) {
            prompt += `\n\nFocus especially on generating a high-quality "${targetField}".`;
        }
        return prompt;
    }
  }

  private static parseAiResponse(text: string): AiAnalysisResult {
      try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr) as AiAnalysisResult;
      } catch (e) {
        console.error('Failed to parse AI response:', text);
        throw new Error('Invalid AI response format');
      }
  }

  private static async callGemini(data: { content?: string; title?: string; description?: string }, apiKey: string, targetField?: string): Promise<AiAnalysisResult> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = this.getAnalysisPrompt(data, targetField);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return this.parseAiResponse(text);
  }

  private static async callDeepSeek(data: { content?: string; title?: string; description?: string }, apiKey: string, targetField?: string): Promise<AiAnalysisResult> {
    const openai = new OpenAI({
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    });

    const prompt = this.getAnalysisPrompt(data, targetField);

    const response = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'deepseek-chat',
    });

    const text = response.choices[0].message.content || '';
    return this.parseAiResponse(text);
  }

  private static analyzeLocally(content: string): AiAnalysisResult {
    const lowerContent = content.toLowerCase();
    const tags = new Set<string>();
    let category = '';
    let maxKeywordCount = 0;

    // Detect Category and Tags
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

    // Generate Title (First line or summary)
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    let title = lines[0]?.substring(0, 50) || 'Untitled Prompt';
    if (title.length >= 50) title += '...';

    // Generate Description (First few sentences)
    let description = content.replace(/\n/g, ' ').substring(0, 120);
    if (description.length >= 120) description += '...';

    return {
      title,
      description,
      category: category || 'other',
      tags: Array.from(tags).slice(0, 8) // Limit to top 8 tags
    };
  }

  /**
   * Runs a prompt and returns a stream of generated content.
   */
  static async runPromptStream(prompt: string, config: { temperature?: number, maxTokens?: number, model?: string } = {}, userApiKey?: string) {
    let modelName = config.model;
    const deepSeekKey = userApiKey || process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY;
    const geminiKey = userApiKey || process.env.AI_API_KEY;

    // Default model selection logic
    if (!modelName) {
        if (process.env.DEEPSEEK_API_KEY) {
            modelName = 'deepseek-chat';
        } else {
            modelName = 'gemini-pro';
        }
    }

    if (modelName.startsWith('deepseek')) {
        if (!deepSeekKey) throw new Error('DeepSeek API Key is required');

        const openai = new OpenAI({
            apiKey: deepSeekKey,
            baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
        });

        const stream = await openai.chat.completions.create({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            stream: true,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
        });

        return this.adaptOpenAIStream(stream);
    }

    // Default to Gemini
    if (!geminiKey) {
      throw new Error('Gemini API Key is required');
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
        }
    });

    const result = await model.generateContentStream(prompt);
    return result.stream;
  }

  private static async *adaptOpenAIStream(stream: any) {
    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        yield {
            text: () => content
        };
    }
  }

  static async getAvailableModels() {
    const models: Array<{ id: string, name: string, provider: string, color: string }> = [];
    
    // Check for DeepSeek First
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

    // Check for Gemini Second
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
