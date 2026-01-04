# API 使用指南 (v2.4)

## 概述

PromptSpark API 遵循 RESTful 原则，采用 JSON 格式。

**Base URL**: `http://localhost:5000` (Dev) / `https://api.promptspark.com` (Prod)

## 认证 (Authentication)

所有写操作需要 JWT 认证：
```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. 核心提示词 API (Prompts)

### 创建提示词
`POST /api/prompts`
*   Body: `{ title, content, description, tags, metadata }`
    *   `metadata`: (Optional) JSON 对象，存储 AI 绘画参数 (seed, model, etc)。

### 同步抓取数据 (Sync) [NEW]
用于将 Chrome 插件抓取的数据批量上传。
`POST /api/prompts/sync`
*   Body: `{ items: SparkPrompt[] }`
*   Response: `{ success: true, data: [CreatedPrompt objects] }`

### 获取列表
`GET /api/prompts?page=1&limit=20`

### 获取详情
`GET /api/prompts/:id`
*   Response 包含解析后的 `metadata` 对象。

---

## 2. 智能化辅助 API (AI Copilot)

### AI 润色与优化 (Optimize) [NEW]
`POST /api/ai/optimize`
*   Body: 
    ```json
    {
      "content": "原始提示词...",
      "goal": "quality" | "detail" | "creative"
    }
    ```
*   Response:
    ```json
    {
      "original": "...",
      "optimized": "优化后的提示词...",
      "changes": ["增加了光影描述", "修复了语法错误"]
    }
    ```

### AI 诊断 (Diagnose)
`POST /api/ai/diagnose`
*   Body: `{ content }`
*   Response: `{ score, clarity, safety, suggestions[] }`

---

## 3. 协作与社区 (Collaboration & Community)

### 权限管理 (Permissions)
*   `POST /api/collaboration/permissions/grant`: 授予权限 (Body: `{ promptId, userId, role }`)
*   `DELETE /api/collaboration/permissions/:permissionId`: 撤销权限
*   `GET /api/collaboration/prompts/:promptId/permissions`: 获取权限列表
*   `GET /api/collaboration/prompts/:promptId/check-permission`: 检查当前用户权限

### 评论 (Comments)
*   `POST /api/collaboration/comments`: 发表评论 (Body: `{ promptId, content, parentId? }`)
*   `GET /api/collaboration/prompts/:promptId/comments`: 获取评论列表
*   `DELETE /api/collaboration/comments/:commentId`: 删除评论
*   `POST /api/collaboration/comments/:commentId/like`: 点赞评论

### 讨论区 (Discussions)
*   `POST /api/collaboration/discussions`: 发起讨论 (Body: `{ promptId, title, description }`)
*   `GET /api/collaboration/prompts/:promptId/discussions`: 获取讨论列表
*   `PUT /api/collaboration/discussions/:discussionId/status`: 更新状态 (Body: `{ status: 'open'|'resolved'|'closed' }`)

### 评测与打分 (Ratings & Evals)
*   `POST /api/evals`: 记录模型运行评测日志。
*   `POST /api/collaboration/ratings`: 提交多维评分 (Body: `{ promptId, score, helpfulness, accuracy, relevance }`)
*   `GET /api/collaboration/prompts/:promptId/ratings`: 获取评分详情
*   `GET /api/collaboration/prompts/:promptId/stats`: 获取聚合统计数据

---

## 4. 数据模型 (Models)

### Prompt Object
```typescript
interface Prompt {
  id: string;
  title: string;
  content: string; // 主要的提示词文本
  
  // 结构化元数据 (AI 绘画专用)
  metadata?: {
    model: string;
    seed: string;
    sampler: string;
    cfgScale: number;
    steps: number;
    loras: Array<{name: string, weight: number}>;
    sourceUrl: string;
  };
  
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 版本历史

### v2.4.0 (2026-01-01) - Commercial Ready
- **Sync API**: 支持插件数据批量上云。
- **Metadata Support**: 数据库支持存储结构化生成参数。
- **AI Optimize**: 新增基于目标的 AI 润色接口。

### v2.3.0 (2025-12-30)
- MVC 重构，权限管理。
