<template>
    <div v-if="messageList.length === 0" class="message-box none">
        <div class="tip">发条消息试试</div>
        <div class="tip">支持回车发送</div>
    </div>
    <div class="message-box" v-else ref="boxRef">
        <MessageItem class="message-item" 
            v-for="msg in messageList" 
            :key="msg.id" 
            :message="msg" 
            @delete-message="deleteMessage(msg.id)" 
        />
        <div v-if="loading" class="thinking-row">
            <div class="thinking-bubble">思考中…</div>
        </div>
    </div>
</template>
<script setup lang="ts">
import MessageItem from './MessageItem.vue';
import type { ChatMessage } from '@/types/Message'
import { nextTick, ref, watch } from 'vue';

const { messageList = [], loading } = defineProps<{
    messageList?: ChatMessage[]
    loading: boolean
}>()

const emit = defineEmits<{
    'delete-message': [id: number]
}>()

const deleteMessage = (id: number):void => {
    emit('delete-message', id)
}

const boxRef = ref<HTMLDivElement>()
watch(() => messageList.length, (newVal, oldVal) => {
    const el = boxRef.value
    if (!el) return
    if (newVal <= oldVal) return 

    // 是否已经滚到底部（留 5px 容差，防浮点误差）
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 5

    if(isAtBottom) {
       nextTick(() =>  el.scrollTop = el.scrollHeight)
    }

})

</script>

<style lang="scss" scoped>
.message-box {
    flex: 1;
    border-bottom: 1px solid #ccc;
    border-top: 1px solid #ccc;
    overflow-y: auto;
    min-height: 0;
}
.none {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

/* 思考中占位：视觉上复刻 AI 气泡（左侧、灰色、同圆角），但无删除按钮 */
.thinking-row {
    display: flex;
    padding: 8px 20px;
}

.thinking-bubble {
    padding: 10px 14px;
    border-radius: 12px;
    border-bottom-left-radius: 4px;
    background-color: #f2f3f5;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    animation: thinking-pulse 1.6s ease-in-out infinite;

    /* 用户系统开了"减少动态效果"时停用动画 */
    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
}

@keyframes thinking-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.45;
    }
}
</style>