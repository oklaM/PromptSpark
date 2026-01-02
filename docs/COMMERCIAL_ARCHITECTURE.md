# PromptSpark 商业化架构设计与盈利模式

> **文档目标**：重构 PromptSpark 技术架构，从“工具”转型为“平台”，建立可持续的商业闭环。

## 1. 商业核心逻辑 (The Business Core)

我们的核心商业模式是 **Freemium (免费增值)**：
1.  **流量钩子 (Hook)**：通过免费、极速的 **Chrome 插件** 吸引大量 AI 绘画（Stable Diffusion/Midjourney）用户。
2.  **价值沉淀 (Retain)**：将抓取的数据同步到 **Web 平台**，提供标签管理、搜索和永久备份。
3.  **变现 (Monetize)**：对高级功能（AI 优化、跨设备同步、团队协作、Prompt 交易）收费。

---

## 2. 产品矩阵与功能分层

| 功能模块 | 🔌 Chrome 插件 (Lite) | ☁️ Web 平台 (Pro/SaaS) | 💰 变现点 |
| :--- | :--- | :--- | :--- |
| **定位** | 极速采集工具 | 资产管理工作台 | - |
| **存储** | 本地 (Local Storage) | 云端数据库 (Cloud DB) | 数据安全/跨端同步 |
| **抓取能力** | 自动解析 Civitai/Liblib 参数 | - | - |
| **管理能力** | 仅最近 50 条历史 | 无限存储、文件夹、标签系统 | 存储空间/组织能力 |
| **AI 能力** | 无 | Prompt 润色、诊断、LLM 对抗评测 | AI Token 消耗 |
| **协作** | 无 | 团队库、版本控制、分享链接 | 团队席位费 |

---

## 3. 技术架构演进 (Technical Architecture)

为了支持上述商业模式，后端与数据库需要进行以下改造：

### A. 数据模型升级 (Schema Evolution)

目前的 `Prompt` 表过于通用，无法承载 AI 绘画的结构化数据（Seed, Sampler 等）。我们需要引入 `StructuredMetadata` 概念。

#### 新增/修改 Database Schema

```typescript
// 1. 扩展 prompts 表或新增 prompt_metadata 表
interface PromptMetadata {
  promptId: string;
  
  // 来源信息 (用于归因和回溯)
  sourcePlatform: 'civitai' | 'liblib' | 'midjourney' | 'manual';
  sourceUrl: string;
  originalImageUrl: string; // 缩略图
  
  // 结构化生成参数 (这是 Extension 抓取的核心价值)
  parameters: {
    model: string;        // e.g. "ChilloutMix"
    sampler: string;      // e.g. "DPM++ 2M Karras"
    seed: string;
    steps: number;
    cfgScale: number;
    loras: Array<{name: string, weight: number}>;
  };
}

// 2. 新增用户订阅表 (users_subscription)
interface UserSubscription {
  userId: string;
  plan: 'free' | 'pro' | 'team';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  usage: {
    storageUsed: number;   // 已存储条数
    aiTokensUsed: number;  // 本月 AI 调用量
  };
}
```

### B. 插件与后端通信 (Sync Protocol)

插件端不再是孤岛，需要实现“一键同步”功能。

1.  **Auth**: 插件复用 Web 端的 JWT Token (通过 `chrome.cookies` 读取或手动登录)。
2.  **Sync API**: `POST /api/v1/sync`
    *   接收插件解析后的 JSON。
    *   后端进行去重（根据 Image Hash 或 Source URL）。
    *   存入数据库并关联当前用户。

---

## 4. 盈利功能规划 (Monetization Features)

### 第一阶段：个人效率付费 (Individual Pro)
*   **卖点**：云端无限存储 + 结构化搜索。
*   **场景**：用户在插件抓取了 1000 张图的参数，本地存不下了，或者想搜“所有用过 ChilloutMix 模型的图”。
*   **实现**：Web 端增加高级筛选器 (Filter Store)，对接后端 SQL 查询 JSON 字段。

### 第二阶段：AI 增值服务 (AI Power-Ups)
*   **卖点**：Prompt 智能优化。
*   **场景**：用户抓取了一个烂 Prompt，点击“AI 修复”，系统消耗 Token 调用 GPT-4/Claude 优化单词顺序和权重。
*   **实现**：复用现有的 `AiService`，增加计费中间件 `BillingMiddleware`。

### 第三阶段：市场与交易 (Marketplace)
*   **卖点**：优质 Prompt 变现。
*   **场景**：Pro 用户可以将自己的 Prompt 设为“付费可见”或“订阅可见”。
*   **实现**：扩展 `Permission` 系统，增加 `price` 字段。

---

## 5. 开发路线图 (Implementation Roadmap)

1.  **后端改造 (Week 1)**:
    *   修改 SQLite schema，支持存储 JSON 格式的 `metadata`。
    *   实现 `/api/sync` 接口。
2.  **插件联调 (Week 1-2)**:
    *   在插件 Popup 中增加“登录”状态检测。
    *   实现“同步到云端”按钮。
3.  **Web 升级 (Week 2-3)**:
    *   Prompt 详情页适配：如果存在 metadata，展示为结构化的“生成参数面板”（类似 Civitai）。
    *   搜索栏升级：支持按 Model 或 Lora 搜索。
4.  **支付接入 (Week 4)**:
    *   接入 Stripe 或简单的支付网关，限制 Free 用户的存储数量（例如 50 条）。

---

> **架构师备注**: 目前我们最缺的是“数据结构化”的存储能力。现有的 `Prompt` 表只有 `content` 字段。下一步的首要任务是迁移数据库，支持扩展字段。
