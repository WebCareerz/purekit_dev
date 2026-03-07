#!/usr/bin/env node
/**
 * Google Indexing API 提交脚本
 *
 * 限额说明：
 * - 每天最多 200 个 URL 发布/更新请求
 * - 每分钟最多 600 个请求
 *
 * 使用前准备：
 * 1. 在 Google Cloud Console 创建项目并启用 Indexing API
 * 2. 创建服务账户并下载 JSON 密钥文件
 * 3. 在 Google Search Console 中将服务账户邮箱添加为网站所有者
 * 4. 将密钥文件保存为 scripts/google-credentials.json
 *
 * 代理设置（可选）：
 *   export HTTPS_PROXY=http://127.0.0.1:7890
 *   或在下方 PROXY_URL 中直接配置
 *
 * 运行：node scripts/submit-google-index.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { URL } = require('url');

// 代理配置 - 根据你的代理设置修改，设为 null 则不使用代理
const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy || 'http://127.0.0.1:21467';

// 配置
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const URLS_PATH = path.join(process.cwd(), 'urls-to-index.json');
const DAILY_LIMIT = 200;
const DELAY_BETWEEN_REQUESTS = 100; // 毫秒

// 通过代理发送 HTTPS 请求
function httpsRequestWithProxy(options, postData) {
  return new Promise((resolve, reject) => {
    if (!PROXY_URL) {
      // 不使用代理，直接请求
      const req = https.request(options, handleResponse(resolve));
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
      return;
    }

    const proxy = new URL(PROXY_URL);
    const targetHost = options.hostname;
    const targetPort = options.port || 443;

    // 通过 HTTP CONNECT 建立隧道
    const connectOptions = {
      hostname: proxy.hostname,
      port: proxy.port || 7890,
      method: 'CONNECT',
      path: `${targetHost}:${targetPort}`,
      headers: {
        'Host': `${targetHost}:${targetPort}`
      }
    };

    const connectReq = http.request(connectOptions);

    connectReq.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Proxy CONNECT failed: ${res.statusCode}`));
        return;
      }

      // 通过隧道发送 HTTPS 请求
      const tlsOptions = {
        ...options,
        socket: socket,
        servername: targetHost
      };

      const req = https.request(tlsOptions, handleResponse(resolve));
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });

    connectReq.on('error', reject);
    connectReq.end();
  });
}

function handleResponse(resolve) {
  return (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve({ statusCode: res.statusCode, data }));
  };
}

// JWT 生成函数
function createJWT(credentials) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');

  return `${signatureInput}.${signature}`;
}

// 获取访问令牌
async function getAccessToken(credentials) {
  const jwt = createJWT(credentials);
  const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;

  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const { statusCode, data } = await httpsRequestWithProxy(options, postData);
  const response = JSON.parse(data);

  if (response.access_token) {
    return response.access_token;
  } else {
    throw new Error(`Token error: ${data}`);
  }
}

// 提交单个 URL
async function submitUrl(url, accessToken, type = 'URL_UPDATED') {
  const postData = JSON.stringify({
    url: url,
    type: type // URL_UPDATED 或 URL_DELETED
  });

  const options = {
    hostname: 'indexing.googleapis.com',
    path: '/v3/urlNotifications:publish',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  try {
    const { statusCode, data } = await httpsRequestWithProxy(options, postData);
    let response;
    try {
      response = JSON.parse(data);
    } catch {
      response = data;
    }
    return { url, status: statusCode, response };
  } catch (e) {
    return { url, status: 'error', response: e.message };
  }
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  console.log('=== Google Indexing API 提交工具 ===\n');

  // 检查凭据文件
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('错误: 未找到 Google 凭据文件');
    console.error(`请将服务账户密钥文件保存到: ${CREDENTIALS_PATH}`);
    console.error('\n获取凭据步骤:');
    console.error('1. 访问 https://console.cloud.google.com/');
    console.error('2. 创建项目并启用 "Web Search Indexing API"');
    console.error('3. 创建服务账户并下载 JSON 密钥');
    console.error('4. 在 Search Console 中添加服务账户邮箱为所有者');
    process.exit(1);
  }

  // 读取 URL 列表
  if (!fs.existsSync(URLS_PATH)) {
    console.error('错误: 未找到 URL 列表文件');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { urls } = JSON.parse(fs.readFileSync(URLS_PATH, 'utf8'));

  console.log(`服务账户: ${credentials.client_email}`);
  console.log(`代理: ${PROXY_URL || '未使用'}`);
  console.log(`待提交 URL 数量: ${urls.length}`);
  console.log(`每日限额: ${DAILY_LIMIT}`);

  if (urls.length > DAILY_LIMIT) {
    console.warn(`\n警告: URL 数量 (${urls.length}) 超过每日限额 (${DAILY_LIMIT})`);
    console.warn(`本次只会提交前 ${DAILY_LIMIT} 个 URL\n`);
  }

  const urlsToSubmit = urls.slice(0, DAILY_LIMIT);

  try {
    console.log('\n正在获取访问令牌...');
    const accessToken = await getAccessToken(credentials);
    console.log('访问令牌获取成功\n');

    console.log('开始提交 URL...\n');

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (let i = 0; i < urlsToSubmit.length; i++) {
      const url = urlsToSubmit[i];
      const result = await submitUrl(url, accessToken);
      results.push(result);

      if (result.status === 200) {
        successCount++;
        console.log(`[${i + 1}/${urlsToSubmit.length}] 成功: ${url}`);
      } else {
        failCount++;
        console.log(`[${i + 1}/${urlsToSubmit.length}] 失败 (${result.status}): ${url}`);
        console.log(`  错误: ${JSON.stringify(result.response)}`);
      }

      // 请求间隔
      if (i < urlsToSubmit.length - 1) {
        await sleep(DELAY_BETWEEN_REQUESTS);
      }
    }

    console.log('\n=== 提交完成 ===');
    console.log(`成功: ${successCount}`);
    console.log(`失败: ${failCount}`);
    console.log(`总计: ${urlsToSubmit.length}`);

    // 保存结果
    const resultPath = path.join(process.cwd(), 'google-index-result.json');
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { success: successCount, fail: failCount, total: urlsToSubmit.length },
      results
    }, null, 2));
    console.log(`\n结果已保存到: ${resultPath}`);

  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

main();
