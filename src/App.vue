<script setup lang="ts">
import { ref } from 'vue'
import { CraftingTable } from './components/crafting'
import type { VanillaRecipeJson } from './components/crafting'

const SAMPLES: { name: string; label: string; data: VanillaRecipeJson }[] = [
  {
    name: 'pickaxe',
    label: '钻石镐 · 有序 3x3',
    data: {
      type: 'minecraft:crafting_shaped',
      pattern: ['DDD', ' S ', ' S '],
      key: { D: 'minecraft:diamond', S: 'minecraft:stick' },
      result: { id: 'minecraft:diamond_pickaxe', count: 1 },
    },
  },
  {
    name: 'table',
    label: '工作台 · 有序 2x2（旧版字段）',
    data: {
      type: 'crafting_shaped',
      pattern: ['PP', 'PP'],
      key: { P: { item: 'minecraft:oak_planks' } },
      result: { item: 'minecraft:crafting_table' },
    },
  },
  {
    name: 'stick',
    label: '木棍 · tag 原料',
    data: {
      type: 'minecraft:crafting_shaped',
      pattern: ['P', 'P'],
      key: { P: { tag: 'minecraft:planks' } },
      result: { id: 'minecraft:stick', count: 4 },
    },
  },
  {
    name: 'cake',
    label: '蛋糕 · 无序 9 格',
    data: {
      type: 'minecraft:crafting_shapeless',
      ingredients: [
        'minecraft:milk_bucket',
        'minecraft:milk_bucket',
        'minecraft:milk_bucket',
        'minecraft:sugar',
        'minecraft:egg',
        'minecraft:sugar',
        'minecraft:wheat',
        'minecraft:wheat',
        'minecraft:wheat',
      ],
      result: { id: 'minecraft:cake', count: 1 },
    },
  },
]

const currentName = ref(SAMPLES[0]?.name ?? '')
const input = ref(JSON.stringify(SAMPLES[0]?.data ?? {}, null, 2))

function loadSample(sample: (typeof SAMPLES)[number]) {
  currentName.value = sample.name
  input.value = JSON.stringify(sample.data, null, 2)
}
</script>

<template>
  <main class="demo">
    <header class="demo-head">
      <h1>MC 合成表组件</h1>
      <p>解析原版 data pack 配方 JSON，渲染为合成台界面 · 悬停物品查看名称</p>
    </header>

    <section class="demo-showcase">
      <CraftingTable :recipe="input" :scale="3" title="crafting_bg_3x3" />
    </section>

    <section class="demo-panel">
      <div class="demo-samples">
        <h2>示例配方</h2>
        <div class="demo-samples-btns">
          <button
            v-for="sample in SAMPLES"
            :key="sample.name"
            :class="{ active: currentName === sample.name }"
            @click="loadSample(sample)"
          >
            {{ sample.label }}
          </button>
        </div>
      </div>
      <div class="demo-editor">
        <h2>粘贴配方 JSON</h2>
        <textarea v-model="input" spellcheck="false" rows="16" placeholder='在此粘贴原版配方 JSON，例如 {"type":"minecraft:crafting_shaped",...}'></textarea>
      </div>
    </section>
  </main>
</template>

<style scoped>
.demo {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 16px 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.demo-head h1 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #fff;
  text-shadow: 2px 2px 0 #3f3f3f;
  letter-spacing: 1px;
}

.demo-head p {
  margin: 0;
  font-size: 13px;
  color: #a8a29a;
}

.demo-showcase {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  border: 1px solid #4a453f;
  border-radius: 6px;
  background:
    linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)),
    repeating-conic-gradient(#3a3631 0% 25%, #332f2b 0% 50%) 0 0 / 24px 24px;
}

.demo-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.demo-panel h2 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #cfc9c0;
}

.demo-samples-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.demo-samples-btns button {
  padding: 7px 12px;
  font-size: 13px;
  color: #fff;
  text-shadow: 1px 1px 0 #3f3f3f;
  background: #6f6b66;
  border: 2px solid #000;
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.35),
    inset -2px -2px 0 rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.demo-samples-btns button:hover {
  background: #7d7f92;
}

.demo-samples-btns button.active {
  background: #5a7fb0;
}

.demo-editor textarea {
  width: 100%;
  padding: 12px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d8e0c8;
  background: #1d1b18;
  border: 1px solid #4a453f;
  border-radius: 4px;
  resize: vertical;
  outline: none;
}

.demo-editor textarea:focus {
  border-color: #8fc27a;
}
</style>
