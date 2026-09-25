/**
 * 原版配方数据（misode/mcmeta summary 分支聚合单文件）。
 * 由 scripts/generate-vanilla-recipes.mjs 从 mcmeta 生成入库，运行时零网络请求。
 * 数据源版本见文件名，与 vite.config.ts 的 MC_VERSION 保持一致。
 */
import recipesRaw from './generated/vanilla-recipes-26.3.json?raw'
import type { VanillaRecipeJson } from '../components/crafting'

/** 单条原版配方：注册 id（如 "acacia_boat"、"brewing/xxx"）+ 配方 JSON */
export interface VanillaRecipeEntry {
  id: string
  recipe: VanillaRecipeJson
}

const record = JSON.parse(recipesRaw) as Record<string, VanillaRecipeJson>

/** 全部原版配方，保持 mcmeta 生成时的字典序 */
export const VANILLA_RECIPES: VanillaRecipeEntry[] = Object.entries(record).map(([id, recipe]) => ({
  id,
  recipe,
}))
