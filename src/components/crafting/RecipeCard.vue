<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { parseRecipe } from './parse'
import { prettyLabel } from './icons'
import type { ParsedRecipe, RecipeSlot, SlotKey } from './types'
import CraftingSurface from './surfaces/CraftingSurface.vue'
import FurnaceSurface from './surfaces/FurnaceSurface.vue'
import BrewingSurface from './surfaces/BrewingSurface.vue'
import SmithingSurface from './surfaces/SmithingSurface.vue'
import StonecutterSurface from './surfaces/StonecutterSurface.vue'

/**
 * 配方目录卡片（视觉对齐源项目 /recipes 页面的 RecipeCatalogCard）。
 * 标题为产物物品显示名（回退类型标签），右侧为类型徽章，预览面板居中可横向滚动。
 * scale 通过 transform: scale() 缩放整卡，wrapper 用 ResizeObserver 撑出缩放后占位。
 */
const props = withDefaults(
  defineProps<{
    /** 原版配方 JSON（对象或 JSON 字符串），实时解析 */
    recipe: unknown
    /** 整卡缩放倍数，>0 任意数值（演示页使用 1/2/4/8 整数档） */
    scale?: number
  }>(),
  { scale: 1 },
)

const parsed = computed(() => parseRecipe(props.recipe))

const scaleValue = computed(() => {
  const s = props.scale
  return typeof s === 'number' && Number.isFinite(s) && s > 0 ? s : 1
})

// 卡片标题 = 产物物品显示名（与源目录页 getRecipeCardTitle 一致），无产物时回退类型标签
const RESULT_KEYS: SlotKey[] = [
  'crafting.result',
  'cooking.result',
  'brewing.output',
  'stonecutter.result',
  'smithing.result',
]
const title = computed(() => {
  if (!parsed.value.ok) return ''
  const recipe: ParsedRecipe = parsed.value.recipe
  let result: RecipeSlot | undefined
  for (const key of RESULT_KEYS) {
    result = recipe.slots[key]
    if (result) break
  }
  return result ? prettyLabel(result.id) : recipe.label
})

// transform: scale 不改变布局占位，用 ResizeObserver 量自然尺寸撑开 wrapper
const naturalRef = ref<HTMLElement | null>(null)
const naturalSize = ref({ width: 0, height: 0 })
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(() => {
    if (!naturalRef.value) return
    naturalSize.value = { width: naturalRef.value.offsetWidth, height: naturalRef.value.offsetHeight }
  })
  if (naturalRef.value) observer.observe(naturalRef.value)
})
onBeforeUnmount(() => observer?.disconnect())

const wrapperStyle = computed(() => {
  const { width, height } = naturalSize.value
  if (!width || !height) return undefined
  return {
    width: `${Math.round(width * scaleValue.value)}px`,
    height: `${Math.round(height * scaleValue.value)}px`,
  }
})
</script>

<template>
  <div class="rc-scale-wrapper" :style="wrapperStyle">
    <div ref="naturalRef" class="rc-scale-inner" :style="{ transform: `scale(${scaleValue})` }">
      <!-- 解析成功：目录卡片 -->
      <article v-if="parsed.ok" class="rc-card">
        <div class="rc-head">
          <h2 class="rc-title">{{ title }}</h2>
          <span class="rc-badge">{{ parsed.recipe.label }}</span>
        </div>

        <div class="rc-preview">
          <div class="rc-scroll">
            <CraftingSurface
              v-if="parsed.recipe.kind === 'crafting'"
              :slots="parsed.recipe.slots"
              :grid-size="parsed.recipe.gridSize"
            />
            <FurnaceSurface
              v-else-if="parsed.recipe.kind === 'furnace'"
              :slots="parsed.recipe.slots"
              :label-key="parsed.recipe.containerKey"
            />
            <BrewingSurface v-else-if="parsed.recipe.kind === 'brewing'" :slots="parsed.recipe.slots" />
            <StonecutterSurface
              v-else-if="parsed.recipe.kind === 'stonecutter'"
              :slots="parsed.recipe.slots"
            />
            <SmithingSurface v-else :slots="parsed.recipe.slots" />
          </div>
        </div>
      </article>

      <!-- 解析失败：同尺寸错误卡片 -->
      <div v-else class="rc-error">
        <div class="rc-error-head">
          <span class="rc-error-icon">⚠</span>
          <span class="rc-error-title">配方解析失败</span>
        </div>
        <p class="rc-error-message">{{ parsed.message }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rc-scale-wrapper {
  max-width: 100%;
}

.rc-scale-inner {
  transform-origin: top left;
}

/* 卡片内的 MC 面板恒为经典亮色配色（对应源项目 minecraft-preview-slots） */
.rc-card,
.rc-error {
  --minecraft-slot-bg: 0 0% 54.51%;
  --minecraft-slot-border-tl: #373737;
  --minecraft-slot-border-br: #ffffff;
}

.rc-card {
  height: 208px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 8px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--rc-card);
  color: var(--rc-foreground);
  contain: layout paint style;
}

.rc-head {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.rc-title {
  min-width: 0;
  flex: 1;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  text-transform: capitalize;
}

.rc-badge {
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid var(--rc-badge-border);
  background: var(--rc-badge-bg);
  color: var(--rc-primary);
  padding: 4px 8px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  user-select: none;
}

.rc-preview {
  margin-top: 8px;
  display: flex;
  flex: 1 1 0%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
}

.rc-scroll {
  max-width: 100%;
  overflow-x: auto;
}

/* 错误卡片：与目录卡片同尺寸的红边深色提示 */
.rc-error {
  height: 208px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #b3556a;
  border-radius: 8px;
  background: #3a1f27;
  color: #ff9fb0;
}

.rc-error-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rc-error-icon {
  font-size: 14px;
}

.rc-error-title {
  font-size: 13px;
  font-weight: 600;
}

.rc-error-message {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}
</style>
