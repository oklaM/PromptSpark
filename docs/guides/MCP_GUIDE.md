# Model Context Protocol (MCP) Integration Guide

PromptSpark now supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), allowing AI assistants like **Claude Desktop** to directly connect to your local PromptSpark library.

This means you can ask Claude to:
- *"Find my coding prompts for Python"*
- *"Search for prompts about 'fantasy writing'"*
- *"Help me pick the best prompt for summarizing a legal document"* (Intelligent Librarian)

---

## 🚀 Features

The PromptSpark MCP server exposes the following capabilities:

### 1. Resources (`promptspark://`)
Direct access to your prompt templates.
- **URI Pattern**: `promptspark://prompts/{id}`
- **MimeType**: `application/json`

### 2. Tools
- **`search_prompts`**: Search your local prompt library using keywords (SQL `ILIKE` search).
  - Arguments: `query` (string), `limit` (number)
- **`ask_librarian`**: An intelligent agent that analyzes your natural language request and finds the best matching prompt in your database using AI analysis.
  - Arguments: `task` (string)

### 3. Prompts (Templates)
Exposes your PromptSpark prompts as MCP Prompts, allowing them to be used directly within the client with variable substitution.

---

## 🛠️ Configuration (Claude Desktop)

To use PromptSpark with Claude Desktop, you need to add it to your `claude_desktop_config.json`.

**Location:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "promptspark": {
      "command": "npm",
      "args": [
        "run",
        "mcp",
        "--",
        "--silent"
      ],
      "cwd": "/absolute/path/to/your/PromptSpark/backend",
      "env": {
        "NODE_ENV": "development",
        "AI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

> **Note:** Replace `/absolute/path/to/your/PromptSpark/backend` with the actual path to the `backend` folder in your project. Ensure your `.env` file in `backend/` is configured, or pass the API keys directly in the `env` section above.

---

## 🔌 Usage Examples

Once connected, you will see a 🔌 icon (or "Connected to MCP") in Claude Desktop.

**Example 1: Searching**
> **You:** "Do I have any prompts related to 'midjourney' in my library?"
> **Claude:** (Calls `search_prompts` tool) "Yes, I found 3 prompts..."

**Example 2: Intelligent Retrieval**
> **You:** "I need to write a compassionate email to a dissatisfied customer. Do I have a prompt for that?"
> **Claude:** (Calls `ask_librarian` tool) "Checking your library... I found 'Customer Support Empathy V2' which seems perfect for this task."

**Example 3: Using a Template**
> **You:** "Use the 'Code Reviewer' prompt template to analyze this code."
> **Claude:** (Loads the prompt content via MCP Resources) "Okay, using 'Code Reviewer'..."

---

## 🔍 Troubleshooting

**1. "Connection failed"**
- Check the `cwd` path in the config file. It must point to the `backend` folder, not the root.
- Ensure you have run `npm install` in the `backend` folder.
- Try running `npm run mcp` manually in the backend folder to see if it starts without errors.

**2. "AI Librarian unavailable"**
- Ensure `AI_API_KEY` (Gemini) or `DEEPSEEK_API_KEY` is set in your `backend/.env` file or the `claude_desktop_config.json` `env` section.

**3. "No prompts found"**
- The MCP server connects to your *local* database (`backend/src/db/database.ts`). Ensure you have added some prompts to your local PromptSpark instance.
