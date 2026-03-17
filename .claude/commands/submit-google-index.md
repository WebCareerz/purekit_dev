---
description: 提交 URL 到 Google Indexing API
allowed-tools: Bash(node:*), Read, Write
---

# Google 索引提交

用户希望将网站 URL 提交到 Google 搜索引擎索引。

## 执行步骤

1. 询问用户要提交哪些页面（如果 $ARGUMENTS 为空）
2. 根据用户描述，在当前目录生成 `urls-to-index.json` 文件，格式：
   ```json
   {
     "urls": [
       "https://example.com/page1",
       "https://example.com/page2"
     ]
   }
   ```
3. 显示生成的 URL 列表，请用户确认
4. 用户确认后，执行：
   ```bash
   node scripts/submit-google-index.js
   ```

注意：Google Indexing API 每天最多 200 个 URL。

$ARGUMENTS
