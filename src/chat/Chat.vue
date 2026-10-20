<template>
    <div class="chat-page">
        <ChatHeader 
            :label="currentModel.label" 
            @clear="clear" 
            :total-count="totalCount"
            :last-message-at="lastMessageAt" 
        />
        <MessageList :message-list="messageList" @deleteMessage="deleteMessage" />
        <ChatInput @send="handleSend" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import MessageList from './components/MessageList.vue';
import ChatInput from './components/ChatInput.vue';
import ChatHeader from './components/ChatHeader.vue';
import type { ChatMessage } from '@/types/Message';
import { useModel } from '@/composables/useModel';

const { currentModel } = useModel()
let idSeed = 0
const messageList = ref<ChatMessage[]>([])

const lastMessageAt = computed(() => {
    return messageList.value.filter(item => item.role === 'user').at(-1)?.createdAt
})

function handleSend(text: string):void {
    messageList.value.push(
        {
            id: ++idSeed,          // 简易自增 id，够学习用
            content: text,
            role: 'user',
            createdAt: Date.now()
        },
        {
            id: ++idSeed,          // 简易自增 id，够学习用
            content: `【模拟回复】我收到了：${text}`,
            role: 'assistant',
            createdAt: Date.now()
        }
    )
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