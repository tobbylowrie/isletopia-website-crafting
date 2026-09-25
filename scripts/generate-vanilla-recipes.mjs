// 从 misode/mcmeta 拉取指定版本的原版配方（summary 分支聚合单文件，
// 含 crafting / 烹饪 / 切石 / 锻造 / 酿造全部注册项），生成配方表入库：
//   src/data/generated/vanilla-recipes-<版本>.json
// 生成结果提交到仓库，组件运行时零网络请求。重新生成：node scripts/generate-vanilla-recipes.mjs [版本]
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const MC_VERSION = process.argv[2] ?? '26.3'
const url = `https://raw.githubusercontent.com/misode/mcmeta/${MC_VERSION}-summary/data/recipe/data.min.json`
const outFile = path.resolve(`src/data/generated/vanilla-recipes-${MC_VERSION}.json`)

console.log(`拉取 ${url}`)

// 部分环境 Node fetch（undici）无法直连 GitHub，回退用 curl 拉取
async function fetchJson() {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.arrayBuffer()
  } catch (err) {
    console.warn(`fetch 失败（${err.message}），改用 curl`)
    return await new Promise((resolve, reject) => {
      execFile(
        'curl',
        ['-fsSL', '--max-time', '120', url],
        { maxBuffer: 64 * 1024 * 1024 },
        (error, stdout) => (error ? reject(error) : resolve(stdout)),
      )
    }).then((stdout) => {
      if (typeof stdout !== 'string') throw new Error('curl 返回非文本')
      return stdout
    })
  }
}

let rawBuffer
try {
  rawBuffer = await fetchJson()
} catch (err) {
  console.error(`下载失败: ${err.message}`)
  process.exit(1)
}
let raw
try {
  raw = JSON.parse(typeof rawBuffer === 'string' ? rawBuffer : Buffer.from(rawBuffer).toString('utf8'))
} catch {
  console.error('下载内容不是有效 JSON，中止写入')
  process.exit(1)
}

const count = Object.keys(raw).length
if (count < 1000) {
  console.error(`配方数量异常（${count}），中止写入`)
  process.exit(1)
}

await fs.mkdir(path.dirname(outFile), { recursive: true })
await fs.writeFile(outFile, `${JSON.stringify(raw)}\n`)
console.log(`已生成 ${outFile}（${count} 个配方）`)
