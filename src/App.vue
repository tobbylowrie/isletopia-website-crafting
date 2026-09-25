<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RecipeCard, parseRecipe, slotDisplayName } from './components/crafting'
import type { RecipeKind, VanillaRecipeJson } from './components/crafting'
import { VANILLA_RECIPES } from './data/vanilla-recipes'

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
    label: '木棍 · tag 原料（2x2）',
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
  {
    name: 'smelting',
    label: '熔炼铁锭 · 熔炉（1.21+ 字符串原料）',
    data: {
      type: 'minecraft:smelting',
      ingredient: 'minecraft:iron_ore',
      result: { id: 'minecraft:iron_ingot' },
      experience: 0.7,
      cookingtime: 200,
    },
  },
  {
    name: 'blasting',
    label: '高炉金锭 · 高炉（1.21+ {id} 原料）',
    data: {
      type: 'minecraft:blasting',
      ingredient: { id: 'minecraft:gold_ore' },
      result: { id: 'minecraft:gold_ingot' },
      experience: 0.7,
      cookingtime: 100,
    },
  },
  {
    name: 'smoking',
    label: '烟熏鲑鱼 · 烟熏炉（旧版 {item} 原料）',
    data: {
      type: 'minecraft:smoking',
      ingredient: { item: 'minecraft:salmon' },
      result: { id: 'minecraft:cooked_salmon' },
      experience: 0.35,
      cookingtime: 100,
    },
  },
  {
    name: 'campfire',
    label: '烤土豆 · 营火',
    data: {
      type: 'minecraft:campfire_cooking',
      ingredient: 'minecraft:potato',
      result: { id: 'minecraft:baked_potato' },
      experience: 0.35,
      cookingtime: 600,
    },
  },
  {
    name: 'stonecutting',
    label: '石台阶 · 切石机（字符串产物 + 根级 count）',
    data: {
      type: 'minecraft:stonecutting',
      ingredient: 'minecraft:stone',
      result: 'minecraft:stone_slab',
      count: 2,
    },
  },
  {
    name: 'smithing_transform',
    label: '下界合金斧 · 锻造升级',
    data: {
      type: 'minecraft:smithing_transform',
      template: 'minecraft:netherite_upgrade_smithing_template',
      base: 'minecraft:diamond_axe',
      addition: 'minecraft:netherite_ingot',
      result: { id: 'minecraft:netherite_axe' },
    },
  },
  {
    name: 'smithing_trim',
    label: '盔甲纹饰 · smithing_trim（无产物字段）',
    data: {
      type: 'minecraft:smithing_trim',
      template: 'minecraft:coast_armor_trim_smithing_template',
      base: 'minecraft:iron_chestplate',
      addition: 'minecraft:copper_ingot',
    },
  },
]

const currentName = ref(SAMPLES[0]?.name ?? '')
const input = ref(JSON.stringify(SAMPLES[0]?.data ?? {}, null, 2))

/** 可选的整数倍缩放档位 */
const SCALE_OPTIONS = [1, 2, 4, 8]
const scale = ref(1)

function loadSample(sample: (typeof SAMPLES)[number]) {
  currentName.value = sample.name
  input.value = JSON.stringify(sample.data, null, 2)
}

/* ------- 原版配方目录（26.3 全量 2042 条） ------- */

/** 产物槽位键（与 RecipeCard 内标题逻辑一致） */
const RESULT_KEYS = [
  'crafting.result',
  'cooking.result',
  'brewing.output',
  'stonecutter.result',
  'smithing.result',
] as const

interface CatalogEntry {
  id: string
  raw: VanillaRecipeJson
  kind: RecipeKind | null
  title: string
  searchText: string
}

/** 面板种类 → 筛选按钮文案 */
const KIND_LABELS: { kind: RecipeKind | 'all'; label: string }[] = [
  { kind: 'all', label: '全部' },
  { kind: 'crafting', label: '合成' },
  { kind: 'furnace', label: '熔炼' },
  { kind: 'brewing', label: '酿造' },
  { kind: 'stonecutter', label: '切石' },
  { kind: 'smithing', label: '锻造' },
]

/** 目录排序：面板种类分区（解析失败的排最后），区内按注册 id 字典序 */
const KIND_ORDER: Record<RecipeKind, number> = {
  crafting: 0,
  furnace: 1,
  brewing: 2,
  stonecutter: 3,
  smithing: 4,
}

/** 启动时全量解析一次，得到分区/标题/搜索文本；失败的条目仍保留（卡片内展示错误态） */
const catalog: CatalogEntry[] = VANILLA_RECIPES.map(({ id, recipe }) => {
  const parsed = parseRecipe(recipe)
  if (!parsed.ok) return { id, raw: recipe, kind: null, title: '', searchText: id.toLowerCase() }
  const { recipe: parsedRecipe } = parsed
  let resultSlot
  for (const key of RESULT_KEYS) {
    resultSlot = parsedRecipe.slots[key]
    if (resultSlot) break
  }
  const title = resultSlot ? slotDisplayName(resultSlot) : parsedRecipe.label
  return {
    id,
    raw: recipe,
    kind: parsedRecipe.kind,
    title,
    searchText: `${id} ${title}`.toLowerCase(),
  }
}).sort((a, b) => {
  const orderA = a.kind === null ? Number.MAX_SAFE_INTEGER : KIND_ORDER[a.kind]
  const orderB = b.kind === null ? Number.MAX_SAFE_INTEGER : KIND_ORDER[b.kind]
  return orderA - orderB || a.id.localeCompare(b.id)
})

const query = ref('')
const kindFilter = ref<RecipeKind | 'all'>('all')

const kindCounts = computed(() => {
  const counts: Record<string, number> = { all: catalog.length }
  for (const entry of catalog) {
    if (entry.kind) counts[entry.kind] = (counts[entry.kind] ?? 0) + 1
  }
  return counts
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return catalog.filter((entry) => {
    if (kindFilter.value !== 'all' && entry.kind !== kindFilter.value) return false
    return !q || entry.searchText.includes(q)
  })
})

/** 增量渲染：2042 张卡片一次性挂载会明显卡顿，滚动到页尾按批追加 */
const PAGE_SIZE = 60
const visibleCount = ref(PAGE_SIZE)
watch([query, kindFilter], () => {
  visibleCount.value = PAGE_SIZE
})
const visible = computed(() => filtered.value.slice(0, visibleCount.value))

const sentinel = ref<HTMLElement | null>(null)
let scrollObserver: IntersectionObserver | undefined
onMounted(() => {
  scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, filtered.value.length)
      }
    },
    { rootMargin: '600px' },
  )
  if (sentinel.value) scrollObserver.observe(sentinel.value)
})
onBeforeUnmount(() => scrollObserver?.disconnect())
</script>

<template>
  <main class="demo">
    <header class="demo-head">
      <h1>MC 配方目录卡片</h1>
      <p>解析原版 data pack 配方 JSON，按配方目录页样式渲染四类面板 · 悬停物品查看 tooltip</p>
    </header>

    <section class="workbench">
      <div class="workbench-editor">
        <h2>粘贴配方 JSON</h2>
        <div class="sample-btns">
          <button
            v-for="sample in SAMPLES"
            :key="sample.name"
            :class="{ active: currentName === sample.name }"
            @click="loadSample(sample)"
          >
            {{ sample.label }}
          </button>
        </div>
        <textarea
          v-model="input"
          spellcheck="false"
          rows="14"
          placeholder='在此粘贴原版配方 JSON，例如 {"type":"minecraft:crafting_shaped",...}'
        ></textarea>
      </div>

      <div class="workbench-preview">
        <div class="zoom">
          <span class="zoom-label">缩放</span>
          <div class="zoom-btns">
            <button
              v-for="opt in SCALE_OPTIONS"
              :key="opt"
              :class="{ active: scale === opt }"
              @click="scale = opt"
            >
              {{ opt }}x
            </button>
          </div>
        </div>
        <RecipeCard :recipe="input" :scale="scale" />
      </div>
    </section>

    <section class="gallery">
      <h2>原版配方目录 · 26.3</h2>
      <div class="catalog-toolbar">
        <input
          v-model="query"
          class="catalog-search"
          type="search"
          placeholder="搜索配方 id 或产物名（如 pickaxe、钻石剑）"
        />
        <div class="kind-chips">
          <button
            v-for="opt in KIND_LABELS"
            :key="opt.kind"
            :class="{ active: kindFilter === opt.kind }"
            @click="kindFilter = opt.kind"
          >
            {{ opt.label }}（{{ kindCounts[opt.kind] ?? 0 }}）
          </button>
        </div>
      </div>
      <p class="catalog-meta">显示 {{ visible.length }} / {{ filtered.length }} 个配方</p>
      <div class="catalog-grid">
        <RecipeCard v-for="entry in visible" :key="entry.id" :recipe="entry.raw" />
      </div>
      <div ref="sentinel" class="catalog-sentinel" aria-hidden="true"></div>
      <p v-if="visible.length < filtered.length" class="catalog-meta">继续滚动加载更多…</p>
    </section>
  </main>
</template>

<style scoped>
.demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.demo-head h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
}

.demo-head p {
  margin: 0;
  font-size: 13px;
  color: color-mix(in oklab, var(--rc-foreground) 62%, transparent);
}

/* 编辑 + 实时预览 */
.workbench {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.workbench-editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.workbench h2,
.gallery h2 {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: color-mix(in oklab, var(--rc-foreground) 82%, transparent);
}

.sample-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sample-btns button,
.zoom-btns button,
.kind-chips button {
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

.sample-btns button:hover,
.zoom-btns button:hover,
.kind-chips button:hover {
  background: #7d7f92;
}

.sample-btns button.active,
.zoom-btns button.active,
.kind-chips button.active {
  background: #5a7fb0;
}

.workbench-editor textarea {
  width: 100%;
  padding: 12px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d8e0c8;
  background: #1d1b18;
  border: 1px solid var(--rc-border);
  border-radius: 4px;
  resize: vertical;
  outline: none;
}

.workbench-editor textarea:focus {
  border-color: #8fc27a;
}

.workbench-preview {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--rc-border);
  border-radius: 8px;
  background: var(--rc-card);
}

.zoom {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-label {
  font-size: 13px;
  color: color-mix(in oklab, var(--rc-foreground) 62%, transparent);
}

.zoom-btns {
  display: flex;
  gap: 8px;
}

/* 示例目录网格（对齐源目录页：最小 320px 列、16px 间距、响应式列数） */
.gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.catalog-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.catalog-search {
  width: 100%;
  max-width: 480px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--rc-foreground);
  background: var(--rc-card);
  border: 1px solid var(--rc-border);
  border-radius: 4px;
  outline: none;
}

.catalog-search:focus {
  border-color: var(--rc-primary);
}

.kind-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.catalog-meta {
  margin: 0;
  font-size: 12px;
  color: color-mix(in oklab, var(--rc-foreground) 62%, transparent);
}

/* 增量渲染哨兵：提前 600px 触发加载，不占视觉空间 */
.catalog-sentinel {
  height: 1px;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
</style>
