/**
 * 官方简体语言字典（Minecraft 客户端 assets/minecraft/lang/zh_cn.json）。
 * 由 scripts/generate-vanilla-lang.mjs 从 misode/mcmeta 生成入库，运行时零网络请求。
 * 数据源版本见文件名，与 vite.config.ts 的 MC_VERSION 保持一致。
 * 保留键范围：item.minecraft.* / block.minecraft.*（不含 banner 图案）/ container.*。
 */
import langRaw from '../../data/generated/vanilla-lang-zh_cn-26.3.json?raw'

const lang = JSON.parse(langRaw) as Record<string, string>

/** 去掉命名空间："minecraft:diamond" -> "diamond"（本地实现，避免与 icons.ts 循环依赖） */
function strip(id: string): string {
  const i = id.indexOf(':')
  return i === -1 ? id : id.slice(i + 1)
}

/** 物品 id -> 官方中文名（依次查组件化名称键 .new、物品键、方块键）；未知物品返回 undefined */
export function zhItemName(itemId: string): string | undefined {
  const name = strip(itemId)
  return (
    lang[`item.minecraft.${name}.new`] ??
    lang[`item.minecraft.${name}`] ??
    lang[`block.minecraft.${name}`]
  )
}

/** 直接按语言键取官方文案（如药水 "item.minecraft.potion.effect.strength"、GUI "container.furnace"） */
export function zhLangText(langKey: string): string | undefined {
  return lang[langKey]
}

/**
 * 按语言键取显示名；long_/strong_ 药水变体回退到基础效果键。
 * 官方字典只收录基础效果键（如 effect.healing），游戏内延长/强化变体与基础效果同名。
 */
export function zhDisplayName(langKey: string): string | undefined {
  const text = lang[langKey]
  if (text !== undefined) return text
  const baseKey = langKey.replace(
    /^(item\.minecraft\.(?:potion|splash_potion|lingering_potion|tipped_arrow)\.effect\.)(?:long_|strong_)(.+)$/,
    '$1$2',
  )
  return baseKey === langKey ? undefined : lang[baseKey]
}
