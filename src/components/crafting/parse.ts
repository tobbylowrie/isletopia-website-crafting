import type { ParseResult, ParsedRecipe, RecipeSlot, SlotKey } from './types'

/**
 * 配方类型 → 面板种类 + 目录卡片徽章文案（按 MC 中文社区通用术语）。
 * furnace 四种烹饪变体共用熔炉面板，container 为面板标题对应的容器语言键。
 */
const TYPE_INFO: Record<
  string,
  { kind: ParsedRecipe['kind']; label: string; container?: string; fuel?: boolean }
> = {
  crafting_shaped: { kind: 'crafting', label: '合成' },
  crafting_shapeless: { kind: 'crafting', label: '合成' },
  smelting: { kind: 'furnace', label: '熔炼', container: 'container.furnace', fuel: true },
  blasting: { kind: 'furnace', label: '高炉', container: 'container.blast_furnace', fuel: true },
  smoking: { kind: 'furnace', label: '烟熏炉', container: 'container.smoker', fuel: true },
  campfire_cooking: { kind: 'furnace', label: '营火烹饪', container: 'block.minecraft.campfire' },
  stonecutting: { kind: 'stonecutter', label: '切石' },
  smithing_transform: { kind: 'smithing', label: '锻造升级' },
  smithing_trim: { kind: 'smithing', label: '盔甲纹饰' },
  brewing: { kind: 'brewing', label: '酿造' },
  crafting_decorated_pot: { kind: 'crafting', label: '饰纹陶罐' },
}

/**
 * 字段式配方：按固定字段顺序映射为无序合成槽位（SHAPELESS_ORDER）。
 * 覆盖 1.21+ 的 transmute/dye/imbue 与各 crafting_special_*（合成逻辑硬编码于游戏，
 * JSON 只带提示字段）。fields 允许重复字段名（如 bannerduplicate 的两份 banner），
 * 缺失字段跳过；resultFallbackId 用于产物字段为空对象的配方（mapextending）。
 */
const FIELD_RECIPE_TYPES: Record<
  string,
  { label: string; fields: string[]; resultFallbackId?: string }
> = {
  crafting_transmute: { label: '转化', fields: ['input', 'material'] },
  crafting_dye: { label: '染色', fields: ['target', 'dye'] },
  crafting_imbue: { label: '浸染', fields: ['material', 'source'] },
  crafting_special_bannerduplicate: { label: '旗帜复制', fields: ['banner', 'banner'] },
  crafting_special_bookcloning: { label: '成书复制', fields: ['source', 'material'] },
  crafting_special_firework_rocket: { label: '烟花火箭', fields: ['shell', 'fuel', 'star'] },
  crafting_special_firework_star: { label: '烟花之星', fields: ['fuel', 'dye', 'trail'] },
  crafting_special_firework_star_fade: { label: '烟花之星渐变', fields: ['target', 'dye'] },
  crafting_special_mapextending: {
    label: '地图扩展',
    fields: ['map', 'material'],
    resultFallbackId: 'minecraft:map',
  },
  crafting_special_repairitem: { label: '物品修复', fields: [] },
  crafting_special_shielddecoration: { label: '盾牌装饰', fields: ['target', 'banner'] },
}

const SUPPORTED_HINT = Object.keys(TYPE_INFO).join(' / ')

// 无序配方的填充顺序（源项目 cleanShapelessOrder）：中心 → 十字 → 四角
const SHAPELESS_ORDER = [5, 4, 6, 2, 8, 1, 3, 7, 9] as const

/**
 * 解析原版 data pack 配方（对象或 JSON 字符串）为统一槽位模型。
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

  const fieldDef = FIELD_RECIPE_TYPES[type]
  if (fieldDef) return parseFieldRecipe(raw, fieldDef)

  const info = TYPE_INFO[type]
  if (!info) {
    return fail(`不支持的配方类型 "${String(raw.type ?? '(缺失)')}"，当前支持 ${SUPPORTED_HINT}`)
  }

  switch (info.kind) {
    case 'crafting': {
      if (type === 'crafting_shaped') return parseShaped(raw)
      if (type === 'crafting_shapeless') return parseShapeless(raw)
      if (type === 'crafting_decorated_pot') return parseDecoratedPot(raw)
      const def = FIELD_RECIPE_TYPES[type]
      return def ? parseFieldRecipe(raw, def) : fail(`不支持的配方类型 "${String(raw.type)}"`)
    }
    case 'furnace':
      return parseWithIngredient(raw, info, 'cooking.ingredient', 'cooking.result')
    case 'stonecutter':
      return parseWithIngredient(raw, info, 'stonecutter.ingredient', 'stonecutter.result', raw.count)
    case 'brewing':
      return parseBrewing(raw)
    case 'smithing':
      return parseSmithing(raw, info.label)
  }
}

function fail(message: string): ParseResult {
  return { ok: false, message }
}

/** 归一化物品 id：无命名空间时补 minecraft: */
function normalizeId(id: string): string {
  return id.includes(':') ? id : `minecraft:${id}`
}

/**
 * 解析物品引用：字符串 / "#tag" / {"id"}（1.21+，支持 "#" 前缀 tag）/ {"item"} / {"tag"}。
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
    if (typeof obj.id === 'string') {
      return obj.id.startsWith('#')
        ? { id: obj.id.slice(1), count: 1, isTag: true }
        : { id: normalizeId(obj.id), count: 1 }
    }
    if (typeof obj.tag === 'string') return { id: obj.tag, count: 1, isTag: true }
  }
  return '无法识别的物品引用，支持 "minecraft:id"、"#tag"、{"id": "..."}、{"item": "..."} 或 {"tag": "..."}'
}

/**
 * 解析 result：兼容 {"id"}（1.21+）与 {"item"}（旧版），stonecutter 还接受字符串产物。
 * count 仅保留 ≥1 的有限数字；fallbackCount 用于 stonecutter 位于配方根级的 count。
 */
function parseResultSlot(raw: Record<string, unknown>, fallbackCount?: unknown): RecipeSlot | string {
  const r = raw.result
  let id: string
  let countSource: unknown = fallbackCount
  if (typeof r === 'string') {
    id = r.trim()
  } else if (typeof r === 'object' && r !== null && !Array.isArray(r)) {
    const obj = r as Record<string, unknown>
    id = typeof obj.id === 'string' ? obj.id : typeof obj.item === 'string' ? obj.item : ''
    countSource = obj.count ?? fallbackCount
  } else {
    return '缺少 result 对象'
  }
  if (!id) return 'result 缺少 id（或旧版 item）字段'
  const count = typeof countSource === 'number' ? countSource : Number(countSource)
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

  // ≤2×2 的图案用 2x2 面板渲染（可见槽 crafting.1/.2/.4/.5，左上对齐），
  // 否则 3x3 面板 + 源项目居中偏移
  const gridSize: 2 | 3 = rows.length <= 2 && width <= 2 ? 2 : 3
  const rowOffset = gridSize === 3 ? Math.min(1, 3 - rows.length) : 0
  const columnOffset = gridSize === 3 ? Math.floor((3 - width) / 2) : 0

  const slots: Partial<Record<SlotKey, RecipeSlot>> = {}
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < width; c++) {
      const ch = rows[r]?.charAt(c) ?? ' '
      if (ch === ' ') continue
      const slot = parseItemRef(keyMap[ch])
      if (slot === null) return fail(`pattern 中使用了字符 "${ch}"，但 key 中没有它的定义`)
      if (typeof slot === 'string') return fail(`key["${ch}"]：${slot}`)
      slots[`crafting.${(r + rowOffset) * 3 + (c + columnOffset) + 1}` as SlotKey] = slot
    }
  }

  const result = parseResultSlot(raw)
  if (typeof result === 'string') return fail(result)
  slots['crafting.result'] = result
  return { ok: true, recipe: { kind: 'crafting', gridSize, label: 'Crafting', slots } }
}

function parseShapeless(raw: Record<string, unknown>): ParseResult {
  const ingredients = raw.ingredients
  if (!Array.isArray(ingredients)) return fail('crafting_shapeless 的 ingredients 必须是数组')
  if (ingredients.length === 0) return fail('ingredients 不能为空')
  if (ingredients.length > 9) {
    return fail(`ingredients 数量不能超过 9，当前为 ${ingredients.length}`)
  }

  const slots: Partial<Record<SlotKey, RecipeSlot>> = {}
  let i = 0
  for (const entry of ingredients) {
    const slot = parseItemRef(entry)
    if (typeof slot === 'string') return fail(slot)
    if (slot) slots[`crafting.${SHAPELESS_ORDER[i++]}` as SlotKey] = slot
  }

  const result = parseResultSlot(raw)
  if (typeof result === 'string') return fail(result)
  slots['crafting.result'] = result
  // 无序配方恒以 3x3 面板展示
  return { ok: true, recipe: { kind: 'crafting', gridSize: 3, label: 'Crafting', slots } }
}

/** 熔炉/高炉/烟熏配方的燃料槽：展示合成燃料组（游戏内燃料数据不在配方 JSON 中） */
const FUEL_TAG_SLOT: RecipeSlot = { id: 'minecraft:fuel', count: 1, isTag: true }

/** 熔炼类（四种烹饪变体共用 cooking.* 槽位）与切石配方的通用解析 */
function parseWithIngredient(
  raw: Record<string, unknown>,
  info: { kind: ParsedRecipe['kind']; label: string; container?: string; fuel?: boolean },
  ingredientKey: SlotKey,
  resultKey: SlotKey,
  fallbackCount?: unknown,
): ParseResult {
  const ingredient = parseItemRef(raw.ingredient)
  if (ingredient === null) return fail('缺少 ingredient 字段')
  if (typeof ingredient === 'string') return fail(`ingredient：${ingredient}`)

  const result = parseResultSlot(raw, fallbackCount)
  if (typeof result === 'string') return fail(result)

  return {
    ok: true,
    recipe: {
      kind: info.kind,
      label: info.label,
      containerKey: info.container,
      slots: {
        [ingredientKey]: ingredient,
        // 营火烹饪不消耗燃料，燃料槽仅熔炉/高炉/烟熏有
        ...(info.fuel ? { 'cooking.fuel': FUEL_TAG_SLOT } : {}),
        [resultKey]: result,
      },
    },
  }
}

function parseSmithing(raw: Record<string, unknown>, label: string): ParseResult {
  const slots: Partial<Record<SlotKey, RecipeSlot>> = {}
  for (const field of ['template', 'base', 'addition'] as const) {
    const slot = parseItemRef(raw[field])
    if (slot === null) return fail(`smithing 配方缺少 ${field} 字段`)
    if (typeof slot === 'string') return fail(`${field}：${slot}`)
    slots[`smithing.${field}` as SlotKey] = slot
  }

  // smithing_trim 没有产物字段（纹饰保留基物品），产物槽回退用 base 展示
  const result = raw.result === undefined ? slots['smithing.base'] : parseResultSlot(raw)
  if (typeof result === 'string') return fail(result)
  if (!result) return fail('smithing 配方缺少 result 字段')
  slots['smithing.result'] = result

  return { ok: true, recipe: { kind: 'smithing', label, slots } }
}

/** 字段式配方（transmute/dye/imbue 与 crafting_special_*）：字段顺序映射无序槽位 */
function parseFieldRecipe(
  raw: Record<string, unknown>,
  def: { label: string; fields: string[]; resultFallbackId?: string },
): ParseResult {
  const slots: Partial<Record<SlotKey, RecipeSlot>> = {}
  let i = 0
  for (const field of def.fields) {
    const slot = parseItemRef(raw[field])
    if (typeof slot === 'string') return fail(`${field}：${slot}`)
    if (!slot) continue
    // transmute 的 material_count 指定材料耗量（如染色潜影盒）
    if (field === 'material' && typeof raw.material_count === 'number' && raw.material_count >= 1) {
      slot.count = Math.floor(raw.material_count)
    }
    slots[`crafting.${SHAPELESS_ORDER[i++]}` as SlotKey] = slot
  }

  let result = parseResultSlot(raw)
  if (typeof result === 'string') {
    // 产物为空对象（mapextending / map_cloning）时回退：显式指定 id → material → input
    if (def.resultFallbackId) {
      result = { id: def.resultFallbackId, count: 1 }
    } else {
      const ref = parseItemRef(raw.material) ?? parseItemRef(raw.input)
      if (ref && typeof ref !== 'string') result = ref
    }
    // repairitem 等全动态配方：JSON 无任何字段，展示空合成面板 + 类型徽章
    if (typeof result === 'string' && def.fields.length === 0) {
      return { ok: true, recipe: { kind: 'crafting', gridSize: 3, label: def.label, slots } }
    }
  }
  if (typeof result === 'string') return fail(result)
  slots['crafting.result'] = result
  return { ok: true, recipe: { kind: 'crafting', gridSize: 3, label: def.label, slots } }
}

/** 饰纹陶罐：front/left/right/back 四个装饰槽呈菱形排布（2/4/6/8） */
function parseDecoratedPot(raw: Record<string, unknown>): ParseResult {
  const POSITIONS = { front: 2, left: 4, right: 6, back: 8 } as const
  const slots: Partial<Record<SlotKey, RecipeSlot>> = {}
  let filled = 0
  for (const [field, pos] of Object.entries(POSITIONS)) {
    const slot = parseItemRef(raw[field])
    if (typeof slot === 'string') return fail(`${field}：${slot}`)
    if (!slot) continue
    slots[`crafting.${pos}` as SlotKey] = slot
    filled++
  }
  if (filled === 0) return fail('crafting_decorated_pot 缺少 front/left/right/back 字段')

  const result = parseResultSlot(raw)
  if (typeof result === 'string') return fail(result)
  slots['crafting.result'] = result
  return { ok: true, recipe: { kind: 'crafting', gridSize: 3, label: 'Decorated Pot', slots } }
}

/** 药水栈的显示名语言键：带 potion_contents 组件时生成 item.minecraft.<药水>.effect.<效果> */
function potionNameKey(stack: unknown, itemId: string): string | undefined {
  if (typeof stack !== 'object' || stack === null) return undefined
  const obj = stack as Record<string, unknown>
  const components =
    typeof obj.components === 'object' && obj.components !== null
      ? (obj.components as Record<string, unknown>)
      : undefined
  const contents =
    typeof obj.potion_contents === 'object' && obj.potion_contents !== null
      ? obj.potion_contents
      : components?.['minecraft:potion_contents']
  if (typeof contents !== 'object' || contents === null) return undefined
  const c = contents as Record<string, unknown>
  const effect =
    typeof c.potion === 'string' ? c.potion : typeof c.potions === 'string' ? c.potions : undefined
  if (!effect) return undefined
  const kind = normalizeId(itemId).replace(/^minecraft:/, '')
  return `item.minecraft.${kind}.effect.${effect.replace(/^minecraft:/, '')}`
}

/** 酿造：input（药水瓶）+ reagent（酿造原料）→ output，对齐酿造台槽位语义 */
function parseBrewing(raw: Record<string, unknown>): ParseResult {
  const input = parseItemRef(raw.input)
  if (input === null) return fail('brewing 配方缺少 input 字段')
  if (typeof input === 'string') return fail(`input：${input}`)
  const reagent = parseItemRef(raw.reagent)
  if (reagent === null) return fail('brewing 配方缺少 reagent 字段')
  if (typeof reagent === 'string') return fail(`reagent：${reagent}`)
  const output = parseItemRef(raw.output)
  if (output === null) return fail('brewing 配方缺少 output 字段')
  if (typeof output === 'string') return fail(`output：${output}`)
  input.nameKey = potionNameKey(raw.input, input.id)
  output.nameKey = potionNameKey(raw.output, output.id)

  return {
    ok: true,
    recipe: {
      kind: 'brewing',
      label: 'Brewing',
      slots: { 'brewing.input': input, 'brewing.reagent': reagent, 'brewing.output': output },
    },
  }
}
