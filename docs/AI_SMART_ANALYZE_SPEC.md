# 🤖 AI 智能分析功能 (Smart Analyze) 设计文档

## 1. 需求背景
用户希望在创建或编辑提示词时，能够利用真正的 AI 智能来分析提示词内容，从而自动生成：
- **标题** (如果为空)
- **描述** (如果为空)
- **标签** (自动提取相关标签)
- **分类** (自动归类)

此外，用户反馈提示词详情页的“编辑”入口不够明显，需要进行 UI 优化。

## 2. 解决方案概述

### 2.1 系统架构
采用 **Client - Server - AI Provider** 的架构：
1.  **前端 (Client)**: 用户点击 "AI 智能分析"，发送当前提示词内容到后端。
2.  **后端 (Server)**: 接收请求，构建 prompt，调用外部 LLM 服务 (如 Gemini/OpenAI)。
3.  **AI Provider**: 处理自然语言分析，返回 JSON 格式的结构化数据。
4.  **后端**: 校验并格式化数据，返回给前端。
5.  **前端**: 自动填充表单。

### 2.2 编辑入口优化
- **现状**: 编辑按钮位于详情页底部，内容较长时不可见。
- **改进**: 将编辑按钮移至详情页顶部 Header 区域，与 "复制"、"关闭" 等操作并列，确保随时可见。

## 3. 详细设计

### 3.1 后端 API 设计

**Endpoint**: `POST /api/ai/analyze`

**Request Body**:
```json
{
  "content": "这里是用户输入的详细提示词内容..."
}
```

**Response Body**:
```json
{
  "success": true,
  "data": {
    "title": "建议的标题",
    "description": "建议的简短描述",
    "category": "coding", // writing, analysis, other
    "tags": ["react", "typescript", "frontend"]
  }
}
```

### 3.2 后端 Service 层 (`AiService`)
- 抽象 `AiProvider` 接口。
- 实现 `GeminiProvider` (作为示例，或标准 HTTP 调用)。
- 提供 Fallback 机制：如果未配置 API Key，则使用本地启发式算法 (Regex/Keyword matching) 作为保底，确保功能永远可用。

### 3.3 前端 UI 交互
- **PromptDetail**: Header 区域增加 "编辑" 图标按钮。
- **CreatePromptModal**:
    - "AI 智能分析" 按钮点击后显示 "正在思考..." (Thinking...) 状态。
    - 成功后高亮显示被自动填充的字段。

## 4. 配置
在 `backend/.env` 中新增：
```env
AI_PROVIDER=gemini  # or openai, mock
AI_API_KEY=sk-...
```
