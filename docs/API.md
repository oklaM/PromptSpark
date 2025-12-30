# API 使用指南 (v2.3)

## 概述

PromptSpark API 遵循 RESTful 原则，采用 JSON 格式进行数据交互。所有响应都遵循统一的格式：

```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "error": string (仅在失败时出现)
}
```

## 认证 (Authentication)

大多数写操作 (POST/PUT/DELETE) 均需要 JWT 认证。请在 HTTP Header 中包含以下信息：

```http
Authorization: Bearer <your_jwt_token>
```

此外，开发者 SDK 接口使用专用的 API Token：
```http
Authorization: Bearer <your_api_token_sk_ps_...>
```

---

## 核心提示词 API

### 1. 创建提示词 (Auth Required)
`POST /api/prompts`

### 2. 获取列表与搜索
`GET /api/prompts`
`GET /api/prompts/search?query=...`

### 3. 获取详情
`GET /api/prompts/:id`

---

## 智能化辅助 API (AI Copilot)

### 1. 内容分析与自动生成
**请求**
```http
POST /api/ai/analyze
Content-Type: application/json

{
  "content": "简单指令...",
  "targetField": "description" // 可选: title, description, tags, category
}
```
**说明**: 后端将调用配置的 LLM 模型对内容进行理解并返回生成的元数据。

### 2. Prompt 诊断
**请求**
```http
POST /api/ai/diagnose
Content-Type: application/json

{
  "content": "提示词全文..."
}
```
**说明**: 返回包含评分及改进建议的诊断报告。

---

## 开发者 SDK API

### 1. 获取提示词内容 (Token Required)
**请求**
```http
GET /api/sdk/prompts/:id
Authorization: Bearer sk-ps-xxxxxx
```
**说明**: 面向开发者集成，仅支持公开提示词或 Token 所属用户的私有提示词。

---

## 评测与日志 API

### 1. 记录评测结果 (Auth Required)
`POST /api/evals`
参数: `promptId`, `modelId`, `content`, `output`, `score` (1 为好, 0 为差)。

### 2. 获取统计信息
`GET /api/prompts/:id/evals/stats`
返回通过率、测试总数等。

---

## 令牌管理 API (Auth Required)

- `GET /api/tokens`: 列出当前用户的所有 Token。
- `POST /api/tokens`: 创建新 Token。
- `DELETE /api/tokens/:id`: 撤销 Token。

---

## 版本历史

### v2.3.0 (2025-12-30)
- ✓ MVC 架构重构，逻辑迁移至 Model 层。
- ✓ 强制身份验证与所有权自动关联。
- ✓ 提示词“认领”机制。

### v2.2.0 (2025-12-29)
- ✓ Developer SDK 基础能力。
- ✓ Eval Logs 评测记录。

### v2.1.0 (2025-12-28)
- ✓ AI Copilot (诊断、智能润色、自动打标)。
- ✓ Prompt Playground (交互式调试、变量识别)。

### v2.0.0 (2025-12-11)
- ✓ Team Collaboration (Permissions, Comments, Discussions).