# AI 驱动的中后台表单生成器

面向中后台开发场景的 AI 应用：通过自然语言描述生成符合严格 Schema 的表单配置并动态渲染，减少低代码平台中「搭建页面仍需大量手工配置」的工作量。

> **当前阶段**：界面骨架与类型系统已完成，对话为本地模拟回复，尚未接入真实模型调用。

---

## 技术栈

| 类别 | 选型 | 版本 |
|---|---|---|
| 框架 | Vue | 3.5.42（`<script setup>` + Composition API） |
| 语言 | TypeScript | 6.0.2（严格模式，`src/` 下零 `any`） |
| 构建 | Vite | 8.3.0（rolldown） |
| 样式 | Sass | sass-embedded 1.105.1 |
| 类型检查 | vue-tsc | 3.3.11 |
| 模型 | GLM-4.7-Flash | 智谱开放平台（免费档） |

---

## 本地运行

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览构建产物
```

`npm run build` 等价于 `vue-tsc -b && vite build`，类型错误会直接阻断构建。

### 调试脚本

`scripts/glm-test.mjs` 用于验证 API Key 连通性，不依赖前端：

```bash
set ZAI_API_KEY=你的密钥   # Windows cmd
node scripts/glm-test.mjs
```

密钥只通过环境变量读取，源码中不存在硬编码。

---

## 目录结构

```
src/
├── main.ts                  入口
├── App.vue                  根组件，挂载聊天页面
├── chat/
│   ├── Chat.vue             页面容器：消息状态与业务逻辑
│   └── components/
│       ├── ChatHeader.vue   顶栏：模型标签、消息计数、清空
│       ├── MessageList.vue  消息列表：自动滚动与删除事件转发
│       ├── MessageItem.vue  单条气泡
│       └── ChatInput.vue    输入框：自适应高度与发送
├── composables/
│   └── useModel.ts          模型状态共享
├── config/
│   └── models.ts            模型清单（不依赖 Vue）
├── types/
│   └── Message.ts           消息与角色类型
└── utils/
    └── format.ts            时间格式化

scripts/
└── glm-test.mjs             API 连通性调试脚本
```

---

## 设计说明

以下几处是有意识的设计选择，不是随手写的：

**模型配置与运行时代码分离**
`config/models.ts` 不 import Vue，只描述数据。模型名、上下文长度等易变信息集中在此，切换模型只改一处，不散落在业务代码里。

**类型从数据派生**
```ts
export const ROLES = ['user', 'assistant', 'system'] as const
export type Role = (typeof ROLES)[number]
```
`as const` 使数组成为只读元组、字面量类型不被拓宽，配合索引访问类型取出联合。新增一个角色只需改数组，类型自动跟随——避免手写联合类型与运行时校验两处维护而漂移。

**composable 共享状态的前提是 ref 位于模块顶层**
`useModel.ts` 把 `currentModelId` 声明在函数外部。ES Module 只求值一次，所有 import 方拿到同一份引用；若写在函数内部，每个组件会各持一份独立副本，表现为「界面显示变了但请求发的还是旧模型」且不报错。

**唯一写入口**
`useModel()` 的返回类型将 `currentModelId` 标注为 `Readonly<Ref<ModelId>>`，写操作只能走 `setCurrentModel`。这是类型闭环成立的前提：id 的类型派生自 `MODELS` 数组本身，因此 `find` 在类型上不会失手。

**删除用 filter 而非 splice**
```ts
messageList.value = messageList.value.filter(item => item.id !== id)
```
按 id 条件筛除，不依赖数组下标。`splice` 需先 `findIndex`，而删除过程中下标会变化。同时「生成新数组再整体赋值」的不可变更新心智模型更简单，列表 diff 更可控。

**自动滚动只在贴底时跟随**
```ts
watch(() => messageList.length, (newVal, oldVal) => {
    const el = boxRef.value
    if (!el) return
    if (newVal <= oldVal) return
    // 是否已经滚到底部（留 5px 容差，防浮点误差）
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 5

    if(isAtBottom) {
       nextTick(() =>  el.scrollTop = el.scrollHeight)
    }
})
```
两个时序要点：`isAtBottom` 必须在 `nextTick` **之前**读（记录新消息到达前用户的位置），滚动赋值必须在 `nextTick` **之后**写（等新气泡渲染完成）。无条件滚动会打断用户翻阅历史。

**flex 子项需要 `min-height: 0`**
中间滚动区同时要 `flex: 1` + `overflow-y: auto` + `min-height: 0`。flex 子项的 `min-height` 默认值是 `auto`，即拒绝缩小到内容尺寸以下，导致内容溢出时撑高父容器而非触发自身滚动。该属性必须加在**作为 flex 子项的那个元素**上，加在其后代元素无效。

**语义化标签而非 CSS 模拟**
发送按钮使用 `<button type="button">` + 原生 `disabled`。用 `pointer-events: none` 模拟禁用会同时使 `cursor: not-allowed` 失效（元素完全不接收指针事件），且键盘用户无法聚焦、屏幕阅读器不播报禁用状态。

---

## 路线图

- [x] 第 1 周 · 界面骨架、组件拆分、类型系统
- [ ] 第 2 周 · 接入真实模型调用（非流式），处理浏览器直连的跨域问题
- [ ] 第 3 周 · SSE 流式输出：跨 chunk 的 JSON 分片重组、打字机渲染、请求取消
- [ ] 第 4 周 · Node BFF：密钥收归服务端，统一错误分级
- [ ] 第 5 周 · 结构化输出：`tool_choice` 强制 JSON、Zod 运行时校验、失败带错误重试
- [ ] 第 6 周 · 动态表单渲染：Schema 驱动 UI、生成失败的降级路径
