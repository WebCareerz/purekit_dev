#!/bin/bash

# 新增页面URL列表（Batch Auto 0312: 3个工具）
URLS=(
  "https://www.purekit.dev/en/css-js-minifier/"
  "https://www.purekit.dev/en/svg-optimizer/"
  "https://www.purekit.dev/en/robots-txt-generator/"
)

# IndexNow配置
KEY="abrk8bajy3hzlrukxjz46qh1jwfa5bn5"
HOST="www.purekit.dev"
KEY_LOCATION="https://www.purekit.dev/$KEY.txt"

# 构建URL列表JSON数组
URL_JSON=$(printf '%s\n' "${URLS[@]}" | jq -R . | jq -s .)

# 构建IndexNow请求体
JSON_PAYLOAD=$(jq -n \
  --arg host "$HOST" \
  --arg key "$KEY" \
  --arg keyLocation "$KEY_LOCATION" \
  --argjson urlList "$URL_JSON" \
  '{host: $host, key: $key, keyLocation: $keyLocation, urlList: $urlList}')

echo "====== IndexNow提交 ======"
echo "提交时间: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "提交批次: Batch Auto 0312"
echo "提交URL数量: ${#URLS[@]}"
echo ""
echo "URL列表:"
for url in "${URLS[@]}"; do
  echo "  • $url"
done
echo ""
echo "请求体:"
echo "$JSON_PAYLOAD" | jq .
echo ""

# 提交到IndexNow (Bing等支持)
echo "正在提交到IndexNow..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$JSON_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "响应状态码: $HTTP_CODE"
if [ ! -z "$BODY" ]; then
  echo "响应内容: $BODY"
fi
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ IndexNow提交成功（Bing等搜索引擎已收到通知）"
elif [ "$HTTP_CODE" = "202" ]; then
  echo "✅ IndexNow提交已接受（请求已排队处理）"
else
  echo "❌ IndexNow提交失败"
fi

echo ""
echo "====== 工具说明 ======"
echo "• CSS & JS Minifier - 压缩CSS/JS代码减小文件体积"
echo "• SVG Optimizer - 优化SVG文件移除冗余代码"
echo "• Robots.txt Generator - 生成robots.txt控制爬虫访问"
echo ""
echo "====== 搜索引擎覆盖 ======"
echo "IndexNow联盟成员（已自动通知）："
echo "  • Bing"
echo "  • Yandex"
echo "  • Seznam.cz"
echo "  • Naver（部分支持）"
echo ""
echo "====== Google Search Console ======"
echo "Google已于2023年停止sitemap ping服务。"
echo "索引方式："
echo "  1. 自动：Google会定期爬取sitemap.xml并检测<lastmod>更新"
echo "  2. 手动：在GSC中逐个提交URL可加速收录（可选）"
echo ""
echo "Sitemap地址："
echo "  https://www.purekit.dev/sitemap.xml"
