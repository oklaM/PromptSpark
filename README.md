# PromptSpark - 智能化提示词工程平台 (Prompt Engineering Platform)

🌟 **一个现代化、功能完整、生产就绪的智能化 Prompt 管理与协作系统**

## 📋 项目概述

PromptSpark 是专为 AI 工作者与 Prompt 工程师设计的全能平台。它不仅能帮助您整理、搜索、版本化提示词，还通过 AI 能力简化编写流程，并提供类似 IDE 的调试与集成体验。

### 核心特性

✨ **AI Copilot (智能化辅助)**
- **智能润色**: 一键将简单指令扩写为结构化 Prompt。
- **AI 诊断**: 自动评估清晰度、安全性与逻辑性，提供改进建议。
- **自动打标**: AI 自动提取标签与分类，无需手动录入。

🚀 **Interactive Playground (交互式运行)**
- **模型竞技场**: 同屏对比不同 LLM (OpenAI, Gemini, DeepSeek) 的输出结果。
- **动态变量**: 自动识别 `{{variable}}` 语法并生成输入表单。
- **流式输出**: 打字机式的实时响应体验。

📊 **Engineering & Ops (工程化与运维)**
- **版本可视化 Diff**: 直观对比不同版本的字符级差异。
- **评测日志 (Eval Logs)**: 记录运行结果满意度，自动计算 Prompt 的测试通过率。
- **批量操作**: 支持导入导出 (JSON/CSV/MD)、批量删除与发布。

🔐 **Collaboration & Security (协作与安全)**
- **权限管理**: 细粒度的角色控制 (Owner, Editor, Viewer)。
- **所有权关联**: 自动关联创建者，支持匿名数据的“认领”机制。
- **开发者 SDK**: 提供标准 API Token 与集成代码示例。

---

## 🏗️ 系统架构

```
PromptSpark/
├── backend/                 # Node.js + Express 后端 (MVC 架构)
│   ├── src/
│   │   ├── models/         # 业务逻辑与 DB 封装
│   │   ├── routes/         # 包含 SDK 与 Auth 路由
│   │   └── services/       # AI 服务适配器
│   └── tests/              # 自动化测试
│
├── frontend/               # React + TypeScript 前端 (Vite)
│   ├── src/
│   │   ├── components/     # 50+ 响应式功能组件
│   │   ├── stores/         # Zustand 状态管理
│   │   └── services/       # API 客户端
```

---

## 🚀 快速开始

### 安装与启动

1. **克隆并安装**
```bash
cd /home/rowan/Projects/PromptSpark
npm install
```

2. **配置环境**
```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env 设置 JWT_SECRET 与数据库路径
```

3. **启动开发服务器**
```bash
npm run dev # 同时启动 http://localhost:3000 (Web) 与 http://localhost:5000 (API)
```

---

## 📚 详细文档

- [API 使用指南](docs/API.md) - 完整接口参考
- [开发演进路线图](docs/ROADMAP_AND_REQUIREMENTS.md) - 版本计划与现状
- [部署指南](docs/DEPLOYMENT.md) - 本地与云端部署说明

---

## 🛠️ 技术栈

- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand, Lucide Icons.
- **Backend**: Node.js, Express, SQLite3, JWT, UUID.
- **Testing**: Vitest, Supertest.
- **AI**: 支持 OpenAI, Google Gemini, DeepSeek 等模型接入。

---

## 📱 浏览器兼容性
- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14

---

## 📄 许可证

MIT License - 可自由使用和修改

---

**版本：2.3.0 - Enterprise Ready** ✨
**更新日期：2025 年 12 月 30 日**