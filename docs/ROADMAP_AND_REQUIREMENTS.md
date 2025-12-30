# PromptSpark 产品演进路线图 & 需求规格说明书 (v2.1)

**日期:** 2025-12-30
**状态:** 开发中 (Phase 3 进行中)
**目标:** 从“基础提示词库”进阶为“智能化 Prompt 工程平台”

---

## 1. 概述 (Overview)
PromptSpark 已完成核心 CRUD、智能化辅助 (AI Copilot)、交互式运行 (Playground) 及版本对比功能的开发。当前平台已具备完整的 Prompt 编写、调试、优化和管理闭环。下一阶段重点在于 **工程化集成 (SDK)** 及 **深度评测** 能力。

---

## 2. 详细需求规划 (Detailed Requirements)

### 🚀 P1: 核心差异化 - 交互式运行 (Prompt Playground) ✅ [已完成]
**目标:** 让用户在不离开平台的情况下，直接运行并测试 Prompt 效果，打造 IDE 般的体验。

#### 2.1 在线运行 (Run & Test) ✅
*   **用户故事:** 用户在 Prompt 详情页，可以输入测试变量，点击“运行”，实时查看大模型的输出结果。
*   **功能点:**
    *   **API Key 管理:** 用户可在个人设置或环境变量中配置 OpenAI/Anthropic/Gemini 的 API Key。
    *   **参数配置:** 提供 Temperature, Max Tokens 等常见参数调节面板。
    *   **流式输出:** 支持实时响应 (模拟/真实 SSE)。

#### 2.2 变量自动识别 (Variable Support) ✅
*   **用户故事:** 当 Prompt 中包含 `{{product_name}}` 等占位符时，系统自动识别并生成对应的输入表单。
*   **功能点:**
    *   正则匹配 `{{variable}}` 语法。
    *   动态生成 Input/Textarea 表单供用户填入测试值。
    *   发送请求前自动进行字符串替换。

#### 2.3 模型竞技场 (Model Arena) ✅
*   **用户故事:** 用户想知道 GPT-4 和 Claude-3 哪个处理这个任务更好。
*   **功能点:**
    *   分屏显示（Split View）。
    *   同时向两个不同的模型发送相同的 Prompt。
    *   并在同一视图下对比输出结果。

---

### ✨ P2: 智能化辅助 - AI Copilot ✅ [已完成]
**目标:** 降低编写门槛，利用 AI 能力提升平台内容的整体质量。

#### 2.1 智能润色 (Smart Refine) ✅
*   **用户故事:** 用户写了一个简单的指令“写个文案”，点击“AI 优化”，系统自动扩写为包含角色设定、背景、任务、约束的结构化 Prompt。
*   **功能点:**
    *   在创建/编辑模态框中增加“✨ 一键生成”按钮。
    *   后端调用 LLM，自动填充标题、描述、分类及 Prompt 内容。

#### 2.2 评分与诊断 (Analysis & Scoring) ✅
*   **用户故事:** 用户保存前，想知道这个 Prompt 是否足够清晰。
*   **功能点:**
    *   静态分析：检查长度、变量完整性。
    *   AI 诊断：分析清晰度、安全性、逻辑漏洞，并给出评分及改进建议。

#### 2.3 自动打标 (Auto-Tagging) ✅
*   **用户故事:** 用户懒得手动填标签，希望系统自动分类。
*   **功能点:**
    *   基于 Prompt 内容，AI 自动推荐相关标签（如：#代码生成 #营销 #Python）。

---

### 🛠️ P3: 工程化深度 - 版本对比与评测 (Engineering) [部分完成]
**目标:** 服务于专业 Prompt 工程师，支持严谨的迭代过程。

#### 3.1 可视化版本 Diff (Visual Diff) ✅
*   **用户故事:** 用户回滚历史版本时，需要清楚知道 v2 和 v3 到底改了哪几个字。
*   **功能点:**
    *   引入 `diff` 类库。
    *   在历史记录页，提供“版本对比”视图，高亮显示差异。

#### 3.2 评测记录 (Eval Logs) (未来规划) 📅
*   **用户故事:** 记录某次运行结果的满意度，用于长期分析。
*   **功能点:**
    *   在 Playground 运行结果后，允许用户标记“Bad case”或“Good case”。
    *   统计该 Prompt 的测试通过率。

---

### 🔌 P4: 开发者生态 - 集成能力 (Integration) 🚧 [待开发]
**目标:** 将 PromptSpark 作为基础设施嵌入到业务流中 (Prompt-as-a-Service)。

#### 4.1 SDK / API Access
*   **用户故事:** 开发者希望在代码中直接调用最新的 Prompt，而不是硬编码在项目中。
*   **功能点:**
    *   提供只读 API: `GET /api/v1/sdk/prompts/{key}`。
    *   支持按 `tag` 或 `alias` 获取（例如获取 `prod` 环境的 Prompt）。
    *   生成 API Token 用于鉴权。

---

## 3. 技术实施路径 (Technical Roadmap)

1.  **Phase 1 (Done):** ✅ 后端 `aiService` 架构，AI 优化/润色 (Smart Refine)，自动打标。
2.  **Phase 2 (Done):** ✅ Prompt Playground (运行测试、变量识别、模型竞技场)，评分诊断。
3.  **Phase 3 (Done):** ✅ 版本 Diff (Visual Diff)。
4.  **Phase 4 (Pending):** 🚧 SDK 基础接口 (P4.1) 及 评测记录 (P3.2)。

---
