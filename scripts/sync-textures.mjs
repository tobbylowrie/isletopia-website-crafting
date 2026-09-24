// 从 minecraft-textures 包同步 manifest 引用的物品贴图到 public/textures/。
// 贴图文件名是内容哈希，与 manifest 一一对应；package.json 的 postinstall 会运行本脚本，
// 因此 public/textures 不入库（见 .gitignore），克隆后 pnpm install 即可还原。
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const MC_VERSION = '1.21.4'
const require = createRequire(import.meta.url)

const pkgDir = path.dirname(require.resolve('minecraft-textures/package.json'))
const manifest = require(`minecraft-textures/manifest/${MC_VERSION}.json`)
const srcDir = path.join(pkgDir, 'dist', 'textures', 'assets')
const outDir = path.join(process.cwd(), 'public', 'textures')

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

let copied = 0
for (const item of manifest.items) {
  const from = path.join(srcDir, item.texture)
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(outDir, item.texture))
    copied++
  } else {
    console.warn(`[sync-textures] 包内缺少贴图: ${item.id} -> ${item.texture}`)
  }
}

console.log(`[sync-textures] 已同步 ${copied}/${manifest.items.length} 个贴图 (MC ${MC_VERSION})`)
