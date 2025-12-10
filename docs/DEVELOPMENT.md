# 项目开发规范

## 代码风格

### TypeScript 规范

1. **类型定义**
```typescript
// ✓ 好
interface User {
  id: string;
  name: string;
  email: string;
}

// ✗ 避免
type User = {
  id: any;
  name: any;
};
```

2. **函数定义**
```typescript
// ✓ 好
async function getUserById(id: string): Promise<User> {
  // ...
}

// ✗ 避免
async function getUserById(id: any) {
  // ...
}
```

3. **导入导出**
```typescript
// ✓ 好
import { User } from '../types';
export const createUser = async (data: CreateUserDTO) => {};

// ✗ 避免
const { User } = require('../types');
module.exports = { createUser };
```

### React 组件规范

1. **函数式组件**
```typescript
// ✓ 好
interface CardProps {
  title: string;
  onClick?: () => void;
}

export function Card({ title, onClick }: CardProps) {
  return <div onClick={onClick}>{title}</div>;
}

// ✗ 避免
export const Card = (props) => {
  return <div>{props.title}</div>;
};
```

2. **Hooks 使用**
```typescript
// ✓ 好
function UserList() {
  const users = useUsers();
  const { filters, setFilters } = useFilterStore();

  return (
    <div>
      {users.map(u => <User key={u.id} user={u} />)}
    </div>
  );
}

// ✗ 避免
function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    // 直接在组件中处理逻辑
  }, []);
}
```

## 文件组织

```
src/
├── components/       # 可复用组件
│   ├── PromptCard.tsx
│   └── SearchBar.tsx
├── pages/           # 页面组件
├── hooks/           # 自定义钩子（复用逻辑）
├── services/        # API 调用
├── stores/          # 状态管理
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
└── styles/          # 样式文件
```

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件 | kebab-case | `prompt-card.tsx` |
| 组件 | PascalCase | `PromptCard` |
| 函数 | camelCase | `getUserById` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 接口 | PascalCase + I前缀或Suffix | `IUser` 或 `UserInterface` |
| 类型 | PascalCase + DTO | `CreateUserDTO` |

## Git 提交规范

### 提交消息格式
```
<type>(<scope>): <subject>
<blank line>
<body>
<blank line>
<footer>
```

### Type 类型
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `test`: 添加测试
- `chore`: 其他改动（依赖更新等）

### 示例
```
feat(prompt): add search functionality

- Implement full-text search
- Add category filter support
- Optimize query performance

Closes #123
```

## 测试规范

### 单元测试
```typescript
describe('PromptModel', () => {
  it('should create a new prompt', async () => {
    const data = {
      title: 'Test',
      content: 'Test content',
    };
    const prompt = await PromptModel.create(data);
    expect(prompt).toBeDefined();
    expect(prompt.title).toBe('Test');
  });
});
```

### 最少覆盖率要求
- 语句覆盖率：80%
- 分支覆盖率：75%
- 函数覆盖率：80%

## 文档规范

### JSDoc 注释
```typescript
/**
 * 创建新的提示词
 * @param {CreatePromptDTO} data - 提示词数据
 * @returns {Promise<Prompt>} 创建的提示词
 * @throws {Error} 当数据无效时抛出错误
 */
async function createPrompt(data: CreatePromptDTO): Promise<Prompt> {
  // ...
}
```

## 性能优化指南

1. **数据库查询优化**
   - 使用索引
   - 避免 N+1 查询
   - 使用连接而非多个查询

2. **前端优化**
   - 使用 React.memo 避免不必要的渲染
   - 虚拟滚动处理大列表
   - 请求防抖和节流

3. **API 响应优化**
   - 合理分页
   - 返回必要字段
   - 使用缓存策略

## 安全建议

1. **环境变量**
   - 敏感信息存储在 .env 文件
   - 不提交 .env 文件到版本控制

2. **输入验证**
   - 验证所有用户输入
   - 使用类型检查

3. **SQL 注入防护**
   - 使用参数化查询
   - 避免字符串拼接

4. **CORS 配置**
   ```typescript
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(','),
     credentials: true
   }));
   ```

## 常见问题

**Q: 如何添加新的 API 端点？**
A: 
1. 在 `models/` 中添加数据模型
2. 在 `controllers/` 中添加控制器
3. 在 `routes/` 中添加路由

**Q: 如何添加新的前端页面？**
A:
1. 在 `pages/` 中创建页面组件
2. 在路由配置中注册
3. 创建对应的 hook 和 store

**Q: 如何优化数据库性能？**
A:
1. 分析慢查询
2. 添加必要的索引
3. 考虑数据分片策略
