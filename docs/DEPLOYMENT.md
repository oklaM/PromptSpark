# PromptSpark 部署指南

## 本地部署

### 前置要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 步骤

1. **安装依赖**
```bash
npm install
```

2. **配置环境**
```bash
cp backend/.env.example backend/.env
```

3. **启动应用**
```bash
npm run dev
```

- 前端: http://localhost:3000
- 后端 API: http://localhost:5000/api

---

## Docker 部署

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY backend ./backend
COPY frontend ./frontend

# Install dependencies
RUN npm install

# Build
RUN npm run build

# Expose ports
EXPOSE 5000 3000

# Start
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  promptspark:
    build: .
    ports:
      - "5000:5000"
      - "3000:3000"
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

## Nginx 反向代理配置

```nginx
upstream promptspark_api {
    server localhost:5000;
}

upstream promptspark_web {
    server localhost:3000;
}

server {
    listen 80;
    server_name promptspark.example.com;

    # API 代理
    location /api/ {
        proxy_pass http://promptspark_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 前端
    location / {
        proxy_pass http://promptspark_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## SSL/TLS 配置（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 生成证书
sudo certbot certonly --nginx -d promptspark.example.com

# 在 Nginx 配置中添加
ssl_certificate /etc/letsencrypt/live/promptspark.example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/promptspark.example.com/privkey.pem;

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 云平台部署

### Heroku 部署

1. **创建 Procfile**
```
web: npm start
```

2. **推送到 Heroku**
```bash
heroku create promptspark
git push heroku main
```

### AWS 部署

1. **使用 EC2**
   - 启动 Ubuntu 20.04 LTS 实例
   - SSH 连接并安装 Node.js
   - 克隆项目并配置

2. **使用 ECS**
   - 创建 Docker 镜像
   - 推送到 ECR
   - 创建 ECS 任务定义和服务

### Google Cloud Platform

1. **使用 App Engine**
```bash
# app.yaml
runtime: nodejs18
env: standard

env_variables:
  NODE_ENV: "production"
```

2. **部署**
```bash
gcloud app deploy
```

---

## 数据库迁移

### 从 SQLite 到 PostgreSQL

```sql
-- 导出 SQLite
.mode insert
.output prompts_data.sql
SELECT * FROM prompts;

-- 创建 PostgreSQL 表并导入
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  author TEXT,
  isPublic BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  deletedAt TIMESTAMP
);

-- 导入数据
\i prompts_data.sql
```

### 更新后端配置

```typescript
// 使用 pg 包替换 sqlite3
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

---

## 监控和维护

### 日志管理

```bash
# 使用 pm2
npm install -g pm2
pm2 start npm --name "promptspark" -- start
pm2 logs promptspark
pm2 save
```

### 性能监控

```bash
# 使用 New Relic
npm install newrelic
# 在应用启动前加载: require('newrelic');
```

### 备份策略

```bash
# 每天备份数据库
0 2 * * * cp /path/to/data/promptspark.db /path/to/backups/promptspark-$(date +\%Y\%m\%d).db

# 清理旧备份（保留最近 30 天）
0 3 * * * find /path/to/backups -name "*.db" -mtime +30 -delete
```

---

## 性能优化

### CDN 配置

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 启用 Gzip 压缩

```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### 数据库连接池

```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 故障排查

### 常见问题

**数据库连接错误**
```bash
# 检查数据库文件权限
chmod 644 data/promptspark.db
chmod 755 data/
```

**API 无响应**
```bash
# 检查端口占用
lsof -i :5000
# 清理进程
kill -9 <PID>
```

**内存泄漏**
```bash
# 使用 heapdump
npm install heapdump
# 监控内存使用
pm2 monit
```

---

## 安全加固

1. **更新依赖**
```bash
npm audit
npm audit fix
```

2. **配置防火墙**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

3. **定期更新系统**
```bash
sudo apt-get update
sudo apt-get upgrade
```

---

*最后更新：2024年12月*
