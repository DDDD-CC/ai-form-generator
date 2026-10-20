<template>
    <div class="send-box">
        <textarea
            ref="textareaRef"
            v-model="draft"
            class="textarea"
            placeholder="发条消息..."
            rows="1"
            @input="autoResize"
            @keydown.enter.exact.prevent="send"
        />
        <button
            type="button"
            :disabled="!canSend"
            class="btn"
            :class="canSend ? 'available' : 'disabled'"
            @click="send"
        >
            发送
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const draft = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

const emit = defineEmits<{
    send: [text: string]
}>()

// 自动撑高：先重置再贴合内容
function autoResize():void {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
}

const canSend = computed(() => draft.value.trim().length > 0)

const send = ():void => {
    if (!canSend.value) return
    emit('send', draft.value.trim())
    draft.value = ''
    autoResize()   // JS 清空不触发 input 事件，手动缩回单行
}
</script>

<style lang="scss" scoped>
.send-box {
    display: flex;
    align-items: flex-end;   // 多行时按钮贴底部对齐
    padding: 10px 20px;
    background: #fff;

    .textarea {
        flex: 1;
        box-sizing: border-box;

        /* reset */
        border: none;
        outline: none;
        resize: none;
        background: none;
        font: inherit;

        /* 多行自适应造型 */
        min-height: 44px;
        max-height: 132px;            // 3 行封顶，超出内部滚动
        overflow-y: auto;
        padding: 10px 16px;
        line-height: 1.5;
        border-radius: 20px;
        background-color: #f2f3f5;
        transition: background-color 0.2s;

        &::placeholder {
            color: #b0b3b8;
        }

        &:focus {
            background-color: #e8f3ff;
        }
    }

    .btn {
        flex-shrink: 0;               // 防止被文本域挤变形
        width: 88px;
        min-height: 44px;
        line-height: 44px;
        border: none;
        border-radius: 22px;
        margin-left: 12px;
        text-align: center;
    }

    .disabled {
        background-color: #eee;
        color: #999;
        cursor: not-allowed;
    }

    .available {
        background-color: #0099ff;
        color: #fff;
        cursor: pointer;
    }
}
</style>
