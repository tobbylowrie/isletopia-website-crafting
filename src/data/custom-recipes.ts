/**
 * 自定义配方装载：数据文件 custom-recipes.json 与原版配方文件（vanilla-recipes-26.3.json）同构，
 * 按注册 id 键控原版配方 JSON；批量导入直接往该 JSON 追加键值对即可。
 */
import customRaw from './custom-recipes.json?raw'
import type { VanillaRecipeJson } from '../components/crafting'

/** 单条自定义配方：注册 id（custom/ 前缀）+ 原版配方 JSON */
export interface CustomRecipeEntry {
  id: string
  recipe: VanillaRecipeJson
}

const record = JSON.parse(customRaw) as Record<string, VanillaRecipeJson>

/** 全部自定义配方，保持文件中的书写顺序 */
export const CUSTOM_RECIPES: CustomRecipeEntry[] = Object.entries(record).map(([id, recipe]) => ({
  id,
  recipe,
}))
