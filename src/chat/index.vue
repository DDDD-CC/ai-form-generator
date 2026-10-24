<template>
    <div class="chat-page">
        <ChatHeader 
            :label="currentModel.label" 
            @clear="clear" 
            :total-count="totalCount"
            :last-message-at="lastMessageAt" 
        />
        <MessageList :message-list="messageList" @delete-message="deleteMessage" :loading="loading" />
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

const { currentModel, currentModelId } = useModel()
let idSeed = 0
const messageList = ref<ChatMessage[]>([])

const lastMessageAt = computed(() => {
    return messageList.value.filter(item => item.role === 'user').at(-1)?.createdAt
})

const loading = ref(false)

async function handleSend(text: string):Promise<void> {
    if(loading.value) return
    messageList.value.push({
        id: ++idSeed,          // 简易自增 id，够学习用
        content: text,
        role: 'user',
        createdAt: Date.now(),
        isError: false
    })
    try {
        loading.value = true
        const message = await sendChat(currentModelId.value, apiMessages(messageList.value))
        messageList.value.push({
            id: ++idSeed,          // 简易自增 id，够学习用
            content: message.content,
            role: 'assistant',
            createdAt: Date.now(),
            isError: false
        })
    } catch (err) {
        messageList.value.push({
            id: ++idSeed,
            content: `【请求失败】${err instanceof Error ? err.message : String(err)}`,
            role: 'assistant',
            createdAt: Date.now(),
            isError: true
        })
    } finally {
        loading.value = false
    }
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