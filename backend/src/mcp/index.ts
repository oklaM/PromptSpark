#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { database } from "../db/database.js";
import { AiService } from "../services/aiService.js";

console.error("Starting PromptSpark MCP Server...");

// Ensure DB is ready
async function main() {
  try {
    await database.initialize();
    console.error("Database connected.");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }

  const server = new Server(
    {
      name: "promptspark-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  // --- Resources ---

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const prompts = await database.all('SELECT id, title, description FROM prompts ORDER BY "updatedAt" DESC LIMIT 50');
    return {
      resources: prompts.map((p) => ({
        uri: `promptspark://prompts/${p.id}`,
        name: p.title,
        description: p.description,
        mimeType: "application/json",
      })),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    const id = url.pathname.replace(/^\//, "");
    const prompt = await database.get("SELECT * FROM prompts WHERE id = $1", [id]);

    if (!prompt) {
      throw new McpError(ErrorCode.InvalidRequest, `Prompt not found: ${id}`);
    }

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(prompt, null, 2),
        },
      ],
    };
  });

  // --- Prompts (MCP "Prompts" capability) ---

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const prompts = await database.all('SELECT id, title, description FROM prompts LIMIT 20');
    return {
      prompts: prompts.map((p) => ({
        name: p.title,
        description: p.description,
        arguments: [
          {
            name: "variables",
            description: "JSON string of variables to inject if template uses {{variable}} syntax",
            required: false,
          }
        ],
      })),
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const title = request.params.name;
    const prompt = await database.get("SELECT * FROM prompts WHERE title = $1", [title]);

    if (!prompt) {
      throw new McpError(ErrorCode.InvalidRequest, `Prompt template not found: ${title}`);
    }

    // Basic variable substitution
    let content = prompt.content;
    if (request.params.arguments?.variables) {
      try {
        const vars = JSON.parse(request.params.arguments.variables);
        Object.entries(vars).forEach(([key, val]) => {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
        });
      } catch (e) {
        // Ignore parse errors
      }
    }

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: content,
          },
        },
      ],
    };
  });

  // --- Tools ---

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_prompts",
          description: "Search for prompts in the PromptSpark library using SQL keywords.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search keywords (title or content)" },
              limit: { type: "number", description: "Max results (default 10)" },
            },
            required: ["query"],
          },
        },
        {
          name: "ask_librarian",
          description: "Intelligently find the best prompt for a specific task using AI analysis.",
          inputSchema: {
            type: "object",
            properties: {
              task: { type: "string", description: "Description of what you want to achieve (e.g., 'Write a python script to scrape a website')" },
            },
            required: ["task"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case "search_prompts": {
        const query = String(request.params.arguments?.query);
        const limit = Number(request.params.arguments?.limit) || 10;
        
        const sql = `
          SELECT id, title, description, content 
          FROM prompts 
          WHERE title ILIKE $1 OR content ILIKE $1 OR description ILIKE $1
          LIMIT $2
        `;
        const rows = await database.all(sql, [`%${query}%`, limit]);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };
      }

      case "ask_librarian": {
        const task = String(request.params.arguments?.task);

        // 1. Fetch candidates (Last 50 prompts to keep context reasonable)
        // In a real vector system, we'd fetch top 20 nearest neighbors.
        const candidates = await database.all('SELECT id, title, description, content FROM prompts ORDER BY "updatedAt" DESC LIMIT 50');

        if (candidates.length === 0) {
          return {
            content: [{ type: "text", text: "No prompts found in the library." }],
          };
        }

        // 2. Ask AI to pick the best one
        // We'll create a lightweight index for the LLM
        const index = candidates.map(c => ({ id: c.id, title: c.title, description: c.description || c.content.substring(0, 100) }));
        
        const selectionPrompt = `
You are an intelligent librarian for a prompt library.
User Task: "${task}"

Available Prompts:
${JSON.stringify(index)}

Identify the single best matching prompt ID for this task.
If no prompt is a good match, return null.

Return ONLY the ID (or null) as a raw string. No JSON, no Markdown.
        `;

        // Use the AiService to "Run Prompt Stream" (but we'll just await the first chunk or use a simpler method if available).
        // Actually AiService has optimize/diagnose. Let's adapt runPromptStream or just assume we can use a new method.
        // I'll reuse optimizePrompt's infrastructure manually or add a generic 'chat' method.
        // For now, I'll use the 'diagnose' method's pattern but I don't want to change AiService right now.
        // I will implement a quick helper here since I can't easily change AiService interface without affecting others.
        // Wait, I can import GoogleGenerativeAI directly here too if needed, but better to reuse AiService logic if possible.
        // AiService.runPromptStream is available. I can collect the stream.

        let selectedId = "";
        try {
          const stream = await AiService.runPromptStream(selectionPrompt);
          for await (const chunk of stream) {
              selectedId += chunk.text();
          }
        } catch (e) {
          console.error("AI Librarian failed:", e);
          return { content: [{ type: "text", text: "AI Librarian is currently unavailable." }] };
        }

        selectedId = selectedId.trim();

        if (!selectedId || selectedId.toLowerCase().includes("null")) {
           return {
            content: [
              {
                type: "text",
                text: "I couldn't find a specific prompt in the library that matches your request perfectly. You might want to try 'search_prompts' with keywords.",
              },
            ],
          };
        }

        // 3. Fetch the full prompt content
        const bestPrompt = candidates.find(c => c.id === selectedId || selectedId.includes(c.id)); // Loose matching

        if (!bestPrompt) {
           return {
            content: [
              {
                type: "text",
                text: `The AI suggested prompt ID '${selectedId}' but I couldn't find it in the loaded candidates.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Here is the best matching prompt for your task:\n\n**Title:** ${bestPrompt.title}\n**Description:** ${bestPrompt.description}\n\n**Content:**\n${bestPrompt.content}`,
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
