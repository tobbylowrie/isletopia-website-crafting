<script setup lang="ts">
import { computed } from 'vue'
import CardFrame from '../CardFrame.vue'
import McSlotView from '../McSlotView.vue'
import { CraftingArrow } from '../mcUiArt'
import type { RecipeSlot, SlotKey } from '../types'

/**
 * 合成台面板（移植自源项目 CraftingPreviewSurface）。
 * 2x2 时可见槽为 crafting.1/.2/.4/.5（3x3 编号的左上角），箭头间距 20/24px。
 */
const props = defineProps<{
  slots: Partial<Record<SlotKey, RecipeSlot>>
  gridSize?: 2 | 3
}>()

const twoByTwo = computed(() => props.gridSize === 2)
const columns = computed(() => (twoByTwo.value ? 2 : 3))
const gridKeys = computed<SlotKey[]>(() =>
  twoByTwo.value
    ? ['crafting.1', 'crafting.2', 'crafting.4', 'crafting.5']
    : [
        'crafting.1',
        'crafting.2',
        'crafting.3',
        'crafting.4',
        'crafting.5',
        'crafting.6',
        'crafting.7',
        'crafting.8',
        'crafting.9',
      ],
)
</script>

<template>
  <CardFrame
    label="Crafting"
    align="center"
    :preferred-width="twoByTwo ? 316 : 352"
    :min-width="twoByTwo ? 236 : 256"
  >
    <div class="crafting-row">
      <div class="crafting-grid" :style="{ gridTemplateColumns: `repeat(${columns}, 36px)` }">
        <McSlotView v-for="key in gridKeys" :key="key" :item="slots[key] ?? null" />
      </div>

      <div class="crafting-arrow" :class="{ 'is-2x2': twoByTwo }">
        <CraftingArrow />
      </div>

      <McSlotView :item="slots['crafting.result'] ?? null" :size="52" />
    </div>
  </CardFrame>
</template>

<style scoped>
.crafting-row {
  margin-top: 6px;
  display: flex;
  align-items: center;
}

.crafting-grid {
  display: grid;
  flex-shrink: 0;
}

.crafting-arrow {
  flex-shrink: 0;
  height: 30px;
  width: 44px;
  margin-left: 14px;
  margin-right: 14px;
  /* 游戏界面里箭头比 flex 居中位置高 1px */
  transform: translateY(-1px);
}

.crafting-arrow.is-2x2 {
  margin-left: 20px;
  margin-right: 24px;
  transform: none;
}
</style>
