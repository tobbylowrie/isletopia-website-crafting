<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RecipeSlot } from './types'
import { itemIconUrl, prettyLabel, stripNamespace } from './icons'
import { prettyTagLabel, tagMembers } from './tags'
import { useTagCycleIndex } from './useTagCycleIndex'

const props = defineProps<{
  /** 物品格数据，null 不渲染 */
  item: RecipeSlot | null
  /** 相对 1x 贴图的缩放倍数（物品原始 16x16） */
  scale?: number
  /** 按物品 id 覆盖图片 URL */
  icons?: Record<string, string>
  /** 按物品 id 覆盖显示名 */
  labels?: Record<string, string>
}>()

const s = computed(() => props.scale ?? 1)

// tag 成员列表与全局同步轮播索引
const memberIds = computed(() => (props.item?.isTag ? (tagMembers(props.item.id) ?? []) : []))
const cycleIndex = useTagCycleIndex(() => memberIds.value.length)

// 当前实际展示的物品 id：普通物品为其本身，tag 物品为轮播到的成员（未知 tag 无成员）
const displayId = computed(() => {
  const item = props.item
  if (!item) return undefined
  if (!item.isTag) return item.id
  const members = memberIds.value
  if (members.length === 0) return undefined
  return members[cycleIndex.value % members.length]
})

// 贴图按需异步解析；序列号防止快速切换物品时的竞态覆盖
const url = ref<string>()
const failed = ref(false)
let urlSeq = 0
watch(
  () => [displayId.value, props.icons] as const,
  async ([id]) => {
    failed.value = false
    const seq = ++urlSeq
    if (!id) {
      url.value = undefined
      return
    }
    const override = props.icons?.[id] ?? props.icons?.[stripNamespace(id)]
    if (override) {
      url.value = override
      return
    }
    const resolved = await itemIconUrl(id)
    if (seq === urlSeq) url.value = resolved
  },
  { immediate: true },
)

const tipName = computed(() => {
  const item = props.item
  if (!item) return ''
  if (item.isTag) return `任意 ${prettyTagLabel(item.id)}`
  return props.labels?.[item.id] ?? prettyLabel(item.id)
})

const tipId = computed(() => {
  const item = props.item
  if (!item) return ''
  return item.isTag ? `#${item.id}` : item.id
})

const memberNames = computed(() =>
  memberIds.value.slice(0, 8).map((id) => props.labels?.[id] ?? prettyLabel(id)),
)
const memberMore = computed(() => memberIds.value.length - memberNames.value.length)
</script>

<template>
  <div v-if="item" class="mc-item" :style="{ '--s': s }">
    <img
      v-if="url && !failed"
      class="mc-item-img"
      :src="url"
      :alt="tipName"
      draggable="false"
      @error="failed = true"
    />
    <div v-else class="mc-item-unknown">{{ item.isTag ? '#' : '?' }}</div>
    <span v-if="item.count > 1" class="mc-item-count">{{ item.count }}</span>
    <div class="mc-item-tip">
      <span class="mc-item-tip-name">{{ tipName }}</span>
      <span class="mc-item-tip-id">{{ tipId }}</span>
      <span
        v-if="item.isTag && memberNames.length"
        class="mc-item-tip-members"
      >{{ memberNames.join('、') }}{{ memberMore > 0 ? ` 等 ${memberIds.length} 种` : '' }}</span>
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

/* 加载失败 / 未知 tag / 未知物品：MC 缺失材质风格的棋盘占位 */
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

.mc-item-tip-members {
  max-width: calc(180px * var(--s));
  color: #9a9a9a;
  font-size: calc(7px * var(--s));
  line-height: 1.6;
  white-space: normal;
}
</style>
