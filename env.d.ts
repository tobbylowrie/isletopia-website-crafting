/// <reference types="vite/client" />

/** 由 vite.config.ts 的 mcTextures 插件生成的虚拟模块（数据来自 minecraft-textures 包 manifest） */
declare module 'virtual:mc-textures' {
  export interface McManifestItem {
    id: string
    readable: string
    texture: string
  }
  const items: McManifestItem[]
  const urlLoaders: Record<string, () => Promise<string>>
  export { items, urlLoaders }
}
