/**
 * 原版 data pack 配方 JSON 的宽松类型。
 * 字段兼容 1.21 前后两种写法（result.id / result.item 等）。
 */
export interface VanillaRecipeJson {
  type?: string
  /** crafting_shaped 的图案行，每行 ≤3 字符，空格表示空位 */
  pattern?: unknown[]
  /** pattern 字符 → 物品引用 的映射 */
  key?: Record<string, unknown>
  /** crafting_shapeless 的原料列表 */
  ingredients?: unknown
  result?: { id?: string; item?: string; count?: number }
  [field: string]: unknown
}

/** 归一化后的物品槽位 */
export interface RecipeSlot {
  /** 物品或标签 id，如 "minecraft:diamond_sword"；tag 引用保留原 id */
  id: string
  count: number
  /** 引用来自 tag（无具体图标，占位显示） */
  isTag?: boolean
}

/** 归一化配方：9 格网格（行优先，左上对齐）+ 产物 */
export interface ParsedRecipe {
  kind: 'shaped' | 'shapeless'
  grid: (RecipeSlot | null)[]
  result: RecipeSlot
}

export type ParseResult =
  | { ok: true; recipe: ParsedRecipe }
  | { ok: false; message: string }
