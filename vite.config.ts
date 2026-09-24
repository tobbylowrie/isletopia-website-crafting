import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const require = createRequire(import.meta.url)
// MC 版本唯一出处：manifest 与贴图均取自 minecraft-textures 包
const MC_VERSION = '26.3'
const mcTexturesPkg = path.dirname(require.resolve('minecraft-textures/package.json'))
const mcTextureAssets = path.join(mcTexturesPkg, 'dist', 'textures', 'assets')
const manifest = JSON.parse(
  readFileSync(path.join(mcTexturesPkg, 'dist', 'textures', 'manifest', `${MC_VERSION}.json`), 'utf8'),
) as { items: { id: string; readable: string; texture: string }[] }
// 只打包 manifest 引用到的贴图（内容哈希去重），包内其余版本资产不进构建产物
const textureHashes = [...new Set(manifest.items.map((item) => item.texture))]

/**
 * 虚拟模块 virtual:mc-textures：
 *   - items: manifest 物品元数据（id / readable / texture 哈希文件名）
 *   - urlLoaders: 哈希文件名 -> 异步解析 Vite 资产 URL
 */
function mcTextures(): Plugin {
  const virtualId = 'virtual:mc-textures'
  const resolvedId = '\0' + virtualId
  return {
    name: 'mc-textures',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id !== resolvedId) return
      const loaders = textureHashes
        .map(
          (hash) =>
            `  ${JSON.stringify(hash)}: () => import('@mc-textures/${hash}?url').then((m) => m.default),`,
        )
        .join('\n')
      return [
        `const items = ${JSON.stringify(manifest.items)}`,
        `const urlLoaders = {\n${loaders}\n}`,
        'export { items, urlLoaders }',
      ].join('\n')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    mcTextures(),
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
