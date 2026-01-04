# PromptSpark - 智能化提示词工程平台 (Prompt Engineering Platform)

🌟 **一个现代化、功能完整、商业就绪的智能化 Prompt 管理与协作系统**

> **Freemium 模式**: Chrome 插件免费采集 + Web 平台专业管理与 AI 增强。

## 📋 项目概述

PromptSpark 是专为 AI 工作者与 Prompt 工程师设计的全能平台。它不仅能帮助您整理、搜索、版本化提示词，还通过 AI 能力简化编写流程，并提供类似 IDE 的调试与集成体验。

我们独特的 **"Hook & Retain"** 架构允许用户通过 Chrome 插件一键抓取 Civitai/Liblib 的生成参数，并无缝同步到云端进行专业化管理。

### 核心特性

✨ **AI Copilot (智能化辅助)**
- **智能润色**: 一键将简单指令扩写为结构化 Prompt（画质增强、细节丰富、创意重写）。
- **AI 诊断**: 自动评估清晰度、安全性与逻辑性，提供改进建议。
- **自动打标**: AI 自动提取标签与分类，无需手动录入。
- **AI 优化对比**: 独家 **Diff 视图**，直观展示 AI 优化前后的每一个改动点。

🤖 **MCP Support (模型上下文协议)**
- **无缝连接**: 让 Claude Desktop 直接连接您的本地 PromptSpark 库。
- **智能检索**: 通过自然语言（"帮我找个写代码的提示词"）直接调用本地资产。
- **工具集成**: 提供 `search_prompts` 和 `ask_librarian` 工具供 AI 助手调用。

🔌 **Chrome Extension Hook (流量入口)**
- **一键采集**: 在 Civitai 等网站自动注入“Spark Capture”按钮，抓取 Prompt、Seed、Model、Sampler 等全套参数。
- **云端同步**: 插件端一键将本地抓取的数据同步到 PromptSpark Web 平台。

📊 **Pro Management (专业管理)**
- **结构化参数面板**: 在 Web 端以专业 UI 展示 SD/MJ 的生成参数（不再是纯文本）。
- **版本可视化 Diff**: 直观对比不同版本的字符级差异。
- **评测日志 (Eval Logs)**: 记录运行结果满意度，自动计算 Prompt 的测试通过率。

🚀 **Interactive Playground (交互式运行)**
- **模型竞技场**: 同屏对比不同 LLM (OpenAI, Gemini, DeepSeek) 的输出结果。
- **动态变量**: 自动识别 `{{variable}}` 语法并生成输入表单。

🔐 **Collaboration & Community (协作与社区)**
- **权限管理**: 细粒度的角色控制 (Owner, Editor, Viewer)。
- **讨论区**: 针对 Prompt 发起专门的讨论 (Discussion Threads)，支持状态追踪 (Open/Resolved)。
- **评论互动**: 支持多级评论回复与点赞，促进团队交流。
- **所有权关联**: 自动关联创建者，支持匿名数据的“认领”机制。
- **开发者 SDK**: 提供标准 API Token 与集成代码示例。

---

## 🏗️ 系统架构

```
PromptSpark/
├── backend/                 # Node.js + Express 后端 (MVC 架构)
│   ├── src/
│   │   ├── mcp/            # MCP Server 实现
│   │   ├── models/         # 业务逻辑与 DB 封装
│   │   └── ...
│   └── ...
│
├── frontend/               # React + TypeScript 前端 (Vite)
│   └── ...
│
└── extension/              # Chrome Extension (Manifest V3)
    └── ...
```

---

## 🚀 快速开始

### 安装与启动

1. **克隆并安装**
```bash
git clone https://github.com/your-repo/PromptSpark.git
cd PromptSpark
npm install # 安装根目录及所有 workspace 依赖
```

2. **配置环境**
```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env 设置 JWT_SECRET, AI_API_KEY (Gemini/DeepSeek)
```

3. **启动开发服务器**
```bash
npm run dev # 同时启动 Web (3000), API (5000) 和 Extension 构建
```

4. **MCP 服务 (可选)**
```bash
# 注册到 Claude Desktop，请参考 MCP 指南
npm run mcp -w backend
```

---

## 📚 详细文档

- [MCP 集成指南](docs/MCP_GUIDE.md) - **NEW!** 连接 Claude Desktop
- [商业化架构设计](docs/COMMERCIAL_ARCHITECTURE.md) - 盈利模式与数据流转
- [插件规格说明](docs/lite.md) - Chrome 插件采集与同步机制
- [API 使用指南](docs/API.md) - 完整接口参考
- [开发演进路线图](docs/ROADMAP_AND_REQUIREMENTS.md) - 版本计划与现状

---

## 🛠️ 技术栈

- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand, Lucide Icons.
- **Backend**: Node.js, Express, PostgreSQL/SQLite, JWT, **MCP SDK**.
- **Extension**: Manifest V3, React, CRXJS.
- **AI**: Google Gemini, DeepSeek, OpenAI.

---

## 📄 许可证

MIT License - 可自由使用和修改

---

**版本：2.5.0 - Feature Release (MCP)** 🚀
**更新日期：2026 年 1 月 4 日**
