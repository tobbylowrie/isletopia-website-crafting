<script setup lang="ts">
import CardFrame from '../CardFrame.vue'
import McUiLabel from '../McUiLabel.vue'
import McSlotView from '../McSlotView.vue'
import { zhLangText } from '../lang'
import { StonecutterScrollerUi, StonecutterSelectionUi } from '../mcUiArt'
import type { RecipeSlot, SlotKey } from '../types'

/**
 * 切石机面板（移植自源项目 StonecutterPreviewSurface）。
 * 312×132 绝对定位画布；列表输出斜面按钮为静态装饰（源项目此处可点击切换选中态）。
 */
defineProps<{
  slots: Partial<Record<SlotKey, RecipeSlot>>
}>()

const label = zhLangText('container.stonecutter') ?? 'Stonecutter'
</script>

<template>
  <CardFrame align="start" :preferred-width="352" :min-width="336">
    <div class="stonecutter-canvas">
      <McUiLabel>{{ label }}</McUiLabel>

      <div class="stonecutter-selection">
        <StonecutterSelectionUi />
      </div>

      <div class="stonecutter-scroller">
        <StonecutterScrollerUi />
      </div>

      <div class="stonecutter-ingredient">
        <McSlotView :item="slots['stonecutter.ingredient'] ?? null" />
      </div>

      <!-- 列表输出斜面按钮：静态装饰，内部为透明静态槽 -->
      <div class="stonecutter-list-output">
        <McSlotView inert transparent :item="slots['stonecutter.result'] ?? null" />
      </div>

      <div class="stonecutter-result">
        <McSlotView :item="slots['stonecutter.result'] ?? null" :size="52" />
      </div>
    </div>
  </CardFrame>
</template>

<style scoped>
.stonecutter-canvas {
  position: relative;
  height: 132px;
  width: 312px;
}

.stonecutter-selection {
  position: absolute;
  left: 86px;
  top: 20px;
  width: 162px;
  height: 112px;
}

.stonecutter-scroller {
  position: absolute;
  left: 222px;
  top: 22px;
  width: 24px;
  height: 30px;
  pointer-events: none;
}

.stonecutter-ingredient {
  position: absolute;
  left: 22px;
  top: 56px;
}

.stonecutter-result {
  position: absolute;
  left: 260px;
  top: 48px;
}

/* 斜面输出按钮（移植自源项目 .stonecutterListOutput，静态展示配色） */
.stonecutter-list-output {
  --stonecutter-recipe-edge-top-left: #e0ca9f;
  --stonecutter-recipe-edge-right-bottom: #544c3b;
  --stonecutter-recipe-fill: #a09172;

  position: absolute;
  left: 88px;
  top: 22px;
  width: 32px;
  height: 36px;
  background:
    linear-gradient(
        var(--stonecutter-recipe-edge-top-left),
        var(--stonecutter-recipe-edge-top-left)
      )
      left top / calc(100% - 2px) 2px no-repeat,
    linear-gradient(
        var(--stonecutter-recipe-edge-top-left),
        var(--stonecutter-recipe-edge-top-left)
      )
      left top / 2px calc(100% - 2px) no-repeat,
    linear-gradient(
        var(--stonecutter-recipe-edge-right-bottom),
        var(--stonecutter-recipe-edge-right-bottom)
      )
      right 0 top 2px / 2px calc(100% - 2px) no-repeat,
    linear-gradient(
        var(--stonecutter-recipe-edge-right-bottom),
        var(--stonecutter-recipe-edge-right-bottom)
      )
      left 2px bottom 0 / calc(100% - 2px) 2px no-repeat,
    linear-gradient(var(--stonecutter-recipe-fill), var(--stonecutter-recipe-fill)) center / 100%
      100% no-repeat;
}

.stonecutter-list-output > div {
  width: 32px !important;
  height: 36px !important;
}
</style>
