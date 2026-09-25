// 从 misode/mcmeta 拉取指定版本的官方简体中文语言字典（客户端 jar 内 assets/minecraft/lang/zh_cn.json，
// assets 分支单文件数据），过滤保留本项目用到的键前缀后生成入库：
//   src/data/generated/vanilla-lang-zh_cn-<版本>.json
// 保留范围：item.minecraft.*（含药水 effect 键）、block.minecraft.*（剔除 banner 图案键）、
// container.*（GUI 面板标签）。生成结果提交到仓库，组件运行时零网络请求。
// 重新生成：node scripts/generate-vanilla-lang.mjs [版本]
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const MC_VERSION = process.argv[2] ?? '26.3'
const url = `https://raw.githubusercontent.com/misode/mcmeta/${MC_VERSION}-assets/assets/minecraft/lang/zh_cn.json`
const outFile = path.resolve(`src/data/generated/vanilla-lang-zh_cn-${MC_VERSION}.json`)

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

const keep = (key) =>
  key.startsWith('item.minecraft.') ||
  (key.startsWith('block.minecraft.') && !key.startsWith('block.minecraft.banner.')) ||
  key.startsWith('container.')

const filtered = {}
let kept = 0
for (const [key, value] of Object.entries(raw)) {
  if (keep(key) && typeof value === 'string') {
    filtered[key] = value
    kept++
  }
}

if (kept < 1000) {
  console.error(`保留键数量异常（${kept}），中止写入`)
  process.exit(1)
}

await fs.mkdir(path.dirname(outFile), { recursive: true })
await fs.writeFile(outFile, `${JSON.stringify(filtered, null, 1)}\n`)
console.log(`已生成 ${outFile}（原始 ${Object.keys(raw).length} 键，保留 ${kept} 键）`)
