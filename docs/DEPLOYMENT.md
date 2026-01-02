# PromptSpark 部署指南 (v2.4)

## 本地部署

### 前置要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14 (推荐) 或 SQLite3

### 步骤

1. **安装依赖**
```bash
npm install
```

2. **配置环境**
```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env
# 配置数据库连接 (PostgreSQL 示例)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=promptspark
# DB_USER=postgres
# DB_PASSWORD=yourpassword
#
# 配置 AI 服务 (Gemini/DeepSeek)
# AI_PROVIDER=gemini
# AI_API_KEY=your_api_key
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
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-promptspark}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "5000:5000" # API
      - "3000:3000" # Web
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=${DB_NAME:-promptspark}
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD:-postgres}
      - JWT_SECRET=${JWT_SECRET}
      - AI_API_KEY=${AI_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

volumes:
  postgres_data:
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
| DB_HOST | 否 | localhost | 数据库主机 |
| DB_PORT | 否 | 5432 | 数据库端口 |
| DB_NAME | 否 | promptspark | 数据库名 |
| DB_USER | 否 | postgres | 数据库用户 |
| DB_PASSWORD | 否 | postgres | 数据库密码 |
| JWT_SECRET | 是 | - | 用户认证加密密钥 |
| AI_API_KEY | 否 | - | Gemini/DeepSeek API Key |
| AI_PROVIDER | 否 | gemini | AI 服务商 (gemini/deepseek) |

---

## 数据库维护

### 备份
使用 `pg_dump` 备份 PostgreSQL 数据库：
```bash
docker-compose exec db pg_dump -U postgres promptspark > backup.sql
```

### 迁移
后端应用启动时会自动检测 schema 变更并执行必要的迁移（如添加 `metadata` 列）。

---

## 生产环境安全建议

1. **强密钥**: 务必在生产环境更改 `JWT_SECRET`。
2. **HTTPS**: 强烈建议通过 Nginx 配置 SSL。
3. **API Token**: 提醒用户定期更换开发者 Token。
4. **AI 配额**: 监控 AI API Key 的使用量，防止超额扣费。

---

*最后更新：2026 年 1 月 1 日*
