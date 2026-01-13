# PromptSpark 测试计划 (Test Plan)

**版本**: 1.0
**生成日期**: 2026-01-12
**测试负责人**: QA Team

---

## 1. 执行摘要 (Executive Summary)

### 1.1 测试范围概述

PromptSpark 是一个全栈 Prompt 管理平台，包含以下核心模块：
- **Backend API** (Node.js + Express + PostgreSQL)
- **Frontend Web App** (React + TypeScript + Vite)
- **Chrome Extension** (Manifest V3)
- **MCP Server** (Model Context Protocol)

### 1.2 关键风险与缓解策略

| 风险类别 | 风险描述 | 影响等级 | 缓解策略 |
|---------|---------|---------|---------|
| 数据安全 | JWT 令牌泄露导致未授权访问 | **高** | 实施 HTTPS、令牌过期机制、中间件验证 |
| 数据一致性 | 版本控制历史丢失或错误 | **高** | 数据库事务、软删除机制、备份策略 |
| AI 服务依赖 | Gemini/DeepSeek API 故障 | **中** | 降级到关键词匹配、超时重试机制 |
| 并发冲突 | 多用户同时编辑同一 Prompt | **中** | 乐观锁、最后写入优先、冲突检测 |
| 性能瓶颈 | 大量 Prompt 导致查询缓慢 | **中** | 分页、索引、缓存策略 |

### 1.3 资源估算

- **测试工程师**: 2 人
- **测试周期**: 2 周
- **自动化覆盖目标**: P0 用例 100%, P1 用例 80%

---

## 2. 详细测试策略 (Test Strategy)

### 2.1 测试层级 (Testing Pyramid)

```
        /\
       /  \        E2E Tests: 15%
      /____\       - Playwright (Chrome/Firefox/Safari)
     /      \      - 关键用户流程
    /        \
   /----------\   Integration Tests: 35%
  /            \  - API endpoint tests
 /              \ - Database interaction
/----------------\ Unit Tests: 50%
                  - Component tests
                  - Business logic
```

### 2.2 单元测试 (Unit Testing)

**目标**: 验证独立组件和函数的正确性

**Backend**:
- 工具: Vitest
- 覆盖范围:
  - Models (业务逻辑层)
  - Services (AI 服务、缓存服务)
  - Middleware (认证、配额、限流)
  - Utils (工具函数)

**Frontend**:
- 工具: Jest + React Testing Library
- 覆盖范围:
  - Components (UI 组件)
  - Stores (Zustand 状态管理)
  - Hooks (自定义 Hooks)

**覆盖率目标**: ≥ 80%

### 2.3 集成测试 (Integration Testing)

**目标**: 验证模块间交互和数据流

**API 集成测试**:
- 工具: Supertest + Vitest
- 测试内容:
  - REST API 端点
  - 数据库 CRUD 操作
  - 认证流程
  - 权限验证

**数据库集成测试**:
- 测试内容:
  - 事务完整性
  - 软删除行为
  - 版本控制历史
  - 关联数据一致性

### 2.4 E2E 测试 (End-to-End Testing)

**目标**: 验证完整用户场景

**工具**: Playwright

**测试环境**:
- Browser: Chrome, Firefox, Safari
- Viewport: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

**关键用户流程**:
1. 用户注册/登录
2. 创建/编辑/删除 Prompt
3. AI 优化与诊断
4. 协作功能（评论、权限）
5. Extension 同步

### 2.5 数据准备 (Data Preparation)

**测试数据类型**:
- Mock 用户数据 (测试账户)
- Sample Prompts (各种类别)
- 测试标签与分类
- API Token 样例
- 评论与讨论数据

**测试数据库**:
- 独立测试数据库实例
- 每次测试前重置状态
- 使用 seed 脚本填充基础数据

---

## 3. 测试用例矩阵 (Test Case Matrix)

### 3.1 认证与授权 (Authentication & Authorization)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-001 | Auth | 用户注册 - 成功 | P0 | 无有效用户 | 1. 提交注册表单（邮箱/密码）<br>2. 验证邮箱 | 注册成功，自动登录 | Automated |
| TC-002 | Auth | 用户注册 - 重复邮箱 | P0 | 邮箱已注册 | 1. 使用已注册邮箱提交注册 | 返回 400 错误，提示邮箱已存在 | Automated |
| TC-003 | Auth | 用户登录 - 有效凭证 | P0 | 用户已注册 | 1. 输入正确邮箱和密码<br>2. 点击登录 | 返回 JWT token，跳转首页 | Automated |
| TC-004 | Auth | 用户登录 - 无效密码 | P0 | 用户已注册 | 1. 输入正确邮箱和错误密码 | 返回 401 错误，提示密码错误 | Automated |
| TC-005 | Auth | Token 过期处理 | P0 | 用户已登录 | 1. 使用过期 token 访问 API | 返回 401，要求重新登录 | Automated |
| TC-006 | Auth | API Token 认证 | P1 | 已生成 API Token | 1. 使用 API Token 调用 SDK 接口 | 成功认证，正常访问 | Automated |
| TC-007 | Auth | 权限检查 - Owner | P0 | 用户是 Owner | 1. 尝试编辑、删除、管理权限 | 所有操作成功 | Automated |
| TC-008 | Auth | 权限检查 - Editor | P0 | 用户是 Editor | 1. 尝试编辑 Prompt | 编辑成功<br>2. 尝试删除 Prompt | 返回 403 禁止 | Automated |
| TC-009 | Auth | 权限检查 - Viewer | P0 | 用户是 Viewer | 1. 尝试编辑 Prompt | 返回 403 禁止<br>2. 尝试查看 Prompt | 查看成功 | Automated |

### 3.2 Prompt 管理 (Prompt Management)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-101 | Prompts | 创建 Prompt - 基础 | P0 | 用户已登录 | 1. 填写标题、内容<br>2. 点击保存 | Prompt 创建成功，显示在列表 | Automated |
| TC-102 | Prompts | 创建 Prompt - 完整表单 | P0 | 用户已登录 | 1. 填写所有字段（标题、内容、描述、分类、标签、元数据）<br>2. 保存 | 所有字段正确保存 | Automated |
| TC-103 | Prompts | 创建 Prompt - 缺少必填项 | P1 | 用户已登录 | 1. 仅填写描述，不填标题和内容 | 显示验证错误提示 | Automated |
| TC-104 | Prompts | 编辑 Prompt | P0 | Prompt 已存在 | 1. 修改标题和内容<br>2. 保存 | 更新成功，创建版本历史 | Automated |
| TC-105 | Prompts | 删除 Prompt - 软删除 | P0 | Prompt 已存在 | 1. 点击删除 | Prompt 不再显示在列表<br>数据库中 deletedAt 不为空 | Automated |
| TC-106 | Prompts | 搜索 Prompt - 关键词 | P1 | 多个 Prompt | 1. 输入关键词搜索 | 返回匹配的 Prompt 列表 | Automated |
| TC-107 | Prompts | 搜索 Prompt - 标签过滤 | P1 | 多个带标签的 Prompt | 1. 选择标签筛选 | 返回包含该标签的 Prompt | Automated |
| TC-108 | Prompts | 搜索 Prompt - 分类过滤 | P1 | 多个分类的 Prompt | 1. 选择分类筛选 | 返回该分类下的 Prompt | Automated |
| TC-109 | Prompts | 版本历史 - 查看 | P0 | Prompt 有多个版本 | 1. 打开版本历史标签 | 显示所有版本，按时间排序 | Automated |
| TC-110 | Prompts | 版本对比 - Diff 视图 | P0 | Prompt 有多个版本 | 1. 选择两个版本对比 | 显示字符级 diff 高亮 | Automated |
| TC-111 | Prompts | 复原到旧版本 | P1 | Prompt 有多个版本 | 1. 选择旧版本<br>2. 点击复原 | 创建新版本，内容与旧版本一致 | Automated |
| TC-112 | Prompts | 公开/私有切换 | P1 | Prompt 已存在 | 1. 切换 isPublic 开关 | 权限更新，非Owner用户可根据设置访问 | Automated |

### 3.3 AI 功能 (AI Features)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-201 | AI | AI 诊断 - 简单 Prompt | P0 | AI 服务可用 | 1. 输入简单 Prompt<br>2. 点击诊断 | 返回评分 (0-100) 和改进建议 | Automated |
| TC-202 | AI | AI 诊断 - 高质量 Prompt | P1 | AI 服务可用 | 1. 输入结构化 Prompt | 返回高评分 (>80) | Automated |
| TC-203 | AI | AI 优化 - 基础扩写 | P0 | AI 服务可用 | 1. 输入简单指令<br>2. 点击优化 | 返回优化后的 Prompt 和 diff | Automated |
| TC-204 | AI | AI 优化 - 拒绝无效输入 | P2 | AI 服务可用 | 1. 输入空内容<br>2. 点击优化 | 返回错误提示 | Automated |
| TC-205 | AI | AI 服务故障降级 | P0 | AI 服务不可用 | 1. AI API 超时或失败 | 自动降级到关键词匹配 | Automated |
| TC-206 | AI | 自动打标 - 新建时 | P1 | AI 服务可用 | 1. 输入 Prompt 内容<br>2. 保存 | 自动提取并保存标签 | Automated |
| TC-207 | AI | 自动打标 - AI 不可用 | P2 | AI 服务不可用 | 1. 输入 Prompt 内容<br>2. 保存 | 手动输入标签，不报错 | Manual |

### 3.4 协作功能 (Collaboration)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-301 | Collaboration | 添加评论 | P0 | Prompt 已存在 | 1. 输入评论内容<br>2. 提交 | 评论显示在讨论区 | Automated |
| TC-302 | Collaboration | 嵌套回复 | P1 | 评论已存在 | 1. 点击回复<br>2. 输入回复内容 | 回复作为子评论显示 | Automated |
| TC-303 | Collaboration | 删除评论 - 软删除 | P0 | 评论已存在 | 1. 点击删除 | 评论显示为"已删除" | Automated |
| TC-304 | Collaboration | 点赞评论 | P2 | 评论已存在 | 1. 点击点赞按钮 | 点赞数 +1 | Automated |
| TC-305 | Collaboration | 创建讨论 | P1 | Prompt 已存在 | 1. 创建讨论线程 | 讨论显示在 Prompt 页面 | Automated |
| TC-306 | Collaboration | 讨论状态切换 | P1 | 讨论已存在 | 1. 切换 Open/Resolved 状态 | 状态更新，显示对应标签 | Automated |
| TC-307 | Collaboration | 权限管理 - 添加 Editor | P0 | 用户是 Owner | 1. 添加用户为 Editor | 用户获得编辑权限 | Automated |
| TC-308 | Collaboration | 权限管理 - 移除权限 | P0 | 用户已授权 | 1. 移除用户权限 | 用户无法再访问 | Automated |
| TC-309 | Collaboration | 评分 - 5星评分 | P1 | 用户已登录 | 1. 评分 5 星（helpfulness, accuracy, relevance） | 评分保存，平均分更新 | Automated |
| TC-310 | Collaboration | 所有权认领 | P2 | 匿名 Prompt | 1. 原作者认领 | 所有权更新为当前用户 | Automated |

### 3.5 交互式 Playground (Interactive Playground)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-401 | Playground | 运行 Prompt - 默认模型 | P0 | Prompt 已存在 | 1. 点击运行 | 返回 AI 生成结果 | Automated |
| TC-402 | Playground | 运行 Prompt - 切换模型 | P0 | Prompt 已存在 | 1. 选择 Gemini<br>2. 运行<br>3. 选择 DeepSeek<br>4. 运行 | 两次运行结果不同 | Automated |
| TC-403 | Playground | 变量注入 | P0 | Prompt 包含 {{variable}} | 1. 打开 Playground<br>2. 自动生成表单<br>3. 填写变量值<br>4. 运行 | 变量正确替换，返回结果 | Automated |
| TC-404 | Playground | 评测日志 - 记录 | P1 | Prompt 已运行 | 1. 对结果评分 | 保存到 eval_logs，计算通过率 | Automated |
| TC-405 | Playground | 评测日志 - 查看历史 | P1 | 多次运行记录 | 1. 打开历史标签 | 显示所有运行记录和评分 | Automated |
| TC-406 | Playground | 流式输出 | P0 | Prompt 已存在 | 1. 运行 Prompt | 实时显示生成内容（stream） | Automated |

### 3.6 Chrome Extension (Extension)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-501 | Extension | 注入采集按钮 | P0 | 在 Civitai 页面 | 1. 打开 Civitai 图片页 | 显示 "Spark Capture" 按钮 | Manual |
| TC-502 | Extension | 点击采集 | P0 | 按钮已显示 | 1. 点击 "Spark Capture" | 提取 Prompt、Seed、Model 等参数 | Manual |
| TC-503 | Extension | 保存到本地存储 | P0 | 参数已提取 | 1. 点击保存 | 保存到 chrome.storage.local | Manual |
| TC-504 | Extension | 同步到云端 | P0 | 已保存本地数据 | 1. 点击同步<br>2. 登录 | 数据上传到 /api/sdk/capture | Manual |
| TC-505 | Extension | 批量同步 | P1 | 多条本地数据 | 1. 点击批量同步 | 所有数据上传成功 | Manual |

### 3.7 MCP Server (MCP Integration)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-601 | MCP | MCP Server 启动 | P0 | 后端服务运行 | 1. 运行 npm run mcp | Server 启动，监听 stdin/stdout | Automated |
| TC-602 | MCP | 搜索 Prompts 资源 | P0 | MCP 已连接 | 1. 调用 search_prompts 工具 | 返回匹配的 Prompt 列表 | Automated |
| TC-603 | MCP | ask_librarian 工具 | P1 | MCP 已连接 | 1. 自然语言查询 | AI 代理选择最合适的 Prompt | Automated |
| TC-604 | MCP | Prompt 模板资源 | P0 | MCP 已连接 | 1. 读取 Prompt 资源 | 返回 Prompt JSON 数据 | Automated |

### 3.8 性能测试 (Performance Testing)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-701 | Performance | API 响应时间 | P1 | 服务运行 | 1. 调用 /api/prompts<br>2. 测量响应时间 | < 500ms (p95) | Automated |
| TC-702 | Performance | 并发请求 - 100用户 | P1 | 服务运行 | 1. 100 并发请求 | 无错误，响应时间 < 2s | Automated |
| TC-703 | Performance | 数据库查询优化 | P1 | 1000+ Prompts | 1. 搜索查询 | 使用索引，< 200ms | Automated |
| TC-704 | Performance | 前端首屏加载 | P1 | Web 应用 | 1. 打开首页<br>2. 测量 FCP/LCP | FCP < 1.5s, LCP < 2.5s | Automated |

### 3.9 安全测试 (Security Testing)

| ID | 模块 | 场景 | 优先级 | 前置条件 | 步骤 | 预期结果 | 类型 |
|----|------|------|--------|---------|------|----------|------|
| TC-801 | Security | SQL 注入防护 | P0 | 登录接口 | 1. 输入 `' OR '1'='1` 作为密码 | 登录失败，返回错误 | Automated |
| TC-802 | Security | XSS 防护 | P0 | 评论功能 | 1. 输入 `<script>alert(1)</script>` | 内容被转义，不执行脚本 | Automated |
| TC-803 | Security | CSRF 防护 | P1 | 已登录 | 1. 跨站请求伪造 | 请求被拒绝 | Manual |
| TC-804 | Security | Token 泄露 | P0 | JWT Token | 1. 检查 Token 存储 | 使用 httpOnly cookie 或 localStorage with CSP | Manual |

---

## 4. 自动化代码示例 (Automation Code Samples)

### 4.1 Backend API Tests (Vitest + Supertest)

```typescript
// backend/tests/auth.api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/db/database';

describe('Authentication API', () => {
  beforeAll(async () => {
    await db.migrate();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/auth/register', () => {
    it('TC-001: should register user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('TC-002: should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'AnotherPass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('TC-003: should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('TC-004: should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
```

### 4.2 Frontend Component Tests (Jest + RTL)

```typescript
// frontend/src/components/__tests__/PromptCard.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptCard } from '../PromptCard';

describe('PromptCard Component', () => {
  const mockPrompt = {
    id: '1',
    title: 'Test Prompt',
    content: 'This is a test prompt',
    category: 'test',
    tags: ['test', 'sample'],
    createdAt: new Date().toISOString(),
  };

  it('TC-101: should render prompt details', () => {
    render(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('This is a test prompt')).toBeInTheDocument();
  });

  it('TC-102: should display tags', () => {
    render(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('sample')).toBeInTheDocument();
  });

  it('TC-104: should call onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<PromptCard prompt={mockPrompt} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockPrompt);
  });
});
```

### 4.3 E2E Tests (Playwright)

```typescript
// e2e/prompts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Prompt Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // TC-003: Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('TC-101: Create a new prompt', async ({ page }) => {
    await page.click('button:has-text("New Prompt")');
    await page.fill('input[name="title"]', 'E2E Test Prompt');
    await page.fill('textarea[name="content"]', 'This is an automated test');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=E2E Test Prompt')).toBeVisible();
    await expect(page.locator('text=This is an automated test')).toBeVisible();
  });

  test('TC-104: Edit existing prompt', async ({ page }) => {
    await page.click('text=E2E Test Prompt');
    await page.click('button:has-text("Edit")');
    await page.fill('textarea[name="content"]', 'Updated content');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Updated content')).toBeVisible();
  });

  test('TC-105: Delete prompt', async ({ page }) => {
    await page.click('text=E2E Test Prompt');
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=E2E Test Prompt')).not.toBeVisible();
  });
});
```

### 4.4 Performance Tests

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('TC-701: API response time', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('http://localhost:5000/api/prompts');
    const duration = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('TC-704: Frontend loading performance', async ({ page }) => {
    const metrics = await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      return {
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        lcp: navigation.loadEventEnd,
      };
    });

    expect(performanceMetrics.fcp).toBeLessThan(1500);
    expect(performanceMetrics.lcp).toBeLessThan(2500);
  });
});
```

---

## 5. 验收标准 (Acceptance Criteria)

### 5.1 测试完成定义 (Definition of Done)

- [ ] 所有 P0 测试用例执行完成，通过率 100%
- [ ] 所有 P1 测试用例执行完成，通过率 ≥ 95%
- [ ] P0 自动化覆盖率达到 100%
- [ ] P1 自动化覆盖率达到 80%
- [ ] 代码覆盖率 ≥ 80%
- [ ] 所有已知 bug 已修复或记录到 backlog
- [ ] 性能测试通过（无 P0/P1 性能问题）
- [ ] 安全扫描通过（无高危漏洞）

### 5.2 上线标准 (Go/No-Go Decision)

**Go 条件**:
- ✅ 所有 P0 bug 已修复
- ✅ P1 bug ≤ 5 个，且有规避方案
- ✅ E2E 测试全部通过
- ✅ 性能指标达标
- ✅ 安全审计通过

**No-Go 条件**:
- ❌ 存在未修复的 P0 bug
- ❌ 数据丢失或损坏风险
- ❌ 安全漏洞未修复
- ❌ 核心功能不可用

---

## 6. 测试环境 (Test Environment)

### 6.1 环境配置

| 环境 | URL | 数据库 | 用途 |
|------|-----|--------|------|
| Local | localhost:3000 | PostgreSQL (local) | 开发测试 |
| Staging | staging.promptspark.com | PostgreSQL (cloud) | 预发布测试 |
| Production | promptspark.com | PostgreSQL (cloud) | 生产环境 |

### 6.2 测试数据

- 测试账户: `test@example.com` / `Test@1234`
- 测试 Prompts: 100+ 条（包含各种类别）
- 测试标签: 20+ 个
- 测试评论: 50+ 条

---

## 7. 风险与问题 (Risks & Issues)

| ID | 风险/问题 | 严重性 | 状态 | 解决方案 |
|----|----------|--------|------|----------|
| R-001 | AI 服务不稳定 | 高 | Open | 实施降级策略 |
| R-002 | 测试数据清理不完整 | 中 | Open | 添加清理脚本 |
| R-003 | E2E 测试不稳定 | 中 | Open | 增加重试机制 |

---

## 8. 附录 (Appendix)

### 8.1 术语表

- **P0**: 最高优先级，必须修复/实现
- **P1**: 高优先级，应该修复/实现
- **P2**: 中等优先级，可以延后
- **Soft Delete**: 软删除，数据不物理删除，标记为已删除
- **MCP**: Model Context Protocol，模型上下文协议

### 8.2 参考文档

- [API 文档](./API.md)
- [MCP 集成指南](./MCP_GUIDE.md)
- [商业化架构](./COMMERCIAL_ARCHITECTURE.md)

---

**测试计划版本历史**:
- v1.0 (2026-01-12): 初始版本
