# PromptSpark - 快速开始指南

## ⚡ 3 分钟启动项目

### 第 1 步：安装依赖（约 1 分钟）
```bash
cd /home/rowan/Projects/PromptSpark
npm install
```

### 第 2 步：启动开发服务器（约 1 分钟）
```bash
npm run dev
```

你会看到：
```
✓ 后端服务器运行在 http://localhost:5000
✓ 前端应用运行在 http://localhost:3000
```

### 第 3 步：打开浏览器
访问 http://localhost:3000 即可使用！

---

## 🎯 首次体验步骤

1. **创建提示词**
   - 点击页面右上角的 "新建提示词" 按钮
   - 填写标题、描述、内容等信息
   - 选择分类（编程、写作、分析、其他）
   - 添加标签（用逗号分隔）
   - 点击 "创建提示词"

2. **浏览和搜索**
   - 在搜索栏输入关键词快速查找
   - 在左侧边栏选择分类或标签进行筛选
   - 点击提示词卡片查看详细信息

3. **与提示词互动**
   - 点击心形图标点赞
   - 在详情页面一键复制内容
   - 查看浏览次数和点赞统计

---

## �� 核心功能

| 功能 | 说明 |
|------|------|
| 📝 创建 | 创建新的提示词并自动保存 |
| 🔍 搜索 | 全文搜索标题、描述和内容 |
| 🏷️ 分类 | 4 个预设分类快速筛选 |
| #️⃣ 标签 | 6 个热门标签选择 |
| ❤️ 点赞 | 实时更新点赞统计 |
| 👁️ 统计 | 自动记录浏览次数 |
| 📋 详情 | 完整展示提示词内容 |
| 🔄 版本 | 自动记录修改历史 |

---

## 🛠️ 常用命令

```bash
# 开发模式（同时启动前后端）
npm run dev

# 仅启动后端
npm run dev:backend

# 仅启动前端
npm run dev:frontend

# 生产构建
npm run build

# 启动生产服务
npm start
```

---

## 📖 完整文档

- **[README.md](./README.md)** - 项目完整说明
- **[API.md](./docs/API.md)** - REST API 文档
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - 开发规范
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - 部署指南
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 项目总结

---

## 🐛 遇到问题？

### 问题：端口被占用
```bash
# 更改端口（修改 vite.config.ts 和 backend/src/index.ts）
```

### 问题：数据库错误
```bash
# 删除数据库文件重新创建
rm -rf ./data/promptspark.db
npm run dev
```

### 问题：依赖安装失败
```bash
# 清除 npm 缓存
npm cache clean --force
npm install
```

---

## 🎓 下一步学习

1. 查看 `frontend/src/App.tsx` - 了解前端结构
2. 查看 `backend/src/index.ts` - 了解后端结构
3. 阅读 `docs/API.md` - 学习 API 使用
4. 参考 `docs/DEVELOPMENT.md` - 学习开发规范

---

**祝你使用愉快！如有问题，查看完整文档即可。** 🚀
