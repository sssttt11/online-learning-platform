# 在线课程平台 - AI 辅助开发文档（纯文本可直接复制）

# 一、项目概览

本项目为**在线课程平台**，采用前后端分离架构，目标是实现课程展示、学习、购买、管理等完整业务闭环。AI 辅助开发需严格遵循以下规则，保证代码一致性、可维护性和业务准确性。

------

# 二、技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS + Ant Design + React Router 6 + Redux Toolkit
- **后端**：FastAPI + PostgreSQL + Pydantic
- **部署**：Docker Compose + Nginx
- **工具链**：Vite + ESLint + Prettier + Husky

------

# 三、目录结构规范

```
src/
├── assets/          # 静态资源（图片、字体、图标）
├── components/
│   ├── common/      # 通用基础组件（Button、Input、Modal、Pagination 等）
│   ├── business/    # 业务组件（CourseCard、VideoPlayer、CommentList 等）
│   └── layout/      # 布局组件（Header、Footer、MainLayout、AdminLayout 等）
├── hooks/           # 自定义 Hooks（useAuth、useCourseList、usePagination 等）
├── pages/           # 页面级组件
│   ├── Home/        # 首页
│   ├── Course/      # 课程列表/详情页
│   ├── Learning/    # 学习中心页
│   ├── User/        # 个人中心/订单页
│   ├── Admin/       # 管理员后台页
│   └── Auth/        # 登录/注册页
├── services/        # API 接口封装
│   ├── api.ts       # 全局请求拦截/响应处理
│   ├── course.ts    # 课程相关接口
│   ├── user.ts      # 用户相关接口
│   └── order.ts     # 订单相关接口
├── store/           # Redux 状态管理
│   ├── slices/      # 状态切片（user、course、cart 等）
│   └── index.ts     # Store 配置
├── types/           # TypeScript 类型定义
│   ├── course.ts    # 课程类型
│   ├── user.ts      # 用户类型
│   └── global.ts    # 全局类型
└── utils/           # 工具函数（格式化、验证、权限判断等）
```

------

# 四、代码规范

## 4.1 组件规范

- 所有组件必须使用**函数式组件 + Hooks**，禁止使用 Class 组件。
- 组件命名采用 **PascalCase**，文件命名与组件名完全一致（如 `CourseCard.tsx`）。
- 组件 Props 必须使用 TypeScript 接口定义，禁止使用 `any`，必填字段需标注 `required`。
- 组件拆分遵循**单一职责原则**：通用逻辑抽离为 Hooks，UI 复用抽离为通用组件。

## 4.2 样式规范

- 优先使用 **Tailwind CSS 原子类**，复杂场景使用 CSS Modules（文件命名：`[组件名].module.css`）。
- 禁止使用内联样式（`style={{}}`），特殊交互场景除外。
- 统一使用项目预设的 Tailwind 主题色（主色：`#165DFF`，辅色：`#36CFC9`）。

## 4.3 类型规范

- 所有数据、接口返回值必须定义 TypeScript 类型，禁止使用 `any`、`unknown`（除非明确需要）。
- 类型定义按模块存放于 `src/types/` 目录，避免在组件内直接定义类型。
- 枚举类型使用 `enum` 或 `as const` 定义，保证类型安全。

## 4.4 API 规范

- 接口请求统一使用 `src/services/api.ts` 封装的 Axios 实例，自动处理 Token、错误提示。
- 接口响应格式统一为：

```
interface ApiResponse<T> {
  code: number;    // 业务状态码（0=成功）
  data: T;         // 响应数据
  message: string; // 提示信息
}
```

- 接口参数、返回值必须定义类型，禁止传递任意类型参数。

------

# 五、业务逻辑约束

## 5.1 核心业务规则

- **用户权限**：未登录用户仅可浏览公开课程，登录后才可购买、学习、评论；管理员可访问后台。
- **课程状态**：课程分为「上架」/「下架」，下架课程不可购买、学习，仅保留展示。
- **订单逻辑**：订单创建后 15 分钟未支付自动取消；已支付订单支持退款（需满足平台规则）。
- **学习进度**：用户观看视频时自动记录进度，下次进入学习页从上次断点继续。

## 5.2 禁止事项

- 禁止直接操作 DOM（如需获取 DOM 节点，使用 `useRef`）。
- 禁止修改项目配置文件（如 `vite.config.ts`、`tailwind.config.js`），除非明确需求。
- 禁止在代码中硬编码敏感信息（如 API 密钥、数据库密码），必须使用环境变量。
- 禁止使用 `any` 类型，所有数据必须有明确类型定义。

------

# 六、AI 辅助开发要求

1. **代码生成**：生成代码前需先确认目录结构、组件职责和类型定义，保证符合规范。
2. **业务理解**：优先实现核心业务流程（如「浏览课程 → 购买 → 学习」），再扩展边缘功能。
3. **可读性**：代码需添加必要注释，复杂逻辑需拆分函数并命名清晰。
4. **兼容性**：生成代码需兼容现有技术栈，避免引入未授权的第三方库。
5. **可维护性**：避免过度封装，保证代码易于调试和扩展。