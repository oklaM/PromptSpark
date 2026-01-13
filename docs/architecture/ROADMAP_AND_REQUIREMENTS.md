# PromptSpark 产品演进路线图 & 需求规格说明书 (v2.4)

**日期:** 2026-01-01
**状态:** 商业化闭环已打通 (Commercial Ready)
**目标:** 建立基于 "Freemium" 模式的可持续盈利平台。

---

## 1. 概述 (Overview)
PromptSpark 已经完成了从单纯的“提示词管理工具”向“商业化 AI 资产平台”的转型。通过 Chrome 插件作为流量入口，结合 Web 端的专业管理与 AI 增值服务，构建了完整的用户价值链。

---

## 2. 功能完成度 (Status)

### ✅ Phase 1: 核心管理 (Core)
- CRUD, Tagging, Searching.
- Version Control (History & Revert).

### ✅ Phase 2: 交互式运行 (Playground)
- Model Arena (OpenAI/Gemini/DeepSeek).
- Variable Extraction.
- Stream Response.

### ✅ Phase 3: AI Copilot (Intelligence)
- **AI Optimize:** 基于目标的智能润色 (Quality/Detail/Creative)。
- **AI Diagnose:** 评分与建议。
- **Auto-Tagging:** 自动分类。

### ✅ Phase 4: 流量与商业化 (Commercial Hook)
- **Extension Capture:** Chrome 插件自动抓取 Civitai/Liblib 参数。
- **Cloud Sync:** 插件数据一键上云。
- **Structured Metadata:** 后端支持存储并展示 Seed, Model, Sampler 等专业参数。

---

## 3. 2026 Q1 路线图 (Upcoming)

### 💰 Phase 5: 变现与支付 (Monetization)
**目标:** 验证付费转化率。
*   **配额限制 (Quota):** 免费用户限制存储 50 条 Prompts，每日 AI 优化 5 次。
*   **支付集成 (Payments):** 接入 Stripe/LemonSqueezy，支持订阅制 (Pro Plan)。
*   **高级搜索:** 仅限 Pro 用户按 Model 或 Seed 搜索。

### 🏢 Phase 6: 团队协作 (Team SaaS)
**目标:** B 端获客。
*   **Team Workspace:** 共享提示词库，成员权限管理。
*   **Audit Logs:** 操作审计日志。

---

## 4. 技术债务与优化
*   **Database:** 迁移至 PostgreSQL (已完成代码适配，需生产环境部署)。
*   **Testing:** 保持 80%+ 的核心路径测试覆盖率。
*   **CI/CD:** 完善自动化构建与部署流程。