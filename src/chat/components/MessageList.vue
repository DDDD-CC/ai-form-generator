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
    </div>
</template>
<script setup lang="ts">
import MessageItem from './MessageItem.vue';
import type { ChatMessage } from '@/types/Message'
import { nextTick, ref, watch } from 'vue';

const { messageList = [] } = defineProps<{
    messageList?: ChatMessage[]
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

</style>