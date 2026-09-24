<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RecipeSlot } from './types'
import { DEFAULT_ICON_BASE, itemIconUrl, prettyLabel, stripNamespace } from './icons'

const props = defineProps<{
  /** 物品格数据，null 不渲染 */
  item: RecipeSlot | null
  /** 相对 1x 贴图的缩放倍数（物品原始 16x16） */
  scale?: number
  /** 贴图 base（以物品目录结尾），可切换版本或自建源 */
  iconBase?: string
  /** 按物品 id 覆盖图片 URL */
  icons?: Record<string, string>
  /** 按物品 id 覆盖显示名 */
  labels?: Record<string, string>
}>()

const s = computed(() => props.scale ?? 1)

const failed = ref(false)
watch(
  () => props.item,
  () => {
    failed.value = false
  },
)

const shortId = computed(() => (props.item ? stripNamespace(props.item.id) : ''))

const iconSrc = computed(() => {
  const item = props.item
  if (!item || item.isTag) return undefined
  return (
    props.icons?.[item.id] ??
    props.icons?.[shortId.value] ??
    itemIconUrl(item.id, props.iconBase ?? DEFAULT_ICON_BASE)
  )
})

const label = computed(() => {
  const item = props.item
  if (!item) return ''
  const pretty = props.labels?.[item.id] ?? prettyLabel(item.id)
  return item.isTag ? `#${pretty}` : pretty
})
</script>

<template>
  <div v-if="item" class="mc-item" :style="{ '--s': s }">
    <img
      v-if="iconSrc && !failed"
      class="mc-item-img"
      :src="iconSrc"
      :alt="label"
      draggable="false"
      @error="failed = true"
    />
    <div v-else class="mc-item-unknown">{{ item.isTag ? '#' : '?' }}</div>
    <span v-if="item.count > 1" class="mc-item-count">{{ item.count }}</span>
    <div class="mc-item-tip">
      <span class="mc-item-tip-name">{{ label }}</span>
      <span class="mc-item-tip-id">{{ item.isTag ? `#${item.id}` : item.id }}</span>
    </div>
  </div>
</template>

<style scoped>
.mc-item {
  --s: 1;
  position: relative;
  width: calc(16px * var(--s));
  height: calc(16px * var(--s));
}

.mc-item-img {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  user-select: none;
}

/* 加载失败 / tag / 未知物品：MC 缺失材质风格的棋盘占位 */
.mc-item-unknown {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: calc(10px * var(--s));
  font-weight: 700;
  background: conic-gradient(#f800f8 25%, #000 0 50%, #f800f8 0 75%, #000 0);
  background-size: 50% 50%;
  text-shadow: 1px 1px 0 #000;
}

/* 数量角标：白色数字 + MC 式右下深色投影 */
.mc-item-count {
  position: absolute;
  right: calc(-1px * var(--s));
  bottom: calc(-2px * var(--s));
  color: #fff;
  font-size: calc(8px * var(--s));
  font-weight: 700;
  line-height: 1;
  text-shadow: calc(1px * var(--s)) calc(1px * var(--s)) 0 #3f3f3f;
  pointer-events: none;
}

/* 悬停提示框：紫边黑底 */
.mc-item-tip {
  display: none;
  position: absolute;
  left: 50%;
  bottom: calc(100% + 3px * var(--s));
  transform: translateX(-50%);
  z-index: 10;
  flex-direction: column;
  gap: calc(1px * var(--s));
  padding: calc(3px * var(--s)) calc(4px * var(--s));
  background: rgba(16, 0, 17, 0.94);
  border: calc(1px * var(--s)) solid #2d0a63;
  outline: calc(1px * var(--s)) solid #100011;
  white-space: nowrap;
  pointer-events: none;
}

.mc-item:hover .mc-item-tip {
  display: flex;
}

.mc-item-tip-name {
  color: #fff;
  font-size: calc(9px * var(--s));
  font-weight: 700;
}

.mc-item-tip-id {
  color: #9a9a9a;
  font-size: calc(7px * var(--s));
}
</style>
