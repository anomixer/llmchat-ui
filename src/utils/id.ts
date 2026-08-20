// 產生唯一訊息 ID：時間戳 + 遞增計數，避免同一毫秒建立多則訊息時 ID 碰撞（React key 重複）
let counter = 0
export function makeMessageId(prefix = 'msg'): string {
    counter += 1
    return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}
