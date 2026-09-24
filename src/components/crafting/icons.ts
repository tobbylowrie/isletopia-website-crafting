/**
 * 物品图标：来自 github.com/destruc7i0n/minecraft-textures（npm 包 minecraft-textures）。
 * 按 README 的 bundler 用法：@mc-textures 别名指向包内 dist/textures/assets，
 * import.meta.glob 让 Vite 管理全部 PNG（开发按需读取、构建时 hash 打包），
 * 贴图 URL 按需异步解析——渲染到哪个物品才解析哪张图，不经过 public/，零网络请求。
 * manifest 提供 id -> 贴图哈希文件名 与 官方英文物品名（readable）映射。
 */
import manifestRaw from 'minecraft-textures/manifest/1.21.4.json?raw'
import urlLoaders from 'virtual:mc-texture-urls'

interface ManifestItem {
  id: string
  readable: string
  texture: string
}

const manifest = JSON.parse(manifestRaw) as { items: ManifestItem[] }

/** 贴图哈希文件名 -> 异步加载其 URL；由 vite.config.ts 的 mcTextureUrls 插件按 manifest 生成 */
const loaderByFile = new Map<string, () => Promise<string>>(
  Object.entries(urlLoaders),
)

/** manifest 物品 id -> 贴图文件名（内容哈希） */
const textureById = new Map<string, string>()
const readableById = new Map<string, string>()
for (const item of manifest.items) {
  textureById.set(item.id, item.texture)
  textureById.set(stripNamespace(item.id), item.texture)
  readableById.set(item.id, item.readable)
  readableById.set(stripNamespace(item.id), item.readable)
}

/** 去掉命名空间："minecraft:diamond" -> "diamond" */
export function stripNamespace(id: string): string {
  const i = id.indexOf(':')
  return i === -1 ? id : id.slice(i + 1)
}

/** 物品 id -> 贴图 URL（按需异步解析）；未知物品（如模组物品）返回 undefined，由组件显示占位 */
export async function itemIconUrl(itemId: string): Promise<string | undefined> {
  const file = textureById.get(itemId) ?? textureById.get(stripNamespace(itemId))
  const loader = file ? loaderByFile.get(file) : undefined
  if (!loader) return undefined
  try {
    return await loader()
  } catch {
    return undefined
  }
}

/** 物品显示名：优先 manifest 官方英文名（如 "Diamond Sword"），未知 id 退化为 ID 驼峰化 */
export function prettyLabel(itemId: string): string {
  const readable = readableById.get(itemId) ?? readableById.get(stripNamespace(itemId))
  if (readable) return readable
  return stripNamespace(itemId)
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
