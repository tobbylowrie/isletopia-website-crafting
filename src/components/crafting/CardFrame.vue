<script setup lang="ts">
import McUiLabel from './McUiLabel.vue'

/**
 * MC 灰色面板容器（移植自源项目 minecraft-ui.module.css 的 .frame）。
 * 21 层 linear-gradient 绘制黑边 / 右下阴影 / 左上高光 / 灰色填充。
 */
withDefaults(
  defineProps<{
    /** 面板左上角标签文字（不传则由 surface 自行在画布内渲染） */
    label?: string
    /** 标签相对内容块居中 */
    centerLabel?: boolean
    /** 内容在帧内的水平对齐 */
    align?: 'center' | 'start'
    /** 常规显示宽度（px） */
    preferredWidth?: number
    /** 最小宽度（px），窄卡时触发外层横向滚动 */
    minWidth?: number
  }>(),
  { align: 'center', preferredWidth: 352, minWidth: 256 },
)
</script>

<template>
  <div
    class="frame"
    :class="align === 'center' ? 'is-center' : 'is-start'"
    :style="{ minWidth: `${minWidth}px`, width: `${preferredWidth}px` }"
  >
    <div class="content">
      <McUiLabel v-if="label" :center="centerLabel">{{ label }}</McUiLabel>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.frame {
  position: relative;
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  max-width: 100%;
  overflow: visible;
  padding: 8px 12px 12px;
  user-select: none;
  background:
    linear-gradient(#000, #000) left 4px top 0 / calc(100% - 10px) 2px no-repeat,
    linear-gradient(#000, #000) left 2px top 2px / 2px 2px no-repeat,
    linear-gradient(#000, #000) right 4px top 2px / 2px 2px no-repeat,
    linear-gradient(#000, #000) right 2px top 4px / 2px 2px no-repeat,
    linear-gradient(#000, #000) left 0 top 4px / 2px calc(100% - 10px) no-repeat,
    linear-gradient(#000, #000) right 0 top 6px / 2px calc(100% - 10px) no-repeat,
    linear-gradient(#000, #000) left 2px bottom 4px / 2px 2px no-repeat,
    linear-gradient(#000, #000) left 4px bottom 2px / 2px 2px no-repeat,
    linear-gradient(#000, #000) right 2px bottom 2px / 2px 2px no-repeat,
    linear-gradient(#000, #000) left 6px bottom 0 / calc(100% - 10px) 2px no-repeat,
    linear-gradient(#555, #555) right 2px top 6px / 4px calc(100% - 14px) no-repeat,
    linear-gradient(#555, #555) right 2px bottom 6px / 6px 2px no-repeat,
    linear-gradient(#555, #555) left 6px bottom 4px / calc(100% - 8px) 2px no-repeat,
    linear-gradient(#555, #555) left 6px bottom 2px / calc(100% - 10px) 2px no-repeat,
    linear-gradient(#fff, #fff) left 4px top 2px / calc(100% - 10px) 2px no-repeat,
    linear-gradient(#fff, #fff) left 2px top 4px / calc(100% - 8px) 2px no-repeat,
    linear-gradient(#fff, #fff) left 2px top 6px / 6px 2px no-repeat,
    linear-gradient(#fff, #fff) left 2px top 8px / 4px calc(100% - 14px) no-repeat,
    linear-gradient(#c6c6c6, #c6c6c6) left 6px top 6px / calc(100% - 12px) calc(100% - 12px)
      no-repeat,
    linear-gradient(#c6c6c6, #c6c6c6) right 4px top 4px / 2px 2px no-repeat,
    linear-gradient(#c6c6c6, #c6c6c6) left 4px bottom 4px / 2px 2px no-repeat;
}

.frame.is-center {
  justify-content: center;
}

.frame.is-start {
  justify-content: flex-start;
}

.content {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
</style>
