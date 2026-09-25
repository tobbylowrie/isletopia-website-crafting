<script setup lang="ts">
/**
 * MC GUI 标签文字（移植自源项目 MinecraftUiLabel）。
 * 20px 字号 / 18px 行高 / 无字体平滑，保证像素字体锐利。
 */
defineProps<{
  /** 相对内容块居中（furnace 面板标签用） */
  center?: boolean
}>()
</script>

<template>
  <div class="mc-ui-label" :class="{ center }"><slot /></div>
</template>

<style scoped>
.mc-ui-label {
  font-family: var(--font-minecraft);
  pointer-events: none;
  font-size: 20px;
  line-height: 18px;
  white-space: nowrap;
  color: #404040;
  -webkit-font-smoothing: none;
  user-select: none;
  text-align: left;
}

.mc-ui-label.center {
  text-align: center;
}
</style>
