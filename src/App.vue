<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RecipeCard, parseRecipe, recipeTitle } from './components/crafting'
import type { RecipeKind, VanillaRecipeJson } from './components/crafting'
import { VANILLA_RECIPES } from './data/vanilla-recipes'

/* ------- 原版配方目录（26.3 全量 2042 条） ------- */

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
  const title = recipeTitle(parsedRecipe)
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
    <section class="gallery">
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

.kind-chips button:hover {
  background: #7d7f92;
}

.kind-chips button.active {
  background: #5a7fb0;
}

/* 配方目录网格（最小 320px 列、16px 间距、响应式列数） */
.gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.catalog-toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.catalog-search {
  width: 100%;
  max-width: 720px;
  padding: 14px 20px;
  font-size: 16px;
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
  justify-content: center;
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
