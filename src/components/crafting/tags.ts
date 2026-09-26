/**
 * 原版物品 tag 数据（嵌套 #tag 引用已展开为扁平成员列表）。
 * 由 scripts/generate-vanilla-tags.mjs 从 misode/mcmeta 生成入库，运行时零网络请求。
 * 数据源版本见文件名，与 vite.config.ts 的 MC_VERSION 保持一致。
 */
import tagsRaw from '../../data/generated/vanilla-tags-26.3.json?raw'
import fuelsRaw from '../../data/generated/vanilla-fuels-26.3.json?raw'
import { stripNamespace } from './icons'

const tags = JSON.parse(tagsRaw) as Record<string, string[]>

// 26.3 原版燃料数据硬编码于游戏代码（无 #minecraft:fuel 物品 tag），
// 由 scripts/generate-vanilla-fuels.mjs 组合官方 tag 与 Wiki 补充项生成合成燃料组
tags['minecraft:fuel'] = JSON.parse(fuelsRaw) as string[]

// 自定义配方（custom-recipes.json）引用的非原版 tag：染色转化配方的六种可选材料
tags['custom:ingots_and_bricks'] = [
  'minecraft:iron_ingot',
  'minecraft:gold_ingot',
  'minecraft:netherite_ingot',
  'minecraft:brick',
  'minecraft:nether_brick',
  'minecraft:copper_ingot',
]

/** 解析 tag 的成员物品列表；未知 tag 返回 undefined */
export function tagMembers(tagId: string): string[] | undefined {
  return tags[tagId] ?? tags[stripNamespace(tagId)]
}

/** tag 显示名："minecraft:planks" -> "Planks" */
export function prettyTagLabel(tagId: string): string {
  return stripNamespace(tagId)
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
