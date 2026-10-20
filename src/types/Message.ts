export const ROLES = ['user', 'assistant', 'system'] as const
export type Role = (typeof ROLES)[number]

export interface ChatMessage {
    id: number
    content: string
    role: Role
    createdAt: number
}