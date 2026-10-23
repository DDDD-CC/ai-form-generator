/**
 * token 用量 = 智谱响应里 usage 字段的结构（边界契约）。
 * snake_case 字段名照抄智谱响应，不要改成驼峰。
 *
 * reasoning_tokens 是思考链的消耗（开思考时才会涨，参考：一句 hi 开思考 210 / 关 50）。
 */
export interface Usage {
    completion_tokens: number,
    completion_tokens_details: {
        reasoning_tokens: number
    },
    prompt_tokens: number,
    prompt_tokens_details: {
        cached_tokens: number
    },
    total_tokens: number
}
