/**
 * 原版 data pack 配方 JSON 的宽松类型。
 * 字段兼容 1.21 前后两种写法（result.id / result.item、ingredient 字符串 / {id} / {item} 等）。
 */
export interface VanillaRecipeJson {
  type?: string
  /** crafting_shaped 的图案行，每行 ≤3 字符，空格表示空位 */
  pattern?: unknown[]
  /** pattern 字符 → 物品引用 的映射 */
  key?: Record<string, unknown>
  /** crafting_shapeless 的原料列表 */
  ingredients?: unknown
  /** 熔炼 / 切石类配方的单一原料 */
  ingredient?: unknown
  /** smithing 配方的三个输入槽 */
  template?: unknown
  base?: unknown
  addition?: unknown
  /** 产物（对象或字符串，stonecutter 支持字符串） */
  result?: unknown
  /** stonecutter 的产物数量位于配方根级 */
  count?: number
  [field: string]: unknown
}

/** 归一化后的物品槽位 */
export interface RecipeSlot {
  /** 物品或标签 id，如 "minecraft:diamond_sword"；tag 引用保留原 id */
  id: string
  count: number
  /** 引用来自 tag（无具体图标，轮播展示成员） */
  isTag?: boolean
  /** 显示名语言键覆盖（如酿造药水 "item.minecraft.potion.effect.strength"），优先于 id 推断 */
  nameKey?: string
}

/** 配方种类，决定渲染使用的面板 */
export type RecipeKind = 'crafting' | 'furnace' | 'brewing' | 'stonecutter' | 'smithing'

/**
 * 统一槽位键（沿用源项目命名）。
 * crafting 网格按 3x3 行优先编号，2x2 面板使用其中左上角的 1/2/4/5。
 */
export type SlotKey =
  | 'crafting.1'
  | 'crafting.2'
  | 'crafting.3'
  | 'crafting.4'
  | 'crafting.5'
  | 'crafting.6'
  | 'crafting.7'
  | 'crafting.8'
  | 'crafting.9'
  | 'crafting.result'
  | 'cooking.ingredient'
  | 'cooking.result'
  | 'brewing.reagent'
  | 'brewing.input'
  | 'brewing.output'
  | 'stonecutter.ingredient'
  | 'stonecutter.result'
  | 'smithing.template'
  | 'smithing.base'
  | 'smithing.addition'
  | 'smithing.result'

/** 归一化配方：统一槽位模型 */
export interface ParsedRecipe {
  kind: RecipeKind
  /** crafting 专用：shaped 图案 ≤2×2 时为 2，否则 3；shapeless 恒为 3 */
  gridSize?: 2 | 3
  /** 目录卡片类型徽章文案，如 "合成" / "熔炼" / "锻造升级" */
  label: string
  /** furnace 面板标题的容器语言键（熔炉/高炉/烟熏炉/营火），其它面板忽略 */
  containerKey?: string
  slots: Partial<Record<SlotKey, RecipeSlot>>
}

export type ParseResult =
  | { ok: true; recipe: ParsedRecipe }
  | { ok: false; message: string }
