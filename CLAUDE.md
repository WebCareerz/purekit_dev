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
