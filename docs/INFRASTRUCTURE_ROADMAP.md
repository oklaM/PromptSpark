# Infrastructure Evolution Roadmap (基础设施演进路线图)

本文档旨在规划 PromptSpark 项目从单机开发模式向高可用、自动化的生产级架构演进的路径。

## Phase 1: 基础设施生产化 (Production Readiness) - **已完成**

目标：实现自动化部署，增强安全性，移除手动运维痛点。

- [x] **引入 Watchtower**: 监控容器镜像仓库，自动拉取最新镜像并重启服务，实现“代码合入即上线”。
- [x] **创建生产级编排文件**: `docker-compose.prod.yml`，区分开发与生产配置。
- [x] **引入 Traefik**: 替代简单的端口映射，作为统一网关。
- [x] **自动 HTTPS**: 利用 Traefik + Let's Encrypt 自动管理 SSL 证书。
- [x] **SQLite -> PostgreSQL**: 
    - [x] 迁移数据模型适配 PostgreSQL。
    - [x] 在 Docker Compose 中添加 Postgres 服务。
    - [ ] 配置数据卷持久化和定期备份策略 (pg_dump) - *待完善备份脚本*

---

## Phase 2: 开发体验提效 (Developer Experience) - **已完成**

目标：减少反馈循环时间，统一开发环境。

- [x] **Husky + lint-staged**: 在 `git commit` 时自动运行 Lint 和格式化，确保脏代码不入库。
- [x] **Commitlint**: 规范提交信息格式（如 `feat:`, `fix:`），配合自动生成 Changelog。
- [ ] **Dev Containers**: 配置 `.devcontainer`，利用 VS Code Remote 容器技术，一键拉起标准开发环境（Node, Git, Docker, Extensions）。

---

## Phase 3: 可观测性 (Observability) - **已完成**

目标：从“被动响应报错”转变为“主动发现问题”。

- [x] **Uptime Kuma**: 部署轻量级监控面板，监控 API 和前端健康状态，配置 Telegram/Discord 告警。
    - 访问地址: `https://status.yourdomain.com` (需配置 DNS)
- [x] **日志聚合**: 部署 **Dozzle**，实时查看所有容器日志。
    - 访问地址: `https://logs.yourdomain.com` (需配置 DNS)

---

## Phase 4: 高可用与扩展 (High Availability) - **基础已就绪**

目标：应对高并发和单点故障。

- [x] **引入 Redis**: 用于缓存、会话管理或任务队列。
- [x] **负载均衡**: Traefik 已配置自动发现，支持 `docker-compose up -d --scale backend=3` 扩展后端副本。
- [ ] **数据库高可用**: 目前为单点 Postgres，未来可迁移至 RDS 或配置主从复制。
- [ ] **K8s (可选)**: 当单机 Docker Compose 无法满足需求时，迁移至 Kubernetes。