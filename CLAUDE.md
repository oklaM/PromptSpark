# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptSpark is a full-stack prompt management platform with three main components:
- **Backend**: Node.js + Express + PostgreSQL (MVC architecture)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Extension**: Chrome Extension (Manifest V3) for capturing prompts from Civitai/Liblib

The platform features AI-powered prompt optimization, version control, collaboration tools, MCP (Model Context Protocol) server integration, and a freemium business model.

## Development Commands

### Root Level (Monorepo)
```bash
npm run dev              # Start both backend (5000) and frontend (3000) dev servers
npm run build            # Build all workspaces (backend, frontend, extension)
npm run test             # Run all tests
npm run test:watch       # Watch mode for all tests
npm run test:coverage    # Generate coverage reports
npm run lint             # Lint all workspaces
```

### Backend (`/backend`)
```bash
npm run dev              # Start dev server with tsx watch (port 5000)
npm run build            # Compile TypeScript to dist/
npm run start            # Production mode (seeds DB then starts)
npm run seed             # Seed database with open source prompts
npm run mcp              # Run MCP server for Claude Desktop integration
npm run test             # Run Vitest tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage with Vitest
```

### Frontend (`/frontend`)
```bash
npm run dev              # Start Vite dev server (port 3000)
npm run build            # TypeScript check + Vite build
npm run preview          # Preview production build
npm run test             # Run Jest tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage with Jest
```

### Extension (`/extension`)
```bash
npm run dev              # Build in development mode
npm run build            # Production build
npm run test             # Run Vitest tests
```

### Database
```bash
# Start PostgreSQL (Docker)
docker-compose up postgres

# Or use full stack
docker-compose up        # Starts postgres + backend + frontend
```

## Architecture

### Backend Structure (MVC)
```
backend/src/
├── app.ts                  # Express app setup, middleware, route registration
├── index.ts                # Server entry point
├── db/database.ts          # PostgreSQL connection & table initialization
├── models/                 # Business logic + data access layer
│   ├── Prompt.ts           # Main prompt model with versioning
│   ├── PromptVersion.ts    # Version history
│   ├── Comment.ts          # Comments with threading
│   ├── Permission.ts       # Role-based access control
│   ├── Rating.ts           # 5-star ratings
│   ├── EvalLog.ts          # Playground execution logs
│   └── ApiToken.ts         # API tokens for SDK
├── controllers/            # Request handlers (thin layer)
├── routes/                 # Express route definitions
├── middleware/             # Auth, quota enforcement
├── services/               # AI service (Gemini/DeepSeek)
├── mcp/                    # MCP server implementation
└── scripts/                # seedPrompts.ts (populates DB on startup)
```

**Key Pattern**: Models contain both data access and business logic. Controllers are thin and delegate to models.

### Frontend Structure
```
frontend/src/
├── App.tsx                 # Router setup
├── components/
│   ├── PromptCard.tsx      # List view card
│   ├── PromptDetail.tsx    # Detail page with tabs
│   ├── PromptPlayground.tsx # Interactive runner with variable injection
│   ├── OptimizeModal.tsx   # AI optimization with diff view
│   ├── DiffViewer.tsx      # Character-level diff visualization
│   ├── PromptDiagnosis.tsx # AI quality analysis
│   ├── DiscussionSection.tsx # Discussion threads
│   ├── CommentThread.tsx   # Nested comments
│   ├── PermissionManagement.tsx # Role management
│   └── __tests__/          # Component tests
├── stores/                 # Zustand state management
│   ├── promptStore.ts      # Prompts state
│   ├── authStore.ts        # Auth state
│   ├── filterStore.ts      # Search/filter state
│   └── settingsStore.ts    # User settings
└── hooks/                  # Custom React hooks
```

**State Management**: Zustand for global state. No Redux/Context API.

### Database Schema

**Core Tables**:
- `prompts` - Main prompts table with soft deletes (`deletedAt`)
- `prompt_history` - Version control (tracks all changes)
- `prompt_tags` / `tags` - Many-to-many tag relationship
- `categories` - Prompt categories

**Collaboration**:
- `permissions` - Role-based access (Owner/Editor/Viewer)
- `comments` - Nested comments with soft deletes
- `discussions` - Threaded discussions on prompts
- `ratings` - 5-star ratings with dimensions (helpfulness, accuracy, relevance)

**Evaluation**:
- `eval_logs` - Playground execution logs (model, latency, tokens, score)

**Commercial**:
- `subscriptions` - Freemium plans (free/pro/team)
- `api_tokens` - SDK authentication

**Important**: The database layer automatically converts SQLite `?` placeholders to PostgreSQL `$1, $2` format via `convertSql()`.

### MCP Integration

The MCP server (`backend/src/mcp/index.ts`) exposes:
- **Resources**: Prompts as JSON resources
- **Tools**: `search_prompts` (keyword search), `ask_librarian` (AI-powered selection)
- **Prompts**: Prompt templates with variable substitution

To register with Claude Desktop, see `docs/MCP_GUIDE.md`.

### AI Service Architecture

Located in `backend/src/services/aiService.ts`:
- Supports **Gemini** (default) and **DeepSeek** providers
- Uses Vercel AI SDK (`ai` package) for streaming and structured generation
- Key methods:
  - `diagnosePrompt()` - Quality analysis with score 0-100
  - `optimizePrompt()` - Prompt enhancement with diff tracking
  - `analyzeContent()` - Auto-generate title, description, category, tags
  - `runPromptStream()` - Streaming text generation
- Falls back to local keyword matching if AI unavailable

### Authentication & Authorization

- JWT-based auth (`middleware/authMiddleware.ts`)
- SDK auth via API tokens (`middleware/sdkAuthMiddleware.ts`)
- Role-based permissions: Owner, Editor, Viewer
- Middleware enforces quotas based on subscription tier

## Environment Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Configure database:
   - **PostgreSQL**: Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - Docker users: `docker-compose up postgres`
3. Set AI keys (optional but recommended):
   - `AI_PROVIDER` (gemini or deepseek)
   - `AI_API_KEY` (for Gemini)
   - `DEEPSEEK_API_KEY`
4. Set `JWT_SECRET` for auth

## Important Notes

- **Soft Deletes**: Both `prompts` and `comments` use soft deletes (`deletedAt` column). Queries must filter `WHERE "deletedAt" IS NULL`.
- **Version Control**: Every prompt update creates a new `prompt_history` entry. Use this for diff visualization.
- **Metadata Field**: The `prompts.metadata` column stores JSON (e.g., Civitai parameters like Seed, Model, Sampler).
- **PostgreSQL Quoting**: Column names with quotes require double quotes: `"createdAt"`, `"deletedAt"`, `"isPublic"`.
- **Auto-Seeding**: Backend runs `seed` script on startup if database is empty.
- **Extension Sync**: Chrome extension captures prompts to local storage, then syncs to `/api/sdk/capture` endpoint.
- **Testing**: Frontend uses Jest + Testing Library. Backend uses Vitest. Both have watch modes.
- **Linting**: Husky + lint-staged run on commit. ESLint configs in each workspace.

## Testing

- Frontend tests in `frontend/src/components/__tests__/`
- Run individual test: `npm test -- ComponentName.test.tsx` (from workspace)
- Backend tests follow pattern `*.test.ts` or `*.spec.ts`
- Coverage target: Check `package.json` scripts

## Production Deployment

- Docker Compose: `docker-compose -f docker-compose.prod.yml`
- Backend serves static frontend from `frontend/dist`
- Requires PostgreSQL (not SQLite in production)
- See `docs/DEPLOYMENT.md` for details
