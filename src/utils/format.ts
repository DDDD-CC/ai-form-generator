/**
 * 时间戳格式化工具函数
 *
 * 特性：
 * 1. 自动识别秒级（10 位）/ 毫秒级（13 位）时间戳
 * 2. 日期为【当天】时，只显示时分（可选是否带秒），如 '14:58' / '14:58:30'
 * 3. 非当天则显示完整日期时间，如 '2025-10-16 14:58'
 * 4. 支持自定义格式模板
 */

/** formatTime 配置项 */
export interface FormatTimeOptions {
  /** 非当天时使用的格式模板，默认 'YYYY-MM-DD HH:mm' */
  format?: string
  /** 日期为当天时，时分后面是否带秒，默认 false（只显示 HH:mm） */
  showSeconds?: boolean
  /** 是否启用「当天只显示时分」的逻辑，默认 true；设为 false 则始终使用 format 完整格式 */
  smartToday?: boolean
}

/**
 * 将时间戳转换为具体时间字符串
 *
 * @param ts      时间戳（秒或毫秒均可，自动识别）
 * @param options 可选配置，见 FormatTimeOptions
 * @returns 格式化后的时间字符串
 *
 * @example
 * // 假设现在是 2025-10-17 15:00
 * formatTime(Date.now())                        // '15:00'      当天 → 只显示时分
 * formatTime(Date.now(), { showSeconds: true }) // '15:00:30'   当天 → 时分 + 秒
 * formatTime(yesterdayTs)                       // '2025-10-16 15:00'  非当天 → 完整格式
 * formatTime(ts, { smartToday: false })         // 始终走完整格式
 * formatTime(ts, { format: 'MM/DD HH:mm' })     // '10/16 15:00' 自定义模板
 */
export function formatTime(ts: number, options: FormatTimeOptions = {}): string {
  const { format = 'YYYY-MM-DD HH:mm', showSeconds = false, smartToday = true } = options

  // 10 位按秒级处理，补成毫秒
  const ms = ts.toString().length === 10 ? ts * 1000 : ts
  const d = new Date(ms)

  const pad = (n: number):string => String(n).padStart(2, '0')

  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  }

  const render = (tpl: string):string => tpl.replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => map[k])

  // 当天 → 只显示时分（可选带秒）
  if (smartToday && isSameDay(d, new Date())) {
    return showSeconds ? `${map.HH}:${map.mm}:${map.ss}` : `${map.HH}:${map.mm}`
  }

  return render(format)
}

/** 判断两个日期是否为同一天（按本地时区） */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}