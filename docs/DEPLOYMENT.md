# PromptSpark 部署指南 (v2.3)

## 本地部署

### 前置要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- SQLite3

### 步骤

1. **安装依赖**
```bash
npm install
```

2. **配置环境**
```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env
# PORT=5000
# JWT_SECRET=your_secret_key
```

3. **启动应用**
```bash
npm run dev
```

---

## Docker 部署 (推荐)

### docker-compose.yml

```yaml
version: '3.8'

services:
  promptspark:
    build: .
    ports:
      - "5000:5000" # API
      - "3000:3000" # Web
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_PATH=/app/data/promptspark.db
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### 启动

```bash
docker-compose up -d
```

---

## 环境变量说明

| 变量名 | 必填 | 默认值 | 描述 |
|--------|------|--------|------|
| PORT | 否 | 5000 | 后端监听端口 |
| DATABASE_PATH | 否 | ./data/promptspark.db | SQLite 数据库文件路径 |
| JWT_SECRET | 是 | - | 用户认证加密密钥 |
| NODE_ENV | 否 | development | 运行模式 (development/production) |

---

## 数据库维护

### 备份
直接备份 `DATABASE_PATH` 指定的 `.db` 文件即可。

### 迁移
由于采用 MVC 架构与 Model 封装，如果需要更换数据库 (如 PostgreSQL)，仅需实现新的 Model 适配器并更新 `database.ts` 连接逻辑。

---

## 生产环境安全建议

1. **强密钥**: 务必在生产环境更改 `JWT_SECRET`。
2. **HTTPS**: 强烈建议通过 Nginx 配置 SSL。
3. **API Token**: 提醒用户定期更换开发者 Token。
4. **权限最小化**: 确保 Docker 运行用户对数据库文件只有必要的读写权限。

---

*最后更新：2025 年 12 月 30 日*