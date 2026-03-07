# PureKit.dev 工程规范

## 响应式适配规范

### 双栏布局断点

- 输入/输出并排布局使用 `md:grid-cols-2`（768px 起生效），不要用 `lg:grid-cols-2`
- 原因：平板设备（如 iPad 1024px 以下）也应并排显示，跳过 md 断点会导致平板仍为单栏

```tsx
// ❌ 禁止
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

// ✅ 正确
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

### textarea / 编辑区域高度

- 必须使用响应式 min-height，移动端减小高度避免过度滚动
- 基准：移动端 `min-h-[200px]`，桌面端 `sm:min-h-[300px]` 或 `sm:min-h-[400px]`

```tsx
// ❌ 禁止
className="min-h-[400px]"

// ✅ 正确
className="min-h-[200px] sm:min-h-[400px]"
```

### 工具栏（toolbar）布局

- 包含多个控件的工具栏使用 `flex-col sm:flex-row`，移动端纵向堆叠
- 避免用 `ml-auto` 将按钮推到右侧，移动端会导致孤立元素

```tsx
// ❌ 禁止
<div className="flex flex-wrap items-center gap-3">
  <Button>Action</Button>
  <div className="ml-auto"><Button>Download</Button></div>
</div>

// ✅ 正确
<div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
  <div className="flex items-center gap-2">
    <Button>Action</Button>
    <Button>Download</Button>
  </div>
</div>
```

### 表格移动端处理

- 表格容器必须加 `overflow-x-auto` 允许横向滚动
- 单元格加 `max-w-[200px] sm:max-w-none truncate`，移动端长文本截断

```tsx
// ✅ 正确
<td className="px-3 py-1.5 whitespace-nowrap font-mono text-sm max-w-[200px] sm:max-w-none truncate">
```

## 页面样式与功能调试规范

### 使用 Chrome 浏览器自动化调试

通过 `mcp__claude-in-chrome__*` 工具直接操作浏览器进行调试，流程如下：

1. **确保开发服务器运行** — 先检查 `lsof -i :3000`，未运行则后台启动 `npm run dev`
2. **获取标签页上下文** — 调用 `tabs_context_mcp` 获取可用 tab，或 `tabs_create_mcp` 创建新 tab
3. **导航到目标页面** — 使用 `navigate` 工具访问 `http://localhost:3000/en/{tool-slug}/`
4. **截图验证渲染** — 使用 `computer` 工具的 `screenshot` 动作检查页面渲染
5. **交互测试** — 使用 `left_click`、`type` 等动作模拟用户操作
6. **检查控制台** — 使用 `read_console_messages` 检查是否有 JS 错误

### 文件上传类工具的测试方法

对于 PDF 工具等需要上传文件的场景，**不能直接点击文件选择框**，需要通过 JavaScript 注入文件：

```javascript
// 通过 javascript_tool 注入文件到 file input
(async () => {
  const response = await fetch('/test-file.pdf');  // 从 public/ 获取测试文件
  const blob = await response.blob();
  const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
  const input = document.querySelector('input[type="file"]');
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
})()
```

**步骤：**
1. 用 Python 或其他方式创建测试文件，放到 `public/` 目录
2. 用 `javascript_tool` 通过 fetch 加载文件并注入到 `<input type="file">`
3. 测试完成后删除 `public/` 下的测试文件

### 调试检查清单

- [ ] 页面正常加载，无白屏
- [ ] 无 JavaScript 控制台错误
- [ ] 核心功能可正常操作（输入 → 处理 → 输出）
- [ ] i18n 文本正确显示（无 undefined 或 key 名泄露）
- [ ] SEO 内容完整（Features、How to Use、FAQ、Related Tools）

## pdfjs-dist 使用注意事项

### Worker 文件本地化

pdfjs-dist 的 worker 文件必须从本地 `public/` 目录加载，不要使用 CDN：

```typescript
// ❌ 禁止：CDN 版本可能不存在
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// ✅ 正确：从 public/ 加载本地 worker
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
```

升级 pdfjs-dist 后需要同步更新 `public/pdf.worker.min.mjs`：
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

### ArrayBuffer 必须传副本

`pdfjs.getDocument({ data })` 会消费（transfer）ArrayBuffer，导致后续使用报 "detached ArrayBuffer" 错误。每次调用都必须传 `.slice(0)` 副本：

```typescript
// ❌ 禁止：ArrayBuffer 被消费后无法重用
const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

// ✅ 正确：传副本
const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
```

### SSG 兼容：必须动态 import

pdfjs-dist 依赖浏览器 API（DOMMatrix），不能在 Node.js 环境中加载。必须使用动态 import：

```typescript
// ❌ 禁止：顶层 import 会导致 SSG 构建失败
import * as pdfjs from "pdfjs-dist";

// ✅ 正确：组件内动态 import
const getPdfjs = useCallback(async () => {
  if (pdfjsRef.current) return pdfjsRef.current;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
  pdfjsRef.current = pdfjs;
  return pdfjs;
}, []);
```
