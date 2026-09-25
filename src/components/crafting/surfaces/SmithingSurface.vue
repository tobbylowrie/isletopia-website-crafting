<script setup lang="ts">
import CardFrame from '../CardFrame.vue'
import McUiLabel from '../McUiLabel.vue'
import McSlotView from '../McSlotView.vue'
import { CraftingArrow, SmithingHammer } from '../mcUiArt'
import type { RecipeSlot, SlotKey } from '../types'

/**
 * 锻造台面板（移植自源项目 SmithingPreviewSurface）。
 * 218×122 绝对定位画布；适用于锻造升级与纹饰两类配方。
 */
defineProps<{
  slots: Partial<Record<SlotKey, RecipeSlot>>
}>()
</script>

<template>
  <CardFrame align="start" :preferred-width="352" :min-width="242">
    <div class="smithing-canvas">
      <div class="smithing-hammer">
        <SmithingHammer />
      </div>

      <div class="smithing-gear-label">
        <McUiLabel>Upgrade Gear</McUiLabel>
      </div>

      <div class="smithing-slot is-template">
        <McSlotView :item="slots['smithing.template'] ?? null" />
      </div>

      <div class="smithing-slot is-base">
        <McSlotView :item="slots['smithing.base'] ?? null" />
      </div>

      <div class="smithing-slot is-addition">
        <McSlotView :item="slots['smithing.addition'] ?? null" />
      </div>

      <div class="smithing-arrow">
        <CraftingArrow />
      </div>

      <div class="smithing-result">
        <McSlotView :item="slots['smithing.result'] ?? null" />
      </div>
    </div>
  </CardFrame>
</template>

<style scoped>
.smithing-canvas {
  position: relative;
  height: 122px;
  width: 218px;
}

.smithing-hammer {
  position: absolute;
  left: 2px;
  top: 6px;
  width: 60px;
  height: 62px;
}

.smithing-gear-label {
  position: absolute;
  left: 76px;
  top: 16px;
}

.smithing-slot.is-template {
  position: absolute;
  left: 2px;
  top: 86px;
}

.smithing-slot.is-base {
  position: absolute;
  left: 38px;
  top: 86px;
}

.smithing-slot.is-addition {
  position: absolute;
  left: 74px;
  top: 86px;
}

.smithing-arrow {
  position: absolute;
  left: 124px;
  top: 90px;
  width: 44px;
  height: 30px;
}

.smithing-result {
  position: absolute;
  left: 182px;
  top: 86px;
}
</style>
