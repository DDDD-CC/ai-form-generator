/**
 * ========== 消息的两套模型：这里是 API 侧 ==========
 *
 * 本文件描述的都是"智谱 API 的线上契约"——字段名由智谱文档决定，一个都不能改。
 */
import type { Usage } from "./usage"

/** 智谱接受的合法角色，与 UI 侧 Role 内容一致但独立声明，互不依赖 */
export const APIROLES = ['user', 'assistant', 'system'] as const
export type APIRole = (typeof APIROLES)[number]

/** 发给智谱的一条消息 = 请求体里 messages 数组的一个元素，只有 role + content 两个字段 */
export interface ApiMessage {
    role: APIRole,
    /** 消息正文。字段名 content 是智谱定的，别改 */
    content: string
}

/** sendChat 的返回值：一次成功请求拆出来的两样东西 */
export interface SendChatResult {
    /** 模型的回答文本：chat/index.vue 拿它 push 一条 assistant 气泡 */
    content: string,
    /** 本次请求的 token 用量 */
    usage: Usage
}
