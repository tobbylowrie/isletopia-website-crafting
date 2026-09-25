<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { Teleport } from 'vue'
import { computePosition, flip, offset, shift } from '@floating-ui/dom'

/**
 * MC 物品 tooltip（交互等价移植自源项目 item-tooltip.tsx 的桌面 hover 模式，
 * 视觉移植自 tooltip.module.css）。
 * fixed 定位挂载到 body，通过虚拟引用元素跟随光标移动；
 * offset / flip / shift 负责屏幕边缘避让。
 */
const props = defineProps<{
  /** 标题行（物品显示名 / tag 标签） */
  title: string
  /** 灰色描述行（完整 id）；标题已包含时不显示 */
  description?: string
}>()

const referenceRef = ref<HTMLElement | null>(null)
const floatingRef = ref<HTMLElement | null>(null)
const open = ref(false)
const floatingStyle = ref<Record<string, string>>({ visibility: 'hidden', left: '0px', top: '0px' })

const showDescription = computed(
  () => !!props.description && !props.title.includes(props.description),
)

// 虚拟引用元素：锚定光标位置而非触发元素（对应源项目 useClientPoint）
const pointer = { x: 0, y: 0 }
const virtualElement = {
  getBoundingClientRect: () => ({
    x: pointer.x,
    y: pointer.y,
    top: pointer.y,
    left: pointer.x,
    right: pointer.x,
    bottom: pointer.y,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  }),
}

let rafId = 0

async function update() {
  const floating = floatingRef.value
  if (!floating) return
  const { x, y } = await computePosition(virtualElement, floating, {
    placement: 'right',
    strategy: 'fixed',
    middleware: [
      offset(16),
      flip({ padding: 8, fallbackPlacements: ['left', 'top'] }),
      shift({ padding: 8 }),
    ],
  })
  floatingStyle.value = { left: `${x}px`, top: `${y}px`, visibility: 'visible' }
}

/** rAF 合并连续 mousemove 的定位计算 */
function scheduleUpdate() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    void update()
  })
}

async function onEnter(event: MouseEvent) {
  pointer.x = event.clientX
  pointer.y = event.clientY
  open.value = true
  floatingStyle.value = { visibility: 'hidden', left: '0px', top: '0px' }
  await nextTick()
  await update()
}

function onMove(event: MouseEvent) {
  if (!open.value) return
  pointer.x = event.clientX
  pointer.y = event.clientY
  scheduleUpdate()
}

function onLeave() {
  open.value = false
}

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div ref="referenceRef" class="mc-tooltip-trigger" @mouseenter="onEnter" @mousemove="onMove" @mouseleave="onLeave">
    <slot />

    <Teleport to="body">
      <div v-if="open" ref="floatingRef" class="mc-tooltip" :style="floatingStyle">
        <div class="mc-tooltip-title">{{ title }}</div>
        <div v-if="showDescription" class="mc-tooltip-description">{{ description }}</div>
        <!-- tag 成员列表等附加内容行 -->
        <slot name="extra" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mc-tooltip-trigger {
  position: relative;
}

/* 视觉移植自源项目 tooltip.module.css：紫边渐变描边的半透明黑底 */
.mc-tooltip {
  position: fixed;
  top: 0;
  left: 0;
  font-family: var(--font-minecraft);
  text-align: left;
  background-color: #100010;
  background-color: rgba(16, 0, 16, 0.94);
  color: #fff;
  padding: 0.375em;
  font-size: 16px;
  word-spacing: 4px;
  white-space: nowrap;
  line-height: 1.25em;
  margin: 0.125em 0.25em;
  pointer-events: none;
  z-index: 99;
}

.mc-tooltip::before {
  content: '';
  position: absolute;
  top: 0.125em;
  right: -0.125em;
  bottom: 0.125em;
  left: -0.125em;
  border: 0.125em solid #100010;
  border-style: none solid;
  border-color: rgba(16, 0, 16, 0.94);
}

.mc-tooltip::after {
  content: '';
  position: absolute;
  top: 0.125em;
  right: 0;
  bottom: 0.125em;
  left: 0;
  border: 2px solid #2d0a63;
  border-image: linear-gradient(rgba(80, 0, 255, 0.31), rgba(40, 0, 127, 0.31)) 1;
}

.mc-tooltip-description {
  font-size: 16px;
  color: #555555;
  display: block;
  margin-top: 2px;
}
</style>
