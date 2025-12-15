## PromptSpark 团队协作功能 - 快速集成指南

本指南帮助你快速集成和使用新的团队协作功能。

---

## 快速开始

### 1. 启动服务器

```bash
# 后端启动
cd backend
npm install
npm run dev

# 前端启动 (新终端)
cd frontend
npm install
npm run dev
```

### 2. 访问应用

打开浏览器访问 `http://localhost:3000`

---

## 核心功能使用

### 功能 1: 权限管理

**场景**: 你想与团队成员共享一个提示词

```typescript
// 前端使用
import { PermissionManagement } from './components/PermissionManagement';

// 在 PromptDetail 中自动包含
// 只有提示词拥有者可见
<PermissionManagement promptId={promptId} isOwner={true} />
```

**用户界面流程**:
1. 打开提示词详情
2. 点击"🔐 权限"选项卡
3. 输入用户 ID 和选择角色
4. 点击"授予权限"

**角色选择**:
- **查看者 (viewer)**: 只能查看
- **评论者 (commenter)**: 可以查看和评论
- **编辑者 (editor)**: 可以查看、编辑和评论
- **拥有者 (owner)**: 完全权限

---

### 功能 2: 评论系统

**场景**: 用户想对提示词发表评论或提出问题

```typescript
import { CommentThread } from './components/CommentThread';

// 使用组件
<CommentThread promptId={promptId} parentId={parentId} />
```

**用户界面流程**:
1. 打开提示词详情
2. 点击"💬 评论"选项卡
3. 在文本框输入评论
4. 点击"发布评论"

**高级功能**:
- **回复评论**: 点击评论下的"回复"按钮
- **点赞评论**: 点击"👍"按钮
- **删除评论**: 只能删除自己的评论

**示例流程**:
```
评论 A (用户 1)
  └─ 回复 A1 (用户 2)
     └─ 回复 A1.1 (用户 3)
  └─ 回复 A2 (用户 2)
```

---

### 功能 3: 讨论系统

**场景**: 团队需要深度讨论如何改进提示词

```typescript
import { DiscussionSection } from './components/DiscussionSection';

<DiscussionSection promptId={promptId} />
```

**用户界面流程**:
1. 打开提示词详情
2. 点击"🗣️ 讨论"选项卡
3. 点击"开启新讨论"
4. 输入标题和描述
5. 点击"创建讨论"

**讨论生命周期**:
```
创建讨论 (状态: open)
  ↓
添加评论和回复
  ↓
标记为已解决 (状态: resolved)
  ↓
关闭讨论 (状态: closed)
```

**讨论功能**:
- 创建有标题的讨论主题
- 在讨论中回复评论
- 更改讨论状态（开放、已解决、已关闭）
- 查看评论计数和最后活动时间

---

### 功能 4: 评分系统

**场景**: 用户想对提示词的质量进行评分

```typescript
import { RatingComponent } from './components/RatingComponent';

<RatingComponent promptId={promptId} />
```

**用户界面流程**:
1. 打开提示词详情
2. 点击"⭐ 评分"选项卡
3. 点击星号进行 1-5 星评分
4. (可选) 填写反馈意见
5. (可选) 评分有用性、准确性、相关性
6. 点击"提交评分"

**评分指标说明**:

| 指标 | 含义 | 范围 |
|------|------|------|
| 星级评分 | 整体质量评分 | 1-5 星 |
| 有用性 | 提示词有多有用 | 0-100 |
| 准确性 | 提示词输出的准确程度 | 0-100 |
| 相关性 | 提示词与目标的相关程度 | 0-100 |

**评分统计显示**:
- 平均评分
- 评分分布图表
- 各维度的平均得分

---

## API 调用示例

### 使用协作服务

```typescript
import * as collaborationService from './services/collaborationService';

// 权限管理
await collaborationService.grantPermission(promptId, userId, 'editor');
await collaborationService.revokePermission(permissionId);
const perms = await collaborationService.getPromptPermissions(promptId);

// 评论
await collaborationService.createComment(promptId, '很好的提示词！');
const comments = await collaborationService.getComments(promptId);
await collaborationService.likeComment(commentId);

// 讨论
await collaborationService.createDiscussion(promptId, '标题', '描述');
const discussions = await collaborationService.getDiscussions(promptId);
await collaborationService.updateDiscussionStatus(discussionId, 'resolved');

// 评分
await collaborationService.submitRating(promptId, 5, '反馈', 90, 85, 95);
const stats = await collaborationService.getPromptStats(promptId);
```

---

## 数据模型

### Comment 对象
```typescript
interface Comment {
  id: string;           // 唯一 ID
  promptId: string;     // 提示词 ID
  userId: string;       // 用户 ID
  userName: string;     // 用户名
  content: string;      // 评论内容
  parentId?: string;    // 父评论 ID (用于回复)
  likes: number;        // 点赞数
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}
```

### Discussion 对象
```typescript
interface Discussion {
  id: string;           // 唯一 ID
  promptId: string;     // 提示词 ID
  title: string;        // 讨论标题
  description: string;  // 讨论描述
  initiatorName: string;// 发起人
  status: 'open' | 'resolved' | 'closed'; // 状态
  commentCount: number; // 评论计数
  createdAt: string;    // 创建时间
}
```

### Rating 对象
```typescript
interface Rating {
  id: string;           // 唯一 ID
  promptId: string;     // 提示词 ID
  userId: string;       // 用户 ID
  score: 1|2|3|4|5;     // 星级评分
  feedback: string;     // 反馈内容
  helpfulness: number;  // 有用性评分
  accuracy: number;     // 准确性评分
  relevance: number;    // 相关性评分
  createdAt: string;    // 创建时间
}
```

---

## 常见问题

### Q: 权限管理后，其他用户如何访问我的提示词？

A: 只有获得权限的用户才能看到你的提示词。授予权限后：
1. 用户需要重新加载页面
2. 提示词将出现在他们的列表中
3. 他们可以根据角色进行相应操作

### Q: 我可以编辑他人的评论吗？

A: 不可以。只有评论的原作者可以删除自己的评论。

### Q: 评分可以修改吗？

A: 可以。用户可以修改自己的评分（删除旧评分后重新提交）。

### Q: 讨论关闭后还能评论吗？

A: 当前版本中，关闭讨论后仍然可以评论。如需禁用评论，可在未来版本中实现。

### Q: 如何导出评分和评论？

A: 当前版本不支持导出。这是 v3.0 的计划功能。

---

## 最佳实践

### 权限管理
```typescript
// ✅ 好的做法
- 为不同用户分配合适的角色
- 定期审查权限列表
- 更新后立即通知用户

// ❌ 避免
- 不要将所有人都设置为编辑者
- 不要忘记撤销离职员工的权限
- 不要在不说明情况下更改权限
```

### 评论
```typescript
// ✅ 好的做法
- 使用清晰、友好的语言
- 回复他人的评论显示尊重
- 点赞有用的评论

// ❌ 避免
- 发送垃圾评论或攻击性评论
- 重复发送相同的评论
- 在长讨论中不断打断
```

### 评分
```typescript
// ✅ 好的做法
- 基于实际使用经验评分
- 提供具体的反馈
- 对多个维度进行评分

// ❌ 避免
- 随意给予极端评分
- 不提供任何反馈
- 基于个人感受而不是实际质量
```

---

## 集成到现有项目

### 步骤 1: 更新数据库
```bash
# 数据库会自动创建新表
npm run dev  # 启动后自动初始化
```

### 步骤 2: 添加路由
```typescript
// 已在 backend/src/index.ts 中添加
import collaborationRoutes from './routes/collaborationRoutes.js';
app.use('/api/collaboration', collaborationRoutes);
```

### 步骤 3: 在 PromptDetail 中集成
```typescript
// PromptDetail.tsx 已自动包含所有功能
import { PromptDetail } from './components/PromptDetail';

// 使用时自动包含选项卡和所有功能
<PromptDetail
  id={promptId}
  title={title}
  // ... 其他属性
/>
```

---

## 性能优化建议

### 前端
```typescript
// 1. 使用选项卡延迟加载
- 只在用户点击时加载内容

// 2. 实现分页
- 评论分页显示
- 评分分页显示

// 3. 缓存数据
- 缓存评分统计
- 缓存权限列表
```

### 后端
```typescript
// 1. 添加分页
export const getComments = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  // 分页逻辑
};

// 2. 缓存统计
- 缓存评分统计结果
- 每小时更新一次

// 3. 异步处理
- 评分统计放到后台任务
```

---

## 故障排查

### 权限错误

**错误**: "无权限管理此提示词的权限"
```typescript
// 原因: 你不是提示词的拥有者
// 解决: 联系提示词拥有者

// 检查权限
const perm = await checkUserPermission(promptId);
console.log(perm);  // 查看你的权限级别
```

### 评论不显示

**错误**: 发表评论后不显示
```typescript
// 原因: 可能需要权限或网络问题
// 解决: 
1. 检查是否有评论权限
2. 检查网络连接
3. 重新加载页面

const perm = await checkUserPermission(promptId);
if (!perm.permissions?.canComment) {
  console.log('没有评论权限');
}
```

### 评分不更新

**错误**: 提交评分后统计未更新
```typescript
// 原因: 可能是缓存问题
// 解决:
1. 重新加载页面
2. 清除浏览器缓存
3. 检查网络请求

const stats = await getPromptStats(promptId);
console.log(stats);  // 查看最新统计
```

---

## 下一步

### 即将推出的功能
- 🔔 实时通知系统
- 📧 邮件通知
- 🤖 AI 驱动的建议
- 📊 高级分析报告
- 🌍 多语言支持

### 反馈和建议
- 提交 Issue 到项目仓库
- 参与讨论和改进
- 分享使用体验

---

## 更多资源

- 📖 [完整 API 文档](./COLLABORATION.md)
- 📖 [实现总结](./COLLABORATION_SUMMARY.md)
- 📖 [开发指南](./DEVELOPMENT.md)
- 📖 [项目 README](../README.md)

---

**祝你使用愉快！** 🎉

如有问题，欢迎在项目中提交 Issue！

