<script setup lang="ts">
import CardFrame from '../CardFrame.vue'
import McSlotView from '../McSlotView.vue'
import { CraftingArrow } from '../mcUiArt'
import type { RecipeSlot, SlotKey } from '../types'

/**
 * 酿造台面板（对齐 FurnaceSurface 的布局语法）。
 * 上槽放酿造原料（reagent），下槽放药水瓶（input），箭头指向产物药水瓶（output）。
 * 游戏内酿造台无进度箭头，此处沿用目录页的通用箭头表达流向。
 */
defineProps<{
  slots: Partial<Record<SlotKey, RecipeSlot>>
}>()
</script>

<template>
  <CardFrame label="Brewing" center-label align="center" :preferred-width="352" :min-width="220">
    <div class="brewing-row">
      <div class="brewing-column">
        <McSlotView :item="slots['brewing.reagent'] ?? null" />

        <div class="brewing-stand-gap"></div>

        <McSlotView :item="slots['brewing.input'] ?? null" />
      </div>

      <div class="brewing-arrow">
        <CraftingArrow />
      </div>

      <McSlotView :item="slots['brewing.output'] ?? null" :size="52" />
    </div>
  </CardFrame>
</template>

<style scoped>
.brewing-row {
  margin-top: 6px;
  margin-left: 32px;
  display: flex;
  align-items: center;
}

.brewing-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* 游戏酿造台上下槽之间的 Blaze 火焰区，此处仅保留间距 */
.brewing-stand-gap {
  height: 24px;
}

.brewing-arrow {
  flex-shrink: 0;
  height: 30px;
  width: 44px;
  margin-left: 14px;
  margin-right: 18px;
  /* 与熔炉面板一致：箭头比 flex 居中位置高 1px */
  transform: translateY(-1px);
}
</style>
