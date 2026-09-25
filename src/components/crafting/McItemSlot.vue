<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RecipeSlot } from './types'
import { itemIconUrl, prettyLabel, stripNamespace } from './icons'
import { zhDisplayName } from './lang'
import { prettyTagLabel, tagMembers } from './tags'
import { useTagCycleIndex } from './useTagCycleIndex'
import ItemTooltip from './ItemTooltip.vue'

const props = defineProps<{
  /** 物品格数据，null 不渲染 */
  item: RecipeSlot | null
  /** 按物品 id 覆盖图片 URL */
  icons?: Record<string, string>
  /** 按物品 id 覆盖显示名 */
  labels?: Record<string, string>
}>()

// tag 成员列表与全局同步轮播索引（对应源项目 CyclingItemPreview + useTagCycleTick）
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

// tooltip 内容：tag 轮播时跟随当前成员（与源项目目录页行为一致）
const tipName = computed(() => {
  const item = props.item
  if (!item) return ''
  if (item.isTag) {
    const current = displayId.value
    return current
      ? (props.labels?.[current] ?? prettyLabel(current))
      : `任意 ${prettyTagLabel(item.id)}`
  }
  return props.labels?.[item.id] ?? (item.nameKey ? zhDisplayName(item.nameKey) : undefined) ?? prettyLabel(item.id)
})

const tipDescription = computed(() => {
  const item = props.item
  if (!item) return ''
  // tag 轮播中展示当前成员 id；静止（未知 tag）展示 tag id
  if (item.isTag && displayId.value && displayId.value !== item.id) return displayId.value
  return item.isTag ? `#${item.id}` : item.id
})

const memberNames = computed(() =>
  memberIds.value.slice(0, 8).map((id) => props.labels?.[id] ?? prettyLabel(id)),
)
const memberMore = computed(() => memberIds.value.length - memberNames.value.length)
</script>

<template>
  <ItemTooltip v-if="item" class="mc-item" :title="tipName" :description="tipDescription">
    <img
      v-if="url && !failed"
      class="mc-item-img"
      :src="url"
      :alt="tipName"
      draggable="false"
      @error="failed = true"
    />
    <!-- 加载失败 / 未知 tag / 未知物品：MC 缺失材质风格的棋盘占位 -->
    <div v-else class="mc-item-unknown">{{ item.isTag ? '#' : '?' }}</div>
    <span v-if="item.count > 1" class="mc-item-count">{{ item.count }}</span>
    <template v-if="item.isTag && memberNames.length" #extra>
      <div class="mc-item-members">
        {{ memberNames.join('、') }}{{ memberMore > 0 ? ` 等 ${memberIds.length} 种` : '' }}
      </div>
    </template>
  </ItemTooltip>
</template>

<style scoped>
.mc-item {
  width: 32px;
  height: 32px;
}

.mc-item-img {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  user-select: none;
  -webkit-touch-callout: none;
}

.mc-item-unknown {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  background: conic-gradient(#f800f8 25%, #000 0 50%, #f800f8 0 75%, #000 0);
  background-size: 50% 50%;
  text-shadow: 1px 1px 0 #000;
  user-select: none;
}

/* 数量角标：Minecraft 字体白色数字 + 右下深色投影（移植自源项目 item-count） */
.mc-item-count {
  position: absolute;
  right: 2px;
  bottom: 2px;
  display: block;
  min-width: 10px;
  text-align: right;
  font-family: var(--font-minecraft);
  font-size: 16px;
  line-height: 1;
  color: #fff;
  font-smooth: none;
  -webkit-font-smoothing: none;
  text-shadow: 2px 2px 0 #3f3f3f;
  pointer-events: none;
  user-select: none;
}

/* tag 成员列表行：跟随在 tooltip 描述行之后，允许换行 */
.mc-item-members {
  max-width: 260px;
  white-space: normal;
  font-size: 16px;
  line-height: 1.25em;
  color: #555555;
  display: block;
  margin-top: 2px;
}
</style>
