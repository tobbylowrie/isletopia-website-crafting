<script setup lang="ts">
import CardFrame from '../CardFrame.vue'
import McSlotView from '../McSlotView.vue'
import { CraftingArrow, FurnaceFire } from '../mcUiArt'
import type { RecipeSlot, SlotKey } from '../types'

/**
 * 熔炉面板（移植自源项目 FurnacePreviewSurface）。
 * 四种烹饪变体（熔炼/高炉/烟熏/营火）共用此面板，面板标签恒为 "Furnace"，
 * 变体由目录卡片的类型徽章区分。燃料槽为纯装饰（JSON 配方不含燃料，恒空）。
 */
defineProps<{
  slots: Partial<Record<SlotKey, RecipeSlot>>
}>()
</script>

<template>
  <CardFrame label="Furnace" center-label align="center" :preferred-width="352" :min-width="220">
    <div class="furnace-row">
      <div class="furnace-column">
        <McSlotView :item="slots['cooking.ingredient'] ?? null" />

        <div class="furnace-fire">
          <FurnaceFire />
        </div>

        <McSlotView inert disabled />
      </div>

      <div class="furnace-arrow">
        <CraftingArrow />
      </div>

      <McSlotView :item="slots['cooking.result'] ?? null" :size="52" />
    </div>
  </CardFrame>
</template>

<style scoped>
.furnace-row {
  margin-top: 6px;
  margin-left: 32px;
  display: flex;
  align-items: center;
}

.furnace-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.furnace-fire {
  height: 28px;
  width: 28px;
}

.furnace-arrow {
  flex-shrink: 0;
  height: 30px;
  width: 44px;
  margin-left: 14px;
  margin-right: 18px;
  /* 游戏界面里箭头比 flex 居中位置高 1px */
  transform: translateY(-1px);
}
</style>
