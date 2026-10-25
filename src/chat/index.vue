<template>
    <div class="chat-page">
        <ChatHeader 
            :label="currentModel.label" 
            @clear="clear" 
            :total-count="totalCount"
            :last-message-at="lastMessageAt" 
        />
        <MessageList :message-list="messageList" @delete-message="deleteMessage" @retry="retry" :loading="loading" />
        <ChatInput @send="handleSend" :loading="loading" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import MessageList from './components/MessageList.vue';
import ChatInput from './components/ChatInput.vue';
import ChatHeader from './components/ChatHeader.vue';
import type { ChatMessage } from '@/types/Message';
import { useModel } from '@/composables/useModel';
import { sendChat } from '@/api/chat';
import { apiMessages } from '@/api/messageMap';
import { ChatError } from '@/api/error';
import type { Usage } from '@/api/usage';

const { currentModel, currentModelId } = useModel()
let idSeed = 0
const messageList = ref<ChatMessage[]>([])

const lastMessageAt = computed(() => {
    return messageList.value.filter(item => item.role === 'user').at(-1)?.createdAt
})

const loading = ref(false)

/** request 的返回：一条待推送的消息（ChatMessage 挖掉 id/createdAt），usage 仅成功路径携带 */
type DraftMessage = Omit<ChatMessage, 'id' | 'createdAt'> & {
    usage?: Usage
}

async function handleSend(text: string): Promise<void> {
    if (loading.value) return
    handlePush({content: text, role: 'user', isError: false})
    const {usage, ...msg} = await request()
    handlePush(msg)
}

async function retry(id: number): Promise<void> {
    if (loading.value) return
    const {usage, ...msg} = await request()
    handlePush(msg)
    if (!msg.isError) deleteMessage(id)
}

// ================= 请求方：一轮对话 → 一条待推送消息 =================

async function request(): Promise<DraftMessage> {
    loading.value = true
    try{
        const result = await sendChat(currentModelId.value, apiMessages(messageList.value))
        return { role: 'assistant', content: result.content, isError: false, usage: result.usage }
    } catch (err){
        return { role: 'assistant', content: errorText(err), isError: true, usage: undefined }
    }
    finally{
        loading.value = false
    }
}

// ================= 推送方：只碰 messageList =================

function handlePush(msg: DraftMessage): void {
    messageList.value.push({ id: ++idSeed, createdAt: Date.now(), ...msg })
}

function errorText(err: unknown): string {
    let content: string
    if (err instanceof ChatError) {
        switch (err.reason) {
            case 'timeout':
                content = '请求超时，请稍后重试'
                break;
            case 'network':
                content = '网络错误，请检查断网/代理未启动/跨域'
                break;
            case 'auth':
                content = '鉴权失败：API Key 无效或未配置，请检查 .env.local（改完需重启 dev 服务）'
                break;
            case 'rate-limit':
                content = '当前模型请求繁忙，请稍后重试，或切换模型'
                break;
            case 'server':
                content = '服务端/链路侧出问题，请等几分钟或错峰再试'
                break;
            default: 
                content = '请求失败，请稍后重试'
        }
    } else {
        content = `【请求失败】${err instanceof Error ? err.message : String(err)}`
    }
    return content
}

const totalCount = computed(() => messageList.value.length)

function clear():void {
    messageList.value = []
}
function deleteMessage(id:number):void {
    messageList.value = messageList.value.filter(item => item.id !== id)
}
</script>

<style lang="scss" scoped>
.chat-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
}
</style>