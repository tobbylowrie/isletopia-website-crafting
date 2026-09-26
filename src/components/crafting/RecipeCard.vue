<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { parseRecipe } from './parse'
import { recipeTitle } from './icons'
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
    /** 是否已收藏（收藏状态由调用方持有，卡片仅展示与上报点击） */
    favorite?: boolean
    /** 附加徽章文案（黄色，如自定义配方显示「服务器自定义」），与类型徽章并列展示 */
    badge?: string
  }>(),
  { scale: 1, favorite: false, badge: undefined },
)

const emit = defineEmits<{ (e: 'toggle-favorite'): void }>()

const parsed = computed(() => parseRecipe(props.recipe))

const scaleValue = computed(() => {
  const s = props.scale
  return typeof s === 'number' && Number.isFinite(s) && s > 0 ? s : 1
})

// 卡片标题 = 产物槽位显示名（titleKey 覆盖优先），无产物时回退类型标签
const title = computed(() => (parsed.value.ok ? recipeTitle(parsed.value.recipe) : ''))

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
          <button
            class="rc-fav"
            :class="{ on: favorite }"
            type="button"
            :title="favorite ? '已收藏' : '收藏'"
            @click.stop="emit('toggle-favorite')"
          >
            <svg class="rc-fav-icon" viewBox="0 0 10 14" shape-rendering="crispEdges" aria-hidden="true">
              <!-- 旗帜：矩形底部减去倒三角（缺口逐行收窄），形成双尾旗 -->
              <path
                fill="currentColor"
                d="M0 0h10v10H0z M0 10h4v1H0z M6 10h4v1H6z M0 11h3v1H0z M7 11h3v1H7z M0 12h2v1H0z M8 12h2v1H8z M0 13h1v1H0z M9 13h1v1H9z"
              />
            </svg>
            <span>{{ favorite ? '已收藏' : '收藏' }}</span>
          </button>
          <span v-if="badge" class="rc-badge is-yellow">{{ badge }}</span>
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

/* 黄色徽章变体（服务器自定义）：MC 金色文字 + 同色调底/边 */
.rc-badge.is-yellow {
  color: #ffaa00;
  border-color: color-mix(in oklab, #ffaa00 35%, transparent);
  background: color-mix(in oklab, #ffaa00 12%, transparent);
}

/* 收藏按钮：原版风格灰底 + 像素旗帜图标，收藏后旗帜变金色 */
.rc-fav {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: #fff;
  text-shadow: 1px 1px 0 #3f3f3f;
  background: #6f6b66;
  border: 2px solid #000;
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.35),
    inset -2px -2px 0 rgba(0, 0, 0, 0.35);
  cursor: pointer;
  user-select: none;
}

.rc-fav:hover {
  background: #7d7f92;
}

.rc-fav-icon {
  width: 10px;
  height: 14px;
  color: #fff;
  flex-shrink: 0;
}

.rc-fav.on .rc-fav-icon {
  color: #ffaa00;
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
