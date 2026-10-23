import type { ChatMessage } from "@/types/Message"
import type { ApiMessage } from "./message"


export function apiMessages(list: ChatMessage[]): ApiMessage[] {
    return list
        .filter(item => !item.isError)
        .map(item => ({ content: item.content, role: item.role }))
}