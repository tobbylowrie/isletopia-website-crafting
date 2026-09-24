<script setup lang="ts">
import { computed } from 'vue'
import McItemSlot from './McItemSlot.vue'
import { parseRecipe } from './parse'
import { BG_HEIGHT, BG_WIDTH, GRID_COLS, gridSlotPos, RESULT_X, RESULT_Y } from './layout'
import bgUrl from '../../assets/crafting/crafting_bg_3x3.png'

const props = defineProps<{
  /** 原版 data pack 配方 JSON（对象或字符串） */
  recipe: unknown
  /** 相对 1x 贴图的缩放倍数，默认 2（显示 256x132） */
  scale?: number
  /** 物品贴图 base（以物品目录结尾），可切换版本或自建源 */
  iconBase?: string
  /** 按物品 id 覆盖图片 URL */
  icons?: Record<string, string>
  /** 按物品 id 覆盖显示名 */
  labels?: Record<string, string>
  /** 面板标题 */
  title?: string
}>()

const s = computed(() => props.scale ?? 2)
const parsed = computed(() => parseRecipe(props.recipe))

const kindLabel = computed(() => {
  const p = parsed.value
  if (!p.ok) return ''
  return p.recipe.kind === 'shaped' ? '有序合成' : '无序合成'
})

function gridStyle(i: number) {
  const { x, y } = gridSlotPos(Math.floor(i / GRID_COLS), i % GRID_COLS)
  return slotStyle(x, y)
}

function slotStyle(x: number, y: number) {
  return { left: `${x * s.value}px`, top: `${y * s.value}px` }
}
</script>

<template>
  <div v-if="!parsed.ok" class="ct-error">
    <span class="ct-error-icon">⚠</span>
    <span>{{ parsed.message }}</span>
  </div>
  <figure v-else class="ct">
    <div
      class="ct-board"
      :style="{
        backgroundImage: `url(${bgUrl})`,
        width: `${BG_WIDTH * s}px`,
        height: `${BG_HEIGHT * s}px`,
      }"
    >
      <McItemSlot
        v-for="(item, i) in parsed.recipe.grid"
        :key="i"
        class="ct-cell"
        :item="item"
        :scale="s"
        :icon-base="iconBase"
        :icons="icons"
        :labels="labels"
        :style="gridStyle(i)"
      />
      <McItemSlot
        class="ct-cell"
        :item="parsed.recipe.result"
        :scale="s"
        :icon-base="iconBase"
        :icons="icons"
        :labels="labels"
        :style="slotStyle(RESULT_X, RESULT_Y)"
      />
    </div>
    <figcaption class="ct-caption">
      <span v-if="title" class="ct-title">{{ title }}</span>
      <span class="ct-kind">{{ kindLabel }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.ct {
  margin: 0;
  width: fit-content;
}

/* 背景整图等比放大，保持像素风 */
.ct-board {
  position: relative;
  background-size: 100% 100%;
  image-rendering: pixelated;
}

.ct-cell {
  position: absolute;
}

.ct-caption {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #b8b3ac;
}

.ct-title {
  font-weight: 700;
  color: #e8e4de;
}

.ct-kind {
  color: #8fc27a;
}

.ct-error {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 480px;
  padding: 10px 14px;
  border: 1px solid #b3556a;
  border-radius: 4px;
  background: #3a1f27;
  color: #ff9fb0;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}
</style>
