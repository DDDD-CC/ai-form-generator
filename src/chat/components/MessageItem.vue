<template>
    <div class="bubble-row" :class="message.role">
        <div class="bubble-group">
            <div class="bubble">{{ message.content }}</div>
            <!-- 重试：仅"父层判定可重试"的失败气泡显示；本组件只上报事件，重试逻辑在 index.vue -->
            <button
                v-if="message.isError && canRetry"
                class="retry-btn"
                aria-label="重试这次请求"
                @click="retry"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
            </button>
            <button class="delete-btn" aria-label="删除这条信息" @click="deleteMessage">
                <svg
                    viewBox="0 0 24 24" 
                    fill="none" stroke="currentColor" 
                    stroke-width="2" stroke-linecap="round" 
                    stroke-linejoin="round"
                >
                    <path d="M3 6h18"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/types/Message'

const { message, canRetry = false } = defineProps<{
    message: ChatMessage
    /** 是否显示重试按钮：由父层判断（仅最后一条失败气泡），本组件不做判断逻辑 */
    canRetry?: boolean
}>()

const emit = defineEmits<{
    deleteMessage: []
    retry: []
}>()

const deleteMessage = ():void => {
    emit('deleteMessage')    
}

const retry = ():void => {
    emit('retry')    
}
</script>

<style lang="scss" scoped>
.bubble-row {
    display: flex;
    padding: 8px 20px;

    &.user {
        justify-content: flex-end;   /* 用户消息：整组靠右 */

        .bubble {
            background-color: #0099ff;
            color: #fff;
            border-bottom-right-radius: 4px;
        }
    }
}

.bubble-group {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 65%;                  /* 气泡 + 按钮整体封顶（原 65% 从 .bubble 挪到这） */

    /* 用户消息：组内镜像，按钮保持在外侧 */
    .user & {
        flex-direction: row-reverse;
    }

    .bubble {
        max-width: 100%;
        padding: 10px 14px;
        border-radius: 12px;
        background-color: #f2f3f5;
        color: #1a1a1a;
        font-size: 14px;
        line-height: 1.5;
        word-break: break-word;
        white-space: pre-wrap;
    }

    /* AI 消息（默认）：按钮在气泡右侧，隐藏时向左缩进 */
    .delete-btn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: #9ca3af;
        cursor: pointer;
        opacity: 0;
        transform: translateX(-5px) scale(.85);
        transition:
            opacity .18s ease,
            transform .18s ease,
            background-color .15s,
            color .15s;

        svg { width: 15px; height: 15px; }

        &:hover {
            background: #fee2e2;
            color: #e5484d;
        }

        &:focus-visible { 
            opacity: 1 
        }
    }

    /* 重试按钮：只出现在失败气泡上，常显（行动入口，不走删除按钮的 hover 隐藏逻辑） */
    .retry-btn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: #d97706;
        cursor: pointer;
        transition:
            background-color .15s,
            color .15s,
            transform .15s;

        svg { width: 15px; height: 15px; }

        &:hover {
            background: #fef3c7;
            color: #b45309;
        }

        &:active { transform: scale(.9); }
    }

    /* 用户消息：按钮在气泡左侧，隐藏时向右缩进 */
    .user & .delete-btn {
        transform: translateX(5px) scale(.85);
    }

    /* 悬停热区 = 气泡 + 按钮（组），空白区域不再触发。
       ⚠️ 必须放在上面两条方向规则之后：优先级打平时按源码顺序取胜 */
    &:hover .delete-btn {
        opacity: 1;
        transform: translateX(0) scale(1);

        &:active {
            transform: scale(.9);
        }
    }
}
</style>
