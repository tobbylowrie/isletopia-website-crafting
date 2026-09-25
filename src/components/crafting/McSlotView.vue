<script setup lang="ts">
import McItemSlot from './McItemSlot.vue'
import type { RecipeSlot } from './types'

/**
 * MC 槽位底座（移植自源项目 slot.module.css）。
 * 2px 浮雕边框 + :before/:after 外角 2px 色块；内嵌 McItemSlot 渲染物品。
 */
withDefaults(
  defineProps<{
    /** 槽位边长：普通 36 / 结果槽 52 */
    size?: number
    /** 静态装饰槽（stonecutter 列表输出内），不响应悬停 */
    inert?: boolean
    /** 变暗（furnace 燃料槽恒空） */
    disabled?: boolean
    /** 透明底（stonecutter 列表输出内） */
    transparent?: boolean
    /** 槽位物品，null 渲染空槽 */
    item?: RecipeSlot | null
    /** 按物品 id 覆盖图片 URL（透传 McItemSlot） */
    icons?: Record<string, string>
    /** 按物品 id 覆盖显示名（透传 McItemSlot） */
    labels?: Record<string, string>
  }>(),
  { size: 36, item: null },
)
</script>

<template>
  <div
    class="slot"
    :class="{ inert, disabled, transparent }"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <McItemSlot v-if="item" :item="item" :icons="icons" :labels="labels" />
  </div>
</template>

<style scoped>
.slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  border-color: var(--minecraft-slot-border-tl) var(--minecraft-slot-border-br)
    var(--minecraft-slot-border-br) var(--minecraft-slot-border-tl);
  background-color: hsl(var(--minecraft-slot-bg));
}

.slot:not(.inert):hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.slot.disabled {
  filter: brightness(0.75);
}

.slot.transparent {
  border-color: transparent;
  background-color: transparent;
}

.slot::before,
.slot::after {
  background-color: hsl(var(--minecraft-slot-bg));
  pointer-events: none;
  position: absolute;
  content: '';
  height: 2px;
  width: 2px;
}

.slot.transparent::before,
.slot.transparent::after {
  background-color: transparent;
}

.slot::before {
  right: -2px;
  top: -2px;
}

.slot::after {
  bottom: -2px;
  left: -2px;
}
</style>
