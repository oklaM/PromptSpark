# 🚀 自动化部署指南 (Deployment Guide)

PromptSpark 已经配置了完整的自动化 CI/CD 流程。本指南将帮助您配置腾讯云服务器并开启自动部署功能。

---

## 📋 部署流程概览

1. **Push Code**: 代码推送到 `master` 分支。
2. **CI Pipeline**: 自动运行测试、代码检查和构建。
3. **Docker Publish**: 构建 Docker 镜像并推送到 GitHub Container Registry (GHCR)。
4. **Deploy Pipeline**: 自动连接到腾讯云服务器，拉取最新镜像并重启服务。

---

## 🛠️ 服务器准备

1. **系统要求**: Ubuntu 20.04/22.04 LTS 或 CentOS 7+。
2. **安装 Docker & Docker Compose**:
   ```bash
   # 安装 Docker
   curl -fsSL https://get.docker.com | sh
   
   # 启动 Docker
   sudo systemctl enable --now docker
   
   # 验证 Docker Compose (新版 Docker 自带)
   docker compose version
   ```

---

## 🔐 GitHub Secrets 配置

在 GitHub 仓库的 `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret` 中添加以下变量：

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `HOST` | 服务器 IP 地址 | `123.45.67.89` |
| `USERNAME` | SSH 登录用户名 | `ubuntu` 或 `root` |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 | `-----BEGIN OPENSSH PRIVATE KEY...` |
| `DB_PASSWORD` | 生产环境数据库密码 | `StrongPassword123!` |
| `DOMAIN` | 你的域名 (用于 Traefik) | `promptspark.com` |
| `ACME_EMAIL` | 用于 Let's Encrypt 证书申请的邮箱 | `admin@promptspark.com` |

### 如何获取 SSH Private Key?

1. 在本地生成密钥对（如果还没有）：
   ```bash
   ssh-keygen -t ed25519 -C "deploy@promptspark" -f deploy_key
   ```
2. 将公钥 (`deploy_key.pub`) 内容添加到服务器的 `~/.ssh/authorized_keys` 文件中。
3. 将私钥 (`deploy_key`) 内容复制到 GitHub Secret `SSH_PRIVATE_KEY`。

---

## 📂 生产环境配置 (docker-compose.prod.yml)

自动部署会使用 `docker-compose.prod.yml` 文件。主要服务包括：

- **Traefik**: 反向代理与自动 HTTPS 证书管理。
- **Backend**: Node.js API 服务。
- **Frontend**: Nginx 静态文件服务。
- **Postgres**: 数据库。
- **Redis**: 缓存。
- **Watchtower**: (可选) 自动更新容器。
- **Uptime Kuma**: (可选) 监控服务状态。

> **注意**: 首次部署前，请确保域名 `DOMAIN` 已经解析到服务器 IP，否则 Traefik 申请 SSL 证书会失败。

---

## 🚀 手动触发部署

除了自动触发，您也可以手动部署：

1. 进入 GitHub 仓库 -> `Actions` 标签页。
2. 选择左侧的 `Deploy to Production`。
3. 点击右侧的 `Run workflow` 按钮。

---

## ❓ 常见问题排查

**Q: 部署失败，提示 "Permission denied (publickey)"**
A: 请检查 `SSH_PRIVATE_KEY` 是否正确复制，且对应的公钥已添加到服务器的 `authorized_keys`。

**Q: 镜像拉取失败 "denied: installation not allowed to Create organization package"**
A: 确保 Docker Publish 工作流成功运行，并且 `GITHUB_TOKEN` 有权限访问 GHCR。通常在个人仓库中默认有权限。

**Q: Traefik 证书获取失败**
A: 检查 `docker-compose.prod.yml` 中的邮箱是否已修改为您自己的邮箱，并确保 DNS 解析已生效。