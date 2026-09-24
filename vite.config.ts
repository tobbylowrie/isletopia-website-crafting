import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const require = createRequire(import.meta.url)
// MC 版本需与 src/components/crafting/icons.ts 的 manifest 导入保持一致
const MC_VERSION = '1.21.4'
// minecraft-textures 包目录与贴图目录（内容哈希文件名；pnpm 布局下指向真实包路径）
const mcTexturesPkg = path.dirname(require.resolve('minecraft-textures/package.json'))
const mcTextureAssets = path.join(mcTexturesPkg, 'dist', 'textures', 'assets')
// 只打包 manifest 引用到的贴图，包内其余版本的资产不进构建产物
const mcTextureHashes: string[] = [
  ...new Set(
    (
      JSON.parse(
        readFileSync(path.join(mcTexturesPkg, 'dist', 'textures', 'manifest', `${MC_VERSION}.json`), 'utf8'),
      ) as { items: { texture: string }[] }
    ).items.map((item) => item.texture),
  ),
]

/** 虚拟模块 virtual:mc-texture-urls：贴图哈希文件名 -> 异步加载其 URL 的映射 */
function mcTextureUrls(): Plugin {
  const virtualId = 'virtual:mc-texture-urls'
  const resolvedId = '\0' + virtualId
  return {
    name: 'mc-texture-urls',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id !== resolvedId) return
      const entries = mcTextureHashes
        .map(
          (hash) =>
            `  ${JSON.stringify(hash)}: () => import('@mc-textures/${hash}?url').then((m) => m.default),`,
        )
        .join('\n')
      return `export default {\n${entries}\n}\n`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    mcTextureUrls(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@mc-textures': mcTextureAssets,
    },
  },
  build: {
    // MC 物品贴图保持为独立 PNG（按需异步加载），不以 base64 内联进 JS chunk
    assetsInlineLimit: (filePath) => !filePath.replaceAll('\\', '/').includes('minecraft-textures'),
  },
})
