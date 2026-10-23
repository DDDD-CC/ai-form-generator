import type { Role } from "@/types/Message"
import type { ModelId } from "@/config/models"
import { API_BASE } from "@/config/api"
import type { ApiMessage, SendChatResult } from "./message"
import type { Usage } from "./usage"

/**
 * 智谱 /chat/completions 响应的整体结构（边界契约）。
 * 字段名照抄智谱响应原文。
 */
interface ChatResponse {
    choices: {
        finish_reason: string,
        index: number,
        message: {
            content: string,
            role: Role
        }
    }[],
    created: number,
    id: string,
    model: ModelId,
    object: string,
    request_id: string,
    usage: Usage
}

/** 混合思考模型的思考开关。实测（第 1 天）：一句 hi 开思考 ≈210 tokens，关 ≈50 */
type ThinkingType = 'enabled' | 'disabled'

/**
 * 全项目唯一的模型调用出口。
 * @param model    模型 id，来自 config/models.ts
 * @param messages 完整对话历史（含刚 push 的最新一条 user 消息），由 apiMessages() 生成
 * @param type     思考开关，默认关闭
 * ① fetch 包 try/catch → ② text() 只读一次 → ③ JSON.parse 兜底 → ④ !res.ok 抛状态码+原文 → ⑤ 逐层可选链判空
 */
export async function sendChat(model: ModelId, messages: ApiMessage[], type: ThinkingType = 'disabled'): Promise<SendChatResult> {
    const key = import.meta.env.VITE_ZHIPU_KEY
    if (!key) throw new Error('key不存在，未配置 VITE_ZHIPU_KEY，请检查 .env.local')

    const payload = {
        model,
        messages,
        thinking: {
            type
        },
    }

    let res: Response
    try {
        res = await fetch(`${API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(payload),
        })
    } catch (err) {
        throw new Error(`请检查断网/代理未启动/跨域，${err instanceof Error ? err.message : String(err)}`)
    }

    const rawText = await res.text()
    let data: ChatResponse | null
    try {
        data = JSON.parse(rawText) as ChatResponse
    } catch {
        data = null
    }

    if (!res.ok) {
        throw new Error(`请求失败：${res.status} ${rawText}`)
    }

    const message = data?.choices[0]?.message
    if (!message || !data?.usage) {
        throw new Error(`响应结构异常，${rawText}`)
    }
    return {
        content: message.content,
        usage: data.usage
    }
}