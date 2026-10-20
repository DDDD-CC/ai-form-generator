<template>
    <div class="title-box">
        <h3>AI 聊天助手</h3>
        <div class="header-right">
            <div class="model-tag">{{ label }}</div>
            <template v-if="hasMessages">
                <div class="time" v-if="lastTimeText">最后发言：{{ lastTimeText }}</div>
                <div class="count-tag">消息总数：{{ totalCount }}</div>
                <button class="clear-btn" @click="emit('clear')">清空</button>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatTime } from '@/utils/format'

const props = defineProps<{
    label?: string
    totalCount: number
    lastMessageAt?: number
}>()

const emit = defineEmits<{
    clear: []
}>()

const hasMessages = computed(() => props.totalCount > 0)

const lastTimeText = computed(() =>
    props.lastMessageAt ? formatTime(props.lastMessageAt) : ''
)
</script>

<style lang="scss" scoped>
.title-box {
    flex-shrink: 0;                 /* 固定件防挤压 */
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    padding: 0 24px;
    background: #fafafa;
    border-bottom: 1px solid #e5e7eb;

    h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 12px;

        .time {
            color: #999;
            font-size: 13px;
        }

        .model-tag {
            font-size: 12px;
            color: #6b7280;
            background: #f3f4f6;
            padding: 3px 10px;
            border-radius: 999px;
        }

        .count-tag {
            font-size: 12px;
            color: #2563eb;
            background: #eff6ff;
            padding: 3px 10px;
            border-radius: 999px;
        }
    }

    .clear-btn {
        border: none;
        background: none;
        color: #e5484d;
        font-size: 13px;
        font-family: inherit;    /* button 不继承字体，显式给 */
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 6px;
        transition: background-color .15s;

        &:hover {
            background: #fdebec;
        }

        &:focus-visible {
            outline: 2px solid #fca5a5;
            outline-offset: 2px;
        }
    }
}
</style>
