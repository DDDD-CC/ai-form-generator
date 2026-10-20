import { computed, ref, type Ref, type ComputedRef } from 'vue'
import { MODELS, DEFAULT_MODEL_ID, type ChatModel, type ModelId } from '@/config/models'

interface UseModelReturn {
    currentModelId: Readonly<Ref<ModelId>>
    currentModel: ComputedRef<ChatModel>
    setCurrentModel: (id: ModelId) => void
}

const currentModelId = ref(DEFAULT_MODEL_ID)

export function useModel(): UseModelReturn {
    const currentModel = computed<ChatModel>(() => {
        const found = MODELS.find(m => m.id === currentModelId.value)
        if (!found) throw new Error(`未知模型 id: ${currentModelId.value}`)
        return found
    })

    function setCurrentModel(id: ModelId): void {
        currentModelId.value = id
    }

    return { currentModelId, currentModel, setCurrentModel }
}