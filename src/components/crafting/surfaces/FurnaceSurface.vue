<script setup lang="ts">
import { computed } from 'vue'
import CardFrame from '../CardFrame.vue'
import McSlotView from '../McSlotView.vue'
import { zhLangText } from '../lang'
import { CraftingArrow, FurnaceFire } from '../mcUiArt'
import type { RecipeSlot, SlotKey } from '../types'

/**
 * 熔炉面板（移植自源项目 FurnacePreviewSurface）。
 * 四种烹饪变体（熔炼/高炉/烟熏/营火）共用此面板，标题随 containerKey
 * 显示对应容器名（熔炉/高炉/烟熏炉/营火），变体另由类型徽章区分。
 * 燃料槽展示合成燃料组轮播（#minecraft:fuel），营火烹饪不消耗燃料故无燃料槽。
 */
const props = defineProps<{
  slots: Partial<Record<SlotKey, RecipeSlot>>
  /** 面板标题的容器语言键（如 "container.blast_furnace"），缺省为熔炉 */
  labelKey?: string
}>()

const label = computed(
  () => (props.labelKey ? zhLangText(props.labelKey) : undefined) ?? zhLangText('container.furnace') ?? 'Furnace',
)
</script>

<template>
  <CardFrame :label="label" center-label align="center" :preferred-width="352" :min-width="220">
    <div class="furnace-row">
      <div class="furnace-column">
        <McSlotView :item="slots['cooking.ingredient'] ?? null" />

        <div class="furnace-fire">
          <FurnaceFire />
        </div>

        <McSlotView :item="slots['cooking.fuel'] ?? null" />
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
