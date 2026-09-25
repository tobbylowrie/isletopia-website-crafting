// 生成合成燃料物品组：26.3 原版燃料烧炼数据硬编码于游戏代码（FuelValues），
// 无 #minecraft:fuel 物品 tag，也无数据文件。本脚本参考 MC Wiki 燃料表，
// 从官方物品 tag 组合可燃木质物/煤类/船类，并补充 tag 外的已知燃料，
// 生成 src/data/generated/vanilla-fuels-<版本>.json，供熔炉面板燃料槽轮播展示。
// 重新生成：node scripts/generate-vanilla-fuels.mjs [版本]
import fs from 'node:fs/promises'
import path from 'node:path'

const MC_VERSION = process.argv[2] ?? '26.3'
const tagsFile = path.resolve(`src/data/generated/vanilla-tags-${MC_VERSION}.json`)
const outFile = path.resolve(`src/data/generated/vanilla-fuels-${MC_VERSION}.json`)

// 参与组合的官方物品 tag（均含于 vanilla-tags-<版本>.json）
const FUEL_TAGS = [
  'minecraft:coals',
  'minecraft:logs_that_burn',
  'minecraft:planks',
  'minecraft:wooden_stairs',
  'minecraft:wooden_slabs',
  'minecraft:wooden_fences',
  'minecraft:wooden_doors',
  'minecraft:wooden_trapdoors',
  'minecraft:wooden_pressure_plates',
  'minecraft:wooden_buttons',
  'minecraft:boats',
  'minecraft:chest_boats',
  'minecraft:bamboo_blocks',
]

// tag 之外的燃料补充项（参考 MC Wiki 燃料表）
const FUEL_EXTRAS = [
  'minecraft:lava_bucket',
  'minecraft:coal_block',
  'minecraft:dried_kelp_block',
  'minecraft:blaze_rod',
  'minecraft:stick',
  'minecraft:bamboo',
  'minecraft:ladder',
  'minecraft:chest',
  'minecraft:trapped_chest',
  'minecraft:barrel',
  'minecraft:composter',
  'minecraft:bookshelf',
  'minecraft:chiseled_bookshelf',
  'minecraft:jukebox',
  'minecraft:note_block',
  'minecraft:crafting_table',
  'minecraft:cartography_table',
  'minecraft:fletching_table',
  'minecraft:smithing_table',
  'minecraft:loom',
  'minecraft:lectern',
  'minecraft:scaffolding',
  'minecraft:bow',
  'minecraft:crossbow',
  'minecraft:wooden_pickaxe',
  'minecraft:wooden_axe',
  'minecraft:wooden_shovel',
  'minecraft:wooden_hoe',
  'minecraft:wooden_sword',
]

const tags = JSON.parse(await fs.readFile(tagsFile, 'utf8'))
const missingTags = FUEL_TAGS.filter((key) => !Array.isArray(tags[key]))
if (missingTags.length > 0) {
  console.error(`tag 数据缺失: ${missingTags.join(', ')}，中止写入`)
  process.exit(1)
}

const fuels = [...new Set([...FUEL_TAGS.flatMap((key) => tags[key]), ...FUEL_EXTRAS])].sort()

await fs.writeFile(outFile, `${JSON.stringify(fuels)}\n`)
console.log(`已生成 ${outFile}（${fuels.length} 个燃料物品）`)
