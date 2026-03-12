#!/bin/bash

# 新增页面URL列表
URLS=(
  "https://www.purekit.dev/en/gzip-compress-decompress/"
  "https://www.purekit.dev/en/csv-to-json/"
  "https://www.purekit.dev/en/character-counter/"
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
echo "提交URL数量: ${#URLS[@]}"
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
echo "====== Google Search Console提交建议 ======"
echo "Google已于2024年停止URL Inspection API的批量提交功能。"
echo "请手动在GSC中提交URL或使用sitemap："
echo ""
for url in "${URLS[@]}"; do
  echo "  $url"
done
echo ""
echo "或者确保这些URL已包含在sitemap中："
echo "  https://www.purekit.dev/sitemap.xml"
