# API 使用指南

## 概述

PromptSpark API 遵循 RESTful 原则，采用 JSON 格式进行数据交互。所有响应都遵循统一的格式：

```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "error": string (仅在失败时出现)
}
```

## 认证

当前版本暂未实现用户认证，所有端点都可公开访问。未来版本将添加 JWT 认证机制。

---

## 提示词 API

### 1. 创建提示词

**请求**
```http
POST /api/prompts
Content-Type: application/json

{
  "title": "编写高质量的代码评论",
  "description": "帮助生成清晰、有用的代码评论",
  "content": "你是一个资深的代码审查专家。当我给你提供代码片段时，请生成包含以下内容的代码评论...",
  "category": "编程",
  "author": "张三",
  "tags": ["代码审查", "最佳实践", "编程"],
  "isPublic": true
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "编写高质量的代码评论",
    "description": "帮助生成清晰、有用的代码评论",
    "content": "你是一个资深的代码审查专家...",
    "category": "编程",
    "author": "张三",
    "isPublic": true,
    "views": 0,
    "likes": 0,
    "tags": ["代码审查", "最佳实践", "编程"],
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  },
  "message": "Prompt created successfully"
}
```

### 2. 获取所有提示词

**请求**
```http
GET /api/prompts?page=1&limit=20
```

**参数**
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 20 | 每页数量 |

**响应**
```json
{
  "success": true,
  "data": [
    { ... },
    { ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### 3. 获取单个提示词

**请求**
```http
GET /api/prompts/{id}
```

**说明**：自动增加浏览次数

**响应**
```json
{
  "success": true,
  "data": { ... }
}
```

### 4. 搜索提示词

**请求**
```http
GET /api/prompts/search?query=关键词&category=编程&tags=AI,工作
```

**参数**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| query | string | ✓ | 搜索关键词 |
| category | string | ✗ | 分类过滤 |
| tags | string | ✗ | 标签过滤（逗号分隔） |

**响应**
```json
{
  "success": true,
  "data": [ ... ],
  "count": 5
}
```

### 5. 更新提示词

**请求**
```http
PUT /api/prompts/{id}
Content-Type: application/json

{
  "title": "新标题（可选）",
  "description": "新描述（可选）",
  "content": "新内容（可选）",
  "category": "新分类（可选）",
  "author": "编辑者信息"
}
```

**说明**：
- 更新 content 时会自动创建版本记录
- author 字段用于记录修改者

**响应**
```json
{
  "success": true,
  "data": { ... },
  "message": "Prompt updated successfully"
}
```

### 6. 删除提示词

**请求**
```http
DELETE /api/prompts/{id}
```

**说明**：使用软删除，数据不会被物理删除

**响应**
```json
{
  "success": true,
  "message": "Prompt deleted successfully"
}
```

### 7. 切换点赞状态

**请求**
```http
POST /api/prompts/{id}/like
Content-Type: application/json

{
  "liked": true
}
```

**参数**
| 参数 | 类型 | 描述 |
|------|------|------|
| liked | boolean | true 表示点赞，false 表示取消点赞 |

**响应**
```json
{
  "success": true,
  "data": { ... },
  "message": "Like status updated"
}
```

---

## 错误处理

### 常见错误码

| HTTP 状态码 | 错误信息 | 说明 |
|------------|--------|------|
| 400 | Bad Request | 请求参数不合法 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器错误 |

### 错误响应示例

```json
{
  "success": false,
  "message": "Prompt not found",
  "error": "详细错误信息（仅开发环境）"
}
```

---

## 使用示例

### JavaScript/Node.js

```javascript
// 创建提示词
const response = await fetch('http://localhost:5000/api/prompts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '标题',
    description: '描述',
    content: '内容',
    category: '分类',
    author: '作者',
    tags: ['标签1', '标签2']
  })
});

const result = await response.json();
console.log(result);
```

### Python

```python
import requests

# 搜索提示词
response = requests.get(
  'http://localhost:5000/api/prompts/search',
  params={
    'query': '关键词',
    'category': '编程'
  }
)

prompts = response.json()['data']
```

### cURL

```bash
# 获取所有提示词
curl -X GET "http://localhost:5000/api/prompts?page=1&limit=10"

# 创建新提示词
curl -X POST "http://localhost:5000/api/prompts" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "标题",
    "description": "描述",
    "content": "内容",
    "category": "编程",
    "author": "作者",
    "tags": ["标签1", "标签2"]
  }'
```

---

## 速率限制

当前版本未实现速率限制。生产环境建议配置：
- 每 IP 每分钟最多 60 个请求
- 每 IP 每小时最多 1000 个请求

---

## 最佳实践

1. **使用分页**：大量数据时使用 page 和 limit 参数
2. **错误处理**：始终检查 success 字段
3. **缓存策略**：对频繁访问的数据实现客户端缓存
4. **搜索优化**：使用合适的搜索关键词和过滤条件
5. **并发控制**：避免同时发送过多请求

---

## 版本历史

### v1.0.0 (2024-12-10)
- ✓ 基础 CRUD 操作
- ✓ 搜索和过滤
- ✓ 浏览次数和点赞统计
- ✓ 版本历史记录

### 计划中的功能
- [ ] 用户认证（JWT）
- [ ] 用户权限管理
- [ ] 导入导出功能
- [ ] 提示词收藏
- [ ] 评论和讨论
- [ ] API 速率限制
