# PromptSpark - 快速开始指南 (v2.3)

## ⚡ 3 分钟启动项目

### 第 1 步：安装依赖
```bash
cd /home/rowan/Projects/PromptSpark
npm install
```

### 第 2 步：启动开发服务器
```bash
npm run dev
```

你会看到：
- 后端: http://localhost:5000
- 前端: http://localhost:3000

---

## 🎯 首次体验核心链路

1. **AI 辅助创建**
   - 点击 "新建提示词"
   - 输入一个简单的想法 (如 "写个 Python 脚本")
   - 点击 ✨ **一键生成全部信息**，查看 AI 如何为您扩写和打标。

2. **交互式调试 (Playground)**
   - 进入提示词详情
   - 点击 **"运行"** 按钮
   - 输入测试变量，同屏对比不同模型 (OpenAI, Gemini 等) 的输出效果。

3. **开发者集成**
   - 在详情页点击 **"SDK"**
   - 复制 cURL 或 Python 代码
   - 使用在 "设置 -> 开发者 API" 中生成的 Token 进行调用。

---

## 📋 功能矩阵

| 模块 | 核心功能 |
|------|------|
| 📝 管理 | CRUD、版本回滚、批量导出、可视化 Diff |
| ✨ 智能 | AI 智能润色、自动打标、Prompt 评分诊断 |
| 🚀 调试 | 多模型竞技场、动态变量表单、流式输出 |
| 🔌 集成 | API Token 管理、标准 RESTful SDK |
| 🤝 协作 | 细粒度权限 (RBAC)、评论区、评分系统 |

---

## 🛠️ 常用命令

```bash
npm run dev          # 同时启动前后端
npm run build        # 生产构建
npm start            # 启动生产服务
npm test             # 运行测试 (vitest)
```

---

**祝你使用愉快！如有问题，查看 [README.md](./README.md) 获取更多信息。** 🚀