// 从 misode/mcmeta 拉取指定版本的原版物品 tag（summary 分支单文件数据），
// 归一化命名空间并展开嵌套 #tag 引用，生成扁平的成员物品表入库：
//   src/data/generated/vanilla-tags-<版本>.json
// 生成结果提交到仓库，组件运行时零网络请求。重新生成：node scripts/generate-vanilla-tags.mjs [版本]
import fs from 'node:fs/promises'
import path from 'node:path'

const MC_VERSION = process.argv[2] ?? '26.3'
const url = `https://raw.githubusercontent.com/misode/mcmeta/${MC_VERSION}-summary/data/tag/item/data.min.json`
const outFile = path.resolve(`src/data/generated/vanilla-tags-${MC_VERSION}.json`)

console.log(`拉取 ${url}`)
const res = await fetch(url)
if (!res.ok) {
  console.error(`下载失败: HTTP ${res.status}`)
  process.exit(1)
}
const raw = await res.json()

// 归一化：tag 名补 minecraft: 前缀；值支持 string / {id} 两种形态
const graph = {}
for (const [name, entry] of Object.entries(raw)) {
  graph[`minecraft:${name}`] = ((entry?.values ?? []))
    .map((v) => (typeof v === 'string' ? v : typeof v?.id === 'string' ? v.id : null))
    .filter(Boolean)
    .map((v) => (v.startsWith('#') && !v.includes(':') ? `#minecraft:${v.slice(1)}` : v))
}

// DFS 展开嵌套 #tag 引用（带环检测），得到扁平成员物品列表
const resolved = {}
const expand = (id, stack = new Set()) => {
  const memo = resolved[id]
  if (memo) return memo
  if (stack.has(id)) return []
  stack.add(id)
  const out = []
  for (const value of graph[id] ?? []) {
    if (value.startsWith('#')) out.push(...expand(value.slice(1), new Set(stack)))
    else out.push(value)
  }
  stack.delete(id)
  resolved[id] = [...new Set(out)]
  return resolved[id]
}
for (const id of Object.keys(graph)) expand(id)

await fs.mkdir(path.dirname(outFile), { recursive: true })
await fs.writeFile(outFile, `${JSON.stringify(resolved)}\n`)
console.log(`已生成 ${outFile}（${Object.keys(resolved).length} 个 tag）`)
