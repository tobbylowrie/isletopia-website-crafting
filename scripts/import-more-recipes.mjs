// 将 Isletopia 服务器 MoreRecipe.java 中注册的自定义配方转换为原版配方 JSON,
// 合并写入 src/data/custom-recipes.json(保留已有条目)。运行:node scripts/import-more-recipes.mjs
import fs from 'node:fs'

const file = 'src/data/custom-recipes.json'
const existing = JSON.parse(fs.readFileSync(file, 'utf8'))

const shaped = (resultId, pattern, key, count) => ({
  type: 'minecraft:crafting_shaped',
  pattern,
  key,
  result: { id: resultId, ...(count > 1 ? { count } : {}) },
})
const shapeless = (resultId, ingredients) => ({
  type: 'minecraft:crafting_shapeless',
  ingredients,
  result: { id: resultId },
})
const cooking = (type, resultId, ingredient, exp, time) => ({
  type: `minecraft:${type}`,
  ingredient,
  result: { id: resultId },
  experience: exp,
  cookingtime: time,
})
// 3x3 环形排布:外圈 ring、中心 center
const ringRecipe = (resultId, ring, center) =>
  shaped(resultId, ['RRR', 'RCR', 'RRR'], { R: `minecraft:${ring}`, C: `minecraft:${center}` })

const added = {}

// 海洋之心:营火烤鸡蛋
added['custom/heart_of_the_sea_from_egg'] = cooking('campfire_cooking', 'minecraft:heart_of_the_sea', 'minecraft:egg', 0, 600)

// 方解石:熔炉烧闪长岩
added['custom/calcite_from_diorite'] = cooking('smelting', 'minecraft:calcite', 'minecraft:diorite', 1.0, 150)

// 凝灰岩:高炉烧玄武岩
added['custom/tuff_from_basalt'] = cooking('blasting', 'minecraft:tuff', 'minecraft:basalt', 1.0, 150)

// 远古残骸:8 骨块 + 下界合金块
added['custom/ancient_debris'] = ringRecipe('minecraft:ancient_debris', 'bone_block', 'netherite_block')

// 枯萎灌木:烟熏 6 种树苗
for (const sapling of ['oak_sapling', 'spruce_sapling', 'birch_sapling', 'jungle_sapling', 'acacia_sapling', 'dark_oak_sapling']) {
  added[`custom/dead_bush_from_${sapling}`] = cooking('smoking', 'minecraft:dead_bush', `minecraft:${sapling}`, 0, 150)
}

// 蜘蛛丝:9 线
added['custom/cobweb'] = shaped('minecraft:cobweb', ['SSS', 'SSS', 'SSS'], { S: 'minecraft:string' })

// 末地石:石头 + 末影珍珠
added['custom/end_stone'] = shapeless('minecraft:end_stone', ['minecraft:stone', 'minecraft:ender_pearl'])

// 深板岩:石砖 + 煤炭
added['custom/deepslate'] = shapeless('minecraft:deepslate', ['minecraft:stone_bricks', 'minecraft:coal'])

// 钻石:营火烤毒马铃薯
added['custom/diamond_from_poisonous_potato'] = cooking('campfire_cooking', 'minecraft:diamond', 'minecraft:poisonous_potato', 1.0, 1200)

// 灵魂土:烟熏泥土
added['custom/soul_soil_from_dirt'] = cooking('smoking', 'minecraft:soul_soil', 'minecraft:dirt', 1.0, 150)

// 砂砾:高炉烧圆石
added['custom/gravel_from_cobblestone'] = cooking('blasting', 'minecraft:gravel', 'minecraft:cobblestone', 1.0, 150)

// 石英:熔炉烧玻璃
added['custom/quartz_from_glass'] = cooking('smelting', 'minecraft:quartz', 'minecraft:glass', 1.0, 150)

// 沙子:高炉烧砂砾
added['custom/sand_from_gravel'] = cooking('blasting', 'minecraft:sand', 'minecraft:gravel', 1.0, 150)

// 下界岩:烟熏圆石
added['custom/netherrack_from_cobblestone'] = cooking('smoking', 'minecraft:netherrack', 'minecraft:cobblestone', 1.0, 150)

// 粘土球 ×32:8 泥土 + 粘液球
added['custom/clay_ball_x32'] = shaped('minecraft:clay_ball', ['DDD', 'DSD', 'DDD'], { D: 'minecraft:dirt', S: 'minecraft:slime_ball' }, 32)

// 烈焰粉:高炉烧红石
added['custom/blaze_powder_from_redstone'] = cooking('blasting', 'minecraft:blaze_powder', 'minecraft:redstone', 1.0, 150)

// 烈焰棒:2 烈焰粉
added['custom/blaze_rod'] = shapeless('minecraft:blaze_rod', ['minecraft:blaze_powder', 'minecraft:blaze_powder'])

// 树苗转换(两两循环)
const saplingCycle = [
  ['oak_sapling', 'dark_oak_sapling'],
  ['spruce_sapling', 'oak_sapling'],
  ['birch_sapling', 'spruce_sapling'],
  ['jungle_sapling', 'birch_sapling'],
  ['acacia_sapling', 'jungle_sapling'],
  ['dark_oak_sapling', 'acacia_sapling'],
]
for (const [target, source] of saplingCycle) {
  added[`custom/${target}_from_${source}`] = shapeless(`minecraft:${target}`, [`minecraft:${source}`, `minecraft:${source}`])
}

// 矿石复原:外圈矿物材料 + 中心石头/深板岩/下界岩/黑石
const ores = [
  ['redstone_ore', 'redstone_block', 'stone'],
  ['coal_ore', 'coal', 'stone'],
  ['iron_ore', 'iron_ingot', 'stone'],
  ['gold_ore', 'gold_ingot', 'stone'],
  ['nether_gold_ore', 'gold_ingot', 'netherrack'],
  ['gilded_blackstone', 'gold_ingot', 'blackstone'],
  ['lapis_ore', 'lapis_block', 'stone'],
  ['diamond_ore', 'diamond', 'stone'],
  ['emerald_ore', 'emerald', 'stone'],
  ['nether_quartz_ore', 'quartz', 'netherrack'],
  ['copper_ore', 'copper_ingot', 'stone'],
  ['deepslate_coal_ore', 'coal', 'deepslate'],
  ['deepslate_iron_ore', 'iron_ingot', 'deepslate'],
  ['deepslate_copper_ore', 'copper_ingot', 'deepslate'],
  ['deepslate_gold_ore', 'gold_ingot', 'deepslate'],
  ['deepslate_redstone_ore', 'redstone_block', 'deepslate'],
  ['deepslate_emerald_ore', 'emerald', 'deepslate'],
  ['deepslate_lapis_ore', 'lapis_block', 'deepslate'],
  ['deepslate_diamond_ore', 'diamond', 'deepslate'],
]
for (const [result, ring, center] of ores) {
  added[`custom/${result}`] = ringRecipe(`minecraft:${result}`, ring, center)
}

// 染色锭:8 染料 + 中心 6 种锭/砖材料
const dyeTargets = [
  ['iron_ingot', 'white_dye'],
  ['gold_ingot', 'yellow_dye'],
  ['netherite_ingot', 'black_dye'],
  ['brick', 'red_dye'],
  ['nether_brick', 'brown_dye'],
  ['copper_ingot', 'orange_dye'],
]
const dyeCenters = ['gold_ingot', 'iron_ingot', 'netherite_ingot', 'brick', 'nether_brick', 'copper_ingot']
for (const [result, dye] of dyeTargets) {
  for (const center of dyeCenters) {
    added[`custom/${result}_dye_${center}`] = shaped(`minecraft:${result}`, ['DDD', 'MDM', 'DDD'], {
      D: `minecraft:${dye}`,
      M: `minecraft:${center}`,
    })
  }
}

const merged = { ...existing, ...added }
fs.writeFileSync(file, JSON.stringify(merged, null, 2) + '\n')
console.log(`已合并 ${Object.keys(added).length} 条自定义配方,总计 ${Object.keys(merged).length} 条`)
