const ERROR_REASONS = ['network', 'timeout', 'auth', 'rate-limit', 'server'] as const
export type ChatErrorReason = (typeof ERROR_REASONS)[number]

export class ChatError extends Error {
    reason: ChatErrorReason

    constructor(reason: ChatErrorReason, message: string) {
        super(message)        // message 交给父类 Error 保管（它本来就会管这个）
        this.reason = reason  // 新加的字段自己赋值
    }
}