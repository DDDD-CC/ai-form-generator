#!/usr/bin/env node
/**
 * GLM API 调试脚本
 *
 * ⚠️ 这是调试工具，不是项目业务代码。
 *    它的作用是在写 Vue 代码之前，先确认 API 层的行为符合预期。
 *
 * 用法：
 *   node scripts/glm-test.mjs "你的问题"
 *   node scripts/glm-test.mjs "你的问题" --thinking     开启思考链（默认关闭）
 *   node scripts/glm-test.mjs "你的问题" --model=glm-4-flash-250414
 *   node scripts/glm-test.mjs --raw                     打印完整原始响应 JSON
 *   node scripts/glm-test.mjs --help
 *
 * 前置：环境变量 ZAI_API_KEY 必须已配置（不要写进代码，也不要写进 .env）
 *
 * 说明：本脚本刻意【不实现】流式（stream）解析。
 *      第 3 周的 SSE 流式解析与跨包截断处理是核心练习内容，需要你自己实现，
 *      那是本项目面试价值最高的技术点之一（见 docs/devlog.md 预警清单）。
 */

const ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const DEFAULT_MODEL = 'glm-4.7-flash'
const TIMEOUT_MS = 60_000

const HELP = `
GLM API 调试脚本

用法：
  node scripts/glm-test.mjs "你的问题" [选项]

选项：
  --thinking        开启思考链（默认关闭）。用于对比 Token 消耗与耗时差异
  --model=<name>    指定模型，默认 ${DEFAULT_MODEL}
  --raw             打印完整原始响应 JSON（排查字段结构时用）
  -h, --help        显示本帮助

环境变量：
  ZAI_API_KEY       必需。智谱 API Key

示例：
  node scripts/glm-test.mjs "用一句话介绍 Vue3"
  node scripts/glm-test.mjs "1+1等于几" --thinking
  node scripts/glm-test.mjs "hi" --raw
`.trim()

// ---------- 参数解析 ----------

function parseArgs(argv) {
  const args = {
    text: null,
    thinking: false,
    raw: false,
    help: false,
    model: DEFAULT_MODEL,
  }

  for (const item of argv) {
    if (item === '--thinking') {
      args.thinking = true
    } else if (item === '--raw') {
      args.raw = true
    } else if (item === '-h' || item === '--help') {
      args.help = true
    } else if (item.startsWith('--model=')) {
      args.model = item.slice('--model='.length).trim()
    } else if (!item.startsWith('--') && args.text === null) {
      args.text = item
    } else {
      console.warn(`[警告] 无法识别的参数已忽略：${item}`)
    }
  }

  return args
}

// ---------- 输出美化 ----------

const LINE = '─'.repeat(52)

function section(title) {
  console.log(`\n${LINE}\n ${title}\n${LINE}`)
}

/** 把 usage 里的关键 Token 指标排成易读的表格 */
function printUsage(usage) {
  if (!usage) {
    console.log('（响应中没有 usage 字段）')
    return
  }

  const rows = [
    { 指标: '输入 prompt_tokens', 值: usage.prompt_tokens ?? '-' },
    { 指标: '输出 completion_tokens', 值: usage.completion_tokens ?? '-' },
    { 指标: '  其中思考 reasoning_tokens', 值: usage.reasoning_tokens ?? 0 },
    { 指标: '合计 total_tokens', 值: usage.total_tokens ?? '-' },
  ]

  console.table(rows)

  // 思考链占比是本项目关注的成本指标（见 docs/devlog.md 记录 7）
  const reasoning = usage.reasoning_tokens ?? 0
  const completion = usage.completion_tokens ?? 0
  if (completion > 0 && reasoning > 0) {
    const ratio = ((reasoning / completion) * 100).toFixed(1)
    console.log(`思考链占输出比例：${ratio}%`)
  }
}

/**
 * 非 2xx 时打印可读的错误诊断。
 * 重点：HTTP 429 只是信封，真实原因在 body 的 code 字段（见 devlog 记录 6）。
 */
function printError(status, data) {
  section(`请求失败 · HTTP ${status}`)

  if (data && typeof data === 'object') {
    const err = data.error ?? data
    console.log('业务错误码 code :', err.code ?? '(无)')
    console.log('错误信息 message :', err.message ?? JSON.stringify(data))
  } else {
    console.log('响应体（非 JSON）:', data)
  }

  console.log('\n──── 排查提示 ────')
  const hints = {
    401: 'Key 无效或已过期。检查环境变量是否生效（改完要重开终端）、Key 是否带空格换行。',
    400: '请求参数有误。检查模型名是否写错（注意是全小写、点号而非横线）。',
    404: '地址错误。智谱是 /api/paas/v4，不是 OpenAI 的 /v1。',
    429: '限流或服务端拥塞。**不要重建 Key**（无效）。先看上面的业务码：\n' +
         '         1302=自身速率超限  1305=模型访问量过大（等 1-5 分钟）\n' +
         '         1308/1310=额度上限  1113=账户欠费\n' +
         '         不要连续快速重试，每次重试都计入限流。',
  }
  console.log(hints[status] ?? '未收录的状态码，把完整响应贴出来排查。')
}

// ---------- 主流程 ----------

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    console.log(HELP)
    return
  }

  const apiKey = process.env.ZAI_API_KEY
  if (!apiKey) {
    console.error('✗ 缺少环境变量 ZAI_API_KEY')
    console.error('  PowerShell 设置（用户级，设完需重开终端）：')
    console.error('    [Environment]::SetEnvironmentVariable("ZAI_API_KEY", "你的KEY", "User")')
    console.error('  验证：cmd 里 echo %ZAI_API_KEY%  /  PowerShell 里 $env:ZAI_API_KEY')
    process.exit(1)
  }

  if (!args.text) {
    console.error('✗ 缺少提问内容。用法：node scripts/glm-test.mjs "你的问题"')
    console.error('  查看完整帮助：node scripts/glm-test.mjs --help')
    process.exit(1)
  }

  const payload = {
    model: args.model,
    messages: [{ role: 'user', content: args.text }],
    // GLM-4.7 系列默认开启思考，显式声明便于做 A/B 对比（devlog 记录 7）
    thinking: { type: args.thinking ? 'enabled' : 'disabled' },
    temperature: 0.7,
  }

  section(`请求 · ${args.model} · 思考=${args.thinking ? '开' : '关'}`)
  console.log(`提问：${args.text}`)

  // 超时控制：避免请求挂死。AbortController 的用法第 3 周做"停止生成"时会再遇到
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const startedAt = Date.now()

  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    section('网络层失败')
    if (err.name === 'AbortError') {
      console.log(`请求超过 ${TIMEOUT_MS}ms 未响应，已主动中断。`)
    } else {
      console.log(err.message)
      console.log('\n排查方向：网络是否可达、是否需要代理、DNS 是否正常。')
    }
    process.exit(1)
  }
  clearTimeout(timer)

  const elapsed = Date.now() - startedAt

  // 先拿文本再解析，这样非 JSON 的错误响应也能看到原文
  const rawText = await res.text()
  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    data = null
  }

  if (!res.ok) {
    printError(res.status, data ?? rawText)
    console.log(`\n耗时：${elapsed}ms`)
    process.exit(1)
  }

  console.log(`HTTP ${res.status} · 耗时 ${elapsed}ms`)

  if (args.raw) {
    section('完整原始响应')
    console.log(JSON.stringify(data, null, 2))
    return
  }

  const choice = data.choices?.[0]
  if (!choice?.message) {
    section('响应结构异常')
    console.log('没有 choices[0].message，完整响应如下：')
    console.log(JSON.stringify(data, null, 2))
    return
  }

  const msg = choice.message

  section('回复内容')
  console.log(msg.content ?? '(空)')

  if (msg.reasoning_content) {
    section('思考过程（reasoning_content）')
    console.log(msg.reasoning_content)
  }

  section('Token 用量')
  printUsage(data.usage)

  if (choice.finish_reason && choice.finish_reason !== 'stop') {
    console.log(`\n⚠ finish_reason = ${choice.finish_reason}（非正常结束，可能被截断或触发安全策略）`)
  }
}

main().catch((err) => {
  console.error('脚本自身出错：', err)
  process.exit(1)
})
