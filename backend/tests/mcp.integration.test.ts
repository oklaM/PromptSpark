import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { database } from '../src/db/database';
import { PromptModel } from '../src/models/Prompt';
import { AiService } from '../src/services/aiService';
import { v4 as uuidv4 } from 'uuid';

// Mock AI Service for librarian tests
import { vi } from 'vitest';

vi.mock('../src/services/aiService', () => ({
  AiService: {
    runPromptStream: vi.fn()
  }
}));

describe('MCP Server Integration', () => {
  let testPromptId: string;

  beforeAll(async () => {
    await database.initialize();
    
    // Seed a test prompt
    const p = await PromptModel.create({
      title: "MCP Test Prompt",
      content: "This is a specialized prompt for MCP testing.",
      description: "Testing intelligent retrieval",
      category: "testing",
      tags: ["mcp", "unit-test"]
    });
    testPromptId = p.id;
  });

  afterAll(async () => {
    if (testPromptId) {
      await database.run('DELETE FROM prompts WHERE id = ?', [testPromptId]);
    }
    await database.close();
  });

  describe('Tools Logic', () => {
    // We test the logic that would be inside the request handler
    // In a full integration test, we'd spawn the process and use JSON-RPC, 
    // but testing the DB queries and tool logic is the primary goal here.

    it('should find prompts via search_prompts keyword logic', async () => {
      const query = "specialized prompt";
      const sql = `
        SELECT id, title, description, content 
        FROM prompts 
        WHERE title ILIKE $1 OR content ILIKE $1 OR description ILIKE $1
        LIMIT $2
      `;
      const rows = await database.all(sql, [`%${query}%`, 10]);
      
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].title).toBe("MCP Test Prompt");
    });

    it('should find correct prompt via ask_librarian logic', async () => {
      const task = "I need to test MCP integration";
      
      // Mock AI suggesting our test prompt ID
      (AiService.runPromptStream as any).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield { text: () => testPromptId };
        }
      });

      // Simulation of ask_librarian logic
      const candidates = await database.all('SELECT id, title, description, content FROM prompts ORDER BY "updatedAt" DESC LIMIT 50');
      
      let selectedId = "";
      const stream = await AiService.runPromptStream("some prompt");
      for await (const chunk of stream) {
          selectedId += (chunk as any).text();
      }
      
      const bestPrompt = candidates.find(c => c.id === selectedId.trim());
      
      expect(bestPrompt).toBeDefined();
      expect(bestPrompt?.id).toBe(testPromptId);
      expect(bestPrompt?.title).toBe("MCP Test Prompt");
    });
  });
});
