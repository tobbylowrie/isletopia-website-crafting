// 下载 GNU Unifont 像素字体（Minecraft 1.20.3+ 客户端用于 CJK 等非拉丁字形的官方字体）入库：
//   src/assets/fonts/unifont.otf
// 来源 unifoundry.com 官方构建（仅提供 OTF，无 woff2）；已存在则跳过。
// 重新下载：node scripts/fetch-unifont.mjs [版本号]
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const UNIFONT_VERSION = process.argv[2] ?? '18.0.01'
const url = `https://unifoundry.com/pub/unifont/unifont-${UNIFONT_VERSION}/font-builds/unifont-${UNIFONT_VERSION}.otf`
const outFile = path.resolve('src/assets/fonts/unifont.otf')

try {
  await fs.access(outFile)
  console.log(`已存在 ${outFile}，跳过下载（如需重新下载请先删除）`)
  process.exit(0)
} catch {
  // 不存在，继续下载
}

console.log(`拉取 ${url}`)
async function download() {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    console.warn(`fetch 失败（${err.message}），改用 curl`)
    return await new Promise((resolve, reject) => {
      execFile(
        'curl',
        ['-fsSL', '--max-time', '300', '-o', '-', url],
        { maxBuffer: 64 * 1024 * 1024, encoding: 'buffer' },
        (error, stdout) => (error ? reject(error) : resolve(stdout)),
      )
    })
  }
}

try {
  const body = await download()
  // OTF 魔数：OTTO
  if (body.length < 100000 || body.subarray(0, 4).toString('latin1') !== 'OTTO') {
    throw new Error(`内容不是有效的 OTF 字体（${body.length} 字节）`)
  }
  await fs.writeFile(outFile, body)
  console.log(`已生成 ${outFile}（${(body.length / 1024 / 1024).toFixed(1)} MB）`)
} catch (err) {
  console.error(`下载失败: ${err.message}`)
  process.exit(1)
}
