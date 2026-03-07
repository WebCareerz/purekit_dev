#!/usr/bin/env node
/**
 * Bing IndexNow API 提交脚本
 *
 * 限额说明：
 * - 每天最多 10,000 个 URL
 * - 每次批量请求最多 10,000 个 URL
 * - IndexNow 同时支持 Bing、Yandex、Seznam 等搜索引擎
 *
 * 使用前准备：
 * 1. 生成一个 API Key（可使用任意 UUID 或字符串，8-128 个字符）
 * 2. 将 API Key 放入 scripts/indexnow-key.txt
 * 3. 将同名的验证文件部署到网站根目录：https://www.playbrainrot.org/{your-key}.txt
 *    文件内容就是 key 本身
 *
 * 运行：node scripts/submit-bing-index.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置
const KEY_PATH = path.join(__dirname, 'indexnow-key.txt');
const URLS_PATH = path.join(process.cwd(), 'urls-to-index.json');
const HOST = process.argv[2] || 'www.example.com';
const DAILY_LIMIT = 10000;
const BATCH_SIZE = 100; // 每批提交的 URL 数量

// IndexNow 端点（可选择不同的搜索引擎）
const ENDPOINTS = {
  bing: 'api.indexnow.org',
  yandex: 'yandex.com',
  seznam: 'search.seznam.cz'
};

// 批量提交 URL
async function submitBatch(urls, apiKey, endpoint = 'bing') {
  return new Promise((resolve, reject) => {
    const hostname = ENDPOINTS[endpoint] || ENDPOINTS.bing;

    const postData = JSON.stringify({
      host: HOST,
      key: apiKey,
      keyLocation: `https://${HOST}/${apiKey}.txt`,
      urlList: urls
    });

    const options = {
      hostname: hostname,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint,
          status: res.statusCode,
          statusMessage: res.statusMessage,
          response: data || '(empty)',
          urlCount: urls.length
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        endpoint,
        status: 'error',
        statusMessage: e.message,
        response: null,
        urlCount: urls.length
      });
    });

    req.write(postData);
    req.end();
  });
}

// 单个 URL 提交（备用方法）
async function submitSingleUrl(url, apiKey, endpoint = 'bing') {
  return new Promise((resolve, reject) => {
    const hostname = ENDPOINTS[endpoint] || ENDPOINTS.bing;
    const params = new URLSearchParams({
      url: url,
      key: apiKey
    });

    const options = {
      hostname: hostname,
      path: `/indexnow?${params.toString()}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          response: data
        });
      });
    });

    req.on('error', (e) => resolve({ url, status: 'error', response: e.message }));
    req.end();
  });
}

// 将数组分成多个批次
function splitIntoBatches(arr, batchSize) {
  const batches = [];
  for (let i = 0; i < arr.length; i += batchSize) {
    batches.push(arr.slice(i, i + batchSize));
  }
  return batches;
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 生成随机 API Key
function generateApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// 主函数
async function main() {
  console.log('=== Bing IndexNow 提交工具 ===\n');

  // 检查或生成 API Key
  let apiKey;
  if (fs.existsSync(KEY_PATH)) {
    apiKey = fs.readFileSync(KEY_PATH, 'utf8').trim();
    console.log(`使用现有 API Key: ${apiKey}`);
  } else {
    apiKey = generateApiKey();
    fs.writeFileSync(KEY_PATH, apiKey);
    console.log(`已生成新的 API Key: ${apiKey}`);
    console.log(`\n重要: 请将以下验证文件部署到网站根目录:`);
    console.log(`  文件路径: https://${HOST}/${apiKey}.txt`);
    console.log(`  文件内容: ${apiKey}`);
    console.log(`\n部署验证文件后再运行此脚本。`);

    // 创建验证文件内容提示
    const verifyFilePath = path.join(__dirname, `${apiKey}.txt`);
    fs.writeFileSync(verifyFilePath, apiKey);
    console.log(`\n验证文件已生成: ${verifyFilePath}`);
    console.log(`请将此文件复制到 public/ 目录并重新部署网站。`);
    return;
  }

  // 读取 URL 列表
  if (!fs.existsSync(URLS_PATH)) {
    console.error('错误: 未找到 URL 列表文件');
    process.exit(1);
  }

  const { urls } = JSON.parse(fs.readFileSync(URLS_PATH, 'utf8'));

  console.log(`\n网站: ${HOST}`);
  console.log(`待提交 URL 数量: ${urls.length}`);
  console.log(`每日限额: ${DAILY_LIMIT}`);
  console.log(`每批大小: ${BATCH_SIZE}`);

  if (urls.length > DAILY_LIMIT) {
    console.warn(`\n警告: URL 数量超过每日限额，只会提交前 ${DAILY_LIMIT} 个`);
  }

  const urlsToSubmit = urls.slice(0, DAILY_LIMIT);
  const batches = splitIntoBatches(urlsToSubmit, BATCH_SIZE);

  console.log(`\n将分 ${batches.length} 批提交\n`);

  // 提交到 Bing (IndexNow)
  console.log('=== 提交到 IndexNow (Bing/Yandex) ===\n');

  const results = [];
  let totalSuccess = 0;
  let totalFail = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`提交第 ${i + 1}/${batches.length} 批 (${batch.length} 个 URL)...`);

    const result = await submitBatch(batch, apiKey, 'bing');
    results.push(result);

    // 状态码说明：
    // 200 - OK, URLs submitted
    // 202 - Accepted, URLs submitted (async)
    // 400 - Bad request (invalid format)
    // 403 - Key not valid
    // 422 - URLs not valid
    // 429 - Too many requests
    const isSuccess = result.status === 200 || result.status === 202;

    if (isSuccess) {
      totalSuccess += batch.length;
      console.log(`  成功 (${result.status})`);
    } else {
      totalFail += batch.length;
      console.log(`  失败 (${result.status}): ${result.statusMessage}`);
      if (result.response) {
        console.log(`  响应: ${result.response}`);
      }
    }

    // 批次间延迟
    if (i < batches.length - 1) {
      await sleep(1000);
    }
  }

  console.log('\n=== 提交完成 ===');
  console.log(`成功提交: ${totalSuccess} 个 URL`);
  console.log(`失败: ${totalFail} 个 URL`);
  console.log(`总计: ${urlsToSubmit.length} 个 URL`);

  // 保存结果
  const resultPath = path.join(process.cwd(), 'bing-index-result.json');
  fs.writeFileSync(resultPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    host: HOST,
    apiKey: apiKey,
    summary: {
      success: totalSuccess,
      fail: totalFail,
      total: urlsToSubmit.length,
      batches: batches.length
    },
    batchResults: results,
    urls: urlsToSubmit
  }, null, 2));
  console.log(`\n结果已保存到: ${resultPath}`);

  // 提示
  console.log('\n提示:');
  console.log('- IndexNow 会自动通知 Bing、Yandex 等支持该协议的搜索引擎');
  console.log('- 索引更新可能需要几小时到几天不等');
  console.log('- 可以在 Bing Webmaster Tools 查看索引状态');
}

main();
