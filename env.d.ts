/// <reference types="vite/client" />

/** 由 vite.config.ts 的 mcTextureUrls 插件生成的虚拟模块：贴图哈希文件名 -> 异步 URL 加载器 */
declare module 'virtual:mc-texture-urls' {
  const urlLoaders: Record<string, () => Promise<string>>
  export default urlLoaders
}
