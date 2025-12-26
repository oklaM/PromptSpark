# PromptSpark - 提示词管理系统

🌟 **一个现代化、功能完整的 AI 提示词管理系统**

## 📋 项目概述

PromptSpark 是为 AI 工作者设计的全能提示词管理平台，帮助用户高效地整理、搜索、共享和版本控制自己的提示词库。

### 核心特性

✨ **智能管理**
- 创建、编辑、删除提示词
- 灵活的分类和标签系统
- 全文搜索和多维度筛选
- 版本历史记录

📊 **协作与共享**
- **权限管理**: 细粒度的角色控制 (Owner, Editor, Viewer)
- **互动社区**: 评论、回复、深度讨论区
- **质量评估**: 多维度评分系统 (有用性/准确性)
- **数据流转**: JSON/CSV/MD 导入导出

🔐 **数据安全**
- 本地 SQLite 数据库
- 支持云端部署
- 完整的备份机制

---

## 🏗️ 系统架构

```
PromptSpark/
├── backend/                 # Node.js + Express 后端
│   ├── src/
│   │   ├── routes/         # API 路由定义
│   │   ├── controllers/    # 业务逻辑处理
│   │   ├── models/         # 数据模型
│   │   ├── db/             # 数据库配置
│   │   └── index.ts        # 服务器入口
│   └── package.json
│
├── frontend/               # React + TypeScript 前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 可复用组件
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── services/      # API 调用服务
│   │   ├── hooks/         # 自定义钩子
│   │   ├── styles/        # 全局样式
│   │   ├── App.tsx        # 主应用
│   │   └── main.tsx       # 入口文件
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── docs/                   # 文档
├── package.json            # 工作区配置
└── README.md
```

---

## 🗄️ 数据库模型

### Prompts (提示词表)
```typescript
{
  id: string (UUID)
  title: string
  description: string
  content: string
  category: string
  author: string
  isPublic: boolean
  views: number
  likes: number
  createdAt: string (ISO)
  updatedAt: string (ISO)
  deletedAt: string? (软删除)
}
```

### Tags (标签表)
```typescript
{
  id: string (UUID)
  name: string (唯一)
  count: number (使用次数)
}
```

### PromptHistory (版本历史)
```typescript
{
  id: string (UUID)
  promptId: string (FK)
  content: string
  version: number
  changedBy: string
  changeLog: string
  createdAt: string
}
```

---

## 🚀 快速开始

### 前置要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### 安装步骤

1. **克隆项目**
```bash
cd /home/rowan/Projects/PromptSpark
```

2. **安装依赖**
```bash
npm install
```

3. **创建环境配置文件**
```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env` 设置必要的环境变量：
```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./data/promptspark.db
JWT_SECRET=your-secret-key-here
```

4. **启动开发服务器**
```bash
# 同时启动前后端
npm run dev

# 或单独启动
npm run dev:backend  # 后端: http://localhost:5000
npm run dev:frontend # 前端: http://localhost:3000
```

---

## 📚 API 文档

详细文档请参考：
- [基础 API 指南](docs/API.md)
- [团队协作 API 指南](docs/COLLABORATION.md)

### 基础 URL
```
http://localhost:5000/api
```

### Prompt 相关接口

#### 创建提示词
```http
POST /prompts
Content-Type: application/json

{
  "title": "标题",
  "description": "描述",
  "content": "完整的提示词内容",
  "category": "分类",
  "author": "作者名称",
  "tags": ["标签1", "标签2"]
}

Response: { success: true, data: {...}, message: "创建成功" }
```

#### 获取所有提示词
```http
GET /prompts?page=1&limit=20

Response: {
  success: true,
  data: [...],
  pagination: { page: 1, limit: 20, total: 100 }
}
```

#### 获取单个提示词
```http
GET /prompts/{id}

Response: { success: true, data: {...} }
```

#### 搜索提示词
```http
GET /prompts/search?query=关键词&category=分类&tags=标签1,标签2

Response: { success: true, data: [...], count: 5 }
```

#### 更新提示词
```http
PUT /prompts/{id}
Content-Type: application/json

{
  "title": "新标题",
  "content": "新内容",
  "author": "编辑者"
}

Response: { success: true, data: {...}, message: "更新成功" }
```

#### 删除提示词
```http
DELETE /prompts/{id}

Response: { success: true, message: "删除成功" }
```

#### 切换点赞状态
```http
POST /prompts/{id}/like
Content-Type: application/json

{ "liked": true }

Response: { success: true, data: {...}, message: "已点赞" }
```

---

## 🎯 前端功能

### 主界面
- 📝 提示词列表网格展示
- 🔍 实时搜索和过滤
- 🏷️ 分类和标签筛选
- 👁️ 浏览量和点赞显示

### 详情页面
- 📖 完整的提示词内容展示
- 📋 一键复制功能
- 📊 统计信息（浏览量、点赞数、作者等）
- 🏷️ 标签展示

### 创建/编辑模态框
- 📝 富文本输入
- 🏷️ 标签管理
- 📂 分类选择
- 👤 作者信息

### 侧边栏
- 🎯 分类快速筛选
- #️⃣ 热门标签
- 🔄 筛选条件清除

---

## 🔧 构建与部署

### 生产构建
```bash
npm run build
```

### 启动生产服务
```bash
npm start
```

### Docker 部署（可选）
```bash
docker build -t promptspark .
docker run -p 5000:5000 -p 3000:3000 promptspark
```

---

## 📱 浏览器兼容性
- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14

---

## 🔐 安全建议

1. **修改默认密钥**：编辑 `.env` 中的 `JWT_SECRET`
2. **HTTPS**：生产环境务必使用 HTTPS
3. **CORS 配置**：根据实际需要调整 CORS 设置
4. **数据备份**：定期备份 SQLite 数据库文件

---

## 📈 性能优化

- ✅ 虚拟滚动（处理大列表）
- ✅ 请求防抖（搜索优化）
- ✅ 组件 memo 优化
- ✅ 数据库索引优化
- ✅ CDN 静态资源托管（可选）

---

## 🐛 常见问题

**Q: 如何修改数据库位置？**
A: 编辑 `backend/.env` 中的 `DATABASE_PATH` 变量

**Q: 如何导入现有提示词？**
A: 通过 API 批量创建，或使用创建模态框逐个添加

**Q: 支持多用户吗？**
A: 当前版本为单用户本地应用，可通过扩展 JWT 认证实现多用户

**Q: 如何备份数据？**
A: 备份 `./data/promptspark.db` 文件即可

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发工作流
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- 📧 Email: support@promptspark.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/promptspark/issues)

---

## 🎓 学习资源

- [Express.js 文档](https://expressjs.com/)
- [React 官方文档](https://react.dev)
- [Zustand 文档](https://github.com/pmndrs/zustand)
- [SQLite 文档](https://www.sqlite.org/docs.html)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)

---

**⭐ 如果你觉得这个项目有帮助，请给我一个 Star！**

---

*最后更新：2024年12月*
