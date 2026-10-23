/**
 * 拼接约定（API_BASE 不以 / 结尾、接口路径必须以 / 开头）
 * 此路径依赖 vite.config.ts 里面配置的 /api 代理，只有 dev 时生效，npm run build 后失效，第 4 周由 BFF 接管
 */
export const API_BASE = '/api/paas/v4'