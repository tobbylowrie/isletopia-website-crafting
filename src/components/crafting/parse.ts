import type { ParseResult, ParsedRecipe, RecipeSlot } from './types'

const SUPPORTED_TYPES = new Set(['crafting_shaped', 'crafting_shapeless'])

/**
 * 解析原版 data pack 配方（对象或 JSON 字符串）为统一模型。
 * 纯函数；失败时返回 { ok: false, message }，由组件负责展示错误。
 */
export function parseRecipe(input: unknown): ParseResult {
  let data: unknown = input

  if (typeof input === 'string') {
    const text = input.trim()
    if (!text) return fail('配方数据为空')
    try {
      data = JSON.parse(text)
    } catch (err) {
      return fail(`JSON 解析失败：${(err as Error).message}`)
    }
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return fail('配方数据必须是 JSON 对象')
  }

  const raw = data as Record<string, unknown>
  const type = typeof raw.type === 'string' ? raw.type.replace(/^minecraft:/, '') : ''

  if (!SUPPORTED_TYPES.has(type)) {
    return fail(
      `不支持的配方类型 "${String(raw.type ?? '(缺失)')}"，当前支持 crafting_shaped / crafting_shapeless`,
    )
  }

  return type === 'crafting_shaped' ? parseShaped(raw) : parseShapeless(raw)
}

function fail(message: string): ParseResult {
  return { ok: false, message }
}

/** 归一化物品 id：无命名空间时补 minecraft: */
function normalizeId(id: string): string {
  return id.includes(':') ? id : `minecraft:${id}`
}

/**
 * 解析物品引用：字符串 / "#tag" / {"item"} / {"tag"}。
 * 数组（多选一原料）取第一项展示。返回 null 表示空位，字符串表示错误信息。
 */
function parseItemRef(ref: unknown): RecipeSlot | string | null {
  if (ref === null || ref === undefined) return null
  if (typeof ref === 'string') {
    const trimmed = ref.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('#')) return { id: trimmed.slice(1), count: 1, isTag: true }
    return { id: normalizeId(trimmed), count: 1 }
  }
  if (typeof ref === 'object') {
    if (Array.isArray(ref)) return ref.length > 0 ? parseItemRef(ref[0]) : null
    const obj = ref as Record<string, unknown>
    if (typeof obj.item === 'string') return { id: normalizeId(obj.item), count: 1 }
    if (typeof obj.tag === 'string') return { id: obj.tag, count: 1, isTag: true }
  }
  return '无法识别的物品引用，支持 "minecraft:id"、{"item": "..."} 或 {"tag": "..."}'
}

/** 解析 result：兼容 {"id"}（1.21+）与 {"item"}（旧版） */
function parseResultSlot(raw: Record<string, unknown>): RecipeSlot | string {
  const r = raw.result
  if (typeof r !== 'object' || r === null || Array.isArray(r)) return '缺少 result 对象'
  const obj = r as Record<string, unknown>
  const id = typeof obj.id === 'string' ? obj.id : typeof obj.item === 'string' ? obj.item : ''
  if (!id) return 'result 缺少 id（或旧版 item）字段'
  const count = typeof obj.count === 'number' ? obj.count : Number(obj.count)
  return {
    id: normalizeId(id),
    count: Number.isFinite(count) && count >= 1 ? Math.floor(count) : 1,
  }
}

function parseShaped(raw: Record<string, unknown>): ParseResult {
  const pattern = raw.pattern
  if (!Array.isArray(pattern) || pattern.length === 0 || pattern.length > 3) {
    return fail('crafting_shaped 的 pattern 必须是 1~3 行的字符串数组')
  }
  const rows = pattern.map((row) => (typeof row === 'string' ? row : String(row)))
  const width = Math.max(...rows.map((row) => row.length))
  if (width > 3) return fail(`pattern 行宽不能超过 3 个字符，当前为 ${width}`)

  const key = raw.key
  if (typeof key !== 'object' || key === null || Array.isArray(key)) {
    return fail('crafting_shaped 缺少 key 映射对象')
  }
  const keyMap = key as Record<string, unknown>

  const grid: (RecipeSlot | null)[] = new Array<RecipeSlot | null>(9).fill(null)
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < width; c++) {
      const ch = rows[r]?.charAt(c) ?? ' '
      if (ch === ' ') continue
      const slot = parseItemRef(keyMap[ch])
      if (slot === null) return fail(`pattern 中使用了字符 "${ch}"，但 key 中没有它的定义`)
      if (typeof slot === 'string') return fail(`key["${ch}"]：${slot}`)
      grid[r * 3 + c] = slot
    }
  }

  const result = parseResultSlot(raw)
  if (typeof result === 'string') return fail(result)
  return { ok: true, recipe: { kind: 'shaped', grid, result } }
}

function parseShapeless(raw: Record<string, unknown>): ParseResult {
  const ingredients = raw.ingredients
  if (!Array.isArray(ingredients)) return fail('crafting_shapeless 的 ingredients 必须是数组')
  if (ingredients.length === 0) return fail('ingredients 不能为空')
  if (ingredients.length > 9) {
    return fail(`ingredients 数量不能超过 9，当前为 ${ingredients.length}`)
  }

  const grid: (RecipeSlot | null)[] = new Array<RecipeSlot | null>(9).fill(null)
  let i = 0
  for (const entry of ingredients) {
    const slot = parseItemRef(entry)
    if (typeof slot === 'string') return fail(slot)
    if (slot) grid[i++] = slot
  }

  const result = parseResultSlot(raw)
  if (typeof result === 'string') return fail(result)
  return { ok: true, recipe: { kind: 'shapeless', grid, result } }
}
