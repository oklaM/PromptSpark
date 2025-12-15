## 团队协作功能文档

PromptSpark v2.0 引入了完整的团队协作功能，包括权限管理、评论系统、讨论区和评分系统。

---

## 1. 权限管理系统 (Permission Management)

### 概述
权限管理系统允许提示词拥有者与其他用户共享提示词，并为不同用户分配不同的角色和权限。

### 角色定义

| 角色 | 查看 | 编辑 | 删除 | 分享 | 评论 | 管理权限 |
|------|------|------|------|------|------|---------|
| owner (拥有者) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| editor (编辑者) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| commenter (评论者) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| viewer (查看者) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### API 端点

#### 授予权限
```
POST /api/collaboration/permissions/grant
Authorization: Bearer {token}

Request Body:
{
  "promptId": "string",
  "userId": "string",
  "role": "editor" | "viewer" | "commenter"
}

Response:
{
  "success": true,
  "permissionId": "string"
}
```

#### 撤销权限
```
DELETE /api/collaboration/permissions/{permissionId}
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

#### 获取提示词权限列表
```
GET /api/collaboration/prompts/{promptId}/permissions

Response:
[
  {
    "id": "string",
    "promptId": "string",
    "userId": "string",
    "role": "owner" | "editor" | "viewer" | "commenter",
    "displayName": "string",
    "grantedAt": "ISO 8601 datetime"
  }
]
```

#### 检查用户权限
```
GET /api/collaboration/prompts/{promptId}/check-permission
Authorization: Bearer {token}

Response:
{
  "hasPermission": boolean,
  "level": "owner" | "editor" | "viewer" | "commenter" | null,
  "permissions": {
    "level": "string",
    "canView": boolean,
    "canEdit": boolean,
    "canDelete": boolean,
    "canShare": boolean,
    "canComment": boolean,
    "canManagePermissions": boolean
  }
}
```

---

## 2. 评论系统 (Comments)

### 概述
评论系统允许用户对提示词发表评论，并支持评论的点赞和回复功能。

### API 端点

#### 创建评论
```
POST /api/collaboration/comments
Authorization: Bearer {token}

Request Body:
{
  "promptId": "string",
  "content": "string",
  "parentId": "string | null"  // 用于回复
}

Response:
{
  "success": true,
  "comment": {
    "id": "string",
    "promptId": "string",
    "userId": "string",
    "userName": "string",
    "content": "string",
    "parentId": "string | null",
    "likes": 0,
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime"
  }
}
```

#### 获取评论
```
GET /api/collaboration/prompts/{promptId}/comments?parentId={parentId}

Response:
[
  {
    "id": "string",
    "promptId": "string",
    "userId": "string",
    "userName": "string",
    "content": "string",
    "parentId": "string | null",
    "likes": number,
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime"
  }
]
```

#### 删除评论
```
DELETE /api/collaboration/comments/{commentId}
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

#### 点赞评论
```
POST /api/collaboration/comments/{commentId}/like
Authorization: Bearer {token}

Response:
{
  "success": true,
  "liked": boolean
}
```

---

## 3. 讨论系统 (Discussions)

### 概述
讨论系统允许用户围绕提示词展开深度讨论，支持线程化的评论和讨论状态管理。

### 讨论状态

- **open**: 讨论开放中
- **resolved**: 问题已解决
- **closed**: 讨论已关闭

### API 端点

#### 创建讨论
```
POST /api/collaboration/discussions
Authorization: Bearer {token}

Request Body:
{
  "promptId": "string",
  "title": "string",
  "description": "string"
}

Response:
{
  "success": true,
  "discussionId": "string"
}
```

#### 获取讨论列表
```
GET /api/collaboration/prompts/{promptId}/discussions

Response:
[
  {
    "id": "string",
    "promptId": "string",
    "title": "string",
    "description": "string",
    "initiatorName": "string",
    "commentCount": number,
    "lastCommentAt": "ISO 8601 datetime",
    "status": "open" | "resolved" | "closed",
    "createdAt": "ISO 8601 datetime"
  }
]
```

#### 更新讨论状态
```
PUT /api/collaboration/discussions/{discussionId}/status
Authorization: Bearer {token}

Request Body:
{
  "status": "open" | "resolved" | "closed"
}

Response:
{
  "success": true
}
```

---

## 4. 评分系统 (Ratings)

### 概述
评分系统允许用户对提示词进行评分（1-5 分），并提供有用性、准确性和相关性的详细评分。

### API 端点

#### 提交评分
```
POST /api/collaboration/ratings
Authorization: Bearer {token}

Request Body:
{
  "promptId": "string",
  "score": 1-5,
  "feedback": "string | null",
  "helpfulness": 0-100,  // 可选，有用性评分
  "accuracy": 0-100,     // 可选，准确性评分
  "relevance": 0-100     // 可选，相关性评分
}

Response:
{
  "success": true,
  "ratingId": "string"
}
```

#### 获取提示词的所有评分
```
GET /api/collaboration/prompts/{promptId}/ratings

Response:
[
  {
    "id": "string",
    "promptId": "string",
    "userId": "string",
    "userName": "string",
    "score": 1-5,
    "feedback": "string",
    "helpfulness": number,
    "accuracy": number,
    "relevance": number,
    "createdAt": "ISO 8601 datetime"
  }
]
```

#### 获取提示词评分统计
```
GET /api/collaboration/prompts/{promptId}/stats

Response:
{
  "promptId": "string",
  "averageScore": number,      // 平均评分 (1-5)
  "totalRatings": number,      // 总评分数
  "averageHelpfulness": number, // 平均有用性 (0-100)
  "averageAccuracy": number,    // 平均准确性 (0-100)
  "averageRelevance": number,   // 平均相关性 (0-100)
  "ratingDistribution": {       // 评分分布
    "1": number,
    "2": number,
    "3": number,
    "4": number,
    "5": number
  },
  "lastUpdated": "ISO 8601 datetime"
}
```

#### 删除评分
```
DELETE /api/collaboration/ratings/{ratingId}
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

---

## 前端组件

### 1. PermissionManagement 组件
```tsx
<PermissionManagement promptId={id} isOwner={isOwner} />
```

显示和管理提示词的权限。只有所有者才能访问。

**功能**:
- 授予权限给其他用户
- 撤销用户权限
- 显示当前权限列表

### 2. CommentThread 组件
```tsx
<CommentThread promptId={promptId} parentId={parentId} />
```

显示和管理评论线程。

**功能**:
- 发表新评论
- 回复评论（线程化）
- 删除自己的评论
- 点赞评论

### 3. DiscussionSection 组件
```tsx
<DiscussionSection promptId={promptId} />
```

显示和管理讨论。

**功能**:
- 创建新讨论
- 查看讨论列表
- 更新讨论状态
- 在讨论中评论

### 4. RatingComponent 组件
```tsx
<RatingComponent promptId={promptId} />
```

显示评分和统计信息。

**功能**:
- 提交评分和反馈
- 查看评分分布
- 查看详细统计（有用性、准确性、相关性）
- 删除自己的评分

---

## 使用示例

### 完整的使用流程

1. **权限设置** (所有者)
   ```
   POST /api/collaboration/permissions/grant
   {
     "promptId": "prompt-123",
     "userId": "user-456",
     "role": "editor"
   }
   ```

2. **用户发表评论** (有权限用户)
   ```
   POST /api/collaboration/comments
   {
     "promptId": "prompt-123",
     "content": "这个提示词很有用！",
     "parentId": null
   }
   ```

3. **用户回复评论** (有权限用户)
   ```
   POST /api/collaboration/comments
   {
     "promptId": "prompt-123",
     "content": "我同意，非常有帮助！",
     "parentId": "comment-789"
   }
   ```

4. **用户创建讨论** (有权限用户)
   ```
   POST /api/collaboration/discussions
   {
     "promptId": "prompt-123",
     "title": "如何改进这个提示词？",
     "description": "我在使用这个提示词时遇到了一些问题..."
   }
   ```

5. **用户提交评分** (有权限用户)
   ```
   POST /api/collaboration/ratings
   {
     "promptId": "prompt-123",
     "score": 5,
     "feedback": "非常完美的提示词！",
     "helpfulness": 95,
     "accuracy": 90,
     "relevance": 95
   }
   ```

6. **获取评分统计** (所有用户)
   ```
   GET /api/collaboration/prompts/prompt-123/stats
   ```

---

## 数据库表结构

### permissions 表
```sql
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  promptId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  grantedBy TEXT,
  grantedAt TEXT NOT NULL,
  revokedAt TEXT,
  UNIQUE(promptId, userId)
);
```

### comments 表
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  promptId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT,
  content TEXT NOT NULL,
  parentId TEXT,
  likes INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);
```

### discussions 表
```sql
CREATE TABLE discussions (
  id TEXT PRIMARY KEY,
  promptId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  initiatorId TEXT,
  initiatorName TEXT,
  commentCount INTEGER DEFAULT 0,
  lastCommentAt TEXT,
  status TEXT DEFAULT 'open',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### ratings 表
```sql
CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  promptId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT,
  score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
  feedback TEXT,
  helpfulness INTEGER DEFAULT 0,
  accuracy INTEGER DEFAULT 0,
  relevance INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(promptId, userId)
);
```

---

## 错误处理

所有 API 端点都遵循统一的错误响应格式：

```json
{
  "error": "Error message"
}
```

常见错误代码:
- `400`: 请求参数无效
- `403`: 无权限执行该操作
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 最佳实践

1. **权限检查**: 始终检查用户权限再执行操作
2. **输入验证**: 验证所有用户输入
3. **错误处理**: 向用户显示友好的错误消息
4. **加载状态**: 显示加载指示器提高 UX
5. **缓存**: 合理使用缓存减少 API 调用

---

## 下一步

- 🔔 添加实时通知系统
- 📧 添加邮件通知
- 🤖 添加 AI 辅助评分
- 📊 添加高级分析报告
- 🌐 多语言支持

