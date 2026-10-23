/**
 * ========== 消息的两套模型：这里是 UI 侧 ==========
 *
 * ChatMessage 是界面里一条气泡的完整数据，只活在浏览器里，
 * 永远不直接发给智谱——发请求前要经过 apiMessages()（api/messageMap.ts）
 * 过滤 + 映射成 ApiMessage。
 *
 * 对比记忆：ChatMessage 多出的 id / createdAt / isError 都是为界面服务的，
 * 智谱只认识 role + content。
 */

/** UI 侧合法角色，用 as const 从数据派生 */
export const ROLES = ['user', 'assistant', 'system'] as const
export type Role = (typeof ROLES)[number]

export interface ChatMessage {
    /** 气泡唯一标识：v-for 的 :key、删除定位都靠它。自增数字，学习项目够用 */
    id: number
    /** 消息正文：气泡里显示的文字，也是发给模型的文字 */
    content: string
    /** 谁说的：user=用户 / assistant=模型 / system=系统预设（本项目 UI 暂不产生 system） */
    role: Role
    /** 创建时间戳（毫秒）：顶栏"最后发言时间"的数据来源 */
    createdAt: number
    /** 是否为错误气泡：true 的消息会被 apiMessages() 过滤掉，不进对话历史 */
    isError: boolean
}
