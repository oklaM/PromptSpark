import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const apiKey = process.env.AI_API_KEY;
    const content = data.content || '';

    if (aiProvider === 'gemini' && apiKey) {
       try {
         return await this.callGemini(data, apiKey, targetField);
       } catch (error) {
         console.error('AI Service Error:', error);
         // Fallback to local if AI fails
       }
    }

    // Fallback to local heuristics
    return this.analyzeLocally(content);
  }

  private static async callGemini(data: { content?: string; title?: string; description?: string }, apiKey: string, targetField?: string): Promise<AiAnalysisResult> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const { content, title, description } = data;

    let prompt = '';
    const context = `
Context Provided:
${title ? `- Title: ${title}` : ''}
${description ? `- Description: ${description}` : ''}
${content ? `- Content: ${content}` : ''}
`;

    // Scenario 1: User wants to generate/improve specific content
    if (targetField === 'content') {
        if (content) {
            prompt = `Act as an expert prompt engineer. Improve, polish, and expand the following prompt content to make it more effective, clear, and professional.
${context}

Return a JSON object with a single key:
- content: The improved prompt text.

Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON string.`;
        } else {
             prompt = `Act as an expert prompt engineer. Create a high-quality, detailed prompt based on the provided Title and/or Description.
${context}

Return a JSON object with a single key:
- content: The generated prompt text.

Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON string.`;
        }
    } 
    // Scenario 2: User wants to generate metadata (or everything)
    else {
        // If content is missing, we need to generate it too
        const generateContent = !content;
        
        prompt = `Analyze the provided context and generate metadata${generateContent ? ' AND the prompt content itself' : ''} in strict JSON format.
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
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean up potential markdown code blocks
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr) as AiAnalysisResult;
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Invalid AI response format');
    }
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
}
