// 数据：id 给 API，label 给人看。这两个字段名别改，改了就分不清谁是谁
export const MODELS = [
    { id: 'glm-4.7-flash', label: 'GLM-4.7-Flash（免费）' },
    { id: 'glm-4-flash-250414', label: 'GLM-4-Flash（免费备用）' },
] as const

// 从数据派生类型
export type ChatModel = (typeof MODELS)[number]
export type ModelId = (typeof MODELS)[number]['id']

// 默认用哪个
export const DEFAULT_MODEL_ID: ModelId = 'glm-4.7-flash'